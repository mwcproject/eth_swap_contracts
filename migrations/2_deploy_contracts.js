var erc20_swap_contract_aggregate_signature = artifacts.require("../contracts/erc20_swap_contract_aggregate_signature.sol");
var swap_contract_aggregate_signature = artifacts.require("../contracts/swap_contract_aggregate_signature.sol");

module.exports = function(_deployer) {
  _deployer.deploy(erc20_swap_contract_aggregate_signature);
  _deployer.deploy(swap_contract_aggregate_signature);
};
