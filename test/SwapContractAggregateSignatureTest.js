const SwapContractAggregateSignature = artifacts.require('../contracts/SwapContractAggregateSignature.sol');

contract('SwapContractAggregateSignature', function (accounts) {
    let contract;

    beforeEach(async () => {
        contract = await SwapContractAggregateSignature.new();
    });

    it('should initiate', async () => {
        let addressFromSecret = '0x1000000000000000000000000000000000000001';
        let participant = '0x2000000000000000000000000000000000000002';
        let sender = accounts[0];
        let value = 500;
        let refundTimeInBlocks = 333;

        let result = await contract.getSwapDetails(addressFromSecret);
        let contractBalance = await web3.eth.getBalance(contract.address);

        assert.equal(result.initiator, '0x0000000000000000000000000000000000000000');
        assert.equal(result.participant, '0x0000000000000000000000000000000000000000');
        assert.equal(contractBalance, 0);

        await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});

        result = await contract.getSwapDetails(addressFromSecret);
        contractBalance = await web3.eth.getBalance(contract.address);

        assert.equal(result.initiator, sender);
        assert.equal(result.participant, participant);
        assert.deepEqual(BigInt(result.value), BigInt(value));
        assert.deepEqual(BigInt(result.refundTimeInBlocks), BigInt(refundTimeInBlocks));
        assert.equal(contractBalance, value);
    });
});
