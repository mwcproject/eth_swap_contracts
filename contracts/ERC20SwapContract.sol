// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract ERC20SwapContract {
    using SafeERC20 for IERC20;

    struct Swap {
        uint refundTimeInBlocks;
        address contractAddress;
        address initiator;
        address participant;
        uint256 value;
    }

    mapping(bytes32 => Swap) swaps;

    function initiate(uint refundTimeInBlocks, bytes32 hashedSecret, address participant, address contractAddress, uint256 value) public
    {
        require(swaps[hashedSecret].refundTimeInBlocks == 0, "swap for this hash is already initiated");
        require(participant != address(0), "invalid participant address");
        require(block.number < refundTimeInBlocks, "refundTimeInBlocks has already come");

        swaps[hashedSecret].refundTimeInBlocks = refundTimeInBlocks;
        swaps[hashedSecret].contractAddress = contractAddress;
        swaps[hashedSecret].participant = participant;
        swaps[hashedSecret].initiator = msg.sender;
        swaps[hashedSecret].value = value;

        IERC20(contractAddress).safeTransferFrom(msg.sender, address(this), value);
    }

    function redeem(bytes32 secret, bytes32 hashedSecret) public
    {
        require(msg.sender == swaps[hashedSecret].participant, "invalid msg.sender");
        require(sha256(abi.encodePacked(secret)) == hashedSecret, "invalid secret");

        Swap memory tmp = swaps[hashedSecret];
        delete swaps[hashedSecret];

        IERC20(tmp.contractAddress).safeTransfer(tmp.participant, tmp.value);
    }

    function refund(bytes32 hashedSecret) public
    {
        require(block.number >= swaps[hashedSecret].refundTimeInBlocks, "refundTimeInBlocks has not come");
        require(msg.sender == swaps[hashedSecret].initiator, "invalid msg.sender");

        Swap memory tmp = swaps[hashedSecret];
        delete swaps[hashedSecret];

        IERC20(tmp.contractAddress).safeTransfer(tmp.initiator, tmp.value);
    }

    function getSwapDetails(bytes32 hashedSecret)
    public view returns (uint refundTimeInBlocks, address contractAddress, address initiator, address participant, uint256 value)
    {
        refundTimeInBlocks = swaps[hashedSecret].refundTimeInBlocks;
        contractAddress = swaps[hashedSecret].contractAddress;
        initiator = swaps[hashedSecret].initiator;
        participant = swaps[hashedSecret].participant;
        value = swaps[hashedSecret].value;
    }
}