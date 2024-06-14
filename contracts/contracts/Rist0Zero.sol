// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../libs/risc0-ethereum/contracts/src/IRiscZeroVerifier.sol";

contract Risc0Test {
    bytes32 public constant IMAGE_ID = bytes32(0xeddd7b1df093cc5609d825fc39a9bb69a0790db7cf2d494e7aaacb534ae7a1f0);

    IRiscZeroVerifier public immutable verifier;

    constructor(IRiscZeroVerifier _verifier) {
        verifier = _verifier;
    }

    event Verified(uint256 fundId, string[] logins, uint256[] shares);

    function distributes(uint256 fund_id, string[] memory logins, uint256[] memory shares, bytes memory journal, bytes32 postStateDigest, bytes memory seal) external {
        require(verifier.verify(seal, IMAGE_ID, postStateDigest, sha256(journal)));
        emit Verified(fund_id, logins, shares);
    }
}
