import { useEffect, useMemo, useState } from 'react';
import type { Book, UserBookStatus } from '../domain/models';
import { LocalStorageUserStateRepository } from '../repositories/userBookState';
import { pickRandomBook } from '../features/discovery/rules';
import { ReactCover } from './ReactCover';
export default function RandomDiscovery({ books }: { books: Book[] }) {
  const repo = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : new LocalStorageUserStateRepository(window.localStorage),
    [],
  );
  const [book, setBook] = useState<Book>();
  const [status, setStatus] = useState<UserBookStatus>();
  const next = async () => {
    if (!repo) return;
    const history = await repo.getRecentExposures();
    const b = pickRandomBook(books, {
      states: await repo.listStatuses(),
      recentlySeen: await repo.getRecentlySeen(),
      recentExposures: history,
      exposureCounts: await repo.getExposureCounts(),
    });
    setBook(b);
    setStatus(b ? (await repo.getStatus(b.id))?.status : undefined);
    if (b) await repo.pushRecentlySeen(b);
  };
  useEffect(() => {
    void next();
  }, [books, repo]);
  const choose = async (s: UserBookStatus) => {
    if (!book || !repo) return;
    await repo.setStatus(book.id, s);
    setStatus(s);
    window.dispatchEvent(new Event('book-state-change'));
    if (s === 'not_interested') await next();
  };
  if (!book)
    return (
      <div className="empty-random">
        <h2>새로 보여드릴 책을 모두 만났어요.</h2>
        <p>최근 본 기록은 시간이 지나면 다시 순환합니다.</p>
      </div>
    );
  return (
    <section className="random-card">
      <div className="random-cover">
        <a href={`/book/${book.id}`}>
          <ReactCover book={book} />
        </a>
      </div>
      <div className="random-copy">
        <span className="eyebrow">우연히 도착한 한 권</span>
        <h1 className="serif">
          <a href={`/book/${book.id}`}>{book.title}</a>
        </h1>
        <p className="by">
          {book.authorDisplay} · {book.primaryCategory}
        </p>
        <div className="why">
          <strong>왜 이 책인가요?</strong>
          <p>{book.description}</p>
          <small>
            {book.descriptionSource === 'data4library'
              ? '소개 출처: 도서관정보나루 API 제공 도서 소개'
              : book.descriptionSource === 'metadata_fallback'
                ? '소개 출처: 도서관정보나루 서지정보 기반 안내'
                : `소개 출처: ${book.metadataSource ?? '등록 서지정보'}`}
          </small>
        </div>
        <div className="random-actions">
          <button className="btn primary" onClick={next}>
            ↻ 다른 책
          </button>
          <button
            className={`btn ${status === 'want_to_read' ? 'active' : ''}`}
            onClick={() => choose('want_to_read')}
          >
            ＋ 읽고 싶음
          </button>
          <button
            className={`btn ${status === 'read' ? 'active' : ''}`}
            onClick={() => choose('read')}
          >
            ✓ 읽었음
          </button>
          <button className="quiet" onClick={() => choose('not_interested')}>
            관심 없음
          </button>
        </div>
      </div>
      <style>{`.random-card{display:grid;gap:34px;align-items:center}.random-cover{width:min(68vw,280px);margin:auto}.random-copy h1{font-size:clamp(1.65rem,4.5vw,2.6rem);line-height:1.16;margin:12px 0}.by{color:var(--muted)}.why{margin:24px 0;padding:18px 20px;background:#e9ede4;border-left:3px solid var(--green)}.why p{margin:5px 0 10px;color:#456054;font-size:.88rem;line-height:1.7}.why small{color:var(--muted);font-size:.7rem}.random-actions{display:flex;gap:8px;flex-wrap:wrap}.quiet{min-height:44px;border:0;background:transparent;color:var(--muted);text-decoration:underline;padding:0 12px}.empty-random{text-align:center;padding:90px 0}@media(min-width:720px){.random-card{grid-template-columns:minmax(240px,340px) 1fr;gap:7vw}.random-cover{width:100%}}`}</style>
    </section>
  );
}
