from web3 import Web3
from web3py_ext import extend

host = "https://api.baobab.klaytn.net:8651"

blockRlp = "0xf9059ef9033ea0b3fdad1b5407c0e9b05615a7f4187046387cdc2fb25bbb15152e9113a93b79e794a86fd667c6a340c53cc5d796ba84dbe1f29cb2f7a0d6e1c132b8f7167b134db1f564898c1e969fa491a7d9569fbea6bbd7e549c28ea082fec4a7ffeabaacda60293276c3048911a496d3613fabaccd336bf517209b4ba0ce610626f0d277da8690e3733cfac2bbbf4e60d6a21066318c33b8ab38860d4cb9010000000800040000000000000000040000000000000000000000000000008000000000000000000000000000000000000010000000100208000000000000000040900000000000000000000000002000000000000001000000000000000002000010000000020000000000000000000800400000000400000002000000180000000000000000000000000000000000000000000480000400000010000000000000000000001000000000000000000000000000000000000000000000000000000000000000400000000000020000000008000010000000000000000000002020000000000081000000000000080000000008000000000000000000000002000020018407346fb583051e7c84644836443ab90187d683010a02846b6c617986676f312e3138856c696e7578000000000000000000f90164f85494571e53df607be97431a5bbefca1dffe5aef56f4d945cb1a7dccbd0dc446e3640898ede8820368554c89499fb17d324fa0e07f23b49d09028ac0919414db694b74ff9dea397fe9e231df545eb53fe2adf776cb2b841e567386ed4da423bd5979b0807d330cc61f290e0e1fb16718be8990a7d94baa94fff36abe1b957bd9bfb6f05a72e0501c2f6841db208594079c01d222306ca0d00f8c9b841472c3b009c531094beac9050329840e695daad3d4cad64536b53237ddfc153f55d284fcaa8b558309ef2190aa453c5f8577240d62a8eb52d98d7887407c5a9d901b841e4f780bcd37a5454a9a7c73ef463d44fa8ac10f20a0ae6f71dd4da77124d98f1388c6b0de1ab60ca89890b583af3f3e95802543ee859c19876b6842120f0a9a600b84140e74ee691d07e3194609fed2931c8801185a4f512a251649f106ed53dcc3f2e1a51b43eca7d91faf93922db35b06f579286bbc5dc0296319324eb1c59907af70080808505d21dba00f9025a31f8e380850ba43b74008405f5e10094fdeedbb2fe5b48d5b49e435ba00e0358740d0cf58094f00e108b66c543d7478461fe75733553b14993c284552984b3f847f8458207f6a03b12c0fd9df13cc079eb1765fbfb2752503421a253ac2f280ae8bf1eb2cb45b1a04860aa0b7c3a3ec80071477a1141d6df614cbdb886c5fe7e9bbcb532a00539f59449f16029074d13890ac9fe589cc913ffd58d39a8f847f8458207f6a03784c05e3ec8a7737df6c09b0a6674ea825e943b3dc6acc2120ada04e5d21904a028c0cd7df839740d610470f7d0d57b25832b9fed8a478f0e5552366a4671c2027802f8b68203e98302440f8459682f00850bfda3a300830493e09408e2425ce1fa5f8eb006d3898c48c5d3de44b79580b844202ee0ed00000000000000000000000000000000000000000000000000000000000244040000000000000000000000000000000000000000000000000000000005f5a0dac001a07f37d46064be9d403d7c589fb6c02b2433acaf4e2d0daf2391fc56383ff6cffca043ac3acd3e3acd4c989c8a449392ec4b488b850b1e40e8558f14b81dc64cbaff7802f8b68203e9830243048459682f00850bfda3a300830493e0944d92f10a23e28ab11d2d39325b9db0fd0504520d80b844202ee0ed00000000000000000000000000000000000000000000000000000000000242fc00000000000000000000000000000000000000000000000000000007cc6e734fc080a0f8e9f3404be26aa9a7c351cdd28eb1b605987c81f65d5be73c0cc79cfafedd20a05cad9db4cc8b7f8d1836383c8744a595a95506407fbbe77a74827b4b46176fe4"

w3 = Web3(Web3.HTTPProvider(host))
debug_response = w3.debug.trace_block(blockRlp)

print(debug_response)
