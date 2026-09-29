import {
  CircleCheck,
  TriangleAlert,
} from 'lucide-react';
import { scoreGrade } from '../hooks/useIsMobile';

// 안전점수 배지 — 화면 여러 곳(메인카드/최근검색/대안경로)에서 재사용.
// md(메인카드) = 아이콘+숫자+등급명, lg(경로결과 요약) = 숫자+등급명,
// sm(리스트용) = 숫자만 — 리스트에서 여러 개 나열될 때 안 복잡하게.
export function ScoreBadge({ score, size = 'md' }) {
  const grade = scoreGrade(score);
  const Icon = score >= 80 ? CircleCheck : TriangleAlert;
  return (
    <div className={`mfScoreBadge mfScoreBadge--${size}`} style={{ '--tone': grade.color, '--tone-soft': grade.soft }}>
      {size === 'md' && <Icon size={14} />}
      <strong>{score}</strong>
      {size !== 'sm' && <span>{grade.label}</span>}
    </div>
  );
}
