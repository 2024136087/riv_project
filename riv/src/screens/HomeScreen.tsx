import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView,
  StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import BookCard from '../components/BookCard';
import { Colors } from '../constants/colors';
import { GENRES } from '../constants/genres';
import { searchBooks, getNewBooks, getTodayRecommended, getBooksByGenre } from '../services/bookApi';
import { addRecentBook, getUser } from '../services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, User } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [recommended, setRecommended] = useState<Book[]>([]);
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [genreBooks, setGenreBooks] = useState<Book[]>([]);
  const newBooksRef = useRef<Book[]>([]);
  const genrePoolRef = useRef<Book[]>([]);

  // 최초 1회: 오늘의 추천·신간 로드
  useEffect(() => {
    (async () => {
      const [rec, nb] = await Promise.all([getTodayRecommended(), getNewBooks()]);
      setRecommended(rec);
      setNewBooks(nb);
      newBooksRef.current = nb;
      setInitialLoading(false);
    })();
  }, []);

  // 포커스마다: 유저 정보 + 선호 장르 추천 갱신
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const u = await getUser();
        setUser(u);

        if (u && u.favoriteGenres.length > 0) {
          const kdcMap: Record<string, string> = {};
          GENRES.forEach(g => { kdcMap[g.label] = g.kdc; });

          const allResults = await Promise.all(
            u.favoriteGenres.map(genre => getBooksByGenre(kdcMap[genre] ?? '8'))
          );
          const newISBNs = new Set(newBooksRef.current.map(b => b.isbn));
          const seen = new Set<string>();
          const combined: Book[] = [];
          for (const books of allResults) {
            for (const book of books) {
              if (!seen.has(book.isbn) && !newISBNs.has(book.isbn)) {
                seen.add(book.isbn);
                combined.push(book);
              }
            }
          }
          genrePoolRef.current = combined;

          // 오늘 이미 뽑은 결과가 있으면 재사용
          const saved = await AsyncStorage.getItem('riv_genre_daily');
          if (saved) {
            const { date, books } = JSON.parse(saved);
            if (date === today()) {
              setGenreBooks(books);
              return;
            }
          }
          // 새 날이거나 저장 없으면 랜덤 선정 후 저장
          const picked = pickRandom(combined, 10);
          setGenreBooks(picked);
          await saveGenreSelection(picked);
        } else {
          setGenreBooks([]);
        }
      })();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('tabPress', () => {
      setQuery('');
      setSearchResults([]);
    });
    return unsubscribe;
  }, [navigation]);

  const today = () => new Date().toISOString().slice(0, 10);

  const pickRandom = (pool: Book[], count: number): Book[] => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const saveGenreSelection = async (books: Book[]) => {
    await AsyncStorage.setItem(
      'riv_genre_daily',
      JSON.stringify({ date: today(), books })
    );
  };

  const refreshGenreBooks = useCallback(async () => {
    if (genrePoolRef.current.length === 0) return;
    const picked = pickRandom(genrePoolRef.current, 10);
    setGenreBooks(picked);
    await saveGenreSelection(picked);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    const results = await searchBooks(query.trim());
    setSearchResults(results);
    setLoading(false);
  }, [query]);

  const handleBookPress = useCallback(
    async (book: Book) => {
      await addRecentBook(book);
      navigation.navigate('BookDetail', { book });
    },
    [navigation]
  );

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>Riv</Text>
            <Text style={styles.subtitle}>나만의 도서 큐레이터</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('Main', { screen: 'MyPage' })}
            activeOpacity={0.7}
          >
            {user ? (
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            ) : (
              <Ionicons name="person" size={20} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* 검색창 */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="책 제목, 저자, 키워드 검색"
            placeholderTextColor={Colors.textHint}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>검색</Text>
          </TouchableOpacity>
        </View>

        {/* 검색 결과 */}
        {loading && (
          <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.primary} />
        )}
        {searchResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>검색 결과</Text>
            {searchResults.map(book => (
              <BookCard key={book.isbn + book.title} book={book} onPress={handleBookPress} horizontal />
            ))}
          </View>
        )}

        {searchResults.length === 0 && (
          <>
            {/* 신간 도서 */}
            <View style={[styles.section, { marginTop: 16 }]}>
              <Text style={styles.sectionTitle}>신간 도서</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {newBooks.map(item => (
                  <BookCard key={item.isbn + item.title + 'new'} book={item} onPress={handleBookPress} />
                ))}
              </ScrollView>
            </View>

            {/* 오늘의 추천 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>오늘의 추천 책</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recommended.map(item => (
                  <BookCard key={item.isbn + item.title} book={item} onPress={handleBookPress} />
                ))}
              </ScrollView>
            </View>

            {/* 선호 장르 추천 */}
            {genreBooks.length > 0 && user && (
              <View style={styles.section}>
                <View style={styles.genreHeader}>
                  <View style={styles.genreHeaderLeft}>
                    <Text style={styles.sectionTitle}>선호장르 추천</Text>
                    <View style={styles.genreTags}>
                      {user.favoriteGenres.slice(0, 2).map(g => (
                        <View key={g} style={styles.genreTag}>
                          <Text style={styles.genreTagText}>{g}</Text>
                        </View>
                      ))}
                      {user.favoriteGenres.length > 2 && (
                        <View style={styles.genreTagMore}>
                          <Text style={styles.genreTagMoreText}>+{user.favoriteGenres.length - 2}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={refreshGenreBooks} activeOpacity={0.7}>
                    <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {genreBooks.map(item => (
                    <BookCard key={item.isbn + item.title + 'genre'} book={item} onPress={handleBookPress} />
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBtn: {
    marginLeft: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  genreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  genreHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  genreTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  genreTag: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  genreTagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  genreTagMore: {
    backgroundColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  genreTagMoreText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
