import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  CircleCheck,
  Plus,
  Trash2,
} from 'lucide-react';
import { MY_USER_UUID, POST_TYPES, acceptPost, addPost, cancelAccept, getAcceptedIds, getPosts, removePost, timeAgo } from '../../data/posts';

// 긴급도(post_type)별 카드 테두리/배지 색 — 기존 클래스 재사용
const POST_TYPE_STYLE = {
  일반: { border: 'yellowBorder', badge: 'yellowBadge' },
  주의: { border: 'orangeBorder', badge: 'orangeBadge' },
  긴급: { border: 'redBorder', badge: 'redBadge' },
};

// 모바일(도움요청 탭)과 데스크탑(도움요청 메뉴)이 함께 쓰는 패널.
// 목록 → 글쓰기 화면 / 게시글 상세(수락·삭제) 모달.
export function HelpPanel() {
  const [posts, setPosts] = useState(getPosts);
  const [acceptedIds, setAcceptedIds] = useState(getAcceptedIds);
  const [filter, setFilter] = useState('all'); // 'all' | 'mine'
  const [writing, setWriting] = useState(false);
  const [openId, setOpenId] = useState(null);

  const isMine = (p) => p.user_uuid === MY_USER_UUID;
  const visible = filter === 'mine' ? posts.filter(isMine) : posts;
  const openPost = posts.find((p) => p.post_uuid === openId);

  const deletePost = (p) => {
    if (!window.confirm(`'${p.post_title}' 글을 삭제할까요?`)) return;
    setPosts(removePost(p.post_uuid));
    setAcceptedIds(getAcceptedIds());
    setOpenId(null);
  };

  if (writing) {
    return (
      <HelpWriteForm
        onCancel={() => setWriting(false)}
        onSubmit={(post) => {
          setPosts(addPost(post));
          setFilter('all');
          setWriting(false);
        }}
      />
    );
  }

  return (
    <div className="panelContent">
      <h1>도움요청</h1>

      <p className="subtitle">주변에서 요청한 도움을 확인할 수 있습니다.</p>

      <button className="searchRouteButton helpWriteButton" onClick={() => setWriting(true)}>
        <Plus size={20} />
        도움 요청 글쓰기
      </button>

      <div className="themeButtons helpTabs">
        <button
          className={filter === 'all' ? 'themeButton selected' : 'themeButton'}
          onClick={() => setFilter('all')}
        >
          전체
        </button>
        <button
          className={filter === 'mine' ? 'themeButton selected' : 'themeButton'}
          onClick={() => setFilter('mine')}
        >
          내가 쓴 글
        </button>
      </div>

      <div className="helpLegend">
        <span>
          <i className="yellowUrgency"></i>
          일반
        </span>

        <span>
          <i className="orangeUrgency"></i>
          주의
        </span>

        <span>
          <i className="redUrgency"></i>
          긴급
        </span>
      </div>

      {visible.length === 0 && (
        <p className="settingsDescription">
          {filter === 'mine' ? '아직 작성한 도움 요청이 없어요.' : '주변에 올라온 도움 요청이 없어요.'}
        </p>
      )}

      {visible.map((p) => {
        const style = POST_TYPE_STYLE[p.post_type] ?? POST_TYPE_STYLE.일반;
        const mine = isMine(p);
        return (
          <div key={p.post_uuid} className={`requestCard ${style.border}`}>
            <button className="requestCardMain" onClick={() => setOpenId(p.post_uuid)}>
              <div className="requestHeader">
                <strong>{p.post_title}</strong>
                <span className={style.badge}>{p.post_type}</span>
              </div>
              <p>{p.body}</p>
              <div className="requestInfo">
                {mine ? '내가 쓴 글' : `약 ${p.distance ?? '-'}km`} · {timeAgo(p.created_at)}
                {acceptedIds.includes(p.post_uuid) && <em className="requestAccepted"> · 수락함</em>}
              </div>
            </button>
            {mine && (
              <button className="requestDelete" onClick={() => deletePost(p)}>
                <Trash2 size={14} />
                삭제
              </button>
            )}
          </div>
        );
      })}

      {openPost && (
        <HelpPostModal
          post={openPost}
          mine={isMine(openPost)}
          accepted={acceptedIds.includes(openPost.post_uuid)}
          onAccept={() => setAcceptedIds(acceptPost(openPost.post_uuid))}
          onCancelAccept={() => setAcceptedIds(cancelAccept(openPost.post_uuid))}
          onDelete={() => deletePost(openPost)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

// 요청 게시글 상세 — 남의 글이면 수락, 내 글이면 삭제
function HelpPostModal({ post, mine, accepted, onAccept, onCancelAccept, onDelete, onClose }) {
  const style = POST_TYPE_STYLE[post.post_type] ?? POST_TYPE_STYLE.일반;
  // controlPanel이 자체 z-index 층을 만들어서, body로 빼야 지도까지 어둡게 덮인다
  return createPortal(
    <div className="helpModalScrim" onClick={onClose}>
      <div
        className="helpModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="helpModalTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="requestHeader">
          <strong id="helpModalTitle">{post.post_title}</strong>
          <span className={style.badge}>{post.post_type}</span>
        </div>
        <p className="helpModalBody">{post.body}</p>
        <div className="requestInfo">
          {mine ? '내가 쓴 글' : `약 ${post.distance ?? '-'}km`} · {timeAgo(post.created_at)}
        </div>

        {accepted && (
          <p className="helpModalNotice">
            <CircleCheck size={16} /> 수락한 요청이에요.
          </p>
        )}

        <div className="helpModalActions">
          <button className="mfOutlineBtn" onClick={onClose}>
            닫기
          </button>
          {mine ? (
            <button className="mfPrimaryBtn helpModalDanger" onClick={onDelete}>
              삭제하기
            </button>
          ) : accepted ? (
            <button className="mfOutlineBtn" onClick={onCancelAccept}>
              수락 취소
            </button>
          ) : (
            <button className="mfPrimaryBtn" onClick={onAccept}>
              수락하기
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function HelpWriteForm({ onCancel, onSubmit }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('일반');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!title.trim()) return setError('제목을 입력해주세요.');
    if (!body.trim()) return setError('위치와 상황을 입력해주세요.');
    onSubmit({ post_title: title.trim(), post_type: type, body: body.trim() });
  };

  return (
    <div className="panelContent">
      <button className="login-back" onClick={onCancel}>
        <ChevronLeft size={20} />
        목록으로
      </button>

      <h1>도움 요청 글쓰기</h1>
      <p className="subtitle">주변 이웃에게 필요한 도움을 알려주세요.</p>

      <div className="helpForm">
        <label className="helpField">
          <span>제목</span>
          <input
            className="mfAddContactInput"
            placeholder="귀갓길 동행이 필요해요"
            maxLength={50}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError('');
            }}
          />
        </label>

        <div className="helpField">
          <span>긴급도</span>
          <div className="themeButtons">
            {POST_TYPES.map((t) => (
              <button
                key={t}
                className={type === t ? 'themeButton selected' : 'themeButton'}
                onClick={() => setType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <label className="helpField">
          <span>위치 · 상황</span>
          <textarea
            className="mfAddContactInput helpTextarea"
            placeholder="성수역 2번 출구 근처, 골목이 어두워서 함께 걸어갈 분을 찾아요"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setError('');
            }}
          />
        </label>

        {error && <p className="helpFormError">{error}</p>}

        <button className="searchRouteButton" onClick={submit}>
          요청 올리기
        </button>
      </div>
    </div>
  );
}
