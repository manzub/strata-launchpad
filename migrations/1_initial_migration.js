const LaunchToken = artifacts.require("LaunchToken");
const Airdrop = artifacts.require("Airdrop");

module.exports = async function (deployer) {
  // await deployer.deploy(LaunchToken);

  await deployer.deploy(Airdrop);
};
