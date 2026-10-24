import { PrismaClient, Role, PostType, Visibility } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');
  const password = await bcrypt.hash('password123', 10);

  const names = ['nova','pixel','echo','raven','lumen','orbit','flux','zen','arc','cipher','mirage','atlas','cyber','vivid','onyx','prism','delta','glitch','helix','quantum'];
  const users = [];
  const channels = [];

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + name;
    const u = await prisma.user.create({
      data: {
        email: name + '@cliprooom.dev',
        username: name,
        passwordHash: password,
        role: i === 0 ? Role.ADMIN : i < 5 ? Role.CREATOR : Role.USER,
        emailVerified: true,
        profile: {
          create: {
            displayName: name.charAt(0).toUpperCase() + name.slice(1),
            bio: 'I am ' + name + ', creating cool stuff on CLIPROOM.',
            avatarUrl,
            coverUrl: 'https://picsum.photos/1200/300?random=' + i,
          },
        },
        xp: { create: { total: Math.floor(Math.random() * 5000), level: 1 + Math.floor(Math.random() * 30) } },
      },
    });
    users.push(u);

    const ch = await prisma.channel.create({
      data: {
        ownerId: u.id,
        slug: name.toLowerCase(),
        name: name.charAt(0).toUpperCase() + name.slice(1) + ' Channel',
        description: 'Personal channel of @' + name,
        avatarUrl,
        bannerUrl: 'https://picsum.photos/1200/300?random=' + name,
        subscribersCount: Math.floor(Math.random() * 500),
      },
    });
    channels.push(ch);
  }
  console.log('  ✓ ' + users.length + ' users + personal channels');

  // Extra themed channels
  const extraChannels = [
    { slug: 'tech-daily', name: 'Tech Daily', desc: 'Daily tech news & tips' },
    { slug: 'art-station', name: 'Art Station', desc: 'Showcase your art' },
    { slug: 'gaming-zone', name: 'Gaming Zone', desc: 'All gaming, all the time' },
    { slug: 'anime-hub', name: 'Anime Hub', desc: 'Anime reviews & news' },
    { slug: 'dev-tips', name: 'Dev Tips', desc: 'Coding tips & snippets' },
  ];
  for (let i = 0; i < extraChannels.length; i++) {
    const c = extraChannels[i];
    const owner = users[i % users.length];
    const ch = await prisma.channel.create({
      data: {
        ownerId: owner.id,
        slug: c.slug,
        name: c.name,
        description: c.desc,
        avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=' + c.slug,
        bannerUrl: 'https://picsum.photos/1200/300?random=' + c.slug,
        subscribersCount: Math.floor(Math.random() * 1000),
      },
    });
    channels.push(ch);
  }
  console.log('  ✓ ' + (channels.length - users.length) + ' extra channels');

  // Communities
  const communityDefs = [
    ['gaming','Gaming','All things gaming'],
    ['anime','Anime','Anime fans unite'],
    ['manga','Manga','Manga discussion'],
    ['art','Art','Digital & traditional art'],
    ['minecraft','Minecraft','Blocky adventures'],
    ['programming','Programming','Code all day'],
    ['horror','Horror','Spooky stuff'],
    ['memes','Memes','Daily memes'],
    ['movies','Movies','Cinema lovers'],
    ['music','Music','Share your sound'],
  ];
  const communities = [];
  for (const [slug, name, desc] of communityDefs) {
    const c = await prisma.community.create({
      data: {
        slug, name, description: desc,
        bannerUrl: 'https://picsum.photos/1200/300?random=' + slug,
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=' + slug,
        rules: '1. Be kind\n2. No spam\n3. Follow guidelines',
        membersCount: 100 + Math.floor(Math.random() * 10000),
      },
    });
    communities.push(c);
  }
  console.log('  ✓ ' + communities.length + ' communities');

  // Tags
  const tagSlugs = ['art','gaming','meme','creative','music','design','photography','coding','funny','trending'];
  const tags = [];
  for (const s of tagSlugs) tags.push(await prisma.tag.create({ data: { slug: s, name: s } }));

  // Channel subscribers
  for (let i = 0; i < 200; i++) {
    const u = users[Math.floor(Math.random() * users.length)];
    const c = channels[Math.floor(Math.random() * channels.length)];
    if (u.id === c.ownerId) continue;
    try {
      await prisma.channelSubscriber.create({ data: { userId: u.id, channelId: c.id } });
    } catch {}
  }

  // Posts
  const posts = [];
  for (let i = 0; i < 50; i++) {
    const author = users[Math.floor(Math.random() * users.length)];
    const comm = communities[Math.floor(Math.random() * communities.length)];
    const personalChannel = channels.find(c => c.ownerId === author.id)!;
    const types = [PostType.IMAGE, PostType.GIF, PostType.TEXT, PostType.VIDEO];
    const type = types[Math.floor(Math.random() * types.length)];

    const mediaData = type !== PostType.TEXT ? {
      create: [{
        url: 'https://picsum.photos/800/800?random=' + i,
        thumbUrl: 'https://picsum.photos/300/300?random=' + i,
        mediumUrl: 'https://picsum.photos/600/600?random=' + i,
        mimeType: 'image/jpeg',
        width: 800, height: 800,
      }],
    } : undefined;

    const p = await prisma.post.create({
      data: {
        authorId: author.id,
        channelId: personalChannel.id,
        type,
        caption: 'Check this out #' + tagSlugs[i % tagSlugs.length],
        communityId: comm.id,
        visibility: Visibility.PUBLIC,
        viewsCount: Math.floor(Math.random() * 50000),
        likesCount: Math.floor(Math.random() * 2000),
        savesCount: Math.floor(Math.random() * 500),
        sharesCount: Math.floor(Math.random() * 200),
        isTrending: Math.random() > 0.8,
        media: mediaData,
        tags: { create: [{ tagId: tags[Math.floor(Math.random() * tags.length)].id }] },
      },
    });
    posts.push(p);
  }
  console.log('  ✓ ' + posts.length + ' posts');

  // Comments
  for (let i = 0; i < 30; i++) {
    const p = posts[Math.floor(Math.random() * posts.length)];
    const a = users[Math.floor(Math.random() * users.length)];
    await prisma.comment.create({
      data: { postId: p.id, authorId: a.id, content: 'This is amazing! Great work.' },
    });
  }
  const grouped = await prisma.comment.groupBy({ by: ['postId'], _count: { _all: true } });
  for (const g of grouped) {
    await prisma.post.update({ where: { id: g.postId }, data: { commentsCount: g._count._all } });
  }

  // Update channel counts
  for (const ch of channels) {
    const postCount = await prisma.post.count({ where: { channelId: ch.id } });
    const subCount = await prisma.channelSubscriber.count({ where: { channelId: ch.id } });
    await prisma.channel.update({
      where: { id: ch.id },
      data: { postsCount: postCount, subscribersCount: subCount },
    });
  }

  // Achievements
  const achievements = [
    { slug: 'first-post', name: 'First Post', xp: 50, description: 'Publish your first post' },
    { slug: 'first-100-likes', name: '100 Likes', xp: 200, description: 'Reach 100 likes' },
    { slug: '100-comments', name: '100 Comments', xp: 150, description: 'Write 100 comments' },
    { slug: '1000-followers', name: '1000 Followers', xp: 500, description: 'Reach 1000 followers' },
    { slug: 'top-creator', name: 'Top Creator', xp: 1000, description: 'Be a top creator' },
    { slug: 'community-founder', name: 'Community Founder', xp: 300, description: 'Create a community' },
    { slug: 'trending-creator', name: 'Trending Creator', xp: 400, description: 'Reach trending' },
  ];
  for (const a of achievements) await prisma.achievement.create({ data: a });

  console.log('\n✨ Seed complete. Login: nova@cliprooom.dev / password123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
