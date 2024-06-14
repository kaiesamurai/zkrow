"use client";

import { useSearchParams } from "next/navigation";
import { useGitHubRepository } from "../../hooks/useGitHubRepository";
import { Avatar, Button, Card, CardBody } from "@nextui-org/react";
import { Listbox, ListboxItem, ListboxSection, cn } from "@nextui-org/react";
import { useGitHubContributors } from "../../hooks/useGitHubContributors";
import Link from "next/link";
import { gql, useQuery } from "@apollo/client";
import { useMemo } from "react";
import { ethers } from "ethers";

const funded = gql`
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

const distributeds = gql`
  query Funded {
    fundDistributeds {
      id
      fundId
      logins
      shares
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

const formatFixedPoints = (s: string) => {
  if (s.includes(".")) {
    const dotPos = s.indexOf(".");
    return s.slice(0, Math.min(s.length, dotPos + 3));
  } else {
    return s;
  }
};

export default function Home() {
  const params = useSearchParams();
  const orgAndName = params.get("name");
  const query = useGitHubRepository(orgAndName!);
  const contributorsQuery = useGitHubContributors(orgAndName!);

  const fundedQuery = useQuery(funded);
  const distributedsQuery = useQuery(distributeds);

  const contributors = useMemo(() => {
    const map: { [key: string]: bigint } = {};

    const fundedIds = (fundedQuery?.data?.fundeds ?? [])
      .filter((x: any) => x.orgAndName === orgAndName)
      .map((x: any) => x.fundId);

    (distributedsQuery?.data?.fundDistributeds ?? [])
      .filter((x: any) => fundedIds.includes(x.fundId))
      .forEach((x: any) => {
        for (let i = 0; i < x.logins.length; i++) {
          if (x.logins[i] in map) {
            map[x.logins[i]] = map[x.logins[i]] + BigInt(x.shares[i]);
          } else {
            map[x.logins[i]] = BigInt(x.shares[i]);
          }
        }
      });

    return map;
  }, [
    distributedsQuery?.data?.fundDistributeds,
    fundedQuery?.data?.fundeds,
    orgAndName,
  ]);

  const supporters = useMemo(() => {
    const map: { [key: string]: bigint } = {};

    (fundedQuery?.data?.fundeds ?? [])
      .filter((x: any) => x.orgAndName === orgAndName)
      .forEach((x: any) => {
        if (x.funder in map) {
          map[x.funder] = map[x.funder] + BigInt(x.amount);
        } else {
          map[x.funder] = BigInt(x.amount);
        }
      });

    return map;
  }, [fundedQuery?.data?.fundeds, orgAndName]);

  console.log("debug::contributors", contributors);

  return (
    <main
      className="flex min-h-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "0px 64px",
      }}
    >
      <div
        style={{
          marginTop: "64px",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Avatar
          size="lg"
          isBordered
          radius="full"
          showFallback={false}
          fallback={null}
          src={query.data?.avatar}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1
            style={{
              textAlign: "left",
              color: "#ECEDEE",
              fontSize: "24px !important",
              fontWeight: "700",
            }}
          >
            {orgAndName}
          </h1>
          <p
            style={{
              textAlign: "left",
              color: "#ECEDEE",
              fontSize: "16px !important",
              fontWeight: "400",
            }}
          >
            {query.data?.description}
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Link href={`/support?name=${orgAndName}`}>
            <Button
              color="default"
              style={{
                color: "rgb(236, 237, 238)",
              }}
            >
              Support
            </Button>
          </Link>
        </div>
      </div>

      <div
        style={{
          marginTop: "48px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
        }}
      >
        <div>
          <h2 style={{ marginBottom: "12px", fontWeight: "600" }}>
            Contributors
          </h2>
          <Card style={{ width: "100%" }}>
            <CardBody>
              <Listbox>
                {contributorsQuery.data !== null &&
                  contributorsQuery.data !== undefined &&
                  contributorsQuery.data.map((x: any) => (
                    <ListboxItem showDivider key="new">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "4px 0px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 24,
                          }}
                        >
                          <Avatar
                            size="sm"
                            isBordered
                            radius="full"
                            showFallback={false}
                            fallback={null}
                            src={x.avatar_url}
                          />
                          <span>{x.login}</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{ textAlign: "right", fontSize: "12px" }}
                          >
                            {x.contributions} Contributions
                          </span>

                          {x.login in contributors ? (
                            <span
                              style={{ textAlign: "right", fontSize: "12px" }}
                            >
                              {formatFixedPoints(
                                ethers.formatUnits(
                                  contributors[x.login] * BigInt(1000),
                                  18
                                )
                              )}{" "}
                              Ether Distributed
                            </span>
                          ) : (
                            <span
                              style={{ textAlign: "right", fontSize: "12px" }}
                            >
                              No Distributed
                            </span>
                          )}
                        </div>
                      </div>
                    </ListboxItem>
                  ))}
              </Listbox>
            </CardBody>
          </Card>
        </div>

        <div>
          <h2 style={{ marginBottom: "12px", fontWeight: "600" }}>
            Supporters
          </h2>
          <Card style={{ width: "100%", padding: "8px 12px" }}>
            <CardBody>
              <Listbox>
                {Object.entries(supporters).map(([funder, value]) => (
                  <ListboxItem showDivider key="new">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 0px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 24,
                        }}
                      >
                        <span>{`${funder.slice(0, 7)}...${funder.slice(
                          funder.length - 5
                        )}`}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <span style={{ textAlign: "right", fontSize: "12px" }}>
                          {ethers.formatUnits(value * BigInt(1000), 18)} Ether
                          Funded
                        </span>
                      </div>
                    </div>
                  </ListboxItem>
                ))}
              </Listbox>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
