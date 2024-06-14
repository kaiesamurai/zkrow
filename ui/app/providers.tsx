"use client";

import { NextUIProvider } from "@nextui-org/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { sepolia, baseSepolia } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  gql,
} from "@apollo/client";
import React from "react";

const queryClient = new QueryClient();

const apolloClient = new ApolloClient({
  uri: "https://api.studio.thegraph.com/query/37331/ethdenver-2024/version/latest",
  cache: new InMemoryCache(),
});

export const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  chains: [sepolia, baseSepolia],
  ssr: true, // If your dApp uses server side rendering (SSR)
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApolloProvider client={apolloClient}>
        <JotaiProvider>
          <NextUIProvider>
            <WagmiProvider config={config}>
              <RainbowKitProvider>
                <React.Suspense fallback={null}>{children}</React.Suspense>
              </RainbowKitProvider>
            </WagmiProvider>
          </NextUIProvider>
        </JotaiProvider>
      </ApolloProvider>
    </QueryClientProvider>
  );
}
