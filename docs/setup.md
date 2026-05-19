# 리브 (Riv) — 설치 및 실행 가이드

## 1. 사전 요구사항

| 항목 | 버전 | 확인 명령 |
|---|---|---|
| Node.js | 18 이상 권장 | `node -v` |
| npm | 9 이상 | `npm -v` |
| Expo CLI | 최신 | `npx expo --version` |
| iOS 실행 시 | Xcode (macOS 전용) | — |
| Android 실행 시 | Android Studio + AVD | — |
| 실기기 테스트 | Expo Go 앱 설치 | App Store / Play Store |

---

## 2. 프로젝트 설치

```bash
# 1. 저장소 루트로 이동
cd project/riv

# 2. 의존성 설치
npm install
```

---

## 3. API 키 설정

리브는 두 개의 외부 API 키를 사용한다. 현재는 소스 코드에 직접 포함되어 있으며, 배포 전 환경변수로 분리해야 한다.

### 3.1 국립중앙도서관 오픈 API
- 파일: `src/services/bookApi.ts`
- 변수: `AUTH_KEY`
- 발급: [data4library.kr](http://data4library.kr) 회원가입 후 인증키 발급
- 키가 없어도 앱 내장 목 데이터(8권)로 기본 동작한다.

### 3.2 Google Gemini API
- 파일: `src/services/aiService.ts`
- 변수: `GEMINI_API_KEY`
- 발급: Google AI Studio에서 무료 API 키 발급
- 키가 없거나 `'YOUR_GEMINI_API_KEY'`로 설정된 경우 목 응답으로 대화 흐름을 테스트할 수 있다.

> **주의**: API 키를 공개 저장소에 커밋하지 않는다. 배포 시 서버 프록시로 이전할 것을 권장한다.

---

## 4. 앱 실행

```bash
# 개발 서버 시작 (QR 코드 → Expo Go로 스캔)
npm start

# Android 에뮬레이터/실기기
npm run android

# iOS 시뮬레이터/실기기 (macOS만 가능)
npm run ios

# 웹 브라우저
npm run web
```

Expo Go 앱으로 실기기에서 테스트할 때는 `npm start` 실행 후 터미널에 표시되는 QR 코드를 스캔한다.

---

## 5. 프로젝트 구조 (개발자 참고)

```
riv/
├── App.tsx              # 내비게이션 설정 (Stack + Tab)
├── index.ts             # Expo 엔트리포인트
├── app.json             # 앱 이름, 아이콘, 방향 등 Expo 설정
├── package.json         # 의존성 및 스크립트
├── tsconfig.json        # TypeScript 설정
└── src/
    ├── screens/         # 화면 단위 컴포넌트
    │   ├── HomeScreen.tsx
    │   ├── GenreScreen.tsx
    │   ├── RecommendScreen.tsx
    │   ├── MyPageScreen.tsx
    │   └── BookDetailScreen.tsx
    ├── components/      # 재사용 UI 컴포넌트
    │   ├── BookCard.tsx
    │   └── HorizontalBookList.tsx
    ├── services/        # 외부 API 및 저장소
    │   ├── bookApi.ts   # 국립중앙도서관 API
    │   ├── aiService.ts # Gemini AI API
    │   └── storage.ts   # AsyncStorage 래퍼
    ├── constants/
    │   ├── colors.ts    # 앱 색상 팔레트
    │   └── genres.ts    # KDC 장르 목록
    └── types/
        └── index.ts     # Book, User, ChatMessage 등 공통 타입
```

---

## 6. 기능별 확인 사항

### 도서 검색
1. 홈 탭 → 검색창에 키워드 입력 후 검색 버튼 또는 엔터
2. API 응답이 없으면 목 데이터에서 키워드 필터링 결과를 표시한다.

### 장르 탐색
1. 장르 탭 → 원하는 KDC 장르 선택
2. 장르 내 키워드 검색도 가능하다.

### AI 추천
1. AI추천 탭 → 대화 시작
2. AI가 최소 3회 질문 후 추천 도서와 이유를 제공한다.
3. Gemini API 키가 없으면 내장 목 대화 흐름으로 전체 시나리오를 확인할 수 있다.

### 마이페이지
1. 로그인 → 이름/이메일 입력
2. 최근 본 책: 도서 상세 화면 방문 시 자동 저장 (최대 20권)
3. 구매한 책: 도서 상세에서 구매 처리 시 저장
4. 결제 수단: 카드 추가/삭제 및 캐시 충전

---

## 7. 의존성 주요 목록

```json
{
  "expo": "~54.0.33",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "@react-navigation/native": "^7.2.4",
  "@react-navigation/bottom-tabs": "^7.16.0",
  "@react-navigation/native-stack": "^7.15.0",
  "@react-native-async-storage/async-storage": "^3.0.2",
  "@expo/vector-icons": "^15.1.1"
}
```

---

## 8. 자주 발생하는 문제

### Metro 번들러가 시작되지 않을 때
```bash
npx expo start --clear
```

### node_modules 오류
```bash
rm -rf node_modules
npm install
```

### Expo Go 버전 불일치
Expo SDK 54를 지원하는 최신 Expo Go 앱을 설치한다.

### Gemini API 429 오류 (요청 초과)
`aiService.ts`의 모델 폴백이 자동으로 처리한다. 모든 모델에서 실패하면 잠시 후 다시 시도한다.
