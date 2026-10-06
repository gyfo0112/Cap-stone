import { ROLES } from '../data/auth';

// 계정 이름 옆의 "보호자" / "보호 대상" 표시 — 사이드바와 설정 화면의 계정 카드가 함께 쓴다
export function RoleBadge({ role }) {
  return <i className={`roleBadge ${role}`}>{ROLES[role] ?? ROLES.guardian}</i>;
}
