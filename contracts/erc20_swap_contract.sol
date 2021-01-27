// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.2 <0.8.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract erc20_swap_contract {
    using SafeERC20 for IERC20;

    struct Swap {
        uint refundTimeInBlocks;
        address contractAddress;
        address initiator;
        address participant;
        uint256 value;
    }

    mapping(bytes32 => Swap) swaps;
    
    // event for EVM logging
    // TODO

    modifier isNotInitiated(uint refundTimeInBlocks, bytes32 hashedSecret, address participant) {
        require(swaps[hashedSecret].refundTimeInBlocks == 0, "swap for this hash is already initiated");
        require(participant != address(0), "invalid participant address");
        require(block.number < refundTimeInBlocks, "refundTimeInBlocks has already come");
        _;
    }

    modifier isRefundable(bytes32 hashedSecret) {
        require(block.number >= swaps[hashedSecret].refundTimeInBlocks);
        require(msg.sender == swaps[hashedSecret].initiator);
        _;
    }
    
    modifier isRedeemable(bytes32 hashedSecret, bytes32 secret) {
        require(msg.sender == swaps[hashedSecret].participant, "invalid msg.sender");
        require(sha256(abi.encodePacked(secret)) == hashedSecret, "invalid secret");
        _;
    }
    
    function initiate(uint refundTimeInBlocks, bytes32 hashedSecret, address participant, address contractAddress, uint256 value) public
        isNotInitiated(refundTimeInBlocks, hashedSecret, participant)
    {
        swaps[hashedSecret].refundTimeInBlocks = refundTimeInBlocks;
        swaps[hashedSecret].contractAddress = contractAddress;
        swaps[hashedSecret].participant = participant;
        swaps[hashedSecret].initiator = msg.sender;
        swaps[hashedSecret].value = value;

        IERC20(contractAddress).safeTransferFrom(msg.sender, address(this), value);
    }
    
    function redeem(bytes32 secret, bytes32 hashedSecret) public
        isRedeemable(hashedSecret, secret)
    {
        Swap memory tmp = swaps[hashedSecret];
        delete swaps[hashedSecret];

        IERC20(tmp.contractAddress).safeTransfer(tmp.participant, tmp.value);
    }

    function refund(bytes32 hashedSecret) public
        isRefundable(hashedSecret) 
    {
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
