import { useEffect, useMemo, useState } from 'react';
import { LocalStorageUserStateRepository } from '../repositories/userBookState';
import type { UserBookStatus } from '../domain/models';
export default function StatusButtons({
  bookId,
  compact = false,
}: {
  bookId: number;
  compact?: boolean;
}) {
  const repo = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : new LocalStorageUserStateRepository(window.localStorage),
    [],
  );
  const [status, setStatus] = useState<UserBookStatus | undefined>();
  useEffect(() => {
    void repo?.getStatus(bookId).then((entry) => setStatus(entry?.status));
  }, [bookId, repo]);
  const choose = async (next: UserBookStatus) => {
    if (status === next) {
      await repo?.clearStatus(bookId);
      setStatus(undefined);
    } else {
      await repo?.setStatus(bookId, next);
      setStatus(next);
    }
    window.dispatchEvent(new Event('book-state-change'));
  };
  return (
    <div className="status-actions" aria-label="독서 상태">
      <button
        className={`btn ${status === 'want_to_read' ? 'active' : ''}`}
        aria-pressed={status === 'want_to_read'}
        onClick={() => choose('want_to_read')}
      >
        ＋ {compact ? '읽고 싶음' : '읽고 싶어요'}
      </button>
      <button
        className={`btn ${status === 'read' ? 'active' : ''}`}
        aria-pressed={status === 'read'}
        onClick={() => choose('read')}
      >
        ✓ {compact ? '읽었음' : '읽었어요'}
      </button>
      <style>{`.status-actions{display:flex;gap:8px;flex-wrap:wrap}.status-actions .btn{flex:1;white-space:nowrap}`}</style>
    </div>
  );
}
