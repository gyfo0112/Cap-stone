import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import process from 'node:process'

// `npm run build:spring` → 스프링 프로젝트(SafetyMap)의 static 폴더로 바로 빌드한다.
// 팀 구조처럼 SafetyMap/frontend 안에 이 폴더가 있으면 기본값 그대로 동작하고,
// 위치가 다르면 SPRING_STATIC_DIR 환경변수로 경로를 지정.
const SPRING_STATIC_DIR =
  process.env.SPRING_STATIC_DIR || '../src/main/resources/static'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: mode === 'spring' ? { outDir: SPRING_STATIC_DIR, emptyOutDir: true } : {},
  // 스프링에 같이 올리는 빌드는 항상 실제 백엔드(/api)를 쓴다 — Vercel 시연 빌드는 mock
  define: mode === 'spring' ? { 'import.meta.env.VITE_USE_BACKEND': '"true"' } : {},
  // npm run dev 중에는 /api 요청을 스프링 서버(8080)로 넘긴다 — 배포(B안)에선 같은 서버라 필요 없음
  server: {
    proxy: {
      '/api': process.env.API_PROXY_TARGET || 'http://localhost:8080',
    },
  },
}))
