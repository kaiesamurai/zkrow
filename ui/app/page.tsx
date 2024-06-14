import { Button } from "@nextui-org/react";
import { GitHubConnectButton } from "../components/GitHubConnectButton";
import { RepositoryListItem } from "../components/RepositoryListItem";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  const repositories = [
    "bitcoin/bitcoin",
    "ethereum/go-ethereum",
    "0xPolygon/polygon-edge",
    "smartcontractkit/solana-starter-kit",
  ];

  return (
    <main
      className="flex min-h-screen"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0px 64px",
      }}
    >
      <div
        style={{
          margin: "32px 0px 0px",
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ color: "#ECEDEE", fontSize: "24px", fontWeight: "700" }}>
          BitBounty
        </h1>
        <div style={{ display: "flex", gap: 16 }}>
          <ConnectButton />
          <GitHubConnectButton />
        </div>
      </div>

      <div>
        <p
          style={{
            marginTop: "32px",
            textAlign: "center",
            color: "#ECEDEE",
            fontSize: "24px !important",
            fontWeight: "700",
          }}
        >
          Boost innovation with every bit
        </p>
        <p
          style={{
            marginTop: "8px",
            textAlign: "center",
            color: "#ECEDEE",
            fontSize: "24px !important",
            fontWeight: "700",
          }}
        >
          Every contribution rewarded
        </p>
      </div>

      <div style={{ width: "100%", marginTop: "48px" }}>
        <div
          style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}
        >
          <Button
            color="default"
            style={{
              color: "rgb(236, 237, 238)",
            }}
          >
            Add new Repository
          </Button>
        </div>
        <div
          style={{
            marginTop: "18px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {repositories.map((r) => (
            <Link
              key={r}
              href={`/repository?name=${r}`}
              style={{ width: "100%" }}
            >
              <RepositoryListItem orgAndName={r} />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
