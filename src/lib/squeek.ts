export const CORE_API = "https://api.squeekchain.com/v1/core";
export const STATUS_API = "https://api.squeekchain.com/v1/status";
export const BRIEF_CORE = "0x74665dAecA35A2303e767E76a2FF1FB6F93e119f";
export type CoreSnapshot = {
  identity: string;
  address: string;
  height: bigint;
  progress: number;
  work: bigint;
  settledRound: bigint;
  genesis: number;
  roundDuration: number;
  paused: boolean;
  fetchedAt: number;
  serverAt: number;
};
export type WheelSnapshot = {
  state: "spinning" | "idle" | "fault" | "stale";
  rpm: number;
  provenance: string;
  fetchedAt: number;
  expiresAt: number;
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Unexpected Squeekchain response.");
  return value as Record<string, unknown>;
}
function integer(value: unknown): bigint {
  if (typeof value !== "string" || !/^\d{1,40}$/.test(value))
    throw new Error("Squeekchain returned an invalid count.");
  return BigInt(value);
}
export function parseCore(
  payload: unknown,
  fetchedAt = Date.now(),
  serverAt = fetchedAt,
): CoreSnapshot {
  const p = record(payload),
    chain = record(p.chain),
    core = record(p.core),
    config = record(p.configuration),
    ids = record(p.identities);
  if (p.status !== "available" || String(chain.chainId) !== "11155111")
    throw new Error("Sepolia chain data is unavailable.");
  if (typeof ids.core !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(ids.core))
    throw new Error("SqueekCore identity is unavailable.");
  const units = integer(config.blockUnitsPerBlock),
    progress = integer(core.blockProgress);
  if (units === 0n || progress >= units)
    throw new Error("Block progress is outside its expected range.");
  const duration = Number(integer(config.roundDuration)),
    genesis = Number(integer(config.genesisTimestamp));
  if (
    !Number.isSafeInteger(duration) ||
    duration <= 0 ||
    !Number.isSafeInteger(genesis)
  )
    throw new Error("Round timing is unavailable.");
  return {
    identity: `${String(p.installationId)}:${ids.core.toLowerCase()}`,
    address: ids.core,
    height: integer(core.blockHeight),
    progress: Number((progress * 10000n) / units) / 100,
    work: integer(core.cumulativeWork),
    settledRound: integer(core.settledThroughRound),
    genesis,
    roundDuration: duration,
    paused: core.paused === true,
    fetchedAt,
    serverAt,
  };
}
export function parseWheel(payload: unknown, now = Date.now()): WheelSnapshot {
  const p = record(payload),
    m = record(p.measurement);
  const rpm = Number(m.rpmMilli) / 1000;
  if (!Number.isFinite(rpm) || rpm < 0)
    throw new Error("Wheel telemetry is unavailable.");
  const generated = Date.parse(String(p.generatedAt)),
    received = Date.parse(String(m.receivedAt));
  const threshold = Number(m.staleAfterSeconds) * 1000;
  const age = generated - received;
  const transportAge = now - generated;
  const fresh =
    m.freshness === "online" &&
    Number.isFinite(age) &&
    age >= -5000 &&
    age < threshold &&
    Number.isFinite(transportAge) &&
    transportAge >= -300000 &&
    transportAge < threshold;
  const state = !fresh
    ? "stale"
    : m.coreStatus === "COUNTER_FAULT"
      ? "fault"
      : ["ACTIVE", "SPINNING"].includes(String(m.coreStatus)) && rpm > 0
        ? "spinning"
        : "idle";
  return {
    state,
    rpm,
    provenance: String(m.provenance ?? "unknown"),
    fetchedAt: now,
    expiresAt:
      now +
      Math.max(0, threshold - Math.max(0, age) - Math.max(0, transportAge)),
  };
}
export function roundProgress(core: CoreSnapshot, now = Date.now()) {
  const serverTime = core.serverAt + now - core.fetchedAt;
  const elapsed = Math.max(0, serverTime / 1000 - core.genesis);
  return {
    round: Math.floor(elapsed / core.roundDuration),
    percent: ((elapsed % core.roundDuration) / core.roundDuration) * 100,
  };
}
/** High-water mark prevents duplicate bonuses after a reorg or an API identity change. */
export class BlockTracker {
  identity = "";
  high: bigint | undefined;
  accept(core: CoreSnapshot): boolean {
    if (this.identity !== core.identity || this.high === undefined) {
      this.identity = core.identity;
      this.high = core.height;
      return false;
    }
    if (core.height > this.high) {
      this.high = core.height;
      return !core.paused;
    }
    return false;
  }
}
export async function fetchJson(url: string, signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(8000);
  const response = await fetch(url, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    cache: "no-cache",
  });
  if (!response.ok)
    throw new Error(
      `Squeekchain returned ${response.status}. Try again shortly.`,
    );
  const serverAt = Date.parse(response.headers.get("Date") ?? "") || Date.now();
  return { payload: (await response.json()) as unknown, serverAt };
}
