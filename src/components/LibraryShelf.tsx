import { useEffect, useMemo, useState } from 'react';
import type { Book, UserBookState, UserBookStatus } from '../domain/models';
import { LocalStorageUserStateRepository } from '../repositories/userBookState';
import { ReactCover } from './ReactCover';
export default function LibraryShelf({ books }: { books: Book[] }) {
  const [tab, setTab] = useState<UserBookStatus>('want_to_read');
  const [states, setStates] = useState<UserBookState[]>([]);
  const repo = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : new LocalStorageUserStateRepository(window.localStorage),
    [],
  );
  useEffect(() => {
    if (!repo) return;
    const load = () => void repo.listStatuses().then(setStates);
    load();
    window.addEventListener('book-state-change', load);
    return () => window.removeEventListener('book-state-change', load);
  }, [repo]);
  const selected = states
    .filter((s) => s.status === tab)
    .map((s) => books.find((b) => b.id === s.bookId))
    .filter(Boolean) as Book[];
  return (
    <section>
      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'want_to_read'}
          onClick={() => setTab('want_to_read')}
        >
          읽고 싶은 책 <span>{states.filter((s) => s.status === 'want_to_read').length}</span>
        </button>
        <button role="tab" aria-selected={tab === 'read'} onClick={() => setTab('read')}>
          읽은 책 <span>{states.filter((s) => s.status === 'read').length}</span>
        </button>
      </div>
      {selected.length ? (
        <div className="book-grid">
          {selected.map((book) => (
            <article className="book-card" key={book.id}>
              <a href={`/book/${book.id}`}>
                <ReactCover book={book} />
                <h3>{book.title}</h3>
                <p className="author">{book.authorDisplay}</p>
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <span>⌇</span>
          <h2 className="serif">아직 이 선반은 비어 있어요.</h2>
          <p>
            {tab === 'read'
              ? '읽은 책을 표시하면 여기에 차곡차곡 모입니다.'
              : '마음에 남은 책을 발견해 선반에 놓아보세요.'}
          </p>
          <a className="btn primary" href={tab === 'read' ? '/' : '/discover/random'}>
            {tab === 'read' ? '책 발견하기' : '뜻밖의 책 만나기'}
          </a>
        </div>
      )}
      <style>{`.tabs{display:flex;border-bottom:1px solid var(--line);margin-bottom:34px}.tabs button{border:0;background:transparent;padding:14px 18px;border-bottom:2px solid transparent;color:var(--muted);font-weight:800}.tabs button[aria-selected=true]{color:var(--green);border-color:var(--green)}.tabs span{display:inline-grid;place-items:center;margin-left:5px;background:#e4e0d5;border-radius:99px;min-width:23px;height:23px;font-size:.72rem}.empty{text-align:center;padding:70px 20px;border:1px dashed var(--line);border-radius:18px}.empty>span{font-size:2rem;color:var(--accent)}.empty h2{font-size:1.5rem;margin:12px 0}.empty p{color:var(--muted);margin:0 0 22px}`}</style>
    </section>
  );
}
