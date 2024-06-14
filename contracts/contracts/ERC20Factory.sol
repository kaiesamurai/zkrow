//SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/utils/Create2.sol";
import "./MyERC20.sol";

contract ERC20Factory {
    mapping(bytes32 => address) public deployedTokens;

    event TokenDeployed(string name, string symbol, address tokenAddress);

    function deployToken(
        string memory name,
        string memory symbol,
        address initialHolder,
        uint256 initialBalance
    ) external returns (address) {
        bytes32 salt = bytes32(bytes(name));

        require(deployedTokens[salt] == address(0x0), "Already deployed");

        address tokenAddress = Create2.deploy(
            0,
            salt,
            abi.encodePacked(
                type(MyERC20).creationCode, 
                abi.encode(name, symbol, initialHolder, initialBalance)
            )
        );

        deployedTokens[salt] = tokenAddress;
        
        emit TokenDeployed(name, symbol, tokenAddress);

        return tokenAddress;
    }
}