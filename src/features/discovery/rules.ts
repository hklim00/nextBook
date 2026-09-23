import type { Book, UserBookState } from '../../domain/models';
import type { ExposureCounts, SeenBook } from '../../repositories/userBookState';
export interface DiscoveryContext {
  states: UserBookState[];
  recentlySeen: number[];
  recentExposures?: SeenBook[];
  exposureCounts?: ExposureCounts;
}
const countBy = <T extends string | number>(items: T[]) =>
  items.reduce<Record<string, number>>((counts, item) => {
    const key = String(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
function countsFrom(context: DiscoveryContext): ExposureCounts {
  if (context.exposureCounts) return context.exposureCounts;
  const recent = (context.recentExposures ?? []).slice(-20);
  return {
    author: countBy(recent.map((item) => item.authorId)),
    publisher: countBy(recent.map((item) => item.publisherId)),
    category: countBy(recent.map((item) => item.primaryCategory)),
  };
}
export function eligibleBooks(
  books: Book[],
  context: DiscoveryContext,
  enforceCaps = true,
): Book[] {
  const excluded = new Set(
    context.states
      .filter((s) => s.status === 'read' || s.status === 'not_interested')
      .map((s) => s.bookId),
  );
  const recent = new Set(context.recentlySeen.slice(-50));
  let pool = books.filter((b) => !excluded.has(b.id) && !recent.has(b.id));
  if (!enforceCaps) return pool;
  const lastTen = (context.recentExposures ?? []).slice(-10);
  const authors = countBy(lastTen.map((item) => item.authorId));
  const publishers = countBy(lastTen.map((item) => item.publisherId));
  const categories = countBy(lastTen.map((item) => item.primaryCategory));
  pool = pool.filter(
    (book) =>
      (authors[book.authorId] ?? 0) < 2 &&
      (publishers[book.publisherId] ?? 0) < 3 &&
      (categories[book.primaryCategory] ?? 0) < 4,
  );
  return pool;
}
export function discoveryWeight(book: Book, counts: ExposureCounts): number {
  return (
    1 /
    (1 +
      2 * (counts.author[book.authorId] ?? 0) +
      1.5 * (counts.publisher[book.publisherId] ?? 0) +
      (counts.category[book.primaryCategory] ?? 0))
  );
}

export function explainDiscovery(book: Book, recentExposures: SeenBook[]): string {
  const recent = recentExposures.slice(-20);
  if (!recent.length) {
    return '아직 최근 노출 기록이 없어 오늘의 후보 중 한 권을 무작위로 골랐습니다.';
  }
  const authorCount = recent.filter((item) => item.authorId === book.authorId).length;
  const publisherCount = recent.filter((item) => item.publisherId === book.publisherId).length;
  const categoryCount = recent.filter(
    (item) => item.primaryCategory === book.primaryCategory,
  ).length;
  return `최근 ${recent.length}회 노출 기준 같은 저자 ${authorCount}회, 같은 출판사 ${publisherCount}회, ${book.primaryCategory} 분야 ${categoryCount}회였습니다. 반복이 적은 후보에 더 높은 확률을 주는 추첨에서 골랐습니다.`;
}
export function pickRandomBook(
  books: Book[],
  context: DiscoveryContext,
  random = Math.random,
): Book | undefined {
  let pool = eligibleBooks(books, context);
  if (!pool.length) pool = eligibleBooks(books, context, false);
  if (!pool.length) return undefined;
  const counts = countsFrom(context);
  const weights = pool.map((book) => discoveryWeight(book, counts));
  const target = random() * weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = 0;
  for (let index = 0; index < pool.length; index += 1) {
    cursor += weights[index];
    if (target < cursor) return pool[index];
  }
  return pool.at(-1);
}
