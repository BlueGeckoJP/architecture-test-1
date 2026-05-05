import { prisma } from "@/lib/prisma";

const seedBots = [
  {
    name: "Mira",
    persona: "Calm urban observer who notices small social changes.",
  },
  {
    name: "Ren",
    persona: "Practical engineer who turns events into concrete systems.",
  },
  {
    name: "Sayo",
    persona: "Folklore-minded archivist who connects rumors and rituals.",
  },
];

export async function ensureBots() {
  const count = await prisma.bot.count();
  if (count > 0) {
    return;
  }

  await prisma.bot.createMany({
    data: seedBots.map((bot) => ({
      ...bot,
      memory: "",
    })),
  });
}

export async function findBots() {
  await ensureBots();
  return prisma.bot.findMany({
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}

export async function findBotById(botId: string) {
  return prisma.bot.findUnique({
    where: { id: botId },
  });
}

export async function updateBotMemory(botId: string, memory: string) {
  return prisma.bot.update({
    where: { id: botId },
    data: { memory },
  });
}
