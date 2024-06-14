"use client";

import { useGenerateGitHubAccountProof } from "../hooks/useGenerateGitHubAccountProof";
import { useGitHubAccount } from "../hooks/useGitHubAccount";
import { Button } from "@nextui-org/button";

export const LifeCycle = () => {
  const myAccount = useGitHubAccount();
  const generateGitHubAccountProof = useGenerateGitHubAccountProof();

  return (
    <Button disabled={myAccount.isLoading} onClick={generateGitHubAccountProof}>
      Click for verify
    </Button>
  );
};
