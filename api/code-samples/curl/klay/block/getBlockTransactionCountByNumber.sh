curl -X 'POST' \
  'https://api.baobab.klaytn.net:8651/klay/getBlockTransactionCountByNumber' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "method": "klay_getBlockTransactionCountByNumber",
  "id": 73,
  "jsonrpc": "2.0",
  "params": ["0xe8"]
}'
