import { useCallback, useEffect, useMemo, useState } from "react";
import {
  leaderboardAbi,
  makeReader,
  type LeaderboardEntry,
  type RuntimeConfig,
} from "../lib/chain";
export function useLeaderboard(config: RuntimeConfig) {
  const client = useMemo(() => makeReader(config.rpcUrl), [config.rpcUrl]);
  const [rows, setRows] = useState<readonly LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const refresh = useCallback(async () => {
    if (!config.leaderboardAddress) return;
    setLoading(true);
    setError("");
    try {
      const address = config.leaderboardAddress;
      const [chainId, code, version, max] = await Promise.all([
        client.getChainId(),
        client.getBytecode({ address }),
        client.readContract({
          address,
          abi: leaderboardAbi,
          functionName: "version",
        }),
        client.readContract({
          address,
          abi: leaderboardAbi,
          functionName: "MAX_ENTRIES",
        }),
      ]);
      if (
        chainId !== 11155111 ||
        !code ||
        code === "0x" ||
        version !== 1n ||
        max !== 50n
      )
        throw new Error(
          "The configured contract could not be verified on Sepolia.",
        );
      const entries = await client.readContract({
        address,
        abi: leaderboardAbi,
        functionName: "getLeaderboard",
      });
      setRows(entries);
      setVerified(true);
    } catch (e) {
      setVerified(false);
      setError(
        e instanceof Error && e.message.startsWith("The configured")
          ? e.message
          : "The Sepolia leaderboard is unavailable. Check your connection and retry.",
      );
    } finally {
      setLoading(false);
    }
  }, [client, config.leaderboardAddress]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 30000);
    return () => clearInterval(timer);
  }, [refresh]);
  return { rows, loading, error, verified, refresh, client };
}
