"use client";

import { useSearchParams } from "next/navigation";
import { useGitHubAccount } from "../../hooks/useGitHubAccount";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Listbox,
  ListboxItem,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { IssueZKPassButton } from "./IssueZKPassButton";
import { gql, useQuery } from "@apollo/client";
import { ethers } from "ethers";

const formatFixedPoints = (s: string) => {
  if (s.includes(".")) {
    const dotPos = s.indexOf(".");
    return s.slice(0, Math.min(s.length, dotPos + 3));
  } else {
    return s;
  }
};

const chains = [
  {
    id: "sepolia",
    label: "Ethereum Sepolia",
    image: "https://docs.chain.link/assets/chains/ethereum.svg",
  },
  {
    id: "base_sepolia",
    label: "Base Sepolia",
    image: "https://docs.chain.link/assets/chains/base.svg",
  },
];

const tokens = [
  {
    id: "ETH",
    label: "ETH",
    image:
      "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
  },
  {
    id: "USDC",
    label: "USDC",
    image:
      "https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
  },
  {
    id: "EURC",
    label: "EURC",
    image:
      "https://tokens.1inch.io/0x1abaea1f7c830bd89acc67ec4af516284b1bc33c.png",
  },
];

const query = gql`
  query Funded {
    fundeds {
      fundId
      orgAndName
      funder
      token
      amount
      blockTimestamp
    }

    fundDistributeds {
      fundId
      logins
      shares
    }

    shareWithdrwans {
      id
      fundId
      token
      account
      share
    }
  }
`;

export default function Home() {
  const myProfile = useGitHubAccount();
  const router = useRouter();

  // const [chain, setChain] = useState<string | undefined>(undefined);
  // const [token, setToken] = useState<string | undefined>(undefined);

  // const login = myProfile?.data?.login;
  const login = "pappas999";

  const queryData = useQuery(query);

  const data = useMemo(() => {
    const fundDistributeds = queryData.data?.fundDistributeds ?? [];
    const fundeds = queryData.data?.fundeds ?? [];
    const shareWithdrwans = queryData.data?.shareWithdrwans ?? [];

    return fundeds
      .filter((x: any) => {
        return fundDistributeds.some((y: any) => {
          return x.fundId === y.fundId && y.logins.includes(login);
        });
      })
      .map((x: any) => {
        const received =
          shareWithdrwans.indexOf((s: any) => s.fundId === x.fundId) !== -1;
        const amount = fundDistributeds.find((y: any) => y.fundId === x.fundId);

        let shareIndex = -1;
        if (amount) {
          shareIndex = amount.logins.indexOf(login);
        }

        console.log("debug::x", x);

        return {
          received,
          orgAndName: x.orgAndName,
          share: shareIndex !== -1 ? amount.shares[shareIndex] : null,
          date: new Date(
            Number.parseInt(x.blockTimestamp) * 1000
          ).toDateString(),
        };
      });
  }, [
    login,
    queryData.data?.fundDistributeds,
    queryData.data?.fundeds,
    queryData.data?.shareWithdrwans,
  ]);

  console.log("debug::data", queryData, data);

  useEffect(() => {
    if (
      (myProfile.isFetched && myProfile.data === undefined) ||
      myProfile.isError
    ) {
      router.replace("/");
    }
  }, [myProfile, router]);

  return (
    <main
      className="flex min-h-screen"
      style={{
        padding: "64px 64px 24px",
        maxHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "max-content max-content 1fr max-content",
        gap: "24px",
      }}
    >
      <h1
        style={{
          textAlign: "left",
          color: "#ECEDEE",
          fontSize: "24px !important",
          fontWeight: "600",
        }}
      >
        Profile
      </h1>

      <div style={{ display: "flex", alignItems: "center" }}>
        <Avatar
          className="w-20 h-20 text-large"
          isBordered
          radius="full"
          showFallback={false}
          fallback={null}
          src={myProfile?.data?.avatar_url}
        />
        <div
          style={{
            height: "80px",
            marginLeft: "24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span style={{ fontSize: "18px !important", fontWeight: "800" }}>
            {myProfile?.data?.name}
          </span>
          <span style={{ fontSize: "16px !important", fontWeight: "600" }}>
            {myProfile?.data?.bio}
          </span>
          <a
            href={myProfile?.data?.html_url}
            style={{
              width: "auto",
              fontSize: "12px !important",
              textDecoration: "underline #ECEDEE",
              cursor: "pointer",
            }}
          >
            {myProfile?.data?.html_url}
          </a>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <IssueZKPassButton />
        </div>
      </div>

      <div style={{ marginTop: "36px" }}>
        {/* <span style={{ fontSize: "24px !important", fontWeight: "600" }}>
          Recipient Info
        </span>
        <div
          style={{
            marginTop: "12px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: 24,
          }}
        >
          <Select
            label="Select a chain"
            variant="bordered"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
          >
            {chains.map((t) => (
              <SelectItem
                key={t.id}
                value={t.id}
                startContent={
                  <Avatar
                    size="sm"
                    isBordered
                    radius="full"
                    showFallback={false}
                    fallback={null}
                    src={t.image}
                  />
                }
              >
                {t.label}
              </SelectItem>
            ))}
          </Select>
          <Select
            label="Select a token"
            variant="bordered"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          >
            {tokens.map((t) => (
              <SelectItem
                key={t.id}
                value={t.id}
                startContent={
                  <Avatar
                    size="sm"
                    isBordered
                    radius="full"
                    showFallback={false}
                    fallback={null}
                    src={t.image}
                  />
                }
              >
                {t.label}
              </SelectItem>
            ))}
          </Select>
          <Button color="default" style={{ height: "100%" }}>
            Update
          </Button>
        </div> */}

        <div>
          <span style={{ fontSize: "24px !important", fontWeight: "600" }}>
            Receipts
          </span>
          <Card style={{ width: "100%", marginTop: "12px" }}>
            <CardBody>
              <Listbox>
                {data.map((x: any) => (
                  <ListboxItem showDivider key="new">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: "600", fontSize: "18px" }}>
                        {"0xPolygon/polygon-edge"}
                      </span>
                      <span style={{ fontWeight: "600", fontSize: "18px" }}>
                        {formatFixedPoints(
                          ethers.formatUnits(BigInt(x.share) * BigInt(1000), 18)
                        )}
                        {"  Ether  Received"}
                        {` (${x.date}) `}
                      </span>
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
