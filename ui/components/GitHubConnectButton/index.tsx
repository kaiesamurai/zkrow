"use client";

import React from "react";
import { Link, Button } from "@nextui-org/react";
import { FaGithub } from "react-icons/fa6";
import { useGitHubAccount } from "../../hooks/useGitHubAccount";

export const GitHubConnectButton = () => {
  const myProfile = useGitHubAccount();
  const userName = myProfile.data?.login;

  if (userName) {
    return (
      <Link href="/profile">
        <Button
          isLoading={myProfile.isLoading}
          color="default"
          variant="solid"
          endContent={<FaGithub />}
          style={{ backgroundColor: "#2b3137" }}
          disabled={myProfile.isLoading}
        >
          {userName}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      isLoading={myProfile.isLoading}
      href={`https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}`}
      as={Link}
      color="default"
      variant="solid"
      endContent={<FaGithub />}
      style={{ backgroundColor: "#2b3137" }}
      disabled={myProfile.isPaused || myProfile.isLoading}
    >
      SignIn GitHub
    </Button>
  );
};
