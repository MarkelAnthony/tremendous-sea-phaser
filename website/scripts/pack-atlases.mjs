/**
 * Packs individual image files into texture atlases for Phaser.
 *
 * Scans assets/ for:
 *   - characters/{id}/**\/*.png → one atlas per character
 *   - maps/{id}/objects/*.png   → one atlas per map's objects
 *
 * Outputs Phaser3-compatible JSON + PNG into public/atlases/.
 * Frame names preserve the relative path (e.g. "walk/south/frame_000").
 */

import { packAsync } from "free-tex-packer-core";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, basename, extname } from "node:path";

const ASSETS_DIR = join(import.meta.dirname, "..", "..", "assets");
const OUT_DIR = join(import.meta.dirname, "..", "public", "atlases");

const PACK_OPTIONS = {
  textureName: "atlas",
  width: 2048,
  height: 2048,
  padding: 1,
  allowRotation: false,
  allowTrim: true,
  detectIdentical: true,
  exporter: "Phaser3",
  removeFileExtension: true,
  prependFolderName: true,
};

function collectPngs(dir, shouldInclude = () => true) {
  const files = [];
  if (!existsSync(dir)) return files;

  function walk(current) {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (extname(entry).toLowerCase() === ".png") {
        const path = relative(dir, full);
        if (!shouldInclude(path)) continue;
        files.push({
          path,
          contents: readFileSync(full),
        });
      }
    }
  }

  walk(dir);
  return files;
}

async function packAndWrite(name, images) {
  if (images.length === 0) return;

  const results = await packAsync(images, {
    ...PACK_OPTIONS,
    textureName: name,
  });

  // Exactly one atlas page. Overflowing 2048×2048 makes the packer emit `{name}-0.json`,
  // `{name}-1.json`, … while the game loads exactly `atlases/{name}.json` — the build would pass
  // and the deployed game would die at runtime with a cryptic "Unexpected token '<'" (the SPA
  // fallback HTML served for the missing JSON). Fail HERE, loudly, with the fix.
  const expected = new Set([`${name}.json`, `${name}.png`]);
  if (results.length !== 2 || !results.every((f) => expected.has(f.name))) {
    throw new Error(
      `Atlas "${name}" no longer fits a single ${PACK_OPTIONS.width}x${PACK_OPTIONS.height} page ` +
      `(packer emitted: ${results.map((f) => f.name).join(", ")}). ` +
      `Remove or shrink animations for this asset — multi-page atlases are not loadable by the game.`,
    );
  }

  for (const file of results) {
    const outPath = join(OUT_DIR, file.name);
    writeFileSync(outPath, file.buffer);
  }

  console.log(`  ${name}: ${images.length} images → ${results.length} files`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  let totalImages = 0;
  let totalAtlases = 0;

  // Pack each character into its own atlas
  const charsDir = join(ASSETS_DIR, "characters");
  if (existsSync(charsDir)) {
    for (const charId of readdirSync(charsDir)) {
      const charDir = join(charsDir, charId);
      if (!statSync(charDir).isDirectory()) continue;
      const images = collectPngs(charDir, (path) => (
        !path.endsWith("/portrait.png") && !path.endsWith("/vocal/grid.png")
      ));
      if (images.length > 0) {
        await packAndWrite(`char-${charId}`, images);
        totalImages += images.length;
        totalAtlases++;
      }
    }
  }

  // Pack each map's objects into one atlas
  const mapsDir = join(ASSETS_DIR, "maps");
  if (existsSync(mapsDir)) {
    for (const mapId of readdirSync(mapsDir)) {
      const objectsDir = join(mapsDir, mapId, "objects");
      const images = collectPngs(objectsDir);
      if (images.length > 0) {
        await packAndWrite(`map-objects-${mapId}`, images);
        totalImages += images.length;
        totalAtlases++;
      }
    }
  }

  console.log(`Packed ${totalImages} images into ${totalAtlases} atlases`);
}

main().catch((err) => {
  console.error("Atlas packing failed:", err);
  process.exit(1);
});
