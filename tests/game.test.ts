import { test } from "node:test";
import assert from "node:assert/strict";
import { Runner } from "../src/game/engine.ts";
import {
  DEFAULT_OUTFIT,
  combo,
  validOutfit,
  HEADS,
  HANDS,
  EXTRAS,
} from "../src/game/outfits.ts";

test("all 280 outfit combinations have valid bonuses, invalid saved outfit recovers", () => {
  for (const head of HEADS)
    for (const hand of HANDS)
      for (const extra of EXTRAS) {
        const outfit = { head: head.id, hand: hand.id, extra: extra.id };
        assert.deepEqual(validOutfit(outfit), outfit);
        assert.ok(combo(outfit).bonus >= 1 && combo(outfit).bonus <= 3);
      }
  assert.deepEqual(validOutfit({ head: "garbage" }), DEFAULT_OUTFIT);
});
test("moves within lanes, cannot jump or score before starting", () => {
  const g = new Runner(DEFAULT_OUTFIT);
  g.move(-1);
  g.leap();
  g.tick(10);
  assert.equal(g.lane, 1);
  assert.equal(g.jumpTime, 0);
  assert.equal(g.distance, 0);
  g.start();
  for (let n = 0; n < 10; n++) g.move(-1);
  assert.equal(g.lane, 0);
  for (let n = 0; n < 10; n++) g.move(1);
  assert.equal(g.lane, 2);
});
test("collectibles score once with outfit bonus; live block doubles for 12 seconds", () => {
  const g = new Runner(DEFAULT_OUTFIT, () => 0);
  g.start();
  g.spawnIn = 100;
  g.entities = [{ id: 0, lane: 1, z: 0.839, kind: "seed", hit: false }];
  g.tick(0.02);
  assert.equal(g.score, 12);
  assert.equal(g.collected, 1);
  g.tick(0.02);
  assert.equal(g.score, 12);
  g.blockBoost();
  assert.equal(g.boost, 12);
  g.entities.push({ id: 1, lane: 1, z: 0.839, kind: "sock", hit: false });
  g.tick(0.02);
  assert.equal(g.score, 116);
  for (let n = 0; n < 250; n++) g.tick(0.05);
  assert.equal(g.boost, 0);
});
test("collision ends run, while jump and lane avoidance preserve it", () => {
  for (const kind of ["cone", "poop", "toaster"] as const) {
    const g = new Runner(DEFAULT_OUTFIT);
    g.start();
    g.spawnIn = 100;
    g.entities = [{ id: 0, lane: 1, z: 0.839, kind, hit: false }];
    g.tick(0.02);
    assert.equal(g.phase, "over");
    const j = new Runner(DEFAULT_OUTFIT);
    j.start();
    j.spawnIn = 100;
    j.leap();
    for (let n = 0; n < 7; n++) j.tick(0.05);
    j.entities = [{ id: 0, lane: 1, z: 0.839, kind, hit: false }];
    j.tick(0.02);
    assert.equal(j.phase, "running");
    const m = new Runner(DEFAULT_OUTFIT);
    m.start();
    m.move(-1);
    m.spawnIn = 100;
    for (let n = 0; n < 8; n++) m.tick(0.05);
    m.entities = [{ id: 0, lane: 1, z: 0.839, kind, hit: false }];
    m.tick(0.02);
    assert.equal(m.phase, "running");
  }
});
test("pause freezes movement, elapsed time and boosts; stalled frames are clamped", () => {
  const g = new Runner(DEFAULT_OUTFIT);
  g.start();
  g.blockBoost();
  g.tick(0.05);
  g.pause();
  const before = g.snapshot();
  g.move(-1);
  g.leap();
  g.tick(60);
  assert.deepEqual(g.snapshot(), before);
  g.resume();
  g.tick(60);
  assert.equal(g.elapsed, 0.1);
  assert.ok(g.distance < 1);
});
test("spawning is endless, ramps gradually and entities are garbage-collected", () => {
  const g = new Runner(DEFAULT_OUTFIT, () => 0.01);
  g.start();
  for (let n = 0; n < 5000; n++) g.tick(0.05);
  assert.equal(g.phase, "running");
  assert.ok(g.sequence > 200);
  assert.ok(g.entities.length < 10);
  assert.ok(g.distance > 3000);
});
