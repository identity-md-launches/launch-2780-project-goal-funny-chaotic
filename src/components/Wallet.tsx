import { useState } from "react";
import {
  useConnection,
  useConnect,
  useDisconnect,
  useSwitchChain,
  type Connector,
} from "wagmi";
import { getAddress } from "viem";
import { Modal } from "./Modal";
import { Icon } from "./Icon";
import { chain, transactionError } from "../lib/chain";
import { OPEN_IN, isMobileBrowser } from "../lib/open-in";

export function Wallet({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { address, isConnected, chainId } = useConnection();
  const {
    connectors,
    mutateAsync: connect,
    isPending,
    variables,
  } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const { mutateAsync: switchChain, isPending: switching } = useSwitchChain();
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const named = connectors.some(
    (c) => c.type === "injected" && c.id !== "injected",
  );
  const mobile =
    isMobileBrowser() &&
    !named &&
    !(window as Window & { ethereum?: unknown }).ethereum;
  const listed = [
    ...connectors.filter((c) => c.type === "injected"),
    ...connectors.filter((c) => c.type !== "injected"),
  ].filter(
    (c) =>
      !(c.id === "injected" && named) && !(mobile && c.type === "injected"),
  );
  const label = (c: Connector) =>
    c.id === "injected"
      ? "Browser wallet"
      : c.id === "coinbaseWalletSDK"
        ? mobile
          ? "Coinbase Smart Wallet"
          : "Coinbase Wallet"
        : c.name;
  const short = address
    ? `${getAddress(address).slice(0, 6)}…${address.slice(-4)}`
    : "";
  const switchNetwork = async () => {
    setError("");
    try {
      await switchChain({ chainId: chain.id });
    } catch (e) {
      setError(transactionError(e));
      setOpen(true);
    }
  };
  return (
    <>
      <button
        className="wallet-button"
        onClick={() => {
          setError("");
          if (isConnected && chainId !== chain.id) void switchNetwork();
          else setOpen(true);
        }}
      >
        <Icon name="wallet" size={18} />
        <span>
          {isConnected
            ? chainId !== chain.id
              ? switching
                ? "Switching…"
                : "Switch to Sepolia"
              : short
            : "Connect"}
        </span>
      </button>
      {open && (
        <Modal
          title={isConnected ? "Your wallet" : "Connect a wallet"}
          onClose={() => setOpen(false)}
          className="wallet-sheet"
        >
          {isConnected && address ? (
            <>
              <p className="muted">Scores are submitted on Sepolia.</p>
              <p className="address">{getAddress(address)}</p>
              <div className="button-row">
                <button
                  className="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(getAddress(address));
                      setCopied(true);
                    } catch {
                      setError(
                        "Copy is unavailable. Select the address above to copy it.",
                      );
                    }
                  }}
                >
                  {copied ? "Copied" : "Copy address"}
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    disconnect();
                    setOpen(false);
                  }}
                >
                  Disconnect
                </button>
              </div>
              {chainId !== chain.id && (
                <button
                  className="primary full"
                  disabled={switching}
                  onClick={() => void switchNetwork()}
                >
                  Switch to Sepolia
                </button>
              )}
            </>
          ) : (
            <>
              <p className="muted">
                Only needed to save a score on-chain. Playing is free.
              </p>
              <div className="wallet-list">
                {mobile &&
                  OPEN_IN.map((w) => (
                    <a
                      className="wallet-row"
                      key={w.id}
                      href={w.href(location.href)}
                    >
                      <img
                        width="28"
                        height="28"
                        alt=""
                        src={`./wallets/${w.id}.svg`}
                      />
                      <span>Open in {w.name}</span>
                      <Icon name="external" size={16} />
                    </a>
                  ))}
                {listed.map((c) => (
                  <button
                    key={c.uid}
                    className="wallet-row"
                    disabled={isPending}
                    onClick={async () => {
                      setError("");
                      try {
                        await connect({ connector: c });
                        setOpen(false);
                      } catch (e) {
                        const message = transactionError(e);
                        setError(
                          message.startsWith("The transaction")
                            ? "Could not connect to this wallet. Install or unlock it and try again."
                            : message,
                        );
                      }
                    }}
                  >
                    {c.icon ? (
                      <img width="28" height="28" src={c.icon} alt="" />
                    ) : c.id === "coinbaseWalletSDK" ? (
                      <img
                        width="28"
                        height="28"
                        src="./wallets/coinbase.svg"
                        alt=""
                      />
                    ) : (
                      <Icon name="wallet" size={28} />
                    )}
                    <span>
                      {label(c)}
                      {isPending && variables?.connector === c
                        ? " · opening…"
                        : ""}
                    </span>
                  </button>
                ))}
              </div>
              {!named && !mobile && (
                <p className="small muted">
                  No extension detected? Use Coinbase Wallet or open this page
                  inside a mobile wallet.
                </p>
              )}
            </>
          )}
          <p role="status" className="error-text">
            {error}
          </p>
        </Modal>
      )}
    </>
  );
}
