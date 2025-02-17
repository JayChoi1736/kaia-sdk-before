package org.web3j.crypto.transaction.type;

import java.math.BigInteger;
import java.util.List;
import org.web3j.crypto.Sign.SignatureData;
import org.web3j.crypto.transaction.account.AccountKey;
import org.web3j.crypto.transaction.account.AccountKeyDecoder;
import org.web3j.rlp.RlpDecoder;
import org.web3j.rlp.RlpList;
import org.web3j.rlp.RlpString;
import org.web3j.rlp.RlpType;
import org.web3j.utils.KaiaTransactionUtils;
import org.web3j.utils.Numeric;

public class TxTypeFeeDelegatedAccountUpdate extends TxTypeFeeDelegate {

    /**
     * newly created accountKey
     */
    private final AccountKey accountKey;

    public TxTypeFeeDelegatedAccountUpdate(TxType.Type type, BigInteger nonce, BigInteger gasPrice, BigInteger gasLimit, String from, AccountKey accountKey) {
        super(type, nonce, gasPrice, gasLimit, from, "", BigInteger.ZERO);
        this.accountKey = accountKey;
    }

    public static TxTypeFeeDelegatedAccountUpdate createTransaction(TxType.Type type, BigInteger nonce, BigInteger gasPrice, BigInteger gasLimit, String from, AccountKey accountKey) {
        return new TxTypeFeeDelegatedAccountUpdate(type, nonce, gasPrice, gasLimit, from, accountKey);
    }

    public TxTypeFeeDelegatedAccountUpdate(long chainId, TxType.Type type, BigInteger nonce, BigInteger gasPrice, BigInteger gasLimit, String from, AccountKey accountKey) {
        super(chainId, type, nonce, gasPrice, gasLimit, from, "", BigInteger.ZERO);
        this.accountKey = accountKey;
    }

    public static TxTypeFeeDelegatedAccountUpdate createTransaction(long chainId, TxType.Type type, BigInteger nonce, BigInteger gasPrice, BigInteger gasLimit, String from, AccountKey accountKey) {
        return new TxTypeFeeDelegatedAccountUpdate(chainId, type, nonce, gasPrice, gasLimit, from, accountKey);
    }

    public AccountKey getAccountKey() {
        return accountKey;
    }

    /**
     * create RlpType List which contains nonce, gas price, gas limit, from and accountKey.
     * List elements can be different depending on transaction type.
     *
     * @return List RlpType List
     */
    @Override
    public List<RlpType> rlpValues() {
        List<RlpType> values = super.rlpValues();
        values.add(RlpString.create(Numeric.hexStringToByteArray(getFrom())));
        values.add(RlpString.create(getAccountKey().toRlp()));
        return values;
    }

    /**
     * This method is overridden as FEE_DELEGATED_ACCOUNT_UPDATE type.
     * The return value is used for rlp encoding.
     *
     * @return Type transaction type
     */
    @Override
    public Type getKaiaType() {
        return Type.FEE_DELEGATED_ACCOUNT_UPDATE;
    }

    /**
     * decode transaction hash from sender to reconstruct transaction with fee payer signature.
     *
     * @param rawTransaction RLP-encoded signed transaction from sender
     * @return TxTypeFeeDelegatedAccountUpdate decoded transaction
     */
    public static TxTypeFeeDelegatedAccountUpdate decodeFromRawTransaction(byte[] rawTransaction) {
        //TxHashRLP = type + encode([nonce, gasPrice, gas, from, rlpEncodedKey, txSignatures, feePayer, feePayerSignatures])
        try {
            byte[] rawTransactionExceptType = KaiaTransactionUtils.getRawTransactionNoType(rawTransaction);

            RlpList rlpList = RlpDecoder.decode(rawTransactionExceptType);
            List<RlpType> values = ((RlpList) rlpList.getValues().get(0)).getValues();

            BigInteger nonce = ((RlpString) values.get(0)).asPositiveBigInteger();
            BigInteger gasPrice = ((RlpString) values.get(1)).asPositiveBigInteger();
            BigInteger gasLimit = ((RlpString) values.get(2)).asPositiveBigInteger();
            String from = ((RlpString) values.get(3)).asString();
            String accountkeyRaw = ((RlpString) values.get(4)).asString();
            TxType.Type type = Type.FEE_DELEGATED_ACCOUNT_UPDATE;

            TxTypeFeeDelegatedAccountUpdate tx
                    = TxTypeFeeDelegatedAccountUpdate.createTransaction(type, nonce, gasPrice, gasLimit, from, AccountKeyDecoder.fromRlp(accountkeyRaw));
            tx.addSignatureData(values, 5);

            return tx;
        } catch (Exception e) {
            throw new RuntimeException("There is a error in the processing of decoding tx");
        }
    }

    /**
     * @param rawTransaction RLP-encoded signed transaction from sender
     * @return TxTypeFeeDelegatedAccountUpdate decoded transaction
     */
    public static TxTypeFeeDelegatedAccountUpdate decodeFromRawTransaction(String rawTransaction) {
        return decodeFromRawTransaction(Numeric.hexStringToByteArray(Numeric.cleanHexPrefix(rawTransaction)));
    }

    @Override
    public List<RlpType> asRlpValues(SignatureData signatureData) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'asRlpValues'");
    }

    @Override
    public String getData() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getData'");
    }

    @Override
    public TransactionType getType() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getType'");
    }
}
