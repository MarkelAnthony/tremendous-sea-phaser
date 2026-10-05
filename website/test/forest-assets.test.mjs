import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const assets = resolve(import.meta.dirname, "../../assets");
const read = path => JSON.parse(readFileSync(path, "utf8"));

test("all supplied animation clips have complete contiguous frames and gameplay roles", () => {
  const counts = { "476945d1-f351-5034-b0af-5a3e362e53ee": 13, "113f91a5-29f0-5c08-9981-5c5b3b5a8718": 8, "36e5db22-bb07-5f4f-9eb6-75b915d82f4c": 5 };
  for (const [id, count] of Object.entries(counts)) {
    const root = `${assets}/characters/${id}`;
    const manifest = read(`${root}/manifest.json`);
    assert.equal(manifest.states.flatMap(state => state.animations).length, count);
    for (const state of manifest.states) {
      for (const animation of state.animations) {
        assert.notEqual(animation.name, "idle", "animated idle must not use the static rotation path");
        for (const direction of animation.directions) {
          for (let index = 0; index < animation.frame_count; index++) {
            const file = `${root}/${state.folder}/animations/${animation.name}/${direction}/frame_${String(index).padStart(3, "0")}.png`;
            assert.ok(existsSync(file), file);
          }
        }
      }
      const roles = new Set(state.animations.flatMap(animation => [animation.name, ...(animation.aliases ?? [])]));
      for (const role of ["walk", "breathe"]) assert.ok(roles.has(role), `${id}/${state.folder}: missing ${role}`);
      if (id === "476945d1-f351-5034-b0af-5a3e362e53ee") {
        for (const role of ["jump", "hurt"]) assert.ok(roles.has(role));
      }
    }
  }
});

test("forest encounters and exit are supported by painted ground", () => {
  const root = `${assets}/maps/284a60d0-b94a-50b2-ac1d-2f869e93608a`;
  const annotations = read(`${root}/annotations.json`);
  const map = read(`${root}/map.json`);
  const cells = new Set(read(`${root}/terrain-map.json`).cells.map(cell => `${cell.x},${cell.y}`));
  const enemies = annotations.layers.find(layer => layer.id === "forest-enemies").points;
  assert.equal(enemies.length, 6);
  for (const point of enemies) {
    assert.ok(point.x >= point.properties.patrolMin && point.x <= point.properties.patrolMax);
    assert.ok(existsSync(`${assets}/characters/${point.properties.characterId}/manifest.json`));
    assert.ok(cells.has(`${Math.floor(point.x / 16)},${Math.floor(point.y / 16) + 1}`));
  }
  assert.ok(existsSync(`${root}/${map.background.filename}`));
  assert.equal(map.mapConfig.dimensions.pixelWidth, 2560);
});
