import type { FaceLandmarker } from "@mediapipe/tasks-vision";

let pending: Promise<FaceLandmarker> | null = null;

/** Loads the face model once. Everything (wasm + model) is served from this origin; images never leave the device. */
export function getLandmarker(): Promise<FaceLandmarker> {
  if (!pending) {
    pending = (async () => {
      const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe");
      const make = (delegate: "GPU" | "CPU") =>
        FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate },
          runningMode: "IMAGE",
          numFaces: 1,
          outputFacialTransformationMatrixes: true,
        });
      try { return await make("GPU"); } catch { return await make("CPU"); }
    })();
    pending.catch(() => { pending = null; });
  }
  return pending;
}
