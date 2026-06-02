import { Book } from '../types';

const AUTH_KEY = '0bb08275ca257dc2a4218bec631e8172a8b1ca8b89e9450a74675a2f652efde9';
const BASE_URL = 'https://data4library.kr/api';

// API 응답을 공통 Book 타입으로 변환
function mapDoc(doc: any): Book {
  return {
    isbn: (doc.isbn13 || doc.isbn || '').trim(),
    title: (doc.bookname || '').trim(),
    authors: doc.authors ? doc.authors.split(',').map((a: string) => a.trim()) : [],
    publisher: (doc.publisher || '').trim(),
    datetime: doc.publication_year ? `${doc.publication_year}-01-01T00:00:00.000+09:00` : '',
    contents: (doc.description || '').trim(),
    thumbnail: (doc.bookImageURL || '').trim(),
    url: (doc.bookDtlUrl || '').trim(),
    price: 0,
    sale_price: 0,
  };
}

async function fetchDocs(url: string): Promise<Book[]> {
  const res = await fetch(url);
  const json = await res.json();
  const docs = json?.response?.docs ?? [];
  if (docs.length === 0) return [];
  return docs.map((d: any) => mapDoc(d.doc));
}

// 도서 검색
export async function searchBooks(query: string, page = 1): Promise<Book[]> {
  try {
    const url = `${BASE_URL}/srchBooks?authKey=${AUTH_KEY}&title=${encodeURIComponent(query)}&pageNo=${page}&pageSize=10&format=json`;
    const result = await fetchDocs(url);
    return result.length > 0 ? result : MOCK_BOOKS.filter(b =>
      b.title.includes(query) || b.authors.some(a => a.includes(query))
    );
  } catch {
    return MOCK_BOOKS;
  }
}

// 오늘의 추천 - 대출 인기 도서
export async function getTodayRecommended(): Promise<Book[]> {
  try {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const start = new Date(today.setMonth(today.getMonth() - 1)).toISOString().slice(0, 10);
    const url = `${BASE_URL}/loanItemSrch?authKey=${AUTH_KEY}&startDt=${start}&endDt=${end}&pageSize=10&format=json`;
    const result = await fetchDocs(url);
    return result.length > 0 ? result : MOCK_BOOKS.slice(0, 5);
  } catch {
    return MOCK_BOOKS.slice(0, 5);
  }
}

// 신간 도서 - 해당 연도 발간 기준 검색
export async function getNewBooks(): Promise<Book[]> {
  try {
    const year = new Date().getFullYear();
    const url = `${BASE_URL}/srchBooks?authKey=${AUTH_KEY}&startPublishYear=${year}&endPublishYear=${year}&pageSize=10&format=json`;
    const result = await fetchDocs(url);
    return result.length > 0 ? result : MOCK_BOOKS.slice(2, 8);
  } catch {
    return MOCK_BOOKS.slice(2, 8);
  }
}

// 장르 내 검색
export async function searchBooksInGenre(query: string, kdc: string, page = 1): Promise<Book[]> {
  try {
    const url = `${BASE_URL}/srchBooks?authKey=${AUTH_KEY}&title=${encodeURIComponent(query)}&kdc=${encodeURIComponent(kdc)}&pageNo=${page}&pageSize=20&format=json`;
    const result = await fetchDocs(url);
    return result.length > 0 ? result : MOCK_BOOKS.filter(b =>
      b.title.includes(query) || b.authors.some(a => a.includes(query))
    );
  } catch {
    return MOCK_BOOKS.filter(b =>
      b.title.includes(query) || b.authors.some(a => a.includes(query))
    );
  }
}

// 장르(KDC) 별 도서 - 대출 인기 도서에서 KDC 필터링
export async function getBooksByGenre(kdc: string, page = 1): Promise<Book[]> {
  try {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const start = new Date(new Date().setMonth(today.getMonth() - 3)).toISOString().slice(0, 10);
    const url = `${BASE_URL}/loanItemSrch?authKey=${AUTH_KEY}&startDt=${start}&endDt=${end}&kdc=${encodeURIComponent(kdc)}&pageNo=${page}&pageSize=20&format=json`;
    const result = await fetchDocs(url);
    if (result.length > 0) return result;
    // fallback: srchBooks with kdc
    const fallbackUrl = `${BASE_URL}/srchBooks?authKey=${AUTH_KEY}&kdc=${encodeURIComponent(kdc)}&pageNo=${page}&pageSize=20&format=json`;
    const fallback = await fetchDocs(fallbackUrl);
    return fallback.length > 0 ? fallback : MOCK_BOOKS;
  } catch {
    return MOCK_BOOKS;
  }
}

const MOCK_BOOKS: Book[] = [
  {
    isbn: '9788937460449',
    title: '어린 왕자',
    authors: ['앙투안 드 생텍쥐페리'],
    publisher: '열린책들',
    datetime: '2015-04-01T00:00:00.000+09:00',
    contents: '전 세계 어린이와 어른 모두에게 사랑받는 불멸의 고전.',
    thumbnail: 'https://picsum.photos/seed/book1/120/170',
    url: '',
    price: 9800,
    sale_price: 8820,
  },
  {
    isbn: '9788954651387',
    title: '채식주의자',
    authors: ['한강'],
    publisher: '창비',
    datetime: '2007-10-30T00:00:00.000+09:00',
    contents: '노벨문학상 수상 작가 한강의 대표작.',
    thumbnail: 'https://picsum.photos/seed/book2/120/170',
    url: '',
    price: 12000,
    sale_price: 10800,
  },
  {
    isbn: '9788937460623',
    title: '코스모스',
    authors: ['칼 세이건'],
    publisher: '사이언스북스',
    datetime: '2004-12-20T00:00:00.000+09:00',
    contents: '우주의 기원과 인간의 자리를 탐구한 칼 세이건의 대표작.',
    thumbnail: 'https://picsum.photos/seed/book3/120/170',
    url: '',
    price: 22000,
    sale_price: 19800,
  },
  {
    isbn: '9791162540572',
    title: '아몬드',
    authors: ['손원평'],
    publisher: '창비',
    datetime: '2017-03-15T00:00:00.000+09:00',
    contents: '감정을 느끼지 못하는 소년 윤재의 성장 소설.',
    thumbnail: 'https://picsum.photos/seed/book4/120/170',
    url: '',
    price: 13000,
    sale_price: 11700,
  },
  {
    isbn: '9788932919126',
    title: '82년생 김지영',
    authors: ['조남주'],
    publisher: '민음사',
    datetime: '2016-10-14T00:00:00.000+09:00',
    contents: '평범한 한국 여성 김지영의 삶을 통해 사회 문제를 담담히 그린 소설.',
    thumbnail: 'https://picsum.photos/seed/book5/120/170',
    url: '',
    price: 13000,
    sale_price: 11700,
  },
  {
    isbn: '9788934972464',
    title: '데미안',
    authors: ['헤르만 헤세'],
    publisher: '민음사',
    datetime: '2000-10-09T00:00:00.000+09:00',
    contents: '자아 발견의 여정을 그린 헤르만 헤세의 성장소설.',
    thumbnail: 'https://picsum.photos/seed/book6/120/170',
    url: '',
    price: 9800,
    sale_price: 8820,
  },
  {
    isbn: '9788937460624',
    title: '1984',
    authors: ['조지 오웰'],
    publisher: '열린책들',
    datetime: '2009-06-15T00:00:00.000+09:00',
    contents: '전체주의 사회를 배경으로 한 디스토피아 소설의 고전.',
    thumbnail: 'https://picsum.photos/seed/book7/120/170',
    url: '',
    price: 11000,
    sale_price: 9900,
  },
  {
    isbn: '9788932472119',
    title: '총균쇠',
    authors: ['재레드 다이아몬드'],
    publisher: '문학사상사',
    datetime: '2013-08-07T00:00:00.000+09:00',
    contents: '왜 어떤 문명은 다른 문명을 지배하게 되었는지 탐구한 퓰리처상 수상작.',
    thumbnail: 'https://picsum.photos/seed/book8/120/170',
    url: '',
    price: 28000,
    sale_price: 25200,
  },
];
