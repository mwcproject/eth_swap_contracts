// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.8.0;

contract SwapCcontract {

    struct Swap {
        uint refundTimeInBlocks;
        address initiator;
        address participant;
        uint256 value;
    }

    mapping(bytes32 => Swap) swaps;

    function initiate(uint refundTimeInBlocks, bytes32 hashedSecret, address participant) public
        payable
    {
        require(swaps[hashedSecret].refundTimeInBlocks == 0, "swap for this hash is already initiated");
        require(participant != address(0), "invalid participant address");
        require(block.number < refundTimeInBlocks, "refundTimeInBlocks has already come");

        swaps[hashedSecret].refundTimeInBlocks = refundTimeInBlocks;
        swaps[hashedSecret].participant = participant;
        swaps[hashedSecret].initiator = msg.sender;
        swaps[hashedSecret].value = msg.value;
    }

    function redeem(bytes32 secret, bytes32 hashedSecret) public
    {
        require(msg.sender == swaps[hashedSecret].participant, "invalid msg.sender");
        require(sha256(abi.encodePacked(secret)) == hashedSecret, "invalid secret");

        Swap memory tmp = swaps[hashedSecret];
        delete swaps[hashedSecret];

        (bool success, ) = payable(tmp.participant).call{value: tmp.value}("");
        require(success, "Transfer failed.");
    }

    function refund(bytes32 hashedSecret) public
    {
        require(block.number >= swaps[hashedSecret].refundTimeInBlocks, "refundTimeInBlocks has not come");
        require(msg.sender == swaps[hashedSecret].initiator, "invalid msg.sender");

        Swap memory tmp = swaps[hashedSecret];
        delete swaps[hashedSecret];

        (bool success, ) = payable(tmp.initiator).call{value: tmp.value}("");
        require(success, "Transfer failed.");
    }

    function getSwapDetails(bytes32 hashedSecret)
    public view returns (uint refundTimeInBlocks, address initiator, address participant, uint256 value)
    {
        refundTimeInBlocks = swaps[hashedSecret].refundTimeInBlocks;
        initiator = swaps[hashedSecret].initiator;
        participant = swaps[hashedSecret].participant;
        value = swaps[hashedSecret].value;
    }
}