import type { UserBookState, UserBookStatus } from '../domain/models';

export type BookStatus = UserBookStatus;
export type BookStatusEntry = UserBookState;
export interface ExposureCounts {
  author: Record<number, number>;
  publisher: Record<number, number>;
  category: Record<string, number>;
}
export interface SeenBook {
  id: number;
  authorId: number;
  publisherId: number;
  primaryCategory: string;
}
export interface UserStateRepository {
  getStatus(bookId: number): Promise<BookStatusEntry | null>;
  setStatus(bookId: number, status: BookStatus): Promise<void>;
  clearStatus(bookId: number): Promise<void>;
  listByStatus(status: BookStatus): Promise<BookStatusEntry[]>;
  listStatuses(): Promise<BookStatusEntry[]>;
  getRecentlySeen(): Promise<number[]>;
  pushRecentlySeen(book: SeenBook): Promise<void>;
  getExposureCounts(): Promise<ExposureCounts>;
  getRecentExposures(): Promise<SeenBook[]>;
}

export class LocalStorageUserStateRepository implements UserStateRepository {
  constructor(
    private storage: Storage,
    private stateKey = 'next-read:book-states',
    private historyKey = 'next-read:discovery-history-v2',
  ) {}
  private readStates(): BookStatusEntry[] {
    try {
      const value = JSON.parse(this.storage.getItem(this.stateKey) ?? '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }
  private readHistory(): SeenBook[] {
    try {
      const value = JSON.parse(this.storage.getItem(this.historyKey) ?? '[]');
      return Array.isArray(value) ? value.slice(-50) : [];
    } catch {
      return [];
    }
  }
  async getStatus(bookId: number) {
    return this.readStates().find((entry) => entry.bookId === bookId) ?? null;
  }
  async setStatus(bookId: number, status: BookStatus) {
    const entry = { bookId, status, createdAt: new Date().toISOString() };
    this.storage.setItem(
      this.stateKey,
      JSON.stringify([...this.readStates().filter((item) => item.bookId !== bookId), entry]),
    );
  }
  async clearStatus(bookId: number) {
    this.storage.setItem(
      this.stateKey,
      JSON.stringify(this.readStates().filter((entry) => entry.bookId !== bookId)),
    );
  }
  async listByStatus(status: BookStatus) {
    return this.readStates().filter((entry) => entry.status === status);
  }
  async listStatuses() {
    return this.readStates();
  }
  async getRecentlySeen() {
    return this.readHistory().map((book) => book.id);
  }
  async pushRecentlySeen(book: SeenBook) {
    this.storage.setItem(this.historyKey, JSON.stringify([...this.readHistory(), book].slice(-50)));
  }
  async getRecentExposures() {
    return this.readHistory().slice(-20);
  }
  async getExposureCounts() {
    const counts: ExposureCounts = { author: {}, publisher: {}, category: {} };
    for (const book of await this.getRecentExposures()) {
      counts.author[book.authorId] = (counts.author[book.authorId] ?? 0) + 1;
      counts.publisher[book.publisherId] = (counts.publisher[book.publisherId] ?? 0) + 1;
      counts.category[book.primaryCategory] = (counts.category[book.primaryCategory] ?? 0) + 1;
    }
    return counts;
  }
}

export { LocalStorageUserStateRepository as LocalStorageUserBookStateRepository };
