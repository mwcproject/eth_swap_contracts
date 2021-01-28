const ERC20SwapContractAggregateSignature = artifacts.require('../contracts/ERC20SwapContractAggregateSignature.sol');

contract('ERC20SwapContractAggregateSignature', function (accounts) {
    let contract
  
    before(async () => {
        contract = await ERC20SwapContractAggregateSignature.new()
    });

    it('should initiate properly', async () => {
    });
});
