import { useEffect, useRef, useState, type RefObject } from "react";
import { Runner, type GameSnapshot } from "../game/engine";
import type { Outfit } from "../game/outfits";
import { drawScene } from "../game/art";
import { squeak } from "../game/sound";
import { Icon } from "./Icon";

export function GameBoard({
  outfit,
  runnerRef,
  best,
  sound,
  setLocked,
  onEnd,
  onHelp,
  restart,
  onRestartConsumed,
}: {
  outfit: Outfit;
  runnerRef: RefObject<Runner>;
  best: number;
  sound: boolean;
  setLocked: (value: boolean) => void;
  onEnd: (result: GameSnapshot) => void;
  onHelp: () => void;
  restart: boolean;
  onRestartConsumed: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    board = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(runnerRef.current.snapshot());
  const current = useRef({ outfit, sound, onEnd, setLocked });
  current.current = { outfit, sound, onEnd, setLocked };
  const start = () => {
    const game = new Runner(current.current.outfit);
    game.onCollect = () => squeak(current.current.sound);
    game.onCrash = () => squeak(current.current.sound, true);
    game.start();
    runnerRef.current = game;
    setLocked(true);
    setView(game.snapshot());
    board.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (restart) {
      start();
      onRestartConsumed();
    }
  }, [restart]);
  useEffect(() => {
    const element = canvas.current!;
    const c = element.getContext("2d")!;
    let width = 0,
      height = 0,
      raf = 0,
      last = 0,
      lastView = 0,
      previousPhase = runnerRef.current.phase;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new ResizeObserver(() => {
      const r = element.getBoundingClientRect();
      width = r.width;
      height = r.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      element.width = Math.round(width * dpr);
      element.height = Math.round(height * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    observer.observe(element);
    const loop = (time: number) => {
      const game = runnerRef.current;
      game.tick(last ? (time - last) / 1000 : 0);
      last = time;
      if (width > 0 && height > 0)
        drawScene(
          c,
          width,
          height,
          game,
          current.current.outfit,
          media.matches,
        );
      if (time - lastView > 90 || previousPhase !== game.phase) {
        setView(game.snapshot());
        lastView = time;
      }
      if (game.phase === "over" && previousPhase !== "over") {
        current.current.setLocked(false);
        current.current.onEnd(game.snapshot());
      }
      previousPhase = game.phase;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const hide = () => {
      if (document.hidden) {
        runnerRef.current.pause();
        setView(runnerRef.current.snapshot());
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", hide);
    };
  }, [runnerRef]);
  const active = view.phase === "running" || view.phase === "paused";
  const action = (name: "left" | "right" | "jump") => {
    if (name === "jump") runnerRef.current.leap();
    else runnerRef.current.move(name === "left" ? -1 : 1);
    board.current?.focus({ preventScroll: true });
  };
  return (
    <section className="game-section" aria-label="Squeek Run game">
      <div
        ref={board}
        className={`game-board phase-${view.phase}`}
        tabIndex={0}
        role="group"
        aria-label="Game. Arrow left and right to move, Space to jump, P to pause."
        onKeyDown={(e) => {
          if (e.target instanceof HTMLButtonElement) return;
          if (["ArrowLeft", "a", "A"].includes(e.key)) {
            e.preventDefault();
            action("left");
          }
          if (["ArrowRight", "d", "D"].includes(e.key)) {
            e.preventDefault();
            action("right");
          }
          if ([" ", "ArrowUp", "w", "W"].includes(e.key)) {
            e.preventDefault();
            if (!e.repeat) action("jump");
          }
          if (["p", "P", "Escape"].includes(e.key)) {
            e.preventDefault();
            const g = runnerRef.current;
            if (g.phase === "running") g.pause();
            else g.resume();
            setView(g.snapshot());
          }
        }}
      >
        <div className="game-hud">
          <div className="hud-score">
            <Icon name="seed" size={18} />
            <span>
              Score <strong>{view.score.toLocaleString()}</strong>
            </span>
          </div>
          <div className="hud-right">
            <span className="best-score">
              Best <strong>{best.toLocaleString()}</strong>
            </span>
            {active ? (
              <button
                className="icon-button"
                aria-label={
                  view.phase === "paused" ? "Resume game" : "Pause game"
                }
                onClick={() => {
                  const g = runnerRef.current;
                  if (g.phase === "running") g.pause();
                  else g.resume();
                  setView(g.snapshot());
                  board.current?.focus();
                }}
              >
                <Icon
                  name={view.phase === "paused" ? "play" : "pause"}
                  size={18}
                />
              </button>
            ) : (
              <button
                className="icon-button"
                onClick={onHelp}
                aria-label="How to play"
              >
                <Icon name="help" size={19} />
              </button>
            )}
          </div>
        </div>
        <canvas
          ref={canvas}
          className="game-canvas"
          aria-label={`Hamster wearing ${outfit.head}, holding ${outfit.hand}, with ${outfit.extra === "none" ? "no extra accessory" : outfit.extra}.`}
          onPointerDown={(e) => {
            if (view.phase !== "running") return;
            const r = e.currentTarget.getBoundingClientRect(),
              x = (e.clientX - r.left) / r.width;
            action(x < 0.3 ? "left" : x > 0.7 ? "right" : "jump");
          }}
        >
          <span className="sr-only">
            Your browser needs Canvas support to play Squeek Run.
          </span>
        </canvas>
        {view.phase === "ready" && (
          <div className="game-start">
            <button className="primary start-button" onClick={start}>
              <Icon name="play" />
              Start running
              <Icon name="arrow" />
            </button>
            <span className="small">No wallet. No dignity. Just run.</span>
          </div>
        )}
        {view.phase === "paused" && (
          <div className="pause-overlay">
            <h2>Snack break?</h2>
            <p>The wheel can wait.</p>
            <button
              className="primary"
              onClick={() => {
                runnerRef.current.resume();
                board.current?.focus();
              }}
            >
              Resume running
              <Icon name="play" />
            </button>
          </div>
        )}
        {view.phase === "over" && (
          <div className="game-start">
            <button className="primary start-button" onClick={start}>
              Run again
              <Icon name="arrow" />
            </button>
          </div>
        )}
        {view.phase === "running" && (
          <>
            <div
              className={`game-feedback ${view.boost > 0 ? "boost-feedback" : ""}`}
              aria-hidden="true"
            >
              {view.message}
            </div>
            {view.boost > 0 && (
              <div className="boost-timer">2× block boost · {view.boost}s</div>
            )}
            <span className="distance">{view.distance} m</span>
          </>
        )}
      </div>
      <div className="game-controls">
        <div className="movement-buttons">
          <button
            className="key-button"
            onClick={() => action("left")}
            disabled={!active}
            aria-label="Move left"
          >
            <Icon name="left" />
          </button>
          <button
            className="key-button"
            onClick={() => action("right")}
            disabled={!active}
            aria-label="Move right"
          >
            <Icon name="arrow" />
          </button>
          <span>Move</span>
        </div>
        <div className="movement-buttons">
          <button
            className="key-button jump-button"
            onClick={() => action("jump")}
            disabled={!active}
          >
            <Icon name="up" size={16} />
            Jump
          </button>
          <span className="desktop-only">Space</span>
        </div>
        <span className="control-hint">Dodge junk and grab snacks.</span>
      </div>
      <div className="game-note">
        <Icon name="spark" size={16} />
        <span>Real new Squeek block = 12 seconds of 2× snack points.</span>
      </div>
      <p className="sr-only" role="status">
        {view.phase === "paused"
          ? "Game paused."
          : view.phase === "over"
            ? `Run ended with ${view.score} points.`
            : view.phase === "running"
              ? "Run started. Use left and right arrows and Space."
              : ""}
      </p>
    </section>
  );
}
