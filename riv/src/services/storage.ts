import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, User, PaymentCard } from '../types';

const KEYS = {
  USER: 'riv_user',
  RECENT_BOOKS: 'riv_recent_books',
  PURCHASED_BOOKS: 'riv_purchased_books',
  CASH: 'riv_cash',
  CARDS: 'riv_cards',
};

// User
export async function getUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

export async function saveUser(user: User): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function removeUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USER);
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
