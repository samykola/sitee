import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const type = searchParams.get('type') || 'posts';
  if (!q) return NextResponse.json({ results: [] });

  switch (type) {
    case 'users': {
      const results = await prisma.user.findMany({
        where: { OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { profile: { displayName: { contains: q, mode: 'insensitive' } } },
        ]},
        take: 30,
        include: { profile: true, _count: { select: { followers: true } } },
      });
      return NextResponse.json({ results });
    }
    case 'channels': {
      const results = await prisma.channel.findMany({
        where: { isPublic: true, OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ]},
        take: 30,
        include: { owner: { include: { profile: true } } },
      });
      return NextResponse.json({ results });
    }
    case 'communities': {
      const results = await prisma.community.findMany({
        where: { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]},
        take: 30,
      });
      return NextResponse.json({ results });
    }
    case 'tags': {
      const results = await prisma.tag.findMany({
        where: { slug: { contains: q, mode: 'insensitive' } },
        take: 30,
      });
      return NextResponse.json({ results });
    }
    case 'posts':
    default: {
      const results = await prisma.post.findMany({
        where: {
          visibility: 'PUBLIC',
          OR: [
            { caption: { contains: q, mode: 'insensitive' } },
            { tags: { some: { tag: { slug: { contains: q, mode: 'insensitive' } } } } },
          ],
        },
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: { author: { include: { profile: true } }, media: true, channel: true },
      });
      return NextResponse.json({ results });
    }
  }
}
