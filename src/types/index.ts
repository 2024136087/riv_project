export interface Book {
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  datetime: string;
  contents: string;
  thumbnail: string;
  url: string;
  price: number;
  sale_price: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  favoriteGenres: string[];
  password?: string;
  avatarUri?: string;
}

export interface PaymentCard {
  id: string;
  nickname: string;   // 카드 별칭 (예: 신한카드)
  number: string;     // 카드번호 뒤 4자리
  expiry: string;     // MM/YY
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  books?: Book[];
  suggestions?: string[];
  isDivider?: boolean;
}
