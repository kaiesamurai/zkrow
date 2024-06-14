import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGitHubContributors = (orgAndName: string) => {
  return useQuery({
    queryKey: ["https://api.github.com/repos/", orgAndName, "/contributors"],
    queryFn: async () => {
      const res = await axios.get(
        `https://api.github.com/repos/${orgAndName}/contributors`
      );

      return res.data;
    },
    select: (data) =>
      data
        .filter((x: any) => x.type !== "Bot")
        .map((x: any) => ({
          login: x.login,
          id: x.id,
          avatar_url: x.avatar_url,
          contributions: x.contributions,
        })),
  });
};
