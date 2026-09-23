import { isRecord } from '../../providers/http';

const text = (value: unknown, field: string) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field}을(를) 입력하세요.`);
  return value.trim();
};

const id = (value: unknown, field: string) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${field} 값이 올바르지 않습니다.`);
  return parsed;
};

export type CatalogAction =
  | {
      action: 'update_book';
      id: number;
      title: string;
      authorDisplay: string;
      description: string;
      publisherId: number;
      publishedAt: string;
    }
  | {
      action: 'create_source';
      sourceType: string;
      title: string;
      publisherOrChannel: string;
      url: string;
      publishedAt: string;
    }
  | {
      action: 'create_collection';
      slug: string;
      title: string;
      description: string;
      collectionType: string;
    }
  | {
      action: 'update_collection';
      id: number;
      title: string;
      description: string;
      displayOrder: number;
      isActive: boolean;
    }
  | {
      action: 'update_collection_override';
      id: number;
      title: string;
      description: string;
    }
  | { action: 'upsert_collection_book'; collectionId: number; bookId: number; reason: string }
  | {
      action: 'import_collection_book';
      collectionId: number;
      isbn13: string;
      reason: string;
    }
  | { action: 'remove_collection_book'; collectionId: number; bookId: number };

export function parseCatalogAction(value: unknown): CatalogAction {
  if (!isRecord(value)) throw new Error('요청 본문이 올바르지 않습니다.');
  if (value.action === 'update_book')
    return {
      action: value.action,
      id: id(value.id, '책'),
      title: text(value.title, '제목'),
      authorDisplay: text(value.authorDisplay, '저자'),
      description: text(value.description, '짧은 설명'),
      publisherId: id(value.publisherId, '출판사'),
      publishedAt: text(value.publishedAt, '출간일'),
    };
  if (value.action === 'create_source')
    return {
      action: value.action,
      sourceType: text(value.sourceType, '출처 유형'),
      title: text(value.title, '출처 제목'),
      publisherOrChannel: text(value.publisherOrChannel, '발행처'),
      url: text(value.url, 'URL'),
      publishedAt: text(value.publishedAt, '발행일'),
    };
  if (value.action === 'create_collection')
    return {
      action: value.action,
      slug: text(value.slug, 'slug'),
      title: text(value.title, '카테고리 제목'),
      description: text(value.description, '카테고리 설명'),
      collectionType: text(value.collectionType, '카테고리 유형'),
    };
  if (value.action === 'update_collection')
    return {
      action: value.action,
      id: id(value.id, '카테고리'),
      title: text(value.title, '카테고리 제목'),
      description: text(value.description, '카테고리 설명'),
      displayOrder: Math.max(0, Number(value.displayOrder) || 0),
      isActive: value.isActive === true,
    };
  if (value.action === 'update_collection_override')
    return {
      action: value.action,
      id: id(value.id, '자동 카테고리'),
      title: text(value.title, '표시 제목'),
      description: text(value.description, '표시 설명'),
    };
  if (value.action === 'upsert_collection_book')
    return {
      action: value.action,
      collectionId: id(value.collectionId, '카테고리'),
      bookId: id(value.bookId, '책'),
      reason: text(value.reason, '선정 이유'),
    };
  if (value.action === 'import_collection_book')
    return {
      action: value.action,
      collectionId: id(value.collectionId, '카테고리'),
      isbn13: text(value.isbn13, 'ISBN'),
      reason: text(value.reason, '선정 이유'),
    };
  if (value.action === 'remove_collection_book')
    return {
      action: value.action,
      collectionId: id(value.collectionId, '카테고리'),
      bookId: id(value.bookId, '책'),
    };
  throw new Error('지원하지 않는 관리자 작업입니다.');
}
