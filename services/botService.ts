import { notFound } from "@/domain/errors";
import type { BotInternal } from "@/domain/types";
import {
  findBotById,
  findBots,
  updateBotMemory as updateBotMemoryRepository,
} from "@/repositories/botRepository";
import { toBotDetailDto, toBotSummaryDto } from "@/services/mappers";
import { worldStateService } from "@/services/worldStateService";

export async function getBots() {
  worldStateService.assertReady();
  const bots = await findBots();
  return bots.map(toBotSummaryDto);
}

export async function getBot(botId: string) {
  worldStateService.assertReady();
  const bot = await findBotById(botId);
  if (!bot) {
    throw notFound("Bot not found");
  }
  return toBotDetailDto(bot);
}

export async function getInternalBots(): Promise<BotInternal[]> {
  worldStateService.assertReady();
  const bots = await findBots();
  return bots.map((bot) => ({
    ...toBotDetailDto(bot),
    memory: bot.memory,
  }));
}

export async function updateBotMemory(botId: string, memory: string) {
  await updateBotMemoryRepository(botId, memory.slice(0, 1000));
}
