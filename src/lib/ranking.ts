/**
 * Feed ranking formula — extendable.
 * score = base / (hoursAgo + 2)^1.5
 */
export type PostSignals = {
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  views: number;
  createdAt: Date | string;
  following?: boolean;
  affinity?: number;
};

export const WEIGHTS = {
  like: 3,
  comment: 5,
  save: 4,
  share: 6,
  view: 0.05,
  following: 15,
  affinity: 10,
};

export function rankPost(p: PostSignals): number {
  const hoursAgo = (Date.now() - new Date(p.createdAt).getTime()) / 36e5;
  const gravity = Math.pow(hoursAgo + 2, 1.5);
  const base =
    p.likes * WEIGHTS.like +
    p.comments * WEIGHTS.comment +
    p.saves * WEIGHTS.save +
    p.shares * WEIGHTS.share +
    p.views * WEIGHTS.view +
    (p.following ? WEIGHTS.following : 0) +
    (p.affinity ?? 0) * WEIGHTS.affinity;
  return base / gravity;
}
