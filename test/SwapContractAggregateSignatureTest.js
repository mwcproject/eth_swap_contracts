const SwapContractAggregateSignature = artifacts.require('../contracts/SwapContractAggregateSignature.sol');

contract('SwapContractAggregateSignature', function (accounts) {
    let contract
  
    before(async () => {
        contract = await SwapContractAggregateSignature.new()
    });

    it('should initiate properly', async () => {
    });
});
