import type {
  BookAvailability,
  BookUsageAnalysis,
  ExternalBook,
  HotTrendBook,
  Library,
  LoanRankingBook,
  Source,
  WeightedKeyword,
} from '../domain/models';

export interface BookSearchOptions {
  page?: number;
  pageSize?: number;
}

export interface BookBrowseOptions extends BookSearchOptions {
  publisher?: string;
  sort?: 'title' | 'author' | 'pub' | 'pubYear' | 'isbn';
  order?: 'asc' | 'desc';
}

export interface BookProvider {
  searchBooks(query: string, options?: BookSearchOptions): Promise<ExternalBook[]>;
  getBookByISBN(isbn13: string): Promise<ExternalBook | null>;
  getBookMetadata(identifier: string): Promise<ExternalBook | null>;
}

export interface LibrarySearchOptions {
  query?: string;
  region?: string;
  detailRegion?: string;
  page?: number;
  pageSize?: number;
}

export interface HoldingLibraryOptions {
  region: string;
  detailRegion?: string;
  page?: number;
  pageSize?: number;
}

export interface LibraryItemOptions extends BookSearchOptions {
  startDate?: string;
  endDate?: string;
}

export interface LoanRankingQuery {
  startDate: string;
  endDate: string;
  gender?: '0' | '1' | '2';
  age?: string;
  fromAge?: number;
  toAge?: number;
  region?: string;
  detailRegion?: string;
  addCode?: string;
  kdc?: string;
  page?: number;
  pageSize?: number;
}

export interface LibraryProvider {
  getLibraries(options?: LibrarySearchOptions): Promise<Library[]>;
  checkBookAvailability(libraryId: string, isbn13: string): Promise<BookAvailability>;
  getLibrariesHoldingBook(isbn13: string, options: HoldingLibraryOptions): Promise<Library[]>;
  getLibraryItems?(libraryId: string, options?: LibraryItemOptions): Promise<ExternalBook[]>;
  searchBooks(query: string, options?: BookSearchOptions): Promise<ExternalBook[]>;
  browseBooks(options?: BookBrowseOptions): Promise<ExternalBook[]>;
  getLoanRanking(query: LoanRankingQuery): Promise<LoanRankingBook[]>;
  getHotTrend(searchDate: string): Promise<HotTrendBook[]>;
  getMonthlyKeywords(month?: string): Promise<WeightedKeyword[]>;
  getBookKeywords(isbn13: string): Promise<WeightedKeyword[]>;
  getBookUsageAnalysis(isbn13: string): Promise<BookUsageAnalysis>;
  getBookDetail?(isbn13: string): Promise<ExternalBook | null>;
}
export interface ContentSourceProvider {
  findCandidates(query: string): Promise<Source[]>;
}
