import { useQuery } from "@tanstack/react-query";

import { useGitHubAccessToken } from "./useGitHubAccessToken";

export interface GitHubProfile {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: any;
  email: string;
  hireable: boolean;
  bio: string;
  twitter_username: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export const useGitHubAccount = () => {
  const accessToken = useGitHubAccessToken();

  return useQuery<GitHubProfile>({
    queryKey: ["GitHub/MyProfile", accessToken],
    enabled: accessToken !== null,
    queryFn: async () => {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${accessToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      return res.json();
    },
  });
};
