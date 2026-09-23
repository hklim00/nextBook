import { useState } from 'react';

interface LibraryResult {
  id: string;
  name: string;
  region: string;
  address?: string;
  telephone?: string;
  homepage?: string;
}

interface AvailabilityResult {
  held: boolean;
  available: boolean | null;
}

const regions = [
  ['11', '서울'],
  ['21', '부산'],
  ['22', '대구'],
  ['23', '인천'],
  ['24', '광주'],
  ['25', '대전'],
  ['26', '울산'],
  ['29', '세종'],
  ['31', '경기'],
  ['32', '강원'],
  ['33', '충북'],
  ['34', '충남'],
  ['35', '전북'],
  ['36', '전남'],
  ['37', '경북'],
  ['38', '경남'],
  ['39', '제주'],
] as const;

async function responseBody<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || '도서관 정보를 가져오지 못했습니다.');
  return body;
}

export default function LibraryAvailability({ isbn13 }: { isbn13: string }) {
  const [region, setRegion] = useState('11');
  const [libraries, setLibraries] = useState<LibraryResult[]>([]);
  const [availability, setAvailability] = useState<Record<string, AvailabilityResult>>({});
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const findLibraries = async () => {
    setLoading(true);
    setError('');
    setSearched(false);
    setAvailability({});
    try {
      const query = new URLSearchParams({ isbn13, region, pageSize: '20' });
      const body = await responseBody<{ items: LibraryResult[] }>(
        await fetch(`/api/library/holdings?${query}`),
      );
      setLibraries(body.items);
      setSearched(true);
    } catch (caught) {
      setLibraries([]);
      setError(caught instanceof Error ? caught.message : '도서관 정보를 가져오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (libraryId: string) => {
    setCheckingId(libraryId);
    setError('');
    try {
      const query = new URLSearchParams({ isbn13, libraryId });
      const body = await responseBody<{ item: AvailabilityResult }>(
        await fetch(`/api/library/availability?${query}`),
      );
      setAvailability((current) => ({ ...current, [libraryId]: body.item }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '대출 상태를 확인하지 못했습니다.');
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <aside className="library-box">
      <div>
        <span className="eyebrow">Library</span>
        <h2 className="serif">내 도서관에서 찾기</h2>
        <p className="intro">지역을 선택하면 이 책을 소장한 공공도서관을 찾을 수 있습니다.</p>
      </div>
      <div className="search-row">
        <label>
          <span>지역</span>
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            {regions.map(([code, name]) => (
              <option value={code} key={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn primary" type="button" onClick={findLibraries} disabled={loading}>
          {loading ? '찾는 중…' : '소장 도서관 찾기'}
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {searched && !libraries.length && (
        <p className="empty">이 지역에서 소장 도서관을 찾지 못했습니다.</p>
      )}
      {!!libraries.length && (
        <div className="results">
          {libraries.map((library) => {
            const status = availability[library.id];
            return (
              <article className="library" key={library.id}>
                <div>
                  <h3>{library.name}</h3>
                  <p>{library.address || library.region}</p>
                  {library.telephone && <p>{library.telephone}</p>}
                </div>
                <div className="actions">
                  {status ? (
                    <strong className={status.available ? 'available' : 'unavailable'}>
                      {!status.held
                        ? '소장 정보 없음'
                        : status.available === true
                          ? '대출 가능'
                          : status.available === false
                            ? '대출 불가'
                            : '상태 미확인'}
                    </strong>
                  ) : (
                    <button
                      className="check"
                      type="button"
                      onClick={() => checkAvailability(library.id)}
                      disabled={checkingId === library.id}
                    >
                      {checkingId === library.id ? '확인 중…' : '대출 상태 확인'}
                    </button>
                  )}
                  {library.homepage && (
                    <a href={library.homepage} target="_blank" rel="noreferrer">
                      홈페이지 ↗
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="notice">대출 가능 여부는 도서관 정보나루가 제공하는 전날 기준 정보입니다.</p>
      <style>{`
        .library-box{margin:70px 0 0;padding:28px;background:#e4e8df;border-radius:18px;display:grid;gap:20px}
        .library-box h2{font-size:1.45rem;margin:8px 0}.intro,.empty{color:#526057;line-height:1.7;margin:0}
        .search-row{display:flex;gap:10px;align-items:end;flex-wrap:wrap}.search-row label{display:grid;gap:6px;font-size:.75rem;font-weight:800}.search-row select{min-width:150px;padding:11px 34px 11px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;color:inherit;font:inherit}
        .results{display:grid;gap:8px}.library{display:flex;justify-content:space-between;gap:20px;padding:16px;background:rgba(255,255,255,.62);border-radius:12px}.library h3{margin:0 0 6px;font-size:1rem}.library p{margin:2px 0;color:#526057;font-size:.78rem}.actions{display:flex;align-items:flex-end;justify-content:center;flex-direction:column;gap:8px;white-space:nowrap}.actions a,.check{font-size:.75rem;text-decoration:underline}.check{border:0;background:transparent;color:var(--green);font-weight:800;cursor:pointer}.available{color:#176b3a}.unavailable{color:#8a4b35}.error{margin:0;color:#9a3324;font-size:.85rem}.notice{margin:0;color:#68756c;font-size:.72rem}
        @media(min-width:720px){.library-box{padding:38px 44px}.results{margin-top:8px}}
        @media(max-width:520px){.library{flex-direction:column}.actions{align-items:flex-start}.search-row>*{width:100%}.search-row select{width:100%}}
      `}</style>
    </aside>
  );
}
