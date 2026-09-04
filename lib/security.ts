import { createHash, timingSafeEqual } from 'node:crypto';

export function hasAccess(request: Request): boolean {
  const expected = process.env.DEMO_ACCESS_KEY;
  const supplied = request.headers.get('x-demo-key');
  if (!expected || !supplied) return false;
  const left = createHash('sha256').update(supplied).digest();
  const right = createHash('sha256').update(expected).digest();
  return timingSafeEqual(left, right);
}
