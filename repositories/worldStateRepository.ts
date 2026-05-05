import { prisma } from "@/lib/prisma";

export async function findLatestWorldState() {
  return prisma.worldState.findFirst({
    orderBy: { updatedAt: "desc" },
  });
}

export async function createInitialWorldState() {
  return prisma.worldState.create({
    data: {
      facts: "",
    },
  });
}

export async function saveWorldState(facts: string) {
  const current = await findLatestWorldState();
  if (!current) {
    return prisma.worldState.create({
      data: { facts },
    });
  }

  return prisma.worldState.update({
    where: { id: current.id },
    data: { facts },
  });
}
