import { registerWorkers as registerDispatchWorker } from "./dispatch.worker";

export async function registerWorkers() {
  await registerDispatchWorker();
}
