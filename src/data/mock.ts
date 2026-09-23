import type {
  Author,
  Book,
  BookMention,
  Collection,
  CollectionBook,
  Person,
  Publisher,
  Source,
} from '../domain/models';

const authorSlugs = [
  'seo-haein',
  'moon-garam',
  'han-doyoon',
  'choi-yoonseul',
  'kang-moa',
  'yoo-hyeonseo',
  'nam-ian',
  'jung-haru',
  'lee-rowoon',
  'bae-somyeong',
  'yoon-gaeul',
  'jo-haewon',
  'seo-isoo',
  'min-gyuri',
  'kim-haejoon',
  'oh-serim',
  'lim-doha',
  'cha-eunho',
  'park-yoojin',
  'shin-narae',
  'jeon-miro',
  'kwon-ideun',
  'ryu-bomin',
  'hong-danbi',
];
const repeatedAuthorIds = [1, 2, 3, 4];

export const publishers: Publisher[] = [
  { id: 1, name: '여백과 문장', slug: 'margin-sentence' },
  { id: 2, name: '북쪽 창문', slug: 'north-window' },
  { id: 3, name: '느린 파도', slug: 'slow-wave' },
  { id: 4, name: '작은 궤도', slug: 'small-orbit' },
  { id: 5, name: '모서리 책방', slug: 'corner-books' },
];

const rawBooks = [
  [
    '우리가 모르는 낮',
    '서해인',
    1,
    '소설',
    '낯선 도시에서 서로의 낮을 빌려 사는 두 사람의 이야기.',
    '#d77755',
  ],
  [
    '이끼의 시간',
    '문가람',
    2,
    '자연과학',
    '눈에 잘 띄지 않는 생명의 느린 시간을 따라간다.',
    '#5c765c',
  ],
  [
    '아무도 기록하지 않은 지도',
    '한도윤',
    3,
    '에세이',
    '사라진 장소와 남겨진 기억을 수집한 산문.',
    '#4f6d86',
  ],
  ['밤의 우체국', '최윤슬', 4, '소설', '도착하지 못한 편지만 배달하는 우체국의 일주일.', '#604f70'],
  [
    '식탁 위의 작은 역사',
    '강모아',
    5,
    '역사',
    '평범한 한 끼에 숨어 있는 이동과 교류의 역사.',
    '#b76b45',
  ],
  ['고요를 번역하는 법', '유현서', 1, '시', '말과 말 사이의 침묵을 더듬는 시집.', '#426b78'],
  [
    '종이별 관측소',
    '남이안',
    2,
    'SF',
    '별이 보이지 않는 시대, 종이로 우주를 복원하는 사람들.',
    '#32485f',
  ],
  [
    '두 번째 계절의 식물들',
    '정하루',
    3,
    '자연과학',
    '도시의 버려진 틈에서 다시 자라는 식물 기록.',
    '#788b4a',
  ],
  ['보통의 물건들', '이로운', 4, '인문', '연필과 컵, 의자에서 발견한 사물의 철학.', '#8a6c55'],
  ['낯선 문장의 기쁨', '배소명', 5, '언어', '번역할 수 없는 말들이 건네는 새로운 감각.', '#8f5766'],
  [
    '파도가 지나간 자리',
    '윤가을',
    1,
    '소설',
    '폐쇄를 앞둔 해변 극장에 모인 세 사람의 여름.',
    '#2f7584',
  ],
  [
    '도시는 어디에서 잠드는가',
    '조해원',
    2,
    '사회',
    '24시간 도시를 움직이는 보이지 않는 노동의 기록.',
    '#3f5367',
  ],
  [
    '느린 질문의 목록',
    '서이수',
    3,
    '에세이',
    '빨리 답하지 않기 위해 적어 둔 마흔 개의 질문.',
    '#a78655',
  ],
  [
    '사라지는 빛의 도감',
    '민규리',
    4,
    '예술',
    '네온부터 반딧불까지 사라져 가는 빛을 기록한다.',
    '#825e43',
  ],
  [
    '한낮의 천문학',
    '김해준',
    5,
    '자연과학',
    '별이 보이지 않는 낮에도 우주를 관찰하는 법.',
    '#4a7890',
  ],
  [
    '문 뒤의 정원',
    '오세림',
    1,
    '소설',
    '매일 다른 계절로 이어지는 문을 발견한 아이의 이야기.',
    '#6e8050',
  ],
  [
    '실패를 보관하는 서랍',
    '임도하',
    2,
    '에세이',
    '완성되지 않은 시도에서 배운 것들을 꺼내 본다.',
    '#9b604c',
  ],
  ['우연의 박물관', '차은호', 3, '인문', '역사를 바꾼 사소한 우연과 예상 밖의 연결.', '#735c7e'],
  [
    '새벽 네 시의 산책자',
    '박유진',
    4,
    '소설',
    '잠들지 못하는 사람들이 새벽 도시에서 만난다.',
    '#384b68',
  ],
  [
    '먼 곳의 요리법',
    '신나래',
    5,
    '음식',
    '이주한 사람들이 기억으로 복원한 열두 가지 음식.',
    '#a74e3f',
  ],
  [
    '숲은 대답하지 않는다',
    '전미로',
    1,
    '생태',
    '답을 구하러 숲에 갔다가 질문을 바꾼 생태학자.',
    '#456d54',
  ],
  ['불완전한 수집가', '권이든', 2, '소설', '빠진 조각만 모으는 수집가의 기묘한 목록.', '#765345'],
  [
    '어제의 미래들',
    '류보민',
    3,
    '과학사',
    '과거 사람들이 상상했던 미래를 다시 들여다본다.',
    '#4f617d',
  ],
  ['작은 소리의 지도', '홍단비', 4, '음악', '골목, 계단, 빈 극장의 소리를 채집한 기록.', '#826f49'],
  [
    '낮의 가장자리',
    '서해인',
    5,
    '소설',
    '대표작 바깥에서 다시 만나는 느리고 서늘한 도시의 표정.',
    '#9a6759',
  ],
  [
    '빙하 아래의 정원',
    '문가람',
    1,
    '자연과학',
    '사라지는 얼음 아래에서 이어지는 생명의 시간을 기록한다.',
    '#54727c',
  ],
  [
    '없는 길을 걷는 법',
    '한도윤',
    2,
    '에세이',
    '지도에 없는 장소를 걸으며 경계와 기억을 생각한다.',
    '#7b7357',
  ],
  [
    '도착하지 않은 아침',
    '최윤슬',
    3,
    '소설',
    '밤의 우체국을 떠난 편지가 먼 도시의 아침에 닿는다.',
    '#755b76',
  ],
] as const;

export const books: Book[] = rawBooks.map((b, i) => ({
  id: i + 1,
  isbn13: `979119000${String(i + 1).padStart(4, '0')}`,
  title: b[0],
  authorDisplay: b[1],
  authorId: i < 24 ? i + 1 : repeatedAuthorIds[i - 24],
  publisherId: b[2],
  publishedAt: `${2001 + i}-0${(i % 9) + 1}-12`,
  description: b[4],
  pageCount: 176 + i * 7,
  primaryCategory: b[3],
  coverTone: b[5],
  metadataSource: 'mock',
  reviewRequired: false,
}));

export const authors: Author[] = books
  .filter((book, index, all) => all.findIndex((item) => item.authorId === book.authorId) === index)
  .map((book) => ({
    id: book.authorId,
    name: book.authorDisplay,
    slug: authorSlugs[book.authorId - 1],
  }));

export const people: Person[] = [
  ['윤해', 'yoon-hae', '독립영화 감독', '장면 밖의 이야기와 오래된 소설을 수집한다.'],
  ['도은', 'do-eun', '시인', '언어와 자연을 오가며 글을 쓴다.'],
  ['이재온', 'lee-jaeon', '라디오 진행자', '새벽에 읽은 문장을 청취자와 나눈다.'],
  ['정세우', 'jung-sewoo', '건축가', '도시와 장소에 관한 책을 소개한다.'],
  ['모아', 'moa', '음악가', '투어 가방에 늘 책 두 권을 넣는다.'],
  ['김단', 'kim-dan', '번역가', '다른 언어가 여는 감각을 탐구한다.'],
  ['하민', 'ha-min', '생태 연구자', '도시의 작은 생태를 기록한다.'],
  ['유솔', 'yoo-sol', '일러스트레이터', '빛과 사물에 관한 책을 즐겨 읽는다.'],
  ['오진', 'oh-jin', '과학 저술가', '과학사를 일상의 언어로 풀어낸다.'],
  ['배온', 'bae-on', '독립서점 운영자', '덜 알려진 오래된 책을 다시 소개한다.'],
].map((p, i) => ({ id: i + 1, name: p[0], slug: p[1], occupation: p[2], description: p[3] }));

export const sources: Source[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  sourceType: ['interview', 'youtube', 'article', 'official_site'][i % 4],
  title: `책과 시간을 나누는 대화 ${i + 1}`,
  publisherOrChannel: ['월간 여백', '느린 대화', '장면들', '읽는 사람들'][i % 4],
  url: `https://example.com/mock-source-${i + 1}`,
  publishedAt: `202${i % 6}-0${(i % 9) + 1}-15`,
}));

const relations = [
  'recommended',
  'favorite',
  'influential',
  'reading',
  'mentioned',
  'selected',
] as const;
const contexts = ['organic', 'organic', 'unknown', 'publisher_event', 'gifted'] as const;
export const bookMentions: BookMention[] = Array.from({ length: 56 }, (_, i) => ({
  id: i + 1,
  bookId: ((i * 7) % books.length) + 1,
  personId: (i % people.length) + 1,
  sourceId: (i % sources.length) + 1,
  relationType: relations[i % relations.length],
  commercialContext: contexts[i % contexts.length],
  confidence: i % 7 === 0 ? 'medium' : 'high',
  contextSummary: `${people[i % people.length].name}이(가) ${sources[i % sources.length].title}에서 이 책의 ${i % 2 ? '문장과 시선' : '오래 남은 장면'}을 이야기했습니다.`,
  verified: i % 7 !== 0,
  verifiedAt: i % 7 !== 0 ? '2026-08-20' : undefined,
  disclosureStated: i % 5 === 3 ? true : undefined,
  organizerType: i % 5 === 3 ? 'publisher' : 'independent',
  voluntaryMention: i % 5 < 2 ? true : undefined,
  repeatMentionGroup: i % 11 === 0 ? `repeat-${i % 3}` : undefined,
}));

export const collections: Collection[] = [
  {
    id: 1,
    slug: 'people-said',
    title: '인물이 언급한 책',
    description: '한 번의 화제보다 맥락이 분명한 언급을 따라갑니다.',
    collectionType: 'person_mention',
    displayOrder: 1,
  },
  {
    id: 2,
    slug: 'old-new',
    title: '고전의 발견',
    description: '대표작과 판매 순위 바깥에서 오래된 책을 새롭게 만납니다.',
    collectionType: 'rediscovered',
    displayOrder: 2,
  },
  {
    id: 3,
    slug: 'steady',
    title: '다시 조명되는 고전',
    description: '새 번역·복간·공연화처럼 확인 가능한 이유가 있는 책입니다.',
    collectionType: 'rediscovered_reason',
    displayOrder: 3,
  },
  {
    id: 4,
    slug: 'publisher-find',
    title: '출판사의 낯선 선반',
    description: '한 출판사의 결을 따라 뜻밖의 책을 만납니다.',
    collectionType: 'publisher',
    displayOrder: 4,
  },
  {
    id: 5,
    slug: 'cross-border',
    title: '익숙한 장르 바깥으로',
    description: '최근 본 책과 다른 분야를 건넵니다.',
    collectionType: 'serendipity',
    displayOrder: 5,
  },
];
export const collectionBooks: CollectionBook[] = collections.flatMap((c) =>
  Array.from({ length: 8 }, (_, i) => {
    const bookId = (((c.id - 1) * 5 + i * 3) % books.length) + 1;
    return {
      collectionId: c.id,
      bookId,
      score: 100 - i,
      reason:
        c.id === 1
          ? `${people[(bookId - 1) % people.length].name}의 검수된 언급에서 발견`
          : c.id === 2
            ? '새 번역으로 다시 소개된 오래된 작품'
            : c.id === 3
              ? '복간을 통해 다시 독자를 만난 작품'
              : c.id === 4
                ? `${publishers[(bookId - 1) % publishers.length].name}의 목록에서 발견`
                : '익숙한 분야를 잠시 벗어나 고른 책',
      displayOrder: i + 1,
    };
  }),
);

export const catalog = {
  book(id: number) {
    return books.find((b) => b.id === id);
  },
  publisher(id: number) {
    return publishers.find((p) => p.id === id);
  },
  person(id: number) {
    return people.find((p) => p.id === id);
  },
  author(id: number) {
    return authors.find((author) => author.id === id);
  },
  booksForAuthor(id: number) {
    return books.filter((book) => book.authorId === id);
  },
  source(id: number) {
    return sources.find((s) => s.id === id);
  },
  mentionsForBook(id: number) {
    return bookMentions.filter((m) => m.bookId === id && m.verified);
  },
  booksForCollection(id: number) {
    return collectionBooks
      .filter((x) => x.collectionId === id)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((x) => ({ book: books.find((b) => b.id === x.bookId)!, reason: x.reason }));
  },
};
