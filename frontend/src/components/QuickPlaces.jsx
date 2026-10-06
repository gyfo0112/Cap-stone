import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Pencil, Plus } from 'lucide-react';
import { hasKakaoRestKey, searchPlaces } from '../api/kakaoLocal';
import { QUICK_PLACES } from '../data/routeData';
import { useStoredState } from '../hooks/useStoredState';

// 집/회사 바로가기 — 주소는 사용자가 직접 정해 이 브라우저에 저장한다(PC·모바일 같은 저장소).
// 정해두면 누를 때 그 장소로 길찾기, 연필 버튼으로 바꾸거나 지울 수 있다.
export function QuickPlaces({ onGo, className = '' }) {
  const [saved, setSaved] = useStoredState('mf-quick-places', {});
  const [editing, setEditing] = useState(null); // 편집 중인 QUICK_PLACES 항목

  const save = (key, place) =>
    setSaved((s) => {
      const next = { ...s };
      if (place) next[key] = place;
      else delete next[key];
      return next;
    });

  return (
    <>
      <div className={`mfQuickRow ${className}`}>
        {QUICK_PLACES.map((q) => {
          const place = saved[q.key];
          return (
            <div className="quickItem" key={q.key}>
              <button
                className="mfQuickBtn"
                onClick={() => (place ? onGo(place.name, place.address) : setEditing(q))}
                title={place?.name}
              >
                {place ? <q.icon size={16} /> : <Plus size={16} />}
                {place ? q.label : `${q.label} 설정`}
              </button>
              {place && (
                <button className="quickEdit" onClick={() => setEditing(q)} aria-label={`${q.label} 주소 변경`}>
                  <Pencil size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <QuickPlaceEditor
          label={editing.label}
          current={saved[editing.key]}
          onSave={(place) => {
            save(editing.key, place);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

// 검색 결과(카카오 키가 있을 때)에서 골라 저장 — Enter/저장은 첫 번째 결과를 고른다. 결과가 없으면 입력한 글자 그대로 저장
function QuickPlaceEditor({ label, current, onSave, onClose }) {
  const [text, setText] = useState(current?.name ?? '');
  const [places, setPlaces] = useState([]);
  const [placesFor, setPlacesFor] = useState(''); // places가 어떤 검색어의 결과인지
  const query = text.trim();
  const canSearch = hasKakaoRestKey();
  // 이미 저장된 값을 그대로 띄운 상태에서는 검색하지 않는다
  const showSearch = canSearch && query && query !== current?.name;
  const ready = !showSearch || placesFor === query; // 검색어에 맞는 결과가 도착했는가

  useEffect(() => {
    if (!showSearch) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      const done = (r) => {
        if (cancelled) return;
        setPlaces(r);
        setPlacesFor(query);
      };
      searchPlaces(query).then(done).catch(() => done([]));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, showSearch]);

  // 저장 버튼/Enter: 검색 중이면 기다리고, 결과가 있으면 첫 결과, 없으면 입력한 글자 그대로
  const submit = () => {
    if (!query || !ready) return;
    if (showSearch && places[0]) onSave({ name: places[0].name, address: places[0].address });
    else onSave({ name: query, address: current?.name === query ? current.address : '' });
  };

  return createPortal(
    <div className="helpModalScrim" onClick={onClose}>
      <div
        className="helpModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickPlaceTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <strong id="quickPlaceTitle">{label} 주소 설정</strong>
        <input
          className="mfAddContactInput quickPlaceInput"
          autoFocus
          aria-label="주소 검색"
          placeholder={canSearch ? '장소나 주소를 검색하세요' : '주소를 입력하세요'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />

        {showSearch && (
          <div className="quickSuggest">
            {!ready && <p className="mfEmptyHint">검색 중…</p>}
            {ready && places.length === 0 && <p className="mfEmptyHint">검색 결과가 없어요. 저장하면 입력한 글자 그대로 저장돼요.</p>}
            {ready &&
              places.map((p) => (
                <button key={p.id} onClick={() => onSave({ name: p.name, address: p.address })}>
                  <MapPin size={16} />
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.address}</small>
                  </span>
                </button>
              ))}
          </div>
        )}

        <div className="helpModalActions">
          {current ? (
            <button className="mfOutlineBtn" onClick={() => onSave(null)}>
              삭제
            </button>
          ) : (
            <button className="mfOutlineBtn" onClick={onClose}>
              닫기
            </button>
          )}
          <button
            className="mfPrimaryBtn"
            disabled={!query || !ready}
            onClick={submit}
          >
            저장
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
