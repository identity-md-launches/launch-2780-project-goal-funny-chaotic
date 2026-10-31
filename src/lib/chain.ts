import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors/injected";
import { coinbaseWallet } from "wagmi/connectors/coinbaseWallet";
import { sepolia } from "viem/chains";
import {
  createPublicClient,
  fallback,
  getAddress,
  isAddress,
  type Address,
} from "viem";

export const DEFAULT_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
export const EXPLORER = "https://sepolia.etherscan.io";
export const chain = {
  ...sepolia,
  rpcUrls: { default: { http: [DEFAULT_RPC] } },
} as const;
export const walletConfig = createConfig({
  chains: [chain],
  multiInjectedProviderDiscovery: true,
  connectors: [
    injected(),
    coinbaseWallet({
      appName: "Squeek Run",
      appLogoUrl: new URL("favicon.svg", document.baseURI).href,
    }),
  ],
  transports: { [sepolia.id]: http(DEFAULT_RPC) },
});
export type RuntimeConfig = {
  chainId: number;
  leaderboardAddress: Address | null;
  rpcUrl: string;
  deploymentTransaction: string | null;
  loading: boolean;
  error?: string;
};
export const UNCONFIGURED: RuntimeConfig = {
  chainId: sepolia.id,
  leaderboardAddress: null,
  rpcUrl: DEFAULT_RPC,
  deploymentTransaction: null,
  loading: false,
};
export async function loadConfig(): Promise<RuntimeConfig> {
  try {
    const response = await fetch(new URL("config.json", document.baseURI), {
      cache: "no-cache",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok)
      throw new Error("Site configuration could not be loaded.");
    const value = await response.json();
    if (value.chainId !== sepolia.id)
      throw new Error("The leaderboard must be configured for Sepolia.");
    if (
      value.leaderboardAddress !== null &&
      (!isAddress(value.leaderboardAddress) ||
        /^0x0{40}$/i.test(value.leaderboardAddress))
    )
      throw new Error("The leaderboard address is not configured correctly.");
    const rpc = new URL(value.rpcUrl);
    if (rpc.protocol !== "https:")
      throw new Error("The public RPC must use HTTPS.");
    return {
      chainId: value.chainId,
      leaderboardAddress: value.leaderboardAddress
        ? getAddress(value.leaderboardAddress)
        : null,
      rpcUrl: value.rpcUrl,
      deploymentTransaction: value.deploymentTransaction ?? null,
      loading: false,
    };
  } catch (e) {
    return {
      ...UNCONFIGURED,
      error:
        e instanceof Error ? e.message : "Site configuration is unavailable.",
    };
  }
}
export const makeReader = (rpc = DEFAULT_RPC) =>
  createPublicClient({
    chain,
    transport: fallback([
      http(rpc, { timeout: 10000, retryCount: 1 }),
      http("https://1rpc.io/sepolia", { timeout: 10000, retryCount: 1 }),
    ]),
  });
export const leaderboardAbi = [
  {
    type: "function",
    name: "getLeaderboard",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "player", type: "address" },
          { name: "score", type: "uint64" },
          { name: "nickname", type: "string" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "personalBest",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ name: "", type: "uint64" }],
  },
  {
    type: "function",
    name: "MAX_ENTRIES",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "version",
    stateMutability: "pure",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "submitScore",
    stateMutability: "nonpayable",
    inputs: [
      { name: "score", type: "uint64" },
      { name: "nickname", type: "string" },
    ],
    outputs: [],
  },
  ...[
    "InvalidScore",
    "InvalidNickname",
    "NotPersonalBest",
    "BelowLeaderboard",
  ].map((name) => ({ type: "error" as const, name, inputs: [] })),
] as const;
export type LeaderboardEntry = {
  player: Address;
  score: bigint;
  nickname: string;
};
export function transactionError(e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  if (/reject|denied|4001/i.test(message))
    return "Request declined in your wallet. You can try again.";
  if (/NotPersonalBest/i.test(message))
    return "Your on-chain best is already this score or higher. Try another run.";
  if (/BelowLeaderboard/i.test(message))
    return "The top 50 has moved ahead. Beat the lowest score and try again.";
  if (/insufficient funds/i.test(message))
    return "You need Sepolia test ETH for the network fee.";
  if (/chain|network/i.test(message))
    return "Switch your wallet to Sepolia, then try again.";
  return "The transaction could not be completed. Check your wallet and connection, then retry.";
}
export const validNickname = (name: string) =>
  /^[A-Za-z0-9_.-](?:[A-Za-z0-9_. -]{0,22}[A-Za-z0-9_.-])?$/.test(name);
