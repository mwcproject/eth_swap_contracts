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

    it('should not initiate duplicate', async () => {
        let addressFromSecret = '0x1000000000000000000000000000000000000001';
        let participant = '0x2000000000000000000000000000000000000002';
        let sender = accounts[0];
        let value = 500;
        let refundTimeInBlocks = 333;

        await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});

        try {
            await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});
        }
        catch (error) {
            assert(error.message.indexOf('swap for this hash is already initiated') >= 0);
        }
    });

    it('should not redeem non-exist swap', async () => {
        let addressFromSecret = '0x4fd44e9919635435cb60e8d0aa0a26cc016f2b99';
        let participant = '0xa6a2c2fea95702877b9b9a1246bd6d7e0cb7c9e8';
        let r = '0x8c2e2c85e6adfd38a300c3af38cb6989cdfe846798244e1cb4e2698e12a46316';
        let s = '0x173e2180fab2fc6dfec81ecd4638fe077073b31ee70729c1fafd6260fad76618';
        let v = 27;

        try
        {
            await contract.redeem(addressFromSecret, r, s, v, {from: participant, value: 0});
        }
        catch (error) {
            assert(error.message.indexOf('invalid msg.sender') >= 0);
        }
    });

    it('should redeem', async () => {
        // let addressFromSecret = '0x4fd44e9919635435cb60e8d0aa0a26cc016f2b99';
        // let participant = '0xa6a2c2fea95702877b9b9a1246bd6d7e0cb7c9e8';
        // let sender = "0x829a039ed684fdc126b442f9ff8cf5040e0a02be";//accounts[0];
        // let value = 500;
        // let refundTimeInBlocks = 0x91cc35;

        // await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});

        // let r = '0x8c2e2c85e6adfd38a300c3af38cb6989cdfe846798244e1cb4e2698e12a46316';
        // let s = '0x173e2180fab2fc6dfec81ecd4638fe077073b31ee70729c1fafd6260fad76618';
        // let v = 27;

        // await contract.redeem(addressFromSecret, r, s, v, {from: participant, value: 0});
    });

    it('should not refund non-exist swap', async () => { 
        let addressFromSecret = '0x4fd44e9919635435cb60e8d0aa0a26cc016f2b99';

        try
        {
            await contract.refund(addressFromSecret, {from: accounts[0], value: 0});
        }
        catch (error) {
            assert(error.message.indexOf('invalid msg.sender') >= 0);
        }       
    });

    it('should refund', async () => {
    });
});
