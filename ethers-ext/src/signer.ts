import { Provider, TransactionRequest, TransactionResponse } from "@ethersproject/abstract-provider";
import {
  Signer as EthersSigner,
  ExternallyOwnedAccount,
  TypedDataDomain,
  TypedDataField,
} from "@ethersproject/abstract-signer";
import { AddressZero } from "@ethersproject/constants";
import { Logger } from "@ethersproject/logger";
import {
  Web3Provider as EthersWeb3Provider,
  JsonRpcProvider as EthersJsonRpcProvider,
  JsonRpcSigner as EthersJsonRpcSigner,
} from "@ethersproject/providers";
import { Wallet as EthersWallet } from "@ethersproject/wallet";
import { poll } from "@ethersproject/web";
import { KlaytnTxFactory, HexStr, isFeePayerSigTxType, parseTransaction, getRpcTxObject, TxType, getSignatureTuple } from "@klaytn/js-ext-core";
import { BigNumber } from "ethers";
import {
  Bytes,
  BytesLike,
  Deferrable,
  ProgressCallback,
  SigningKey,
  computeAddress,
  hexlify,
  keccak256,
  resolveProperties,
  getAddress,
  toUtf8Bytes,
} from "ethers/lib/utils";
import _ from "lodash";

import { decryptKeystoreList, decryptKeystoreListSync } from "./keystore";
import { ExternalProvider as KlaytnExternalProvider } from "./provider";

// To use the same error format as ethers.js
const logger = new Logger("@klaytn/ethers-ext");

// @ethersproject/abstract-signer/src.ts/index.ts:allowedTransactionKeys
const ethersAllowedTransactionKeys: Array<string> = [
  "accessList", "ccipReadEnabled", "chainId", "customData", "data", "from", "gasLimit", "gasPrice", "maxFeePerGas", "maxPriorityFeePerGas", "nonce", "to", "type", "value",
];

// ethers.js may strip or reject some Klaytn-specific transaction fields.
// To prserve transaction fields around super method calls, use
// saveCustomFields and restoreCustomFields.
function saveCustomFields(tx: Deferrable<TransactionRequest>): any {
  // Save fields that are not allowed in ethers.js
  const savedFields: any = {};
  for (const key in tx) {
    // 'from' may not be corresponded to the public key of the private key in a decoupled account.
    if (ethersAllowedTransactionKeys.indexOf(key) === -1 || key == "from") {
      savedFields[key] = _.get(tx, key);
      _.unset(tx, key);
    }
  }

  // Save txtype that is not supported in ethers.js.
  // and disguise as legacy (type 0) transaction.
  //
  // Why disguise as legacy type?
  // Signer.populateTransaction() will not fill gasPrice
  // unless tx type is explicitly Legacy (type=0) or EIP-2930 (type=1).
  // Klaytn tx types, however, always uses gasPrice.
  if (_.isNumber(tx.type) && KlaytnTxFactory.has(tx.type)) {
    savedFields["type"] = tx.type;
    tx.type = 0;
  }

  return savedFields;
}

function restoreCustomFields(tx: Deferrable<TransactionRequest>, savedFields: any) {
  for (const key in savedFields) {
    _.set(tx, key, savedFields[key]);
  }
}

async function getTransactionRequest(transactionOrRLP: Deferrable<TransactionRequest> | string): Promise<TransactionRequest> {
  if (_.isString(transactionOrRLP)) {
    return parseTransaction(transactionOrRLP) as TransactionRequest;
  } else {
    const tx = transactionOrRLP;
    return resolveProperties(tx);
  }
}

type PrivateKeyLike = BytesLike | ExternallyOwnedAccount | SigningKey;

export class Wallet extends EthersWallet {
  // Override Wallet factories accepting keystores to support KIP-3 (v4) format
  static override async fromEncryptedJson(json: string, password: string | Bytes, progress?: ProgressCallback): Promise<Wallet> {
    const { address, privateKey } = await decryptKeystoreList(json, password, progress);
    return new Wallet(address, privateKey);
  }

  static override fromEncryptedJsonSync(json: string, password: string | Bytes): Wallet {
    const { address, privateKey } = decryptKeystoreListSync(json, password);
    return new Wallet(address, privateKey);
  }

  // New Wallet[] factories accepting keystores supporting KIP-3 (v4) format
  static async fromEncryptedJsonList(json: string, password: string | Bytes, progress?: ProgressCallback): Promise<Wallet[]> {
    const { address, privateKeyList } = await decryptKeystoreList(json, password, progress);
    return _.map(privateKeyList, (privateKey) => new Wallet(address, privateKey));
  }

  static fromEncryptedJsonListSync(json: string, password: string | Bytes): Wallet[] {
    const { address, privateKeyList } = decryptKeystoreListSync(json, password);
    return _.map(privateKeyList, (privateKey) => new Wallet(address, privateKey));
  }

  // Decoupled account address. Defined only if specified in constructor.
  private klaytnAddr: string | undefined;

  // new KlaytnWallet(privateKey, provider?) or
  // new KlaytnWallet(address, privateKey, provider?)
  constructor(
    addressOrPrivateKey: string | PrivateKeyLike,
    privateKeyOrProvider?: PrivateKeyLike | Provider,
    provider?: Provider) {
    // First argument is an address.
    if (HexStr.isHex(addressOrPrivateKey, 20)) {
      const address = HexStr.from(addressOrPrivateKey);
      const privateKey = privateKeyOrProvider as PrivateKeyLike;
      super(privateKey, provider);
      this.klaytnAddr = address;
    } else { // First argument is a private key.
      const privateKey = addressOrPrivateKey as PrivateKeyLike;
      const _provider = privateKeyOrProvider as Provider;
      super(privateKey, _provider);
    }
  }

  override getAddress(legacy?: boolean): Promise<string> {
    if (legacy || !this.klaytnAddr) {
      return Promise.resolve(computeAddress(this.publicKey));
    } else {
      return Promise.resolve(this.klaytnAddr);
    }
  }

  // @deprecated in favor of getAddress(true)
  getEtherAddress(): Promise<string> {
    return super.getAddress();
  }

  async isDecoupled(): Promise<boolean> {
    if (!this.klaytnAddr) {
      return false;
    } else {
      return (await this.getAddress(false)) == (await this.getAddress(true));
    }
  }

  // Fill legacy address for Ethereum TxTypes, and (possibly) decoupled address for Klaytn TxTypes.
  override checkTransaction(transaction: Deferrable<TransactionRequest>): Deferrable<TransactionRequest> {
    const tx = _.clone(transaction);

    const legacy = !KlaytnTxFactory.has(tx.type);
    const expectedFrom = this.getAddress(legacy);
    if (!tx.from) {
      tx.from = expectedFrom;
    } else {
      tx.from = Promise.all([
        Promise.resolve(tx.from),
        expectedFrom,
      ]).then(([from, expectedFrom]) => {
        if (from?.toLowerCase() != expectedFrom?.toLowerCase()) {
          throw new Error(`from address mismatch tx=${JSON.stringify(transaction)} addr=${expectedFrom}`);
        }
        return from;
      });
    }
    return tx;
  }

  override async populateTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionRequest> {
    const tx = await getTransactionRequest(transaction);

    // Not a Klaytn TxType; fallback to ethers.Wallet
    if (!KlaytnTxFactory.has(tx.type)) {
      return super.populateTransaction(tx);
    }

    // Fill 'from' field.
    if (!tx.from) {
      tx.from = await this.getAddress();
    }

    // If the account address is decoupled from private key,
    // the ethers.Wallet.populateTransaction() may fill the nonce of the wrong address.
    if (!tx.nonce) {
      tx.nonce = await this.provider.getTransactionCount(tx.from);
    }

    // Sometimes estimateGas underestimates the required gas limit.
    // Therefore adding some buffer to the RPC result.
    // Other cases:
    // - ethers.js uses estimateGas result as-is.
    // - Metamask multiplies by 1 or 1.5 depending on chainId
    //   (https://github.com/MetaMask/metamask-extension/blob/v11.3.0/ui/ducks/send/helpers.js#L126)
    // TODO: To minimize buffer, add constant intrinsic gas overhead instead of multiplier.
    if (!tx.gasLimit) {
      const bufferMultiplier = 2.5;
      const gasLimit = await this.provider.estimateGas(tx);
      tx.gasLimit = Math.ceil(gasLimit.toNumber() * bufferMultiplier);
    }

    // Leave rest of the fields to ethers
    const savedFields = saveCustomFields(tx);
    const populatedTx = await super.populateTransaction(tx);
    restoreCustomFields(populatedTx, savedFields);

    return populatedTx;
  }

  // @deprecated in favor of parseTransaction
  decodeTxFromRLP(rlp: string): any {
    return parseTransaction(rlp);
  }

  // Sign as a sender
  // tx.sigs += Sign(tx.sigRLP(), wallet.privateKey)
  // return tx.txHashRLP() or tx.senderTxHashRLP();
  override async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    const tx = await getTransactionRequest(transaction);

    // Not a Klaytn TxType; fallback to ethers.Wallet
    if (!KlaytnTxFactory.has(tx.type)) {
      return super.signTransaction(tx);
    }

    // Because RLP-encoded tx may not contain chainId, fill up here.
    tx.chainId ??= await this._chainIdFromTx(tx);

    const klaytnTx = KlaytnTxFactory.fromObject(tx);

    const sigHash = keccak256(klaytnTx.sigRLP());
    const sig = this._eip155sign(sigHash, tx.chainId);
    klaytnTx.addSenderSig(sig);

    if (isFeePayerSigTxType(klaytnTx.type)) {
      return klaytnTx.senderTxHashRLP();
    } else {
      return klaytnTx.txHashRLP();
    }
  }

  // Sign as a fee payer
  // tx.feepayerSigs += Sign(tx.sigFeePayerRLP(), wallet.privateKey)
  // return tx.txHashRLP();
  async signTransactionAsFeePayer(transaction: Deferrable<TransactionRequest>): Promise<string> {
    const tx = await getTransactionRequest(transaction);

    console.log("signfee BEFORE", tx);

    // Not a Klaytn TxType; not supported
    if (!KlaytnTxFactory.has(tx.type)) {
      throw new Error(`feePayer signature not supported for tx type ${tx.type}`);
    }

    // feePayer
    // TODO: define feePayer type in KlaytnTransactionRequest
    // originally undefined => this.getAddress()
    // originally 0x0000000 => this.getAddress() // returned from caver
    // originally 0x1231331 => check if it matches this.getAddress()
    const inputFeePayer = (tx as any).feePayer;
    if (!inputFeePayer || inputFeePayer == AddressZero) {
      (tx as any).feePayer = await this.getAddress();
    } else {
      if (inputFeePayer != await this.getAddress()) {
        throw new Error(`feePayer address mismatch: ${inputFeePayer} != ${await this.getAddress()}`);
      }
    }

    // feePayerSignatures
    // TODO: define feePayerSignatures type in KlaytnTransactionRequest
    // originally [ '0x01', '0x', '0x' ] => remove it
    const inputFeePayerSignatures = (tx as any).feePayerSignatures;
    if (_.isArray(inputFeePayerSignatures)) {
      (tx as any).feePayerSignatures = _.filter(inputFeePayerSignatures, (sig) => {
        try {
          if (sig[0] == "0x01" && sig[1] == "0x" && sig[2] == "0x") {
            return false;
          }
        } catch {
          // Ignore other types of signatures. Let KlaytnTxFactory handle it.
        }
        return true;
      });
    }

    // Because RLP-encoded tx may not contain chainId, fill up here.
    tx.chainId ??= await this._chainIdFromTx(tx);

    console.log("signfee AFTER", tx);

    const klaytnTx = KlaytnTxFactory.fromObject(tx);
    if (!isFeePayerSigTxType(klaytnTx.type)) {
      klaytnTx.throwTypeError("feePayer signature not supported");
    }

    const sigFeePayerHash = keccak256(klaytnTx.sigFeePayerRLP());
    const sig = this._eip155sign(sigFeePayerHash, tx.chainId);
    klaytnTx.addFeePayerSig(sig);

    return klaytnTx.txHashRLP();
  }

  override async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
    this._checkProvider("sendTransaction");

    const populatedTx = await this.populateTransaction(transaction);
    const signedTx = await this.signTransaction(populatedTx);

    if (!KlaytnTxFactory.has(populatedTx.type)) {
      return await this.provider.sendTransaction(signedTx);
    } else {
      return await this._sendRawTransaction(signedTx);
    }
  }

  async sendTransactionAsFeePayer(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
    this._checkProvider("sendTransactionAsFeePayer");

    const populatedTx = await this.populateTransaction(transaction);
    const signedTx = await this.signTransactionAsFeePayer(populatedTx);

    return await this._sendRawTransaction(signedTx);
  }

  _eip155sign(digest: string, chainId?: number) {
    const sig = this._signingKey().signDigest(digest);
    if (chainId) {
      sig.v = sig.recoveryParam + chainId * 2 + 35;
    }
    return sig;
  }

  // Extract chainId from tx signatures.
  // If no signatures, query provider.
  async _chainIdFromTx(tx: any): Promise<number | undefined> {
    function extractFromSig(field: any[]): number | undefined {
      if (_.isArray(field) && field.length > 0 &&
        _.isArray(field[0]) && field[0].length == 3) {
        const v = BigNumber.from(field[0][0]).toNumber();
        return (v + (v % 2) - 36) / 2;
      }
      return undefined;
    }

    return (
      extractFromSig(tx.txSignatures) ??
      extractFromSig(tx.feePayerSignatures) ??
      this.getChainId());
  }

  async _sendRawTransaction(signedTx: string): Promise<TransactionResponse> {
    if (!(this.provider instanceof EthersJsonRpcProvider)) {
      throw new Error("Klaytn typed transaction can only be broadcasted to a Klaytn JSON-RPC server");
    } else {
      const txhash = await this.provider.send("klay_sendRawTransaction", [signedTx]);

      // Retry until the transaction shows up in the txpool
      // Using poll() like in the ethers.JsonRpcProvider.sendTransaction
      // https://github.com/ethers-io/ethers.js/blob/v5.7/packages/providers/src.ts/json-rpc-provider.ts#L283
      const pollFunc = async () => {
        const tx = await this.provider.getTransaction(txhash);
        if (tx == null) {
          return undefined; // retry
        } else {
          return tx; // success
        }
      };
      return poll(pollFunc) as Promise<TransactionResponse>;
    }
  }
}

// EthersJsonRpcSigner cannot be subclassed because of the constructorGuard.
// Instead, we re-create the class by copying the implementation.
export class JsonRpcSigner extends EthersSigner implements EthersJsonRpcSigner {
  readonly provider: EthersJsonRpcProvider;
  _index: number;
  _address: string;

  // Equivalent to EthersJsonRpcSigner.constructor, but without constructorGuard.
  constructor(provider: EthersJsonRpcProvider, addressOrIndex?: string | number) {
    super();

    this.provider = provider;

    if (addressOrIndex == null) {
      addressOrIndex = 0;
    }

    if (typeof (addressOrIndex) === "string") {
      this._address = getAddress(addressOrIndex);
      this._index = null as unknown as number;
    } else if (typeof (addressOrIndex) === "number") {
      this._address = null as unknown as string;
      this._index = addressOrIndex;
    } else {
      throw new Error(`invalid address or index '${addressOrIndex}'`);
    }
  }

  isKaikas(): boolean {
    if (this.provider instanceof EthersWeb3Provider) {
      // The EIP-1193 provider, usually injected as window.ethereum or window.klaytn.
      const injectedProvider = this.provider.provider as KlaytnExternalProvider;
      return injectedProvider.isKaikas === true;
    }
    return false;
  }

  override async getAddress(): Promise<string> {
    if (this._address) {
      return Promise.resolve(this._address);
    }

    return this.provider.send("eth_accounts", []).then((accounts) => {
      if (accounts.length <= this._index) {
        logger.throwError("unknown account #" + this._index, Logger.errors.UNSUPPORTED_OPERATION, {
          operation: "getAddress"
        });
      }
      return this.provider.formatter.address(accounts[this._index]);
    });
  }

  override connect(provider: Provider): EthersJsonRpcSigner {
    throw new Error("cannot alter JSON-RPC Signer connection");
  }

  connectUnchecked(): EthersJsonRpcSigner {
    return this;
  }

  override async signMessage(message: string | Bytes): Promise<string> {
    const data = ((typeof (message) === "string") ? toUtf8Bytes(message) : message);
    const address = await this.getAddress();
    try {
      return await this.provider.send("personal_sign", [hexlify(data), address.toLowerCase()]);
    } catch (error) {
      // @ts-ignore
      if (typeof (error.message) === "string" && error.message.match(/user denied/i)) {
        logger.throwError("user rejected signing", Logger.errors.ACTION_REJECTED, {
          action: "signMessage",
          from: address,
          messageData: message
        });
      }
      throw error;
    }
  }

  override checkTransaction(transaction: Deferrable<TransactionRequest>): Deferrable<TransactionRequest> {
    return super.checkTransaction(transaction);
  }

  override async populateTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionRequest> {
    return super.populateTransaction(transaction);
  }

  override async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    if (!this.isKaikas()) {
      throw new Error("signTransaction is only supported in Kaikas");
    }

    let signedTx;
    try {
      signedTx = await this.provider.send("klay_signTransaction", [transaction]);
    } catch (error: any) {
      if (typeof (error.message) === "string" && error.message.match(/user denied/i)) {
        logger.throwError("user rejected transaction", Logger.errors.ACTION_REJECTED, {
          action: "signTransaction",
          transaction: transaction
        });
      }
    }

    return signedTx.rawTransaction;
  }

  override async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
    // Send the transaction
    const txhash = await this.sendUncheckedTransaction(transaction);

    // Retry until the transaction shows up in the txpool
    // Using poll() like in the ethers.JsonRpcProvider.sendTransaction
    // https://github.com/ethers-io/ethers.js/blob/v5.7/packages/providers/src.ts/json-rpc-provider.ts#L283
    const pollFunc = async () => {
      const tx = await this.provider.getTransaction(txhash);
      if (tx == null) {
        return undefined; // retry
      } else {
        return tx; // success
      }
    };
    return poll(pollFunc) as Promise<TransactionResponse>;
  }

  async sendUncheckedTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    if (this.isKaikas()) {
      return this.sendUncheckedTransactionKlaytn(transaction) as Promise<string>;
    } else {
      return this.sendUncheckedTransactionEth(transaction)as Promise<string>;
    }
  }

  async sendUncheckedTransactionEth(transaction: Deferrable<TransactionRequest>): Promise<string> {
    const tx = await getTransactionRequest(transaction);

    if (!tx.from) {
      tx.from = await this.getAddress();
    }

    if (!tx.gasLimit) {
      tx.gasLimit = await this.provider.estimateGas(tx);
    }

    if (tx.to) {
      const toAddress = await this.provider.resolveName(tx.to);
      if (toAddress == null) {
        logger.throwArgumentError("provided ENS name resolves to null", "tx.to", tx.to);
      } else {
        tx.to = toAddress;
      }
    }

    const fromAddress = await this.getAddress();
    if (tx.from && tx.from.toLowerCase() != fromAddress.toLowerCase()) {
      logger.throwArgumentError("from address mismatch", "transaction", transaction);
    }

    return this.provider.send("eth_sendTransaction", [tx]).then((hash) => {
      return hash;
    }, (error) => {
      if (typeof (error.message) === "string" && error.message.match(/user denied/i)) {
        logger.throwError("user rejected transaction", Logger.errors.ACTION_REJECTED, {
          action: "sendTransaction",
          transaction: tx
        });
      }

      // return checkError("sendTransaction", error, hexTx);
    });
  }


  async sendUncheckedTransactionKlaytn(transaction: Deferrable<TransactionRequest>): Promise<string> {
    const tx = await getTransactionRequest(transaction);

    if (!tx.from) {
      tx.from = await this.getAddress();
    }

    if (!tx.gasLimit) {
      tx.gasLimit = await this.provider.estimateGas(tx);
    }

    if (tx.to) {
      const toAddress = await this.provider.resolveName(tx.to);
      if (toAddress == null) {
        logger.throwArgumentError("provided ENS name resolves to null", "tx.to", tx.to);
      } else {
        tx.to = toAddress;
      }
    }

    const fromAddress = await this.getAddress();
    if (tx.from && tx.from.toLowerCase() != fromAddress.toLowerCase()) {
      logger.throwArgumentError("from address mismatch", "transaction", transaction);
    }

    // It must be changed to the following format like (TxType.ValueTransfer -> VALUE_TRANSFER)
    const rpcTx = getRpcTxObject(tx);
    rpcTx.type = _.snakeCase(TxType[tx.type || 0]).toUpperCase();
    console.log("sending", rpcTx);

    return this.provider.send("klay_sendTransaction", [rpcTx]).then((hash) => {
      return hash;
    }, (error) => {
      if (typeof (error.message) === "string" && error.message.match(/user denied/i)) {
        logger.throwError("user rejected transaction", Logger.errors.ACTION_REJECTED, {
          action: "sendTransaction",
          transaction: tx
        });
      }

      // return checkError("sendTransaction", error, hexTx);
    });
  }

  async _legacySignMessage(message: Bytes | string): Promise<string> {
    throw new Error("Legacy eth_sign not supported");
  }

  async _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
    throw new Error("eth_signTypedData_v4 not supported");
  }

  async unlock(password: string): Promise<boolean> {
    const address = await this.getAddress();
    return this.provider.send("personal_unlockAccount", [address.toLowerCase(), password, null]);
  }
}


