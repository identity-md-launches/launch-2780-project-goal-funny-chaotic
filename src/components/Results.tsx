import { useEffect, useRef, useState } from "react";
import { useConnection, useSwitchChain, useWriteContract } from "wagmi";
import type { Hash } from "viem";
import type { GameSnapshot } from "../game/engine";
import {
  chain,
  EXPLORER,
  leaderboardAbi,
  transactionError,
  validNickname,
  type RuntimeConfig,
} from "../lib/chain";
import type { useLeaderboard } from "../hooks/useLeaderboard";
import { readLocal, writeLocal } from "../lib/storage";
import { Modal } from "./Modal";
import { Icon } from "./Icon";
type Pending = { hash: Hash; score: number; contract: string };

export function Results({
  result,
  open,
  config,
  board,
  onClose,
  onRestart,
  onConnect,
}: {
  result: GameSnapshot | null;
  open: boolean;
  config: RuntimeConfig;
  board: ReturnType<typeof useLeaderboard>;
  onClose: () => void;
  onRestart: () => void;
  onConnect: () => void;
}) {
  const { address, isConnected, chainId } = useConnection();
  const { mutateAsync: writeContract } = useWriteContract();
  const { mutateAsync: switchChain } = useSwitchChain();
  const [nickname, setNickname] = useState(() =>
    readLocal("squeek:nickname", ""),
  );
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(() => {
    const p = readLocal<Pending | null>("squeek:pending", null);
    return p &&
      /^0x[0-9a-f]{64}$/i.test(p.hash) &&
      Number.isSafeInteger(p.score) &&
      p.score > 0 &&
      /^0x[0-9a-f]{40}$/i.test(p.contract)
      ? p
      : null;
  });
  const [confirmed, setConfirmed] = useState<Pending | null>(null);
  const [receiptAttempt, setReceiptAttempt] = useState(0);
  const [receiptError, setReceiptError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setError("");
    setNameError("");
    setShareStatus("");
  }, [result]);
  useEffect(() => {
    if (
      pending &&
      config.leaderboardAddress &&
      pending.contract.toLowerCase() !== config.leaderboardAddress.toLowerCase()
    ) {
      setPending(null);
      writeLocal("squeek:pending", null);
    }
  }, [pending, config.leaderboardAddress]);
  useEffect(() => {
    if (
      !pending ||
      pending.contract.toLowerCase() !==
        config.leaderboardAddress?.toLowerCase()
    )
      return;
    let ignore = false;
    setReceiptError("");
    board.client
      .waitForTransactionReceipt({
        hash: pending.hash,
        confirmations: 1,
        timeout: 120000,
      })
      .then((receipt) => {
        if (ignore) return;
        if (receipt.status === "success") {
          setConfirmed(pending);
          void board.refresh();
        } else
          setError(
            "The transaction reverted. Your score was not saved. Try again.",
          );
        setPending(null);
        writeLocal("squeek:pending", null);
      })
      .catch(() => {
        if (!ignore)
          setReceiptError(
            "Confirmation is taking longer than expected. Check the transaction or check again.",
          );
      });
    return () => {
      ignore = true;
    };
  }, [pending, config.leaderboardAddress, board.client, receiptAttempt]);
  if (!open || !result) return null;
  const wrongChain = isConnected && chainId !== chain.id;
  const submit = async () => {
    if (
      !config.leaderboardAddress ||
      !board.verified ||
      result.score <= 0 ||
      pending ||
      busy
    )
      return;
    if (!isConnected || !address) {
      onConnect();
      return;
    }
    if (wrongChain) {
      try {
        await switchChain({ chainId: chain.id });
      } catch (e) {
        setError(transactionError(e));
      }
      return;
    }
    const name = nickname.trim();
    if (!validNickname(name)) {
      setNameError(
        "Use 1–24 letters, numbers, spaces, dots, dashes or underscores.",
      );
      field.current?.focus();
      return;
    }
    setNameError("");
    setError("");
    setBusy(true);
    try {
      const best = await board.client.readContract({
        address: config.leaderboardAddress,
        abi: leaderboardAbi,
        functionName: "personalBest",
        args: [address],
      });
      if (best >= BigInt(result.score)) {
        setError(
          `Your on-chain best is already ${best.toLocaleString()}. Beat it in another run.`,
        );
        return;
      }
      const { request } = await board.client.simulateContract({
        address: config.leaderboardAddress,
        abi: leaderboardAbi,
        functionName: "submitScore",
        args: [BigInt(result.score), name],
        account: address,
      });
      const hash = await writeContract({ ...request, chainId: chain.id });
      const transaction = {
        hash,
        score: result.score,
        contract: config.leaderboardAddress,
      };
      setPending(transaction);
      writeLocal("squeek:pending", transaction);
      writeLocal("squeek:nickname", name);
    } catch (e) {
      setError(transactionError(e));
    } finally {
      setBusy(false);
    }
  };
  const share = async () => {
    const text = `I scored ${result.score} in Squeek Run. My hamster has no dignity. Can yours do better?`;
    try {
      if (navigator.share)
        await navigator.share({
          title: "Squeek Run",
          text,
          url: location.href.split("#")[0],
        });
      else {
        await navigator.clipboard.writeText(
          `${text}\n${location.href.split("#")[0]}`,
        );
        setShareStatus("Score and link copied.");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setShareStatus(
          "Sharing is unavailable. Copy the page link to challenge a friend.",
        );
    }
  };
  const unavailable =
    !config.leaderboardAddress || !board.verified || result.score === 0;
  return (
    <Modal
      title="Wheel, that happened."
      onClose={onClose}
      className="results-modal"
    >
      <p className="muted">{result.message}</p>
      <div className="result-score">
        <strong>{result.score.toLocaleString()}</strong>
        <span>gloriously questionable points</span>
      </div>
      <div className="result-stats">
        <span>
          <strong>{result.distance}</strong> meters survived
        </span>
        <span>
          <strong>{result.collected}</strong> snacks acquired
        </span>
      </div>
      <div className="button-row">
        <button className="primary" onClick={onRestart}>
          Run again
          <Icon name="arrow" />
        </button>
        <button className="secondary" onClick={() => void share()}>
          Share score
          <Icon name="external" size={16} />
        </button>
      </div>
      <p className="small" role="status">
        {shareStatus}
      </p>
      <form
        className="score-form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <h3>Leave a tiny legacy</h3>
        <label htmlFor="nickname">Leaderboard nickname</label>
        <input
          id="nickname"
          ref={field}
          name="nickname"
          autoComplete="nickname"
          maxLength={24}
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setNameError("");
          }}
          placeholder="Sir Squeeksalot"
          aria-describedby="nickname-hint nickname-error"
          aria-invalid={!!nameError}
          disabled={busy || !!pending}
        />
        <p id="nickname-hint" className="small muted">
          1–24 characters. Public on Sepolia with your address.
        </p>
        <p id="nickname-error" className="small error-text">
          {nameError}
        </p>
        {unavailable && (
          <p className="submission-note">
            {config.loading
              ? "Leaderboard settings are loading. Your device best is already saved."
              : config.error ||
                (!config.leaderboardAddress
                  ? "On-chain saving opens after the community contract is deployed. This run counts toward your device best."
                  : !board.verified
                    ? "The leaderboard cannot be read right now. Retry from the leaderboard below."
                    : "Collect at least one snack before submitting a score.")}
          </p>
        )}
        <button
          className="secondary full"
          type="submit"
          disabled={unavailable || busy || !!pending}
        >
          {pending
            ? "Awaiting confirmation…"
            : busy
              ? "Confirm in your wallet…"
              : wrongChain
                ? "Switch to Sepolia"
                : !isConnected
                  ? "Connect to submit score"
                  : "Submit score on Sepolia"}
          <Icon name="wallet" size={18} />
        </button>
        {!unavailable && (
          <p className="small muted">
            No game fee. Your wallet shows the Sepolia network fee before you
            confirm.
          </p>
        )}
        <p role="status" className="error-text">
          {error}
        </p>
        {pending && (
          <div className="transaction-status">
            <p>Submitting {pending.score.toLocaleString()} points.</p>
            <a
              href={`${EXPLORER}/tx/${pending.hash}`}
              target="_blank"
              rel="noreferrer"
            >
              View pending transaction
              <Icon name="external" size={14} />
            </a>
            {receiptError && (
              <>
                <p>{receiptError}</p>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setReceiptAttempt((n) => n + 1)}
                >
                  Check confirmation
                </button>
              </>
            )}
          </div>
        )}
        {confirmed && (
          <p className="success-text" role="status">
            {confirmed.score.toLocaleString()} points confirmed on Sepolia.{" "}
            <a
              href={`${EXPLORER}/tx/${confirmed.hash}`}
              target="_blank"
              rel="noreferrer"
            >
              View transaction
            </a>
          </p>
        )}
      </form>
    </Modal>
  );
}
