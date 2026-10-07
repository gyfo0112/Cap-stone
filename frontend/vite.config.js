import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { safemapPlugin } from './server/safemap.mjs'
import process from 'node:process'

// `npm run build:spring` → 스프링 프로젝트(SafetyMap)의 static 폴더로 바로 빌드한다.
// 팀 구조처럼 SafetyMap/frontend 안에 이 폴더가 있으면 기본값 그대로 동작하고,
// 위치가 다르면 SPRING_STATIC_DIR 환경변수로 경로를 지정.
const SPRING_STATIC_DIR =
  process.env.SPRING_STATIC_DIR || '../src/main/resources/static'

// https://vite.dev/config/
const target = process.env.API_PROXY_TARGET || 'http://localhost:8080'

export default defineConfig(({ mode }) => ({
  plugins: [react(), safemapPlugin(loadEnv(mode, process.cwd(), '').SAFEMAP_SERVICE_KEY || process.env.SAFEMAP_SERVICE_KEY || '')],
  build: mode === 'spring' ? { outDir: SPRING_STATIC_DIR, emptyOutDir: true } : {},
  // 스프링에 같이 올리는 빌드는 항상 실제 백엔드(/api)를 쓴다 — Vercel 시연 빌드는 mock
  define: mode === 'spring' ? { 'import.meta.env.VITE_USE_BACKEND': '"true"' } : {},
  // npm run dev 중에는 /api 요청을 스프링 서버(8080)로 넘긴다 — 배포(B안)에선 같은 서버라 필요 없음
  server: {
    proxy: {
      // changeOrigin 끔: 스프링의 로그인 리다이렉트(Location)가 브라우저가 연 주소로 오게 한다
      '/api': { target, changeOrigin: false },
      // 스프링 formLogin: 폼 POST /login · /logout 만 넘기고, GET /login 은 React 로그인 페이지로 둔다
      '/login': { target, changeOrigin: false, bypass: (req) => (req.method === 'GET' ? req.url : undefined) },
      '/logout': { target, changeOrigin: false, bypass: (req) => (req.method === 'GET' ? req.url : undefined) },
    },
  },
}))
