import type { useSqueek } from "../hooks/useSqueek";
import { roundProgress } from "../lib/squeek";
import { Icon } from "./Icon";
export function LiveStrip({
  data,
  onDetails,
}: {
  data: ReturnType<typeof useSqueek>;
  onDetails: () => void;
}) {
  const { core, wheel, coreStale, wheelStale, loading, now } = data;
  const state = wheelStale ? "stale" : wheel?.state;
  const spinning = state === "spinning";
  const testTelemetry = !!wheel && wheel.provenance !== "hardware";
  const round = core ? roundProgress(core, now) : null;
  return (
    <section className="live-strip" aria-label="Live Squeekchain data">
      <div className="live-heading">
        <span className={`live-dot ${core && !coreStale ? "available" : ""}`} />
        <strong>Squeekchain</strong>
        <span className="small muted">
          {loading
            ? "Connecting"
            : coreStale
              ? core
                ? "Last known data"
                : "Feed offline"
              : "Sepolia"}
        </span>
      </div>
      <dl className="chain-stats">
        <div>
          <dt>Squeek block</dt>
          <dd>{core ? `#${core.height.toLocaleString()}` : "Unavailable"}</dd>
        </div>
        <div className="round-stat">
          <dt>Round progress</dt>
          <dd>
            <span className="round-number">
              {round ? `${Math.floor(round.percent)}%` : loading ? "…" : "N/A"}
            </span>
            <div
              className="progress-track"
              role="progressbar"
              aria-label={`Estimated round time elapsed${coreStale ? ", last known data" : ""}`}
              aria-valuenow={round ? Math.floor(round.percent) : undefined}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${round?.percent ?? 0}%` }} />
            </div>
          </dd>
        </div>
        <div className="spinning-stat">
          <dt>{testTelemetry ? "Wheel telemetry" : "Real hamster"}</dt>
          <dd>
            <svg
              className={spinning ? "mini-wheel spinning" : "mini-wheel"}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5" />
            </svg>
            {loading && !wheel
              ? "Connecting"
              : state === "stale" || !state
                ? "Unavailable"
                : testTelemetry
                  ? "Test telemetry"
                  : state === "spinning"
                    ? "Spinning"
                    : state === "idle"
                      ? "Snack break"
                      : state === "fault"
                        ? "Sensor fault"
                        : "Unavailable"}
          </dd>
        </div>
      </dl>
      <button
        className="icon-button live-details"
        onClick={onDetails}
        aria-label="View Squeekchain data details"
      >
        <Icon name="external" size={18} />
      </button>
    </section>
  );
}
