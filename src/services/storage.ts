import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, User, PaymentCard, CartItem } from '../types';

const KEYS = {
  USER: 'riv_user',
  SESSION: 'riv_session',
  RECENT_BOOKS: 'riv_recent_books',
  PURCHASED_BOOKS: 'riv_purchased_books',
  CASH: 'riv_cash',
  CARDS: 'riv_cards',
  CART: 'riv_cart',
};

// User
export async function getUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

// 로그인 세션이 활성화된 경우에만 사용자 반환
export async function getLoggedInUser(): Promise<User | null> {
  const session = await AsyncStorage.getItem(KEYS.SESSION);
  if (session !== 'active') return null;
  return getUser();
}

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function removeUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USER);
}

// 세션 시작 (로그인/회원가입 완료 시 호출)
export async function startSession(): Promise<void> {
  await AsyncStorage.setItem(KEYS.SESSION, 'active');
}

// 세션 종료 (로그아웃 시 호출 — 사용자 데이터는 유지)
export async function endSession(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SESSION);
}

// Recent books
export async function getRecentBooks(): Promise<Book[]> {
  const raw = await AsyncStorage.getItem(KEYS.RECENT_BOOKS);
  return raw ? JSON.parse(raw) : [];
}

export async function addRecentBook(book: Book): Promise<void> {
  const books = await getRecentBooks();
  const filtered = books.filter(b => b.isbn !== book.isbn);
  const updated = [book, ...filtered].slice(0, 20);
  await AsyncStorage.setItem(KEYS.RECENT_BOOKS, JSON.stringify(updated));
}

// Purchased books
export async function getPurchasedBooks(): Promise<Book[]> {
  const raw = await AsyncStorage.getItem(KEYS.PURCHASED_BOOKS);
  return raw ? JSON.parse(raw) : [];
}

export async function addPurchasedBook(book: Book): Promise<void> {
  const books = await getPurchasedBooks();
  if (books.some(b => b.isbn === book.isbn)) return;
  await AsyncStorage.setItem(KEYS.PURCHASED_BOOKS, JSON.stringify([book, ...books]));
}

export async function removePurchasedBook(isbn: string): Promise<void> {
  const books = await getPurchasedBooks();
  await AsyncStorage.setItem(
    KEYS.PURCHASED_BOOKS,
    JSON.stringify(books.filter(b => b.isbn !== isbn))
  );
}

export async function isPurchased(isbn: string): Promise<boolean> {
  const books = await getPurchasedBooks();
  return books.some(b => b.isbn === isbn);
}

// Cash
export async function getCash(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.CASH);
  return raw ? parseInt(raw, 10) : 0;
}

export async function setCash(amount: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.CASH, String(amount));
}

// Cards
export async function getCards(): Promise<PaymentCard[]> {
  const raw = await AsyncStorage.getItem(KEYS.CARDS);
  return raw ? JSON.parse(raw) : [];
}

export async function addCard(card: PaymentCard): Promise<void> {
  const cards = await getCards();
  await AsyncStorage.setItem(KEYS.CARDS, JSON.stringify([...cards, card]));
}

export async function removeCard(id: string): Promise<void> {
  const cards = await getCards();
  await AsyncStorage.setItem(KEYS.CARDS, JSON.stringify(cards.filter(c => c.id !== id)));
}

// Cart
export async function getCart(): Promise<CartItem[]> {
  const raw = await AsyncStorage.getItem(KEYS.CART);
  return raw ? JSON.parse(raw) : [];
}

export async function addToCart(book: Book): Promise<void> {
  const cart = await getCart();
  if (cart.some(i => i.book.isbn === book.isbn)) return;
  await AsyncStorage.setItem(KEYS.CART, JSON.stringify([...cart, { book, quantity: 1 }]));
}

export async function removeFromCart(isbn: string): Promise<void> {
  const cart = await getCart();
  await AsyncStorage.setItem(KEYS.CART, JSON.stringify(cart.filter(i => i.book.isbn !== isbn)));
}

export async function updateCartQuantity(isbn: string, quantity: number): Promise<void> {
  const cart = await getCart();
  await AsyncStorage.setItem(KEYS.CART, JSON.stringify(
    cart.map(i => i.book.isbn === isbn ? { ...i, quantity } : i)
  ));
}

export async function clearCart(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.CART);
}

export async function isInCart(isbn: string): Promise<boolean> {
  const cart = await getCart();
  return cart.some(i => i.book.isbn === isbn);
}
