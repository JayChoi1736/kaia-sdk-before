curl -X 'POST' \
  'https://api.baobab.klaytn.net:8651/eth/getWork' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "method": "eth_getWork",
  "id": 1,
  "jsonrpc": "2.0",
  "params": []
}'