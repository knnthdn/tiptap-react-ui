import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const consumerAppPath = "C:/Users/PC/Desktop/to-delete";
const libPath = process.cwd();

if (!existsSync(consumerAppPath)) {
  throw new Error(`Consumer app not found: ${consumerAppPath}`);
}

console.log("Building library...");
execSync("npm run build", { stdio: "inherit" });

console.log("Packing library...");
const tarballName = execSync("npm pack", {
  encoding: "utf-8",
}).trim();

const tarballPath = path.join(libPath, tarballName);

console.log(`Installing ${tarballName} into consumer app...`);
execSync(`npm update tiptap-react-ui`, {
  cwd: consumerAppPath,
  stdio: "inherit",
});

console.log("Done.");
