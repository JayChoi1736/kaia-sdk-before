const { JsonRpcProvider } = require("@klaytn/ethers-ext");
(() => {
  const provider = new JsonRpcProvider("https://public-en-baobab.klaytn.net");
  const maxSubscriptionPerWSConn = 5;

  provider.admin
    .setMaxSubscriptionPerWSConn(
      maxSubscriptionPerWSConn,
      {},
      (err, data, response) => {},
    )
    .then((data) => {
      console.log(data);
    });
})();
