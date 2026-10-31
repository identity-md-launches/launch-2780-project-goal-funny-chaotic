import { readFile, writeFile } from "node:fs/promises";
import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  keccak256,
} from "viem";
import { sepolia } from "viem/chains";

// Public configuration only. Never reads a private key, account configuration or environment file.
const [addressArg, txHash] = process.argv.slice(2);
if (!addressArg || !isAddress(addressArg) || /^0x0{40}$/i.test(addressArg))
  throw new Error(
    "Usage: npm run configure:leaderboard -- <deployed Sepolia address> <deployment transaction hash>",
  );
if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash))
  throw new Error("Provide the real deployment transaction hash.");
const address = getAddress(addressArg);
const config = JSON.parse(await readFile("public/config.json", "utf8"));
const artifact = JSON.parse(
  await readFile("contracts/artifacts/SqueekLeaderboard.json", "utf8"),
);
const client = createPublicClient({
  chain: sepolia,
  transport: http(config.rpcUrl),
});
if ((await client.getChainId()) !== sepolia.id)
  throw new Error("RPC is not on Sepolia.");
const [code, receipt] = await Promise.all([
  client.getBytecode({ address }),
  client.getTransactionReceipt({ hash: txHash }),
]);
if (!code || keccak256(code) !== keccak256(artifact.deployedBytecode))
  throw new Error("Runtime bytecode does not match the built leaderboard.");
if (
  receipt.status !== "success" ||
  receipt.contractAddress?.toLowerCase() !== address.toLowerCase()
)
  throw new Error(
    "Transaction is not a successful deployment of this contract.",
  );
const [version, capacity, scores] = await Promise.all([
  client.readContract({ address, abi: artifact.abi, functionName: "version" }),
  client.readContract({
    address,
    abi: artifact.abi,
    functionName: "MAX_ENTRIES",
  }),
  client.readContract({
    address,
    abi: artifact.abi,
    functionName: "getLeaderboard",
  }),
]);
if (version !== 1n || capacity !== 50n)
  throw new Error("Unexpected leaderboard interface.");
await writeFile(
  "public/config.json",
  `${JSON.stringify({ ...config, chainId: sepolia.id, leaderboardAddress: address, deploymentTransaction: txHash }, null, 2)}\n`,
);
await writeFile(
  "contracts/deployment.json",
  `${JSON.stringify({ chainId: sepolia.id, address, transactionHash: txHash, blockNumber: receipt.blockNumber.toString(), runtimeHash: keccak256(code) }, null, 2)}\n`,
);
console.log(
  `Verified ${address} on Sepolia (${scores.length} scores). Updated public/config.json and contracts/deployment.json. Rebuild the static export and record the address in README.md.`,
);
