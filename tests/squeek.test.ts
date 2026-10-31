import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BlockTracker,
  parseCore,
  parseWheel,
  roundProgress,
} from "../src/lib/squeek.ts";

// A minimized, explicitly synthetic fixture derived from the documented API schema.
// Its contract identity is the actual source address returned during development.
const payload = {
  status: "available",
  installationId: "test-fixture",
  chain: { chainId: "11155111" },
  identities: { core: "0x980b4424c007caf7a1f3670b48c8eaef7ebc3d44" },
  configuration: {
    blockUnitsPerBlock: "1000000000",
    roundDuration: "600",
    genesisTimestamp: "1000",
  },
  core: {
    blockHeight: "5204",
    blockProgress: "637347328",
    cumulativeWork: "58518",
    settledThroughRound: "712",
    paused: false,
  },
};
test("real API units parse; round timing is distinct from settled block progress", () => {
  const c = parseCore(payload, 1000, 1300000);
  assert.equal(c.progress, 63.73);
  assert.equal(c.height, 5204n);
  assert.equal(roundProgress(c, 1000).percent, 50);
  assert.equal(roundProgress(c, 301000).round, 1);
});
test("unknown schemas, negative counts, wrong chain and impossible progress fail honestly", () => {
  for (const v of [
    {},
    { ...payload, status: "unavailable" },
    { ...payload, chain: { chainId: "1" } },
    { ...payload, core: { ...payload.core, blockHeight: "-1" } },
    { ...payload, core: { ...payload.core, blockProgress: "1000000000" } },
  ])
    assert.throws(() => parseCore(v));
});
test("initial observation never boosts; new heights boost once, reorg recovery does not double reward", () => {
  const t = new BlockTracker(),
    c = parseCore(payload);
  assert.equal(t.accept(c), false);
  assert.equal(t.accept(c), false);
  assert.equal(t.accept({ ...c, height: 5205n }), true);
  assert.equal(t.accept({ ...c, height: 5203n }), false);
  assert.equal(t.accept({ ...c, height: 5205n }), false);
  assert.equal(
    t.accept({ ...c, height: 5300n, identity: "replacement-deployment" }),
    false,
  );
  assert.equal(
    t.accept({
      ...c,
      height: 5301n,
      identity: "replacement-deployment",
      paused: true,
    }),
    false,
  );
});
test("spinning requires fresh active telemetry; stale, idle and fault are distinct", () => {
  const p = {
    generatedAt: "2026-10-31T12:00:00Z",
    measurement: {
      receivedAt: "2026-10-31T11:59:50Z",
      freshness: "online",
      staleAfterSeconds: 120,
      rpmMilli: 77000,
      coreStatus: "ACTIVE",
      provenance: "hardware",
    },
  };
  const now = Date.parse(p.generatedAt);
  assert.equal(parseWheel(p, now).state, "spinning");
  assert.equal(parseWheel(p, now).rpm, 77);
  assert.equal(
    parseWheel(
      { ...p, measurement: { ...p.measurement, coreStatus: "IDLE" } },
      now,
    ).state,
    "idle",
  );
  assert.equal(
    parseWheel(
      { ...p, measurement: { ...p.measurement, coreStatus: "COUNTER_FAULT" } },
      now,
    ).state,
    "fault",
  );
  assert.equal(
    parseWheel(
      { ...p, measurement: { ...p.measurement, freshness: "stale" } },
      now,
    ).state,
    "stale",
  );
  assert.equal(
    parseWheel({ ...p, generatedAt: "2026-10-31T12:05:00Z" }, now).state,
    "stale",
  );
  assert.equal(
    parseWheel(p, now + 121000).state,
    "stale",
    "a cached old online response must not look live",
  );
  assert.throws(() => parseWheel({ measurement: null }));
});
