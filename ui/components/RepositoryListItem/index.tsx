"use client";

import { Avatar, Card, CardBody } from "@nextui-org/react";
import classes from "./index.module.css";
import { useGitHubRepository } from "../../hooks/useGitHubRepository";
import { gql, useQuery } from "@apollo/client";
import { useMemo } from "react";
import { ethers } from "ethers";

const query = gql`
  query Funded {
    fundeds {
      id
      fundId
      orgAndName
      funder
      token
      amount
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

type Props = {
  orgAndName: string;
};

export const RepositoryListItem = ({ orgAndName }: Props) => {
  const repoQuery = useGitHubRepository(orgAndName);
  const fundedQuery = useQuery(query);

  const totalFunded = useMemo(() => {
    let total = BigInt(0);
    (fundedQuery?.data?.fundeds ?? [])
      .filter((x: any) => x.orgAndName === orgAndName)
      .forEach((x: any) => {
        total = total + BigInt(x.amount);
      });

    return total > 0 ? ethers.formatUnits(total * BigInt(1000), 18) : null;
  }, [fundedQuery?.data?.fundeds, orgAndName]);

  return (
    <Card
      className={classes.card}
      style={{ width: "100%", padding: "8px 24px", cursor: "pointer" }}
    >
      <CardBody>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            <Avatar
              isBordered
              radius="full"
              showFallback={false}
              fallback={null}
              src={repoQuery.data?.avatar}
            />
            <h2 style={{ fontWeight: "600", fontSize: "18px" }}>
              {orgAndName}
            </h2>
          </div>

          {totalFunded !== null && (
            <span style={{ fontWeight: "700", fontSize: "18px" }}>
              {totalFunded} Ether Funded
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
