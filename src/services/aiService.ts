import { ChatMessage } from '../types';

const GEMINI_API_KEY: string = 'AIzaSyAj74EN2xTp28B1QWCm7tmxadnkXAtHEH0';
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

function getUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

const SYSTEM_PROMPT = `당신은 '리브(Riv)'라는 도서 추천 앱의 AI 사서입니다.
사용자와 대화하며 원하는 책을 찾아주는 역할을 합니다.

응답 규칙:
1. 한 번에 하나의 질문만 합니다.
2. 최소 3번, 최대 5번의 질문으로 사용자의 취향을 파악합니다.
3. 충분한 정보가 모이면 구체적인 책 제목과 추천 이유를 제공합니다.
4. 항상 친근하고 따뜻한 말투를 사용합니다.
5. 책을 추천할 때 제목은 반드시 **책 제목** 형식(별표 두 개)으로 표시하고, 저자명도 함께 적습니다.

SUGGESTIONS 규칙:
- 질문을 할 때: 응답 맨 끝에 <SUGGESTIONS>["짧은답변1","짧은답변2","짧은답변3"]</SUGGESTIONS> 추가
- 책을 추천할 때: SUGGESTIONS 태그를 아예 포함하지 않음

질문 예시:
어떤 장르를 좋아하시나요?
<SUGGESTIONS>["소설","자기계발","역사","과학"]</SUGGESTIONS>`;

export interface AIResponse {
  content: string;
  suggestions: string[];
}

export async function sendMessage(messages: ChatMessage[]): Promise<AIResponse> {
  if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    return getMockResponse(messages);
  }

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
  };

  for (const model of GEMINI_MODELS) {
    const res = await fetch(getUrl(model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.status === 429 || res.status === 503) {
      continue; // 다음 모델 시도
    }

    if (!res.ok) {
      continue; // 다른 오류도 다음 모델로
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return parseResponse(raw);
  }

  // 모든 모델 실패 시 목업 응답으로 fallback
  return getMockResponse(messages);
}

// 응답에서 content와 suggestions 분리
function parseResponse(raw: string): AIResponse {
  const match = raw.match(/<SUGGESTIONS>(.*?)<\/SUGGESTIONS>/s);
  const content = raw.replace(/<SUGGESTIONS>.*?<\/SUGGESTIONS>/s, '').trim();

  let suggestions: string[] = [];
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) suggestions = parsed.filter(s => s.length > 0);
    } catch { /* 파싱 실패 시 빈 배열 */ }
  }

  return { content, suggestions };
}

function getMockResponse(messages: ChatMessage[]): AIResponse {
  const count = messages.filter(m => m.role === 'user').length;

  const steps: AIResponse[] = [
    {
      content: '안녕하세요! 저는 리브의 AI 사서예요. 딱 맞는 책을 찾아드릴게요.\n\n먼저, 어떤 장르를 주로 좋아하시나요?',
      suggestions: ['소설', '자기계발', '역사/사회', '과학/철학'],
    },
    {
      content: '좋아요!\n\n최근에 재미있게 읽은 책이 있나요? 없다면 좋아하는 작가나 드라마/영화를 알려주셔도 됩니다.',
      suggestions: ['기억나는 책 없어요', '한강 소설', '추리/스릴러', '고전 문학'],
    },
    {
      content: '참고가 됐어요!\n\n가볍게 즐길 책을 원하시나요, 깊이 있는 책을 원하시나요?',
      suggestions: ['가볍게 읽고 싶어요', '깊이 있는 책이 좋아요', '상관없어요'],
    },
    {
      content: '거의 다 파악했어요!\n\n특별히 피하고 싶은 주제나 장르가 있나요?',
      suggestions: ['없어요', '공포/스릴러', '너무 어려운 책', '폭력적인 내용'],
    },
  ];

  if (count <= steps.length) return steps[count - 1] ?? steps[0];

  return {
    content: '충분히 파악했어요! 아래 책들을 추천드립니다.\n\n📚 **추천 도서**\n\n1. **채식주의자** - 한강\n   → 깊이 있는 문학적 감동을 원하신다면 꼭 읽어보세요.\n\n2. **아몬드** - 손원평\n   → 감정에 대한 이야기로, 공감과 치유를 원하시는 분께 추천합니다.\n\n3. **데미안** - 헤르만 헤세\n   → 자아 찾기에 관한 불멸의 고전입니다.',
    suggestions: [],
  };
}
