import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Run `forge build --root contracts` first. An explicit path supports external build caches.
const input = resolve(
  process.argv[2] ??
    "contracts/out/SqueekLeaderboard.sol/SqueekLeaderboard.json",
);
const artifact = JSON.parse(await readFile(input, "utf8"));
const output = {
  contractName: "SqueekLeaderboard",
  chainId: 11155111,
  compiler: "0.8.28",
  abi: artifact.abi,
  bytecode: artifact.bytecode.object,
  deployedBytecode: artifact.deployedBytecode.object,
};
await mkdir("contracts/artifacts", { recursive: true });
await writeFile(
  "contracts/artifacts/SqueekLeaderboard.json",
  `${JSON.stringify(output, null, 2)}\n`,
);
console.log(
  "Exported ABI and bytecode to contracts/artifacts/SqueekLeaderboard.json",
);
