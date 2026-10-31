export type IconName =
  | "play"
  | "pause"
  | "arrow"
  | "left"
  | "up"
  | "wallet"
  | "trophy"
  | "shuffle"
  | "volume"
  | "mute"
  | "help"
  | "close"
  | "external"
  | "refresh"
  | "check"
  | "seed"
  | "spark";
const paths: Record<IconName, string> = {
  play: "m8 5 11 7-11 7Z",
  pause: "M8 5v14M16 5v14",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  left: "M20 12H4m6-6-6 6 6 6",
  up: "M12 20V4m-6 6 6-6 6 6",
  wallet:
    "M4 6h15v14H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13v2m-3 5h7v5h-7zm3 2.5h.01",
  trophy:
    "M7 3h10v6a5 5 0 0 1-10 0Zm10 2h4v3a5 5 0 0 1-5 5M7 5H3v3a5 5 0 0 0 5 5m4 1v7m-5 0h10",
  shuffle:
    "M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 5-6m2-4c2-2 3-2 5-2h3m-4-4 4 4-4 4",
  volume: "M10 4 5 8H2v8h3l5 4Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  mute: "M10 4 5 8H2v8h3l5 4Zm5 5 6 6m0-6-6 6",
  help: "M9 8a3 3 0 1 1 4 3c-1 1-1 2-1 3m0 3h.01",
  close: "m6 6 12 12M6 18 18 6",
  external: "M14 3h7v7m0-7L10 14m0-10H4v16h16v-6",
  refresh:
    "M20 7V2m0 5h-5M4 17v5m0-5h5M4 8a8 8 0 0 1 14-3l2 2M4 17l2 2a8 8 0 0 0 14-3",
  check: "m5 12 4 4L19 6",
  seed: "M12 2C-2 14 6 24 12 21c6 3 14-7 0-19m0 5v10",
  spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
