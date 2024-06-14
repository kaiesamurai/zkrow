import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useGitHubRepository = (orgAndName: string) => {
  return useQuery({
    queryKey: ["https://api.github.com/repos/", orgAndName],
    queryFn: async () => {
      const res = await axios.get(`https://api.github.com/repos/${orgAndName}`);

      return res.data;
    },
    select: (data) => ({
      name: data.full_name,
      topics: data.topics,
      avatar: data.owner.avatar_url,
      description: data.description,
    }),
  });
};
