import { useCallback, useEffect, useRef, useState } from "react";
import { GameBoard } from "./components/GameBoard";
import { Wardrobe } from "./components/Wardrobe";
import { LiveStrip } from "./components/LiveStrip";
import { Leaderboard } from "./components/Leaderboard";
import { Wallet } from "./components/Wallet";
import { Results } from "./components/Results";
import { Modal } from "./components/Modal";
import { Icon } from "./components/Icon";
import { Runner, type GameSnapshot } from "./game/engine";
import { squeak } from "./game/sound";
import { DEFAULT_OUTFIT, validOutfit, type Outfit } from "./game/outfits";
import { useSqueek } from "./hooks/useSqueek";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { readLocal, writeLocal } from "./lib/storage";
import { EXPLORER, loadConfig, UNCONFIGURED } from "./lib/chain";
import { BRIEF_CORE, CORE_API, STATUS_API, roundProgress } from "./lib/squeek";

export default function App() {
  const [outfit, updateOutfit] = useState(() =>
    validOutfit(readLocal("squeek:outfit", DEFAULT_OUTFIT)),
  );
  const [best, setBest] = useState(() => {
    const n = readLocal<number>("squeek:best", 0);
    return Number.isSafeInteger(n) && n >= 0 ? n : 0;
  });
  const [sound, setSound] = useState(false),
    [locked, setLocked] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false),
    [dataOpen, setDataOpen] = useState(false),
    [walletOpen, setWalletOpen] = useState(false);
  const [result, setResult] = useState<GameSnapshot | null>(null),
    [resultOpen, setResultOpen] = useState(false),
    [restart, setRestart] = useState(false);
  const [config, setConfig] = useState({ ...UNCONFIGURED, loading: true });
  const runnerRef = useRef(new Runner(outfit));
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (resultTimer.current) clearTimeout(resultTimer.current);
    },
    [],
  );
  const data = useSqueek(useCallback(() => runnerRef.current.blockBoost(), []));
  const leaderboard = useLeaderboard(config);
  useEffect(() => {
    void loadConfig().then(setConfig);
  }, []);
  const setOutfit = (o: Outfit) => {
    updateOutfit(o);
    writeLocal("squeek:outfit", o);
  };
  const onEnd = (run: GameSnapshot) => {
    setResult(run);
    if (resultTimer.current) clearTimeout(resultTimer.current);
    resultTimer.current = setTimeout(() => {
      if (runnerRef.current.phase === "over") setResultOpen(true);
    }, 500);
    setBest((previous) => {
      const value = Math.max(previous, run.score);
      writeLocal("squeek:best", value);
      return value;
    });
  };
  const pauseFor = (open: (b: boolean) => void) => {
    runnerRef.current.pause();
    open(true);
  };
  const returnToGame = () => {
    document.getElementById("game")?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  const round = data.core ? roundProgress(data.core, data.now) : null;
  return (
    <>
      <a className="skip-link" href="#game">
        Skip to game
      </a>
      <header className="site-header">
        <a href="#game" className="brand" aria-label="Squeek Run home">
          <img src="./favicon.svg" width="38" height="38" alt="" />
          <span>
            Squeek<span className="brand-run">Run</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a className="nav-game" href="#game">
            Play
          </a>
          <a href="#leaderboard">Leaderboard</a>
          <button onClick={() => pauseFor(setHelpOpen)}>How to play</button>
        </nav>
        <div className="header-tools">
          <button
            className="icon-button sound-button"
            aria-label={sound ? "Mute sounds" : "Enable sounds"}
            aria-pressed={sound}
            onClick={() => {
              setSound(!sound);
              squeak(!sound);
            }}
          >
            <Icon name={sound ? "volume" : "mute"} />
          </button>
          <Wallet
            open={walletOpen}
            setOpen={(value) => {
              if (value) runnerRef.current.pause();
              setWalletOpen(value);
            }}
          />
        </div>
      </header>
      <main>
        <section
          id="game"
          className="play-section"
          aria-labelledby="game-title"
        >
          <div className="intro">
            <div>
              <h1 id="game-title">
                Small hamster. <span>Big problems.</span>
              </h1>
              <p>
                A chaotic hamster runner powered by real Squeekchain activity.
              </p>
            </div>
            <div className="intro-doodle" aria-hidden="true">
              <svg viewBox="0 0 135 63">
                <path
                  d="M8 43q30 20 62-15m-5 18 5-18-19 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <text
                  x="72"
                  y="20"
                  transform="rotate(8 72 20)"
                  fontSize="15"
                  fontFamily="Fredoka"
                >
                  100% fluff
                </text>
                <text
                  x="80"
                  y="39"
                  transform="rotate(8 80 39)"
                  fontSize="15"
                  fontFamily="Fredoka"
                >
                  0% sense
                </text>
              </svg>
            </div>
          </div>
          <LiveStrip data={data} onDetails={() => pauseFor(setDataOpen)} />
          <div className="play-layout">
            <GameBoard
              outfit={outfit}
              runnerRef={runnerRef}
              best={best}
              sound={sound}
              setLocked={setLocked}
              onEnd={onEnd}
              onHelp={() => pauseFor(setHelpOpen)}
              onViewResult={() => setResultOpen(true)}
              restart={restart}
              onRestartConsumed={() => setRestart(false)}
            />
            <Wardrobe outfit={outfit} setOutfit={setOutfit} locked={locked} />
          </div>
        </section>
        <Leaderboard
          config={config}
          board={leaderboard}
          best={best}
          onPlay={returnToGame}
        />
        <section className="how-section" aria-labelledby="how-title">
          <h2 id="how-title">A very serious training plan</h2>
          <div className="how-grid">
            <div>
              <span className="step-number">01</span>
              <h3>Dress irresponsibly</h3>
              <p>
                Pick a hat, a handheld disaster and an optional extra. All
                style. Very little sense.
              </p>
            </div>
            <div>
              <span className="step-number">02</span>
              <h3>Outrun your decisions</h3>
              <p>
                Change lanes, jump over junk and hoard seeds. Socks are worth a
                suspicious amount.
              </p>
            </div>
            <div>
              <span className="step-number">03</span>
              <h3>Become mildly legendary</h3>
              <p>
                Beat your best. When the Sepolia board opens, submit your score
                with a wallet.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <a className="footer-brand" href="#game">
          Squeek Run
        </a>
        <p>
          A community project for Squeekchain / Buildooooor. Unofficial.
          Unhinged.
        </p>
        <a href="https://squeekchain.com" target="_blank" rel="noreferrer">
          Meet Squeekchain
          <Icon name="external" size={14} />
        </a>
      </footer>
      {helpOpen && (
        <Modal title="Keep the fluff alive" onClose={() => setHelpOpen(false)}>
          <div className="help-list">
            <p>
              <strong>Move:</strong> left / right arrows or A / D. On touch, tap
              the left or right side of the game, or use the buttons below.
            </p>
            <p>
              <strong>Jump:</strong> Space, up arrow or W. Tap the center of the
              game or the Jump button.
            </p>
            <p>
              <strong>Pause:</strong> P, Escape or the pause button. Changing
              tabs automatically pauses the run.
            </p>
            <p>
              <strong>Collect:</strong> seeds +10, arcade SQK coins +30, lost
              socks +50. Your outfit adds 1–3 points to each pickup.
            </p>
            <p>
              <strong>Avoid:</strong> traffic cones, surprise poop and rogue
              toasters. Jump over them or switch lanes.
            </p>
            <p>
              <strong>Block boost:</strong> a newly observed completed Squeek
              block doubles collectible points for 12 seconds during your run.
            </p>
            <p className="small muted">
              Sounds start muted. Reduced motion removes decorative spinning and
              running bob. The moving game still requires visual timing.
            </p>
          </div>
          <button className="primary full" onClick={() => setHelpOpen(false)}>
            Got it
            <Icon name="check" />
          </button>
        </Modal>
      )}
      {dataOpen && (
        <Modal
          title="One real hamster. Real data."
          onClose={() => setDataOpen(false)}
        >
          <p className="muted">
            Public Squeekchain feeds refresh every 15 seconds. Your game keeps
            running if a feed goes offline.
          </p>
          <dl className="data-details">
            <div>
              <dt>Completed Squeek blocks</dt>
              <dd>{data.core?.height.toLocaleString() ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>Next block progress</dt>
              <dd>
                {data.core
                  ? `${data.core.progress.toFixed(2)}%`
                  : "Unavailable"}
              </dd>
            </div>
            <div>
              <dt>Settled work units</dt>
              <dd>{data.core?.work.toLocaleString() ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>Last settled round</dt>
              <dd>
                {data.core?.settledRound.toLocaleString() ?? "Unavailable"}
              </dd>
            </div>
            <div>
              <dt>Current round (clock estimate)</dt>
              <dd>{round?.round ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>Wheel speed</dt>
              <dd>
                {data.wheel && !data.wheelStale
                  ? `${data.wheel.rpm.toFixed(1)} RPM`
                  : "Unavailable"}
              </dd>
            </div>
            <div>
              <dt>Telemetry provenance</dt>
              <dd>{data.wheel?.provenance ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>Settlement</dt>
              <dd>
                {data.core
                  ? data.core.paused
                    ? "Paused on-chain"
                    : data.coreStale
                      ? "Last known data"
                      : "Available"
                  : "Unavailable"}
              </dd>
            </div>
          </dl>
          <p className="small muted">
            Round progress estimates elapsed time using the API’s genesis and
            round duration. It is separate from settled block progress. A fresh
            idle reading means a snack break, not spinning.
          </p>
          <h3>Source contract reported by the API</h3>
          {data.core ? (
            <a
              className="address"
              href={`${EXPLORER}/address/${data.core.address}`}
              target="_blank"
              rel="noreferrer"
            >
              {data.core.address}
            </a>
          ) : (
            <p>Unavailable until the core feed responds.</p>
          )}
          {data.core &&
            data.core.address.toLowerCase() !== BRIEF_CORE.toLowerCase() && (
              <p className="small muted">
                The API currently reports a different deployment from the
                original project brief. This game uses the allowed API source
                and displays its identity here.
              </p>
            )}
          <div className="button-row">
            <a href={CORE_API} target="_blank" rel="noreferrer">
              Core feed
              <Icon name="external" size={14} />
            </a>
            <a href={STATUS_API} target="_blank" rel="noreferrer">
              Wheel feed
              <Icon name="external" size={14} />
            </a>
            <button className="secondary" onClick={() => void data.refresh()}>
              Refresh data
            </button>
          </div>
        </Modal>
      )}
      <Results
        result={result}
        open={resultOpen && !walletOpen}
        config={config}
        board={leaderboard}
        onClose={() => setResultOpen(false)}
        onRestart={() => {
          setResultOpen(false);
          setRestart(true);
          returnToGame();
        }}
        onConnect={() => setWalletOpen(true)}
      />
    </>
  );
}
