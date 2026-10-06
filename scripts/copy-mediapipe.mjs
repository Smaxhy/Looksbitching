// Copies the MediaPipe WASM runtime out of node_modules so the face model runs fully on-device.
import { cpSync, mkdirSync, existsSync } from "node:fs";
const src = "node_modules/@mediapipe/tasks-vision/wasm";
const dst = "public/mediapipe";
if (!existsSync(src)) {
  console.warn("[copy-mediapipe] tasks-vision not installed yet; skipping");
  process.exit(0);
}
mkdirSync(dst, { recursive: true });
for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm", "vision_wasm_nosimd_internal.js", "vision_wasm_nosimd_internal.wasm"]) {
  cpSync(`${src}/${f}`, `${dst}/${f}`);
}
console.log("[copy-mediapipe] done");
