import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tickYear } from '@/lib/sim';

export async function POST() {
  const world = await prisma.world.findFirst();

  if (!world) {
    return NextResponse.json({ error: 'No world found' }, { status: 400 });
  }

  const result = await tickYear(world.id);
  console.log('Sim result:', result); // 👈 THIS

  return NextResponse.json({
    ok: true,
    worldId: world.id,
    ...result,
  });
}
