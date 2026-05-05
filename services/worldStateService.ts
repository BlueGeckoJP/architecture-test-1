import { worldStateNotReady } from "@/domain/errors";
import type { WorldStateDto } from "@/domain/types";
import {
  createInitialWorldState,
  findLatestWorldState,
  saveWorldState,
} from "@/repositories/worldStateRepository";

type RuntimeWorldState = {
  facts: string;
  updatedAt: Date;
};

class WorldStateService {
  private state: RuntimeWorldState | null = null;
  private initializing: Promise<void> | null = null;
  private persistQueue: Promise<void> = Promise.resolve();

  async initialize() {
    if (this.state) {
      return;
    }

    if (!this.initializing) {
      this.initializing = this.loadInitialState().finally(() => {
        this.initializing = null;
      });
    }

    await this.initializing;
  }

  isReady() {
    return this.state !== null;
  }

  assertReady() {
    if (!this.state) {
      throw worldStateNotReady();
    }
  }

  getWorldState(): WorldStateDto {
    this.assertReady();
    return this.toDto(this.state as RuntimeWorldState);
  }

  updateWorldState(facts: string): WorldStateDto {
    this.assertReady();

    const nextState = {
      facts,
      updatedAt: new Date(),
    };
    this.state = nextState;
    this.enqueuePersist(facts);

    return this.toDto(nextState);
  }

  private async loadInitialState() {
    const stored =
      (await findLatestWorldState()) ?? (await createInitialWorldState());
    this.state = {
      facts: stored.facts,
      updatedAt: stored.updatedAt,
    };
  }

  private enqueuePersist(facts: string) {
    this.persistQueue = this.persistQueue
      .catch(() => undefined)
      .then(async () => {
        await saveWorldState(facts);
      })
      .catch((error) => {
        console.error("Failed to persist world state", error);
      });
  }

  private toDto(state: RuntimeWorldState): WorldStateDto {
    return {
      facts: state.facts,
      updatedAt: state.updatedAt.toISOString(),
    };
  }
}

const globalForWorldState = globalThis as typeof globalThis & {
  worldStateService?: WorldStateService;
};

export const worldStateService =
  globalForWorldState.worldStateService ?? new WorldStateService();

globalForWorldState.worldStateService = worldStateService;
