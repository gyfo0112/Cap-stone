# 친절한 이웃 — FrontEnd

안전 귀갓길 찾기 · 도움요청 · 공공시설 확인 웹앱 (React + Vite).

## 실행

```bash
npm install
npm run dev
```

## 카카오맵 키 설정

1. https://developers.kakao.com → 내 애플리케이션 → 앱 생성
2. **앱 키 → JavaScript 키** 복사
3. **앱 설정 → 플랫폼 → Web** 에 `http://localhost:5173` 등록
4. `.env.local` 에 키 입력:

```
VITE_KAKAO_MAP_KEY=발급받은_JavaScript_키
```

키가 없으면 지도 자리에 안내 문구가 표시된다.

## 카카오 로컬 REST API 키 설정 (장소검색 / 현재위치 주소)

같은 애플리케이션의 **앱 키 → REST API 키**를 복사해 `.env.local`에 추가:

```
VITE_KAKAO_REST_KEY=발급받은_REST_API_키
```

없어도 앱은 정상 동작하고(mock 최근검색 + "서울 마포구 서교동" 고정 표시로 대체),
있으면 모바일 경로입력 화면이 실제 장소 검색을 하고 현재 위치도 실제 주소로 표시된다.
