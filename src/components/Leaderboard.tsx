import { useState } from "react";
import type { useLeaderboard } from "../hooks/useLeaderboard";
import { EXPLORER, type RuntimeConfig } from "../lib/chain";
import { Icon } from "./Icon";

export function Leaderboard({
  config,
  board,
  best,
  onPlay,
}: {
  config: RuntimeConfig;
  board: ReturnType<typeof useLeaderboard>;
  best: number;
  onPlay: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section
      id="leaderboard"
      className="leaderboard-section"
      aria-labelledby="leaderboard-title"
    >
      <div className="leaderboard-heading">
        <div>
          <h2 id="leaderboard-title">Hall of questionable fame</h2>
          <p className="muted">Top 50 snack hoarders, recorded on Sepolia.</p>
        </div>
        <span className="chain-label">
          <span className="chain-diamond" aria-hidden="true" />
          On-chain leaderboard
        </span>
      </div>
      <div className="leaderboard-body">
        <div className="leaderboard-main">
          {!config.leaderboardAddress ? (
            <div className="leaderboard-empty">
              <div className="trophy-art">
                <Icon name="trophy" size={48} />
              </div>
              <div>
                <h3>
                  {config.loading
                    ? "Checking the podium"
                    : config.error
                      ? "Leaderboard unavailable"
                      : "The podium is warming up"}
                </h3>
                <p>
                  {config.loading
                    ? "Loading the community leaderboard settings…"
                    : config.error ||
                      "The community leaderboard is awaiting contract deployment. On-chain submissions are not available yet."}
                </p>
                <p className="small muted">
                  You can still play and beat your best on this device.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="leaderboard-source">
                <a
                  className="address"
                  href={`${EXPLORER}/address/${config.leaderboardAddress}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {config.leaderboardAddress}
                  <Icon name="external" size={14} />
                </a>
                <button
                  className="icon-button"
                  disabled={board.loading}
                  aria-label="Refresh leaderboard"
                  onClick={() => void board.refresh()}
                >
                  <Icon name="refresh" size={18} />
                </button>
              </div>
              {board.error && (
                <div className="inline-error" role="status">
                  <p>{board.error}</p>
                  <button
                    className="secondary"
                    onClick={() => void board.refresh()}
                  >
                    Retry leaderboard
                  </button>
                </div>
              )}
              {board.loading && !board.rows.length ? (
                <p className="loading-text" role="status">
                  Reading scores from Sepolia…
                </p>
              ) : !board.error && !board.rows.length ? (
                <div className="leaderboard-empty">
                  <Icon name="trophy" size={48} />
                  <div>
                    <h3>The first seat is yours</h3>
                    <p>
                      Finish a run and submit a score to start the leaderboard.
                    </p>
                  </div>
                </div>
              ) : (
                !!board.rows.length && (
                  <>
                    {board.error && (
                      <p className="small muted">
                        Showing the last successful read.
                      </p>
                    )}
                    <table>
                      <caption className="sr-only">
                        Top scores read from the Sepolia leaderboard contract
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Rank</th>
                          <th scope="col">Hamster</th>
                          <th scope="col">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {board.rows
                          .slice(0, expanded ? 50 : 10)
                          .map((row, index) => (
                            <tr key={row.player}>
                              <td>{index + 1}</td>
                              <td>
                                <strong>
                                  <bdi>{row.nickname}</bdi>
                                </strong>
                                <a
                                  className="player-address"
                                  href={`${EXPLORER}/address/${row.player}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {row.player}
                                </a>
                              </td>
                              <td className="numeric">
                                {row.score.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {board.rows.length > 10 && (
                      <button
                        className="secondary"
                        onClick={() => setExpanded(!expanded)}
                      >
                        {expanded
                          ? "Show top 10"
                          : `Show all ${board.rows.length} scores`}
                      </button>
                    )}
                  </>
                )
              )}
            </>
          )}
        </div>
        <aside className="personal-best">
          <span>Best on this device</span>
          <strong>{best.toLocaleString()}</strong>
          <p className="small">
            Terrible judgment looks good
            <br />
            on your hamster.
          </p>
          <button className="text-button" onClick={onPlay}>
            Beat your best
            <Icon name="arrow" size={18} />
          </button>
        </aside>
      </div>
      <p className="leaderboard-footnote">
        Scores are player-reported, not cheat-proof. Arcade points are not SQK
        tokens. No prizes or token rewards.
      </p>
    </section>
  );
}
