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

    it("should not initiate with empty participant's address", async () => {
        let addressFromSecret = '0x1000000000000000000000000000000000000001';
        let participant = '0x0000000000000000000000000000000000000000';
        let sender = accounts[0];
        let value = 500;
        let refundTimeInBlocks = 333;

        try {
            await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});
        }
        catch (error) {
            assert(error.message.indexOf('invalid participant address') >= 0);
        }
    });

    it("should not initiate with expired refundTimeInBlocks", async () => {
        let addressFromSecret = '0x4fd44e9919635435cb60e8d0aa0a26cc016f2b99';
        let participant = '0xa6a2c2fea95702877b9b9a1246bd6d7e0cb7c9e8';
        let sender = accounts[0];
        let value = 500;
        let refundTimeInBlocks = 0;

        try {
            await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});
        }
        catch (error) {
            assert(error.message.indexOf('refundTimeInBlocks has already come') >= 0);
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

    it('should redeem properly', async () => {
        const secret = "0x59cf604a0581191f30605dac02eee2e363b82bc8fb2bcc6aa3eaf11fa6315441";
        let secretAccount = await web3.eth.accounts.privateKeyToAccount(secret);
        // 0xc05955ecdc22E027f2094Fe8F8266B5a88270d56
        let addressFromSecret = secretAccount.address;

        let participant = accounts[1];
        let sender = accounts[0];
        let value = 500;
        let latestBlock = await web3.eth.getBlock("latest")
        let refundTimeInBlocks = latestBlock.number + 10;

        await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});

        let contractBalance = await web3.eth.getBalance(contract.address);
        let result = await contract.getSwapDetails(addressFromSecret);

        assert.equal(result.initiator, sender);
        assert.equal(result.participant, participant);
        assert.deepEqual(BigInt(result.value), BigInt(value));
        assert.deepEqual(BigInt(result.refundTimeInBlocks), BigInt(refundTimeInBlocks));
        assert.equal(contractBalance, value);

        let participantBalance = await web3.eth.getBalance(participant);

        const hash = web3.utils.soliditySha3(
            {t : 'address', v : addressFromSecret},
            {t : 'address', v : participant},
            {t : 'address', v : sender},
            {t : 'uint256', v : refundTimeInBlocks});

        let prefix = "\x19Ethereum Signed Message:\n32";
        const hash3 = web3.utils.soliditySha3(
            {t: 'string', v: prefix},
            {t: 'bytes32', v: hash});

        const sig = await secretAccount.sign(hash);

        let gasPrice = 20000000000;
        let redeemResult = await contract.redeem(addressFromSecret, sig.r, sig.s, sig.v, {from: participant, value: 0, gasPrice: gasPrice});

        contractBalance = await web3.eth.getBalance(contract.address);
        result = await contract.getSwapDetails(addressFromSecret);

        assert.equal(result.initiator, '0x0000000000000000000000000000000000000000');
        assert.equal(result.participant, '0x0000000000000000000000000000000000000000');
        assert.deepEqual(BigInt(result.value), BigInt(0));
        assert.deepEqual(BigInt(result.refundTimeInBlocks), BigInt(0));
        assert.equal(contractBalance, 0);

        let new_participantBalance = await web3.eth.getBalance(participant);
        let spentByRedeem = BigInt(gasPrice) * BigInt(redeemResult.receipt.gasUsed);
        // check balance
        assert.deepEqual(BigInt(new_participantBalance) + BigInt(spentByRedeem), BigInt(participantBalance) + BigInt(value));
    });

    it('should not redeem twice', async () => {
        const secret = "0x59cf604a0581191f30605dac02eee2e363b82bc8fb2bcc6aa3eaf11fa6315441";
        let secretAccount = await web3.eth.accounts.privateKeyToAccount(secret);
        // 0xc05955ecdc22E027f2094Fe8F8266B5a88270d56
        let addressFromSecret = secretAccount.address;

        let participant = accounts[1];
        let sender = accounts[0];
        let value = 500;
        let latestBlock = await web3.eth.getBlock("latest")
        let refundTimeInBlocks = latestBlock.number + 10;

        await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});

        const hash = web3.utils.soliditySha3(
            {t : 'address', v : addressFromSecret},
            {t : 'address', v : participant},
            {t : 'address', v : sender},
            {t : 'uint256', v : refundTimeInBlocks});

        let prefix = "\x19Ethereum Signed Message:\n32";
        const hash3 = web3.utils.soliditySha3(
            {t: 'string', v: prefix},
            {t: 'bytes32', v: hash});

        const sig = await secretAccount.sign(hash);

        await contract.redeem(addressFromSecret, sig.r, sig.s, sig.v, {from: participant, value: 0});

        try {
            await contract.redeem(addressFromSecret, sig.r, sig.s, sig.v, {from: participant, value: 0});
        }
        catch (error) {
            assert(error.message.indexOf('invalid msg.sender') >= 0);
        }
    });

    it('should not redeem with wrong msg.sender', async () => {
        const secret = "0x59cf604a0581191f30605dac02eee2e363b82bc8fb2bcc6aa3eaf11fa6315441";
        let secretAccount = await web3.eth.accounts.privateKeyToAccount(secret);
        // 0xc05955ecdc22E027f2094Fe8F8266B5a88270d56
        let addressFromSecret = secretAccount.address;

        let participant = accounts[1];
        let sender = accounts[0];
        let value = 500;
        let latestBlock = await web3.eth.getBlock("latest")
        let refundTimeInBlocks = latestBlock.number + 10;

        await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});

        const hash = web3.utils.soliditySha3(
            {t : 'address', v : addressFromSecret},
            {t : 'address', v : participant},
            {t : 'address', v : sender},
            {t : 'uint256', v : refundTimeInBlocks});

        let prefix = "\x19Ethereum Signed Message:\n32";
        const hash3 = web3.utils.soliditySha3(
            {t: 'string', v: prefix},
            {t: 'bytes32', v: hash});

        const sig = await secretAccount.sign(hash);

        try
        {
            // use wrong redeemer
            await contract.redeem(addressFromSecret, sig.r, sig.s, sig.v, {from: accounts[2], value: 0});
        }
        catch (error) {
            assert(error.message.indexOf('invalid msg.sender') >= 0);
        }
    });

    it('should not redeem with wrong signature', async () => {
        const secret = "0x59cf604a0581191f30605dac02eee2e363b82bc8fb2bcc6aa3eaf11fa6315441";
        let secretAccount = await web3.eth.accounts.privateKeyToAccount(secret);
        // 0xc05955ecdc22E027f2094Fe8F8266B5a88270d56
        let addressFromSecret = secretAccount.address;

        let participant = accounts[1];
        let sender = accounts[0];
        let value = 500;
        let latestBlock = await web3.eth.getBlock("latest")
        let refundTimeInBlocks = latestBlock.number + 10;

        await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});

        const hash = web3.utils.soliditySha3(
            {t : 'address', v : addressFromSecret},
            {t : 'address', v : participant},
            {t : 'address', v : sender},
            {t : 'uint256', v : refundTimeInBlocks});

        let prefix = "\x19Ethereum Signed Message:\n32";
        const hash3 = web3.utils.soliditySha3(
            {t: 'string', v: prefix},
            {t: 'bytes32', v: hash});

        // sign by wrong secret
        const sig = await web3.eth.accounts.sign(hash, "f26b34783a5f8b16b11bde493c37989afba93562379b04db544518eb07555943");

        try
        {
            await contract.redeem(addressFromSecret, sig.r, sig.s, sig.v, {from: participant, value: 0});
        }
        catch (error) {
            assert(error.message.indexOf('invalid address') >= 0);
        }
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

    it('should refund properly', async () => {
        let addressFromSecret = '0xc05955ecdc22E027f2094Fe8F8266B5a88270d56';
        let participant = accounts[1];
        let sender = accounts[0];
        let value = 500;
        let latestBlock = await web3.eth.getBlock("latest")
        let refundTimeInBlocks = latestBlock.number + 2;
        let gasPrice = 20000000000;

        let senderBalance = await web3.eth.getBalance(sender);
        let resultLock = await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value, gasPrice: gasPrice});
        let resultRefund = await contract.refund(addressFromSecret, {from: sender, value: 0, gasPrice: gasPrice});

        // check balance and contract state
        let contractBalance = await web3.eth.getBalance(contract.address);
        let result = await contract.getSwapDetails(addressFromSecret);
        let newSenderBalance = await web3.eth.getBalance(sender);

        assert.equal(result.initiator, '0x0000000000000000000000000000000000000000');
        assert.equal(result.participant, '0x0000000000000000000000000000000000000000');
        assert.deepEqual(BigInt(result.value), BigInt(0));
        assert.deepEqual(BigInt(result.refundTimeInBlocks), BigInt(0));
        assert.equal(contractBalance, 0);

        let spentByLock = BigInt(resultLock.receipt.gasUsed) * BigInt(gasPrice);
        let spentByRefund = BigInt(resultRefund.receipt.gasUsed) * BigInt(gasPrice);

        assert.deepEqual(BigInt(newSenderBalance) + BigInt(spentByLock) + BigInt(spentByRefund), BigInt(senderBalance));
    });

    it('should not refund before refundTimeInBlocks', async () => {
        let addressFromSecret = '0xc05955ecdc22E027f2094Fe8F8266B5a88270d56';
        let participant = accounts[1];
        let sender = accounts[0];
        let value = 500;

        let latestBlock = await web3.eth.getBlock("latest")
        let refundTimeInBlocks = latestBlock.number + 10;

        await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});

        try
        {
            await contract.refund(addressFromSecret, {from: sender, value: 0});
        }
        catch (error) {
            assert(error.message.indexOf('refundTimeInBlocks has not come') >= 0);
        }
    });

    it('should not refund twice', async () => {
        let addressFromSecret = '0xc05955ecdc22E027f2094Fe8F8266B5a88270d56';
        let participant = accounts[1];
        let sender = accounts[0];
        let value = 500;
        let latestBlock = await web3.eth.getBlock("latest")
        let refundTimeInBlocks = latestBlock.number + 2;

        await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});
        await contract.refund(addressFromSecret, {from: sender, value: 0});

        // check balance and contract state
        let contractBalance = await web3.eth.getBalance(contract.address);
        let result = await contract.getSwapDetails(addressFromSecret);

        assert.equal(result.initiator, '0x0000000000000000000000000000000000000000');
        assert.equal(result.participant, '0x0000000000000000000000000000000000000000');
        assert.deepEqual(BigInt(result.value), BigInt(0));
        assert.deepEqual(BigInt(result.refundTimeInBlocks), BigInt(0));
        assert.equal(contractBalance, 0);

        try {
            await contract.refund(addressFromSecret, {from: sender, value: 0});
        }
        catch (error) {
            assert(error.message.indexOf('invalid msg.sender') >= 0);
        }
    });

    it('should not refund with wrong msg.sender', async () => {
        let addressFromSecret = '0xc05955ecdc22E027f2094Fe8F8266B5a88270d56';
        let participant = accounts[1];
        let sender = accounts[0];
        let value = 500;
        let latestBlock = await web3.eth.getBlock("latest")
        let refundTimeInBlocks = latestBlock.number + 2;

        await contract.initiate(refundTimeInBlocks, addressFromSecret, participant, {from: sender, value: value});

        try
        {
            await contract.refund(addressFromSecret, {from: participant, value: 0});
        }
        catch (error) {
            assert(error.message.indexOf('invalid msg.sender') >= 0);
        }
    });
});
