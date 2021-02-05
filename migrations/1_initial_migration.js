var ERC20SwapContractAggregateSignature = artifacts.require("../contracts/ERC20SwapContractAggregateSignature.sol");
var SwapContractAggregateSignature = artifacts.require("../contracts/SwapContractAggregateSignature.sol");

module.exports = function(deployer) {
  deployer.deploy(ERC20SwapContractAggregateSignature);
  deployer.deploy(SwapContractAggregateSignature);
};