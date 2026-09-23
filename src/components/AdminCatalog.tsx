import { useState } from 'react';
import type { Book, Collection, CollectionBook, ExternalBook } from '../domain/models';

type Props = {
  books: Book[];
  collections: Collection[];
  collectionBooks: CollectionBook[];
  writable: boolean;
  syncStatus?: {
    status: string;
    discoveryDate?: string;
    completedAt?: string;
    relatedCompleted: number;
    relatedFailed: number;
  };
};

export default function AdminCatalog(props: Props) {
  const [message, setMessage] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ExternalBook[]>([]);
  const [selectedIsbn, setSelectedIsbn] = useState('');
  const manualCollections = props.collections.filter(
    (collection) => collection.source === 'manual',
  );
  const automatedCollections = props.collections.filter(
    (collection) =>
      collection.source === 'data4library' && collection.collectionType !== 'publisher_discovery',
  );

  const recipeFor = (collection: Collection) => {
    if (collection.slug === 'daily-serendipity')
      return '최근 등록 도서 2권 + 월간 관심어와 도서 핵심어 교차 2권 + 마니아 추천 1권 + 인기 상위권을 벗어난 장기 후보 1권 → 성인서 필터 → 도서 상세 조회';
    if (collection.slug === 'classics')
      return '작품 단위 고전 목록을 날짜별 무작위로 섞음 → 도서 검색으로 국내 판본 확인 → 아동·축약·만화판 제외 → 도서 상세 조회';
    if (collection.slug === 'outside-literature')
      return '최근 등록 도서 + 월간 관심어 옆길 + 장기 후보 → KDC 문학 제외 → 서로 다른 분야 선택 → 성인서 필터 → 도서 상세 조회';
    return '도서관 정보나루 후보 조회 → 성인서·중복 필터 → 상세정보 사전 저장';
  };

  const save = async (payload: Record<string, unknown>, reload = false) => {
    setMessage('저장 중…');
    const response = await fetch('/api/admin/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(result.error ?? '저장하지 못했습니다.');
    setMessage('저장했습니다.');
    if (reload) window.location.reload();
  };

  const submit =
    (builder: (form: FormData) => Record<string, unknown>, reload = false) =>
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        await save(builder(new FormData(event.currentTarget)), reload);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '저장하지 못했습니다.');
      }
    };

  const searchBooks = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bookQuery.trim()) return;
    setSearching(true);
    setMessage('정보나루에서 책을 검색 중…');
    try {
      const response = await fetch(`/api/admin/books/search?q=${encodeURIComponent(bookQuery)}`);
      const result = (await response.json()) as { items?: ExternalBook[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? '검색하지 못했습니다.');
      setSearchResults(result.items ?? []);
      setSelectedIsbn(result.items?.[0]?.isbn13 ?? '');
      setMessage(`${result.items?.length ?? 0}권을 찾았습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '검색하지 못했습니다.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <section className="catalog-admin">
      <div className="catalog-summary">
        <strong>카탈로그 현황</strong>
        <span>책 {props.books.length}</span>
        <span>관리자 카테고리 {manualCollections.length}</span>
        {props.syncStatus && (
          <>
            <span>최근 수집 {props.syncStatus.discoveryDate ?? props.syncStatus.status}</span>
            <span>연관도서 성공 {props.syncStatus.relatedCompleted}</span>
            <span>연관도서 실패 {props.syncStatus.relatedFailed}</span>
          </>
        )}
      </div>
      {message && (
        <p className="admin-message" role="status">
          {message}
        </p>
      )}

      <section className="panel recommendation-manager">
        <div className="section-title">
          <h2>추천 카테고리</h2>
          <p>카테고리를 만들고 정보나루에서 책을 검색해 바로 추가할 수 있습니다.</p>
        </div>
        <div className="catalog-grid">
          <form
            onSubmit={submit(
              (form) => ({
                action: 'create_collection',
                title: form.get('title'),
                slug: form.get('slug') || `curation-${Date.now().toString(36)}`,
                description: form.get('description'),
                collectionType: 'curated',
              }),
              true,
            )}
          >
            <h3>새 카테고리 만들기</h3>
            <label>
              카테고리명
              <input name="title" required />
            </label>
            <label>
              짧은 설명
              <textarea name="description" required />
            </label>
            <label>
              주소용 영문 이름 <small>선택</small>
              <input name="slug" pattern="[a-z0-9-]+" placeholder="비우면 자동 생성" />
            </label>
            <button className="btn primary" disabled={!props.writable}>
              카테고리 생성
            </button>
          </form>

          <div className="book-picker">
            <form onSubmit={searchBooks} className="search-form">
              <h3>책 검색해서 추가하기</h3>
              <label>
                책 제목·작가·ISBN
                <div className="search-row">
                  <input
                    value={bookQuery}
                    onChange={(event) => setBookQuery(event.target.value)}
                    required
                  />
                  <button className="btn" disabled={!props.writable || searching}>
                    {searching ? '검색 중…' : '검색'}
                  </button>
                </div>
              </label>
            </form>
            {searchResults.length > 0 && manualCollections.length > 0 && (
              <form
                className="search-results"
                onSubmit={submit(
                  (form) => ({
                    action: 'import_collection_book',
                    collectionId: form.get('collectionId'),
                    isbn13: selectedIsbn,
                    reason: form.get('reason'),
                  }),
                  true,
                )}
              >
                <div className="result-list">
                  {searchResults.map((book) => (
                    <label className="search-result" key={book.isbn13}>
                      <input
                        type="radio"
                        name="isbn13"
                        value={book.isbn13}
                        checked={selectedIsbn === book.isbn13}
                        onChange={() => setSelectedIsbn(book.isbn13)}
                      />
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" />
                      ) : (
                        <span className="cover-placeholder" />
                      )}
                      <span>
                        <strong>{book.title}</strong>
                        <small>
                          {book.author} · {book.publisher} · {book.publishedAt?.slice(0, 4)}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <label>
                  추가할 카테고리
                  <select name="collectionId">
                    {manualCollections.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  선정 이유
                  <textarea name="reason" required placeholder="이 카테고리에 넣는 이유" />
                </label>
                <button className="btn primary" disabled={!props.writable || !selectedIsbn}>
                  선택한 책 추가
                </button>
              </form>
            )}
            {searchResults.length > 0 && manualCollections.length === 0 && (
              <p className="help">먼저 왼쪽에서 추천 카테고리를 만들어 주세요.</p>
            )}
          </div>
        </div>
      </section>

      <section className="automatic-section">
        <div className="section-title">
          <h2>자동 조합 카테고리</h2>
          <p>API 조합과 선정 기준을 확인하고 화면에 표시할 이름을 직접 정할 수 있습니다.</p>
        </div>
        <div className="collection-list">
          {automatedCollections.map((collection) => (
            <section className="panel collection-editor" key={collection.id}>
              <form
                onSubmit={submit(
                  (form) => ({
                    action: 'update_collection_override',
                    id: collection.id,
                    title: form.get('title'),
                    description: form.get('description'),
                  }),
                  true,
                )}
              >
                <div className="editor-head">
                  <h2>{collection.title}</h2>
                  <code>{collection.slug}</code>
                </div>
                <div className="recipe">
                  <strong>API 조합</strong>
                  <p>{recipeFor(collection)}</p>
                  <strong>선정 기준</strong>
                  <p>{collection.basis || '정보나루 데이터와 중복 제한 규칙으로 구성'}</p>
                </div>
                <label>
                  화면 표시 제목
                  <input name="title" defaultValue={collection.title} required />
                </label>
                <label>
                  화면 표시 설명
                  <textarea name="description" defaultValue={collection.description} required />
                </label>
                <button className="btn" disabled={!props.writable}>
                  표시 이름 저장
                </button>
              </form>
            </section>
          ))}
        </div>
      </section>

      <div className="collection-list">
        {manualCollections.map((collection) => {
          const members = props.collectionBooks.filter(
            (item) => item.collectionId === collection.id,
          );
          return (
            <section className="panel collection-editor" key={collection.id}>
              <form
                onSubmit={submit(
                  (form) => ({
                    action: 'update_collection',
                    id: collection.id,
                    title: form.get('title'),
                    description: form.get('description'),
                    displayOrder: form.get('displayOrder'),
                    isActive: form.get('isActive') === 'on',
                  }),
                  true,
                )}
              >
                <div className="editor-head">
                  <h2>{collection.title}</h2>
                  <code>/{collection.slug}</code>
                </div>
                <label>
                  제목
                  <input name="title" defaultValue={collection.title} required />
                </label>
                <label>
                  설명
                  <textarea name="description" defaultValue={collection.description} required />
                </label>
                <div className="row">
                  <label>
                    노출 순서
                    <input
                      name="displayOrder"
                      type="number"
                      min="0"
                      defaultValue={collection.displayOrder}
                    />
                  </label>
                  <label className="check">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={collection.isActive !== false}
                    />{' '}
                    공개
                  </label>
                </div>
                <button className="btn" disabled={!props.writable}>
                  카테고리 수정
                </button>
              </form>
              <div className="members">
                <strong>등록된 책 {members.length}권</strong>
                {members.map((member) => {
                  const book = props.books.find((item) => item.id === member.bookId);
                  return (
                    <div className="member" key={member.bookId}>
                      <span>{book?.title ?? `책 #${member.bookId}`}</span>
                      <button
                        type="button"
                        disabled={!props.writable}
                        onClick={() =>
                          save(
                            {
                              action: 'remove_collection_book',
                              collectionId: collection.id,
                              bookId: member.bookId,
                            },
                            true,
                          )
                        }
                      >
                        제거
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <style>{`.catalog-admin{margin-bottom:42px}.catalog-summary{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:18px}.catalog-summary span{background:#e8e3d8;padding:6px 10px;border-radius:99px;font-size:.75rem}.admin-message{padding:10px 14px;background:#edf3e9;color:var(--green);font-size:.78rem}.catalog-grid,.collection-list{display:grid;gap:16px}.catalog-grid{margin-bottom:28px}.recommendation-manager{margin-bottom:28px}.recommendation-manager .catalog-grid{margin:18px 0 0}.recommendation-manager form,.book-picker{display:grid;gap:12px;align-content:start}.recommendation-manager h3{font-size:.9rem;margin:0}.search-row{display:grid;grid-template-columns:1fr auto;gap:8px}.search-results{border-top:1px solid var(--line);padding-top:12px}.result-list{display:grid;gap:7px;max-height:390px;overflow:auto}.panel .search-result{display:grid;grid-template-columns:auto 42px 1fr;align-items:center;gap:9px;padding:7px;border:1px solid var(--line);border-radius:7px;background:#fff;cursor:pointer}.search-result input{width:auto}.search-result img,.cover-placeholder{width:42px;height:58px;object-fit:cover;background:#ddd7ca;border-radius:2px}.search-result span{display:grid;gap:3px;min-width:0}.search-result strong{color:var(--ink);font-size:.76rem}.search-result small{color:var(--muted);font-size:.67rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.automatic-section{margin:34px 0}.section-title h2{font-size:1.1rem;margin:0}.section-title p{color:var(--muted);font-size:.78rem;margin:7px 0 16px}.panel{padding:20px}.collection-editor form{display:grid;gap:12px}.panel h2{font-size:1rem;margin:0}.help{margin:0;color:var(--muted);font-size:.76rem;line-height:1.5}.panel label{display:grid;gap:5px;color:var(--muted);font-size:.74rem}.panel input,.panel select,.panel textarea{width:100%;border:1px solid var(--line);background:white;border-radius:7px;padding:9px;color:var(--ink)}.panel textarea{min-height:76px;resize:vertical}.panel button{justify-self:start}.editor-head,.row,.member{display:flex;align-items:center;justify-content:space-between;gap:12px}.editor-head code{font-size:.7rem;color:var(--muted)}.recipe{padding:12px;background:#f0ece2;border-radius:8px;font-size:.73rem}.recipe strong{color:var(--green)}.recipe p{margin:4px 0 11px;line-height:1.55;color:var(--muted)}.recipe p:last-child{margin-bottom:0}.row>label{flex:1}.row .check{display:flex;grid-template-columns:auto 1fr;align-items:center;justify-content:start}.row .check input{width:auto}.members{border-top:1px solid var(--line);margin-top:18px;padding-top:14px}.member{padding:9px 0;border-bottom:1px solid #e8e3d8;font-size:.78rem}.member button{border:0;background:transparent;color:var(--accent);text-decoration:underline}details{margin-top:18px;color:var(--muted);font-size:.78rem}details p{line-height:1.7}@media(min-width:780px){.catalog-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.collection-list{grid-template-columns:repeat(2,minmax(0,1fr))}}`}</style>
    </section>
  );
}
