import { createHash, timingSafeEqual } from 'node:crypto';

export function hasAccess(request: Request): boolean {
  // Free Vercel Authentication protects preview/deployment URLs. Production
  // keeps the app-level key because Hobby production domains stay public.
  if (process.env.VERCEL_ENV === 'preview') return true;

  const expected = process.env.DEMO_ACCESS_KEY;
  const supplied = request.headers.get('x-demo-key');
  if (!expected || !supplied) return false;
  const left = createHash('sha256').update(supplied).digest();
  const right = createHash('sha256').update(expected).digest();
  return timingSafeEqual(left, right);
}
