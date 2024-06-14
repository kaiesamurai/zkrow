// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../libs/risc0-ethereum/contracts/src/IRiscZeroVerifier.sol";

contract GitHubFundManager is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    struct GitHubPass {
        string gitHubLogin;
        bytes32 taskId;
        bytes32 schemaId;
        bytes32 uHash;
        bytes32 publicFieldsHash;
        address allocator;
        bytes allocatorSignature;
        address validator;
        bytes validatorSignature;
    }

    struct Fund {
        address funder;
        address tokenAddress;
        uint256 amount;
        string  orgAndName;
        bytes32 chainLinkFunctionRequestId;
        string  ipfsHash;
        bool distributed;
    }

    bytes32 public constant RISC0_IMAGE_ID = bytes32(0xeddd7b1df093cc5609d825fc39a9bb69a0790db7cf2d494e7aaacb534ae7a1f0);

    // https://docs.chain.link/chainlink-functions/supported-networks
    // Ethereum Sepolia
    address chainLinkFunctionsRouter = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
    bytes32 chainLinkFunctionsDonID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;

    IRiscZeroVerifier public immutable risc0Verifier;
    uint64 immutable subscriptionId;

    mapping(address => GitHubPass) githubPass;
    mapping(string => address) gitHubLoginToAddress;

    uint256 nextFundId = 0;
    mapping(uint256 => Fund) funds;
    mapping(bytes32 => uint256) requestIdToFundId;
    mapping(uint256 => mapping(string => uint256)) fundShares;

    constructor(uint64 _subscriptionId, address _risc0Verifier) FunctionsClient(chainLinkFunctionsRouter) ConfirmedOwner(msg.sender) {
        subscriptionId = _subscriptionId;
        risc0Verifier = IRiscZeroVerifier(_risc0Verifier);
    }

    uint32 gasLimit = 300000;
    string source =
        "const orgAndRepo = args[0];"
        "const res1 = await Functions.makeHttpRequest({"
        "url: `https://api.github.com/repos/${orgAndRepo}/contributors`"
        "});"
        "if (res1.error) {"
        "throw Error('Request1 failed: ' + JSON.stringify(res1));"
        "};"
        "const { data } = res1;"
        "const contributors = data.map((x) => ({id: x.id, login: x.login, contributions: x.contributions}));"
        "const res2 = await Functions.makeHttpRequest({"
        "url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',"
        "method: 'POST',"
        "headers: {"
        "'Accept': 'application/json',"
        "'Content-Type': 'application/json',"
        "'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIwZWUwY2E2MS0yZmFiLTQxMTgtYjgyYS03NGY1YWZiZWZhMTMiLCJlbWFpbCI6ImtvdXJpbi5ibG9ja2NoYWluQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJhZGEwYWExYjQwNDE3MTg1ZDJjMyIsInNjb3BlZEtleVNlY3JldCI6IjA3YzMwNWI5N2NkMmExMTYxMjBmYTIzYzRhZGRmNmM1ZTg1YmFiYTk0ZTgxNTE3NzY3ZWNjZjU3MmIzMGY4ZTgiLCJpYXQiOjE3MDkxMzk2NDV9.JvpAFXFQqmGmu5upmVe-Jk1OOhMO3mJJVT-P7swwbXY'"
        "},"
        "data: {pinataContent: contributors}"
        "});"
        "if (res2.error) {"
        "throw Error('Request2 failed: ' + JSON.stringify(res2) + JSON.stringify(contributors));"
        "};"
        "return Functions.encodeString(res2.data.IpfsHash);";

    event GitHubPassRegistered(string login, address addr);
    event Funded(uint256 indexed fundId, string orgAndName, address funder, address token, uint256 amount);
    event CalculationRequested(uint256 indexed fundId, string ipfsHash);
    event ChainLinkFunctionFailed(uint256 indexed fundId, bytes error);
    event FundDistributed(uint256 indexed fundId, string orgAndName, string[] logins, uint256[] shares);
    event FundDistributedToUser(uint256 indexed fundId, string indexed login, string orgAndName, uint256 share);
    event ShareWithdrwan(uint256 fundId, address token, address account, uint256 share);

    function hasGitHubPass(string memory githubLogin) view public returns (bool) {
        return gitHubLoginToAddress[githubLogin] != address(0x0);
    }

    function getIpfsHash(uint256 fundId) view public returns (string memory) {
        return funds[fundId].ipfsHash;
    }

    function isDistributed(uint256 fundId) view public returns (bool) {
        return funds[fundId].distributed;
    }

    function registerGitHubPass(
        string memory gitHubLogin,
        bytes32 taskId,
        bytes32 schemaId,
        bytes32 uHash,
        bytes32 publicFieldsHash,
        address allocator,
        bytes memory allocatorSignature,
        address validator,
        bytes memory validatorSignature
    ) external {
        bytes32 paramsHash1 = keccak256(abi.encodePacked(taskId, schemaId, validator));
        address recoveredAllocator = recoverSigner(paramsHash1, allocatorSignature);
        require(recoveredAllocator == allocator, "allocator's signature is invalid");

        bytes32 paramsHash2 = keccak256(abi.encodePacked(taskId, schemaId, uHash, publicFieldsHash));
        address recoveredValidator = recoverSigner(paramsHash2, validatorSignature);
        require(recoveredValidator == validator, "validator's signature is invalid");

        githubPass[msg.sender] = GitHubPass({
            gitHubLogin: gitHubLogin,
            taskId: taskId,
            schemaId: schemaId,
            uHash: uHash,
            publicFieldsHash: publicFieldsHash,
            allocator: allocator,
            allocatorSignature: allocatorSignature,
            validator: validator,
            validatorSignature: validatorSignature
        });
        gitHubLoginToAddress[gitHubLogin] = msg.sender;

        emit GitHubPassRegistered(gitHubLogin, msg.sender);
    }

    function fundToRepo(
        string memory orgAndName,
        address tokenAddress,
        uint256 amount
    ) external payable {
        if (tokenAddress == address(0x0)) {
            require(amount == msg.value, "amount is wrong");
        } else {
            IERC20 token = IERC20(tokenAddress);
            require(token.allowance(msg.sender, address(this)) >= amount, "allowance is not enough");

            token.transferFrom(msg.sender, address(this), amount);
        }

        uint256 fundId = nextFundId;

        string[] memory args = new string[](1);
        args[0] = orgAndName;
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        req.setArgs(args);

        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            chainLinkFunctionsDonID
        );

        funds[fundId] = Fund({
            funder: msg.sender,
            tokenAddress: tokenAddress,
            orgAndName: orgAndName,
            amount: amount,
            chainLinkFunctionRequestId: requestId,
            ipfsHash: "",
            distributed: false
        });
        requestIdToFundId[requestId] = fundId;

        nextFundId += 1;

        emit Funded(fundId, orgAndName, msg.sender, tokenAddress, amount);
    }

    function distributeFund(uint256 fundId, string[] memory logins, uint256[] memory shares, bytes memory journal, bytes32 postStateDigest, bytes memory seal) external {
        require(!funds[fundId].distributed, "distributed already");
        require(logins.length == shares.length, "logins and shares length mismatch");
        require(risc0Verifier.verify(seal, RISC0_IMAGE_ID, postStateDigest, sha256(journal)));

        for(uint256 i = 0; i < logins.length; i++) {
            fundShares[fundId][logins[i]] = shares[i];
        }

        funds[fundId].distributed = true;

        emit FundDistributed(fundId, funds[fundId].orgAndName, logins, shares);
        for(uint256 i=0; i<logins.length; i++) {
            emit FundDistributedToUser(fundId, logins[i], funds[fundId].orgAndName, shares[i]);
        }
    }

    function withdrawFund(uint256 fundId, string memory login) external {
        require(fundShares[fundId][login] > 0, "no share");

        address tokenAddress = funds[fundId].tokenAddress;
        uint256 share = fundShares[fundId][login];

        if (tokenAddress == address(0x0)) {
            payable(msg.sender).transfer(share);
        } else {
            IERC20(tokenAddress).transfer(msg.sender, share);
        }

        emit ShareWithdrwan(fundId, tokenAddress, msg.sender, share);
    }

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        uint256 fundId = requestIdToFundId[requestId];
        Fund storage fund = funds[fundId];
        require(fund.funder != address(0x0), "fund doesn't exist");

        if (err.length == 0) {
            funds[fundId].ipfsHash = string(response);

            emit CalculationRequested(fundId, funds[fundId].ipfsHash);
        } else {
            emit ChainLinkFunctionFailed(fundId, err);
        }
    }

    // event Trigger(uint256 fundId, address account);
    // event Performed(uint256 fundId, address account);

    // function testEmit(uint256 fundId, address account) external {
    //     emit Trigger(fundId, account);
    // }

    // function checkLog(Log calldata log, bytes memory _checkData) external pure returns (bool upkeepNeeded, bytes memory performData) {
    //     uint256 fundId = uint256(log.topics[0]);
    //     address account = address(uint160(uint256(log.topics[1])));
        
    //     // upkeepNeeded = keccak256(abi.encodePacked(account)) == keccak256(checkData);
    //     // performData = abi.encodePacked(fundId, account);

    //     upkeepNeeded = true;
    //     performData = abi.encodePacked(fundId, account);
    // }

    // function performUpkeep(bytes calldata performData) external {
    //     (uint256 fundId, address account) = abi.decode(performData, (uint256, address));
    //     emit Performed(fundId, account);
    // }

    function recoverSigner(bytes32 digest, bytes memory signature) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);

        return ecrecover(digest, v, r, s);
    }

    function splitSignature(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
    }
}