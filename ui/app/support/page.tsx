"use client";

import { useSearchParams } from "next/navigation";
import { Avatar, Button, Card, Divider, Input } from "@nextui-org/react";
import { useGitHubContributors } from "../../hooks/useGitHubContributors";
import { Select, SelectItem } from "@nextui-org/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useContractRead,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { parseEther } from "viem";
import * as ethers from "ethers";
import axios from "axios";

const abi = require("../../constants/abi.json");

// ETH: https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png
// USDT: https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png
// EURC: https://tokens.1inch.io/0x1abaea1f7c830bd89acc67ec4af516284b1bc33c.png

const tokens = [
  {
    id: "ETH",
    label: "ETH",
    image:
      "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
    address: "0x0000000000000000000000000000000000000000",
  },
  {
    id: "USDC",
    label: "USDC",
    image:
      "https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
    address: "0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05",
  },
  {
    id: "EURC",
    label: "EURC",
    image:
      "https://tokens.1inch.io/0x1abaea1f7c830bd89acc67ec4af516284b1bc33c.png",
    address: "0x466D489b6d36E7E3b824ef491C225F5830E81cC1",
  },
];

export default function Home() {
  const params = useSearchParams();
  const orgAndName = params.get("name");
  const contributorsQuery = useGitHubContributors(orgAndName!);

  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(
    () =>
      contributorsQuery.data
        ? contributorsQuery.data.reduce(
            (acc: any, x: any) => acc + x.contributions,
            0
          )
        : null,
    [contributorsQuery.data]
  );

  const contributors = useMemo(() => {
    return (contributorsQuery.data ?? []).map((x: any) => ({
      ...x,
      share:
        amount && totals
          ? (Number.parseFloat(amount) * x.contributions) / totals
          : null,
    }));
  }, [contributorsQuery.data, amount, totals]);

  const tokenLabel = useMemo(
    () => tokens.find((t) => t.id === token)?.label,
    [token]
  );

  const { writeContractAsync, isSuccess, error } = useWriteContract();

  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const receipt = useWaitForTransactionReceipt({
    hash: txHash as any,
  });

  const onClickSupport = useCallback(async () => {
    const tokenAddress = tokens.find((t) => t.id === token)?.address;

    console.log("args", [
      orgAndName!,
      tokenAddress!,
      parseEther((Number.parseFloat(amount!) * 1000).toFixed()),
    ]);

    setLoading(true);

    // TODO: approve ERC20 transfer
    const value = parseEther((Number.parseFloat(amount!) / 1000).toString());
    const hash = await writeContractAsync({
      abi,
      address: process.env.NEXT_PUBLIC_GITHUB_FUND_MANAGER! as any,
      functionName: "fundToRepo",
      args: [orgAndName!, tokenAddress!, value],
      value:
        tokenAddress == "0x0000000000000000000000000000000000000000"
          ? value
          : undefined,
    });

    console.log("transaction hash", hash);

    setTxHash(hash);
  }, [amount, orgAndName, token, writeContractAsync]);

  const [fundId, setFundId] = useState<number | undefined>(undefined);
  const [fundedAmount, setFundedAmount] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (receipt.data) {
      console.log("receipt", receipt);

      const itface = new ethers.Interface([
        "event Funded(uint256 indexed fundId, string orgAndName, address funder, address token, uint256 amount)",
      ]);

      for (const log of receipt?.data?.logs ?? []) {
        try {
          const parsed = itface.parseLog(log);
          if (parsed !== null) {
            const fundId = parsed.args[0];
            const amount = parsed.args[4];
            setFundId(fundId);
            setFundedAmount(amount);
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
  }, [receipt]);

  const ipfsHashQuery = useReadContract({
    abi,
    address: process.env.NEXT_PUBLIC_GITHUB_FUND_MANAGER! as any,
    functionName: "getIpfsHash",
    args: [fundId as any],
    query: {
      enabled: fundId !== undefined,
    },
  });

  const isDistributedQuery = useReadContract({
    abi,
    address: process.env.NEXT_PUBLIC_GITHUB_FUND_MANAGER! as any,
    functionName: "isDistributed",
    args: [fundId as any],
    query: {
      enabled: fundId !== undefined,
    },
  });

  useEffect(() => {
    if (fundId !== undefined && !ipfsHashQuery.data) {
      const timer = setInterval(() => {
        console.log("refetch ipfsHashQuery");

        ipfsHashQuery.refetch();
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [fundId, ipfsHashQuery, ipfsHashQuery.data]);

  useEffect(() => {
    if (fundId !== undefined && !isDistributedQuery.data) {
      const timer = setInterval(() => {
        console.log("refetch isDistributedQuery");

        isDistributedQuery.refetch();
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [fundId, isDistributedQuery, isDistributedQuery.data]);

  useEffect(() => {
    if (ipfsHashQuery.data) {
      // todo: send to rust
      const ipfsHash = ipfsHashQuery.data;
      const amount = ethers.getBigInt(fundedAmount!).toString();

      console.log("request", { ipfsHash, fundId, amount });

      (async () => {
        const jsonFetchRes = await axios.get(
          `https://lavender-probable-flamingo-693.mypinata.cloud/ipfs/${ipfsHash}`
        );
        console.log("jsonFetchRes", jsonFetchRes);
        console.log("request", {
          fund_id: Number(fundId),
          value: Number.parseInt(amount),
          contributions: jsonFetchRes.data,
        });

        const requestProofRes = await axios.post(
          "http://localhost:8000/calculate",
          {
            fund_id: Number(fundId),
            value: Number.parseInt(amount),
            contributions: jsonFetchRes.data,
          }
        );
        console.log("requestProofRes", requestProofRes);
      })();
    }
  }, [fundId, fundedAmount, ipfsHashQuery.data]);

  useEffect(() => {
    if (isDistributedQuery.data) {
      console.log("completed!!!");
      setLoading(false);
    }
  }, [isDistributedQuery, isDistributedQuery.data]);

  console.log("ipfsHashQuery", fundId, ipfsHashQuery.data, ipfsHashQuery.error);
  console.log(
    "isDistributedQuery",
    fundId,
    isDistributedQuery,
    isDistributedQuery.data
  );

  console.log({
    amount,
    token,
    totals,
    isSuccess,
    error,
    receipt: receipt.data,
    fundId,
    fundedAmount,
  });

  return (
    <main
      className="flex min-h-screen"
      style={{
        padding: "64px 64px 32px",
        maxHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "max-content max-content 1fr max-content",
        gap: "32px",
      }}
    >
      <h1
        style={{
          textAlign: "left",
          color: "#ECEDEE",
          fontSize: "24px !important",
          fontWeight: "700",
        }}
      >
        Support for {orgAndName}
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        <Input
          type="number"
          variant="bordered"
          label="Amount"
          labelPlacement="inside"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
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
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h2
          style={{
            textAlign: "left",
            color: "#ECEDEE",
            fontSize: "24px !important",
            fontWeight: "600",
            flex: "0 0",
          }}
        >
          Preview
        </h2>
        <div
          style={{
            marginTop: "12px",
            overflow: "auto",
            maxHeight: "calc(100vh - 340px)",
          }}
        >
          <Card>
            {contributors.map((c: any) => (
              <>
                <div
                  style={{
                    height: "70px",
                    display: "flex",
                    alignItems: "center",
                    padding: "0px 24px",
                  }}
                >
                  <Avatar
                    size="sm"
                    isBordered
                    radius="full"
                    showFallback={false}
                    fallback={null}
                    src={c.avatar_url}
                  />
                  <span
                    style={{
                      marginLeft: "16px",
                      fontSize: "24px",
                      fontWeight: "600",
                    }}
                  >
                    {c.login}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "24px",
                      fontWeight: "600",
                    }}
                  >
                    {c.share !== null &&
                      tokenLabel !== undefined &&
                      `${c.share} ${tokenLabel}`}
                  </span>
                </div>

                <Divider />
              </>
            ))}
          </Card>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Button color="default" onClick={onClickSupport} isLoading={loading}>
          {loading ? "Sending" : "Support"}
        </Button>
      </div>
    </main>
  );
}
