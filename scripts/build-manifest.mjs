import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");

const frontendDir = path.join(projectDir, "advantagescope/lite/static");
const bundledAssetsDir = path.join(frontendDir, "bundledAssets");
const outputDir = path.join(projectDir, "worker-assets");
const assetsRoot = path.join(outputDir, "bundledAssets");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generateManifest() {
  const manifest = {};

  async function walk(dir) {
    for (const entry of await fs.readdir(dir, {
      withFileTypes: true,
    })) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      const relativePath = path
        .relative(assetsRoot, fullPath)
        .split(path.sep)
        .join("/");

      if (entry.name === "config.json") {
        try {
          manifest[relativePath] = JSON.parse(
            await fs.readFile(fullPath, "utf8")
          );
        } catch (error) {
          throw new Error(
            `Failed to parse ${relativePath}: ${error.message}`
          );
        }
      } else {
        manifest[relativePath] = null;
      }
    }
  }

  if (await exists(assetsRoot)) {
    await walk(assetsRoot);
  }

  await fs.writeFile(
    path.join(outputDir, "asset-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8"
  );

  console.log(`Generated asset manifest with ${Object.keys(manifest).length} entries.`);
}

async function main() {
  if (!(await exists(frontendDir))) {
    throw new Error(`Frontend directory not found: ${frontendDir}`);
  }

  if (!(await exists(bundledAssetsDir))) {
    throw new Error(`Bundled assets directory not found: ${bundledAssetsDir}`);
  }

  // Start with a clean output directory.
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  // Copy the compiled frontend.
  await fs.cp(frontendDir, outputDir, {
    recursive: true,
  });

  generateManifest();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});