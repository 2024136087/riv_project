# 리브 (Riv) — 아키텍처 문서

## 1. 시스템 개요

리브는 **React Native + Expo** 기반의 모바일 도서 앱이다.
외부 도서 API와 AI 추천 엔진을 연결하고, 사용자 데이터는 기기 로컬에 저장하는 서버리스 MVP 구조를 채택했다.

```
┌─────────────────────────────────────────┐
│              사용자 (모바일)              │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         React Native + Expo             │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │  화면/UI  │  │  서비스 레이어        │ │
│  │ screens/ │  │  bookApi / aiService │ │
│  │components│  │  storage             │ │
│  └──────────┘  └──────┬───────┬───────┘ │
└─────────────────────────┼───────┼────────┘
                          │       │
          ┌───────────────┘       └──────────────┐
          ▼                                      ▼
┌─────────────────────┐             ┌────────────────────┐
│  국립중앙도서관 API  │             │  Google Gemini API  │
│  data4library.kr    │             │  (AI 추천 엔진)     │
└─────────────────────┘             └────────────────────┘
          +
┌─────────────────────┐
│   AsyncStorage      │
│   (로컬 기기 저장)  │
└─────────────────────┘
```

---

## 2. 기술 스택

| 분류 | 기술 | 버전 |
|---|---|---|
| 런타임 | Expo | ~54.0.33 |
| 프레임워크 | React Native | 0.81.5 |
| 언어 | TypeScript | ~5.9.2 |
| UI 라이브러리 | React | 19.1.0 |
| 내비게이션 | React Navigation (Bottom Tabs + Native Stack) | ^7.x |
| 아이콘 | @expo/vector-icons (Ionicons) | ^15.1.1 |
| 로컬 저장소 | @react-native-async-storage/async-storage | ^3.0.2 |
| 도서 데이터 | 국립중앙도서관 오픈 API (`data4library.kr`) | — |
| AI 추천 | Google Gemini API (`gemini-2.5-flash` 외) | — |

---

## 3. 디렉토리 구조

```
project/
├── docs/
│   ├── adr/                        # Architecture Decision Records
│   │   ├── ADR-001-book-api-with-mock-fallback.md
│   │   ├── ADR-002-gemini-api-multi-model-fallback.md
│   │   └── ADR-003-asyncstorage-local-persistence.md
│   ├── architecture.md             # 이 문서
│   └── setup.md                    # 설치/실행 가이드
├── riv/                            # React Native 앱 루트
│   ├── App.tsx                     # 내비게이션 진입점
│   ├── index.ts                    # Expo 엔트리
│   ├── app.json                    # Expo 앱 설정
│   ├── package.json
│   ├── assets/                     # 아이콘, 스플래시 이미지
│   └── src/
│       ├── screens/                # 화면 컴포넌트
│       ├── components/             # 재사용 UI 컴포넌트
│       ├── services/               # 외부 연동 및 저장 로직
│       ├── constants/              # 색상, 장르 상수
│       └── types/                  # 공통 타입 정의
└── AUTHORING.minseo.md             # 마스터 기획/실행 문서
```

---

## 4. 내비게이션 구조

```
NavigationContainer
└── Stack.Navigator (RootStackParamList)
    ├── Main  →  Tab.Navigator (TabParamList)
    │            ├── Home      (HomeScreen)
    │            ├── Genre     (GenreScreen)
    │            ├── Recommend (RecommendScreen)
    │            └── MyPage    (MyPageScreen)
    └── BookDetail  →  BookDetailScreen
```

- **Stack**: `Main`(탭 전체)과 `BookDetail` 두 화면만 관리한다. 도서 상세는 어느 탭에서든 이동 가능하다.
- **Tab**: 하단 탭 4개로 앱의 핵심 기능을 구분한다.

---

## 5. 화면 (Screens)

| 화면 | 파일 | 역할 |
|---|---|---|
| 홈 | `HomeScreen.tsx` | 도서 검색, 오늘의 추천, 신간 도서 |
| 장르 | `GenreScreen.tsx` | KDC 기반 장르 선택 및 도서 목록 |
| AI추천 | `RecommendScreen.tsx` | Gemini AI와 대화형 추천 인터페이스 |
| 마이페이지 | `MyPageScreen.tsx` | 로그인, 최근 본 책, 구매한 책, 결제 수단 |
| 도서 상세 | `BookDetailScreen.tsx` | 도서 정보 상세 보기, 구매 처리 |

---

## 6. 서비스 레이어 (Services)

### 6.1 bookApi.ts — 도서 데이터
- `searchBooks(query, page)` — 제목 키워드 검색
- `getTodayRecommended()` — 최근 1개월 대출 인기 도서
- `getNewBooks()` — 해당 연도 신간 도서
- `getBooksByGenre(kdc, page)` — KDC 코드 기반 장르 도서
- `searchBooksInGenre(query, kdc, page)` — 장르 내 키워드 검색

API 실패 또는 빈 응답 시 내장 `MOCK_BOOKS`(8권)를 반환한다. (ADR-001)

### 6.2 aiService.ts — AI 추천
- `sendMessage(messages)` — Gemini API에 대화 이력을 전송하고 응답과 버튼 선택지를 반환한다.

모델 폴백 순서: `gemini-2.5-flash` → `gemini-flash-latest` → `gemini-2.0-flash-lite`
HTTP 429·503 시 다음 모델로 자동 전환한다. (ADR-002)

응답 파싱: AI 출력에서 `<SUGGESTIONS>[...]</SUGGESTIONS>` 태그를 분리해 `{ content, suggestions }` 형태로 반환한다.

### 6.3 storage.ts — 로컬 퍼시스턴스
AsyncStorage 키-값 저장소를 래핑한다. (ADR-003)

| 키 | 내용 | 제약 |
|---|---|---|
| `riv_user` | 사용자 정보 (User) | — |
| `riv_recent_books` | 최근 본 책 (Book[]) | 최신순, 최대 20권 |
| `riv_purchased_books` | 구매한 책 (Book[]) | ISBN 중복 방지 |
| `riv_cash` | 보유 캐시 잔액 (number) | — |
| `riv_cards` | 등록 카드 목록 (PaymentCard[]) | — |

---

## 7. 타입 정의 (Types)

```typescript
// 도서
interface Book {
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  datetime: string;      // ISO 8601
  contents: string;
  thumbnail: string;     // 이미지 URL
  url: string;
  price: number;
  sale_price: number;
}

// 사용자
interface User {
  id: string;
  name: string;
  email: string;
  favoriteGenres: string[];
}

// 결제 카드
interface PaymentCard {
  id: string;
  nickname: string;   // 카드 별칭
  number: string;     // 뒤 4자리
  expiry: string;     // MM/YY
}

// AI 채팅 메시지
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  books?: Book[];
  suggestions?: string[];
  isDivider?: boolean;
}
```

---

## 8. 데이터 흐름

### 도서 검색 흐름
```
사용자 입력
  → HomeScreen.handleSearch()
  → bookApi.searchBooks()
  → data4library.kr API (실패 시 MOCK_BOOKS)
  → Book[] 반환
  → 화면 렌더링
  → 도서 터치 시 storage.addRecentBook() + BookDetail 이동
```

### AI 추천 흐름
```
사용자 메시지 입력
  → RecommendScreen
  → aiService.sendMessage(messages[])
  → Gemini API (모델 폴백 적용)
  → parseResponse() → { content, suggestions }
  → 채팅 UI 렌더링 + 버튼 선택지 표시
```

### 구매 흐름
```
BookDetailScreen 구매 버튼
  → storage.getCash() 잔액 확인
  → 잔액 차감 (storage.setCash)
  → storage.addPurchasedBook()
```

---

## 9. 장르 분류 (KDC)

국립중앙도서관 API의 `kdc` 파라미터와 동일한 값을 사용한다.

| KDC | 장르 |
|---|---|
| 0 | 총류 |
| 1 | 철학 |
| 2 | 종교 |
| 3 | 사회과학 |
| 4 | 자연과학 |
| 5 | 기술과학 |
| 6 | 예술 |
| 7 | 언어 |
| 8 | 문학 |
| 9 | 역사 |

---

## 10. 아키텍처 결정 요약

| ADR | 결정 | 문서 |
|---|---|---|
| ADR-001 | 도서 데이터: 국립중앙도서관 API + 목 데이터 폴백 | `adr/ADR-001-book-api-with-mock-fallback.md` |
| ADR-002 | AI 추천: Gemini API + 3단계 모델 폴백 | `adr/ADR-002-gemini-api-multi-model-fallback.md` |
| ADR-003 | 사용자 데이터: AsyncStorage 로컬 퍼시스턴스 | `adr/ADR-003-asyncstorage-local-persistence.md` |
