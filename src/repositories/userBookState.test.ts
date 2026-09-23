import { describe, expect, it } from 'vitest';
import { LocalStorageUserStateRepository } from './userBookState';
class MemoryStorage implements Storage {
  data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}
describe('LocalStorageUserStateRepository', () => {
  it('stores, replaces, filters and clears states', async () => {
    const repo = new LocalStorageUserStateRepository(new MemoryStorage());
    await repo.setStatus(3, 'want_to_read');
    expect((await repo.getStatus(3))?.status).toBe('want_to_read');
    await repo.setStatus(3, 'read');
    expect(await repo.listByStatus('read')).toHaveLength(1);
    await repo.clearStatus(3);
    expect(await repo.getStatus(3)).toBeNull();
  });
  it('keeps 50 recent books and counts the last 20 exposures', async () => {
    const repo = new LocalStorageUserStateRepository(new MemoryStorage());
    for (let id = 1; id <= 55; id += 1)
      await repo.pushRecentlySeen({
        id,
        authorId: id % 3,
        publisherId: id % 4,
        primaryCategory: `c${id % 5}`,
      });
    expect(await repo.getRecentlySeen()).toHaveLength(50);
    expect((await repo.getRecentlySeen())[0]).toBe(6);
    const counts = await repo.getExposureCounts();
    expect(Object.values(counts.author).reduce((sum, value) => sum + value, 0)).toBe(20);
  });
});
