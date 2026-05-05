import { worldStateService } from "@/services/worldStateService";
import { ensureBotWorkerStarted } from "@/workers/botWorker";

export async function ensureRuntimeStarted() {
  await worldStateService.initialize();
  ensureBotWorkerStarted();
}
