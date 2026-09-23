export type UserBookStatus = 'want_to_read' | 'read' | 'not_interested';
export type RelationType =
  'recommended' | 'favorite' | 'influential' | 'reading' | 'mentioned' | 'selected';
export type CommercialContext = 'organic' | 'sponsored' | 'gifted' | 'publisher_event' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low';
export interface Publisher {
  id: number;
  name: string;
  slug: string;
}
export interface Book {
  id: number;
  isbn13: string;
  title: string;
  subtitle?: string;
  authorDisplay: string;
  authorId: number;
  publisherId: number;
  publishedAt: string;
  description: string;
  descriptionSource?: 'data4library' | 'metadata_fallback' | 'manual' | 'mock';
  pageCount: number;
  primaryCategory: string;
  coverTone: string;
  coverUrl?: string;
  metadataSource?: 'mock' | 'manual' | 'google_books' | 'national_library' | 'data4library';
  reviewRequired?: boolean;
  discoveryActive?: boolean;
}
export interface Author {
  id: number;
  name: string;
  slug: string;
}
export interface Person {
  id: number;
  name: string;
  slug: string;
  occupation: string;
  description: string;
}
export interface Source {
  id: number;
  sourceType: string;
  title: string;
  publisherOrChannel: string;
  url: string;
  publishedAt: string;
}
export interface BookMention {
  id: number;
  bookId: number;
  personId: number;
  sourceId: number;
  relationType: RelationType;
  commercialContext: CommercialContext;
  confidence: Confidence;
  contextSummary: string;
  verified: boolean;
  verifiedAt?: string;
  disclosureStated?: boolean;
  organizerType?: 'publisher' | 'bookstore' | 'independent' | 'other';
  voluntaryMention?: boolean;
  repeatMentionGroup?: string;
}
export interface Collection {
  id: number;
  slug: string;
  title: string;
  description: string;
  collectionType: string;
  displayOrder: number;
  isActive?: boolean;
  basis?: string;
  source?: string;
  refreshedAt?: string;
}
export interface CollectionBook {
  collectionId: number;
  bookId: number;
  score: number;
  reason: string;
  displayOrder: number;
}
export interface UserBookState {
  bookId: number;
  status: UserBookStatus;
  createdAt: string;
}
export interface Library {
  id: string;
  name: string;
  region: string;
  address?: string;
  telephone?: string;
  homepage?: string;
  closedDays?: string;
  operatingHours?: string;
}
export interface BookAvailability {
  isbn13: string;
  libraryId: string;
  held: boolean;
  available: boolean | null;
  checkedAt: string;
  /** 도서관 정보나루의 loanAvailable은 조회일 기준 전날 상태다. */
  basis: 'previous_day';
}

export interface ExternalBook {
  isbn13: string;
  title: string;
  subtitle?: string;
  author: string;
  publisher: string;
  publishedAt?: string;
  registeredAt?: string;
  additionSymbol?: string;
  description?: string;
  pageCount?: number;
  kdc?: string;
  ddc?: string;
  subject?: string;
  coverUrl?: string;
  detailUrl?: string;
  source: 'google_books' | 'national_library' | 'data4library';
}

export interface WeightedKeyword {
  word: string;
  weight: number;
}

export interface LoanRankingBook extends ExternalBook {
  rank: number;
  loanCount: number;
}

export interface HotTrendBook extends ExternalBook {
  trendDate: string;
  rank: number;
  rankRise: number;
  currentRank: number;
  previousRank: number;
}

export interface LoanHistoryPoint {
  period: string;
  loanCount: number;
}

export interface BookUsageAnalysis {
  isbn13: string;
  loanHistory: LoanHistoryPoint[];
  keywords: WeightedKeyword[];
  relatedBooks: ExternalBook[];
  raw: unknown;
}
