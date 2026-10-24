import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { awardXP, XP_REWARDS } from '@/lib/xp';
import { notifyMentions } from '@/lib/mentions';
import { checkAndAwardAchievements } from '@/lib/achievements';
import { z } from 'zod';

const mediaItemSchema = z.object({
  url: z.string(),
  thumbUrl: z.string().optional().nullable(),
  mediumUrl: z.string().optional().nullable(),
  mimeType: z.string(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  size: z.number().optional().nullable(),
  aiGenerated: z.boolean().optional(),
  aiConfidence: z.number().optional().nullable(),
});

const createSchema = z.object({
  caption: z.string().max(2000).optional().default(''),
  tags: z.string().optional().default(''),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE']).default('PUBLIC'),
  channelId: z.string().optional().nullable(),
  mediaUrl: z.string().optional().nullable(),
  mimeType: z.string().optional().default('image/jpeg'),
  media: z.array(mediaItemSchema).optional().default([]),
});

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = createSchema.parse(await req.json());
    const mediaData = data.media.length > 0
      ? data.media
      : (data.mediaUrl ? [{ url: data.mediaUrl, mimeType: data.mimeType }] : []);

    const firstMedia = mediaData[0];
    const type = !firstMedia ? 'TEXT'
      : firstMedia.mimeType.startsWith('video') ? 'VIDEO'
      : firstMedia.mimeType === 'image/gif' ? 'GIF'
      : 'IMAGE';

    const tagSlugs = data.tags.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase()).filter(Boolean);
    const tagRecords = await Promise.all(tagSlugs.map(slug =>
      prisma.tag.upsert({ where: { slug }, update: {}, create: { slug, name: slug } })
    ));

    let channelId = data.channelId || null;
    if (!channelId) {
      const myChannel = await prisma.channel.findFirst({
        where: { ownerId: me.id },
        orderBy: { createdAt: 'asc' },
      });
      if (myChannel) channelId = myChannel.id;
    }

    const post = await prisma.post.create({
      data: {
        authorId: me.id,
        caption: data.caption,
        visibility: data.visibility as any,
        type: type as any,
        channelId,
        media: mediaData.length > 0 ? { create: mediaData.map((m, i) => ({ ...m, order: i })) } : undefined,
        tags: tagRecords.length ? { create: tagRecords.map(t => ({ tagId: t.id })) } : undefined,
      },
      include: { media: true },
    });

    if (channelId) {
      await prisma.channel.update({ where: { id: channelId }, data: { postsCount: { increment: 1 } } });
    }
    await awardXP(me.id, XP_REWARDS.publishPost);
    if (data.caption) {
      await notifyMentions(data.caption, me.id, { type: 'mentioned you in a post', data: { postId: post.id } });
    }
    await checkAndAwardAchievements(me.id);

    return NextResponse.json({ ok: true, post });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
