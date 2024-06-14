import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { atomWithStorage } from "jotai/utils";
import { useAtom } from "jotai";

const LOCALSTORAGE_GITHUB_ACCESS_TOKEN = "LOCALSTORAGE_GITHUB_ACCESS_TOKEN";

const githubAccessTokenAtom = atomWithStorage<string | null>(
  LOCALSTORAGE_GITHUB_ACCESS_TOKEN,
  null
);

export const useGitHubAccessToken = () => {
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("access_token");

  const [accessToken, setAccessToken] = useAtom(githubAccessTokenAtom);

  useEffect(() => {
    if (queryToken !== null) {
      setAccessToken(queryToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return accessToken;
};
