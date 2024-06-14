"use client";
import { Button } from "@nextui-org/react";
import { useCallback, useEffect } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { useGenerateGitHubAccountProof } from "../../hooks/useGenerateGitHubAccountProof";
import { useGitHubAccount } from "../../hooks/useGitHubAccount";
import Web3 from "web3";

const abi = require("../../constants/abi.json");

export const IssueZKPassButton = () => {
  const githubProfile = useGitHubAccount();
  const result = useReadContract({
    abi,
    address: process.env.NEXT_PUBLIC_GITHUB_FUND_MANAGER! as any,
    functionName: "hasGitHubPass",
    args: [githubProfile.data?.login! as any],
  });

  const { writeContract, isSuccess } = useWriteContract();
  const generateProof = useGenerateGitHubAccountProof();

  const onClick = useCallback(async () => {
    const proof = await generateProof();

    try {
      writeContract({
        abi,
        address: process.env.NEXT_PUBLIC_GITHUB_FUND_MANAGER! as any,
        functionName: "registerGitHubPass",
        args: [
          githubProfile.data?.login!,
          Web3.utils.stringToHex(proof!.taskId),
          Web3.utils.stringToHex(
            process.env.NEXT_PUBLIC_ZK_PASS_SCHEMA_GITHUB_PROFILE!
          ),
          proof!.uHash,
          proof!.publicFieldsHash,
          proof!.allocatorAddress,
          proof!.allocatorSignature,
          proof!.validatorAddress,
          proof!.validatorSignature,
        ],
      });
    } catch (error) {
      console.error(error);
    }
  }, [generateProof, githubProfile.data?.login, writeContract]);

  useEffect(() => {
    if (isSuccess) {
      result.refetch();
    }
  }, [isSuccess, result]);

  return (
    <Button
      isLoading={githubProfile.isLoading || result.isFetching}
      isDisabled={result.data === true}
      color="default"
      variant="bordered"
      onClick={onClick}
    >
      {result.data === true
        ? "ZKPass Issued"
        : githubProfile.isLoading || result.isFetching
        ? "ZKPass Checking"
        : "Issue ZKPass"}
    </Button>
  );
};
