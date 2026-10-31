import type { Outfit } from "./outfits.ts";
import { combo } from "./outfits.ts";

export type EntityKind = "seed" | "coin" | "sock" | "cone" | "poop" | "toaster";
export type Entity = {
  id: number;
  lane: number;
  z: number;
  kind: EntityKind;
  hit: boolean;
};
export type RunPhase = "ready" | "running" | "paused" | "over";
export type GameSnapshot = {
  phase: RunPhase;
  score: number;
  distance: number;
  collected: number;
  boost: number;
  message: string;
  lane: number;
  jump: number;
};
export const isObstacle = (kind: EntityKind) =>
  ["cone", "poop", "toaster"].includes(kind);
export const basePoints = (kind: EntityKind) =>
  kind === "coin" ? 30 : kind === "sock" ? 50 : 10;

/** Simulation time is independent of rendering. A suspended tab cannot fast-forward a run. */
export class Runner {
  phase: RunPhase = "ready";
  lane = 1;
  visualLane = 1;
  jumpTime = 0;
  score = 0;
  distance = 0;
  collected = 0;
  elapsed = 0;
  boost = 0;
  entities: Entity[] = [];
  message = "";
  messageTime = 0;
  spawnIn = 0.5;
  sequence = 0;
  bonus: number;
  onCollect?: () => void;
  onCrash?: () => void;
  private random: () => number;
  constructor(outfit: Outfit, random: () => number = Math.random) {
    this.bonus = combo(outfit).bonus;
    this.random = random;
  }
  get jump() {
    return this.jumpTime > 0
      ? Math.sin((1 - this.jumpTime / 0.86) * Math.PI)
      : 0;
  }
  start() {
    this.phase = "running";
  }
  move(direction: number) {
    if (this.phase === "running")
      this.lane = Math.max(0, Math.min(2, this.lane + direction));
  }
  leap() {
    if (this.phase === "running" && this.jumpTime <= 0) this.jumpTime = 0.86;
  }
  pause() {
    if (this.phase === "running") this.phase = "paused";
  }
  resume() {
    if (this.phase === "paused") this.phase = "running";
  }
  blockBoost() {
    if (this.phase !== "running") return;
    this.boost = 12;
    this.message = "New Squeek block! 2× snack points";
    this.messageTime = 4;
  }
  tick(delta: number) {
    if (this.phase !== "running") return;
    const dt = Math.min(Math.max(delta, 0), 0.05);
    this.elapsed += dt;
    this.distance += dt * (9 + Math.min(this.elapsed * 0.12, 10));
    this.jumpTime = Math.max(0, this.jumpTime - dt);
    this.boost = Math.max(0, this.boost - dt);
    this.visualLane += (this.lane - this.visualLane) * Math.min(1, dt * 16);
    this.messageTime = Math.max(0, this.messageTime - dt);
    if (this.messageTime === 0) this.message = "";
    const speed = 0.25 + Math.min(this.elapsed * 0.002, 0.22);
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      const lane = Math.floor(this.random() * 3);
      const r = this.random();
      const kind: EntityKind =
        this.elapsed < 4
          ? "seed"
          : r < 0.43
            ? "seed"
            : r < 0.57
              ? "coin"
              : r < 0.64
                ? "sock"
                : r < 0.78
                  ? "cone"
                  : r < 0.91
                    ? "poop"
                    : "toaster";
      this.entities.push({ id: this.sequence++, lane, z: 0, kind, hit: false });
      this.spawnIn = Math.max(0.62, 1.05 - this.elapsed * 0.003);
    }
    for (const entity of this.entities) {
      const previous = entity.z;
      entity.z += dt * speed;
      if (!entity.hit && previous < 0.84 && entity.z >= 0.84) {
        entity.hit = true;
        if (Math.abs(entity.lane - this.visualLane) > 0.43) continue;
        if (isObstacle(entity.kind)) {
          if (this.jump > 0.42) {
            this.message = "Not today, floor goblin.";
            this.messageTime = 1.2;
            continue;
          }
          this.phase = "over";
          this.message =
            entity.kind === "poop"
              ? "A deeply avoidable poo-pocalypse."
              : entity.kind === "toaster"
                ? "You have been lightly toasted."
                : "The cone has right of way.";
          this.onCrash?.();
          break;
        }
        const points =
          (basePoints(entity.kind) + this.bonus) * (this.boost > 0 ? 2 : 1);
        this.score += points;
        this.collected++;
        this.message =
          entity.kind === "sock"
            ? `+${points} Forbidden laundry!`
            : `+${points} ${entity.kind === "coin" ? "Shiny!" : "Snack acquired."}`;
        this.messageTime = 0.9;
        this.onCollect?.();
      }
    }
    this.entities = this.entities.filter((e) => e.z < 1.2);
  }
  snapshot(): GameSnapshot {
    return {
      phase: this.phase,
      score: this.score,
      distance: Math.floor(this.distance),
      collected: this.collected,
      boost: Math.ceil(this.boost),
      message: this.message,
      lane: this.lane,
      jump: this.jump,
    };
  }
}
