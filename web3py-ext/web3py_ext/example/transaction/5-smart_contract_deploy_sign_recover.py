
#-*- coding:utf-8 -*-
from web3py_ext import extend
from web3 import Web3
from eth_account import Account
from web3py_ext.transaction.transaction import (
    empty_tx,
    fill_transaction,
    TxType
)
from web3py_ext.utils.klaytn_utils import to_pretty
from cytoolz import merge

w3 = Web3(Web3.HTTPProvider('https://public-en-baobab.klaytn.net'))

def web3_smart_contract_deploy_sign_recover():
    user = Account.from_key('0x0e4ca6d38096ad99324de0dde108587e5d7c600165ae4cd6c2462c597458c2b8') 

    smart_contract_deploy_tx = empty_tx(TxType.SMART_CONTRACT_DEPLOY)
    smart_contract_deploy_tx = merge(smart_contract_deploy_tx, {
        'from' : user.address,
        'data' : '0x60806040526040518060400160405280600b81526020017f48656c6c6f20576f726c64000000000000000000000000000000000000000000815250600090816200004a9190620002d9565b503480156200005857600080fd5b50620003c0565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680620000e157607f821691505b602082108103620000f757620000f662000099565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b600060088302620001617fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8262000122565b6200016d868362000122565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b6000620001ba620001b4620001ae8462000185565b6200018f565b62000185565b9050919050565b6000819050919050565b620001d68362000199565b620001ee620001e582620001c1565b8484546200012f565b825550505050565b600090565b62000205620001f6565b62000212818484620001cb565b505050565b5b818110156200023a576200022e600082620001fb565b60018101905062000218565b5050565b601f82111562000289576200025381620000fd565b6200025e8462000112565b810160208510156200026e578190505b620002866200027d8562000112565b83018262000217565b50505b505050565b600082821c905092915050565b6000620002ae600019846008026200028e565b1980831691505092915050565b6000620002c983836200029b565b9150826002028217905092915050565b620002e4826200005f565b67ffffffffffffffff8111156200030057620002ff6200006a565b5b6200030c8254620000c8565b620003198282856200023e565b600060209050601f8311600181146200035157600084156200033c578287015190505b620003488582620002bb565b865550620003b8565b601f1984166200036186620000fd565b60005b828110156200038b5784890151825560018201915060208501945060208101905062000364565b86831015620003ab5784890151620003a7601f8916826200029b565b8355505b6001600288020188555050505b505050505050565b6106e280620003d06000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80633d7403a31461004657806345773e4e14610062578063f6fb7c5d14610080575b600080fd5b610060600480360381019061005b91906102da565b61009e565b005b61006a6100b1565b60405161007791906103a2565b60405180910390f35b6100886100ee565b60405161009591906103a2565b60405180910390f35b80600090816100ad91906105da565b5050565b60606040518060400160405280600b81526020017f48656c6c6f20576f726c64000000000000000000000000000000000000000000815250905090565b6060600080546100fd906103f3565b80601f0160208091040260200160405190810160405280929190818152602001828054610129906103f3565b80156101765780601f1061014b57610100808354040283529160200191610176565b820191906000526020600020905b81548152906001019060200180831161015957829003601f168201915b5050505050905090565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6101e78261019e565b810181811067ffffffffffffffff82111715610206576102056101af565b5b80604052505050565b6000610219610180565b905061022582826101de565b919050565b600067ffffffffffffffff821115610245576102446101af565b5b61024e8261019e565b9050602081019050919050565b82818337600083830152505050565b600061027d6102788461022a565b61020f565b90508281526020810184848401111561029957610298610199565b5b6102a484828561025b565b509392505050565b600082601f8301126102c1576102c0610194565b5b81356102d184826020860161026a565b91505092915050565b6000602082840312156102f0576102ef61018a565b5b600082013567ffffffffffffffff81111561030e5761030d61018f565b5b61031a848285016102ac565b91505092915050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561035d578082015181840152602081019050610342565b60008484015250505050565b600061037482610323565b61037e818561032e565b935061038e81856020860161033f565b6103978161019e565b840191505092915050565b600060208201905081810360008301526103bc8184610369565b905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061040b57607f821691505b60208210810361041e5761041d6103c4565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026104867fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610449565b6104908683610449565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b60006104d76104d26104cd846104a8565b6104b2565b6104a8565b9050919050565b6000819050919050565b6104f1836104bc565b6105056104fd826104de565b848454610456565b825550505050565b600090565b61051a61050d565b6105258184846104e8565b505050565b5b818110156105495761053e600082610512565b60018101905061052b565b5050565b601f82111561058e5761055f81610424565b61056884610439565b81016020851015610577578190505b61058b61058385610439565b83018261052a565b50505b505050565b600082821c905092915050565b60006105b160001984600802610593565b1980831691505092915050565b60006105ca83836105a0565b9150826002028217905092915050565b6105e382610323565b67ffffffffffffffff8111156105fc576105fb6101af565b5b61060682546103f3565b61061182828561054d565b600060209050601f8311600181146106445760008415610632578287015190505b61063c85826105be565b8655506106a4565b601f19841661065286610424565b60005b8281101561067a57848901518255600182019150602085019450602081019050610655565b868310156106975784890151610693601f8916826105a0565b8355505b6001600288020188555050505b50505050505056fea26469706673582212209ef3751f0d95c57e13f1dec8040231f2a3cade80906567043325556d3435f11c64736f6c63430008120033',
    })
    smart_contract_deploy_tx = fill_transaction(smart_contract_deploy_tx, w3)

    # sign the klaytn specific transaction type with web3py
    signed_tx = Account.sign_transaction(smart_contract_deploy_tx, user.key)
    print("\nraw transaction of signed tx:", signed_tx.rawTransaction.hex())

    recovered_tx = Account.recover_transaction(signed_tx.rawTransaction)
    print("\nrecovered sender address", recovered_tx)

    decoded_tx = Account.decode_transaction(signed_tx.rawTransaction)
    print("\ndecoded transaction:", to_pretty(decoded_tx))

    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print('tx hash: ', tx_hash, 'receipt: ', tx_receipt)

web3_smart_contract_deploy_sign_recover()