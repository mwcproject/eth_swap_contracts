const ERC20SwapContractAggregateSignature = artifacts.require('../contracts/ERC20SwapContractAggregateSignature.sol');

contract('ERC20SwapContractAggregateSignature', function (accounts) {
    let contract;

    beforeEach(async () => {
        contract = await ERC20SwapContractAggregateSignature.new();
    });

    it('should initiate', async () => {
        // let addressFromSecret = '0x1000000000000000000000000000000000000001';
        // let participant = '0x2000000000000000000000000000000000000002';
        // let contractAddress = '0x4000000000000000000000000000000000000004';
        // let sender = accounts[0];
        // let value = 500;
        // let refundTimeInBlocks = 333;

        // let result = await contract.getSwapDetails(addressFromSecret);

        // assert.equal(result.initiator, '0x0000000000000000000000000000000000000000');
        // assert.equal(result.participant, '0x0000000000000000000000000000000000000000');

        // await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, contractAddress, value, {from: sender, value: 0});

        // result = await contract.getSwapDetails(addressFromSecret);

        // assert.equal(result.initiator, sender);
        // assert.equal(result.participant, participant);
        // assert.equal(result.contractAddress, contractAddress);
        // assert.deepEqual(BigInt(result.value), BigInt(value));
        // assert.deepEqual(BigInt(result.refundTimeInBlocks), BigInt(refundTimeInBlocks));
    });
});
