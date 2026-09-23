import type { Book } from '../domain/models';
export function ReactCover({ book }: { book: Book }) {
  if (book.coverUrl) {
    return (
      <div className="cover real-cover">
        <img src={book.coverUrl} alt={`${book.title} 표지`} loading="lazy" />
      </div>
    );
  }
  return (
    <div
      className="cover"
      style={{ '--tone': book.coverTone } as React.CSSProperties}
      role="img"
      aria-label={`${book.title} 임시 표지`}
    >
      <span className="cover-title">{book.title}</span>
      <span className="cover-author">{book.authorDisplay}</span>
    </div>
  );
}
