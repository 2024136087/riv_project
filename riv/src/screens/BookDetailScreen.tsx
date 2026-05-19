import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet,
  TouchableOpacity, Alert, SafeAreaView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import {
  isPurchased, addPurchasedBook, removePurchasedBook,
} from '../services/storage';
import { searchBooks } from '../services/bookApi';
import { Book } from '../types';
import BookCard from '../components/BookCard';
import BottomTabBar from '../components/BottomTabBar';
import { RootStackParamList } from '../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { addRecentBook } from '../services/storage';

type Route = RouteProp<RootStackParamList, 'BookDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BookDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { book } = route.params;

  const [purchased, setPurchased] = useState(false);
  const [related, setRelated] = useState<Book[]>([]);

  useEffect(() => {
    (async () => {
      const [p, rel] = await Promise.all([
        isPurchased(book.isbn),
        searchBooks(book.authors[0] ?? book.title),
      ]);
      setPurchased(p);
      setRelated(rel.filter(b => b.isbn !== book.isbn).slice(0, 6));
    })();
  }, [book]);

  const handlePurchaseToggle = useCallback(async () => {
    if (purchased) {
      Alert.alert('구매 취소', '구매 목록에서 삭제할까요?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await removePurchasedBook(book.isbn);
            setPurchased(false);
          },
        },
      ]);
    } else {
      await addPurchasedBook(book);
      setPurchased(true);
      Alert.alert('완료', '구매한 책에 추가되었습니다.');
    }
  }, [book, purchased]);

  const handleRelatedPress = useCallback(
    async (relatedBook: Book) => {
      await addRecentBook(relatedBook);
      navigation.push('BookDetail', { book: relatedBook });
    },
    [navigation]
  );

  const writerRoles = ['지은이', '글', '저', '글쓴이', '저자'];
  const translatorRoles = ['옮긴이', '옮김', '역', '번역', '편역'];

  const parseAuthors = (authors: string[]) => {
    const parts = authors.join(', ').split(';').map(p => p.trim()).filter(Boolean);
    const writers: string[] = [];
    const translators: string[] = [];
    for (const part of parts) {
      const colonIdx = part.indexOf(':');
      if (colonIdx !== -1) {
        const role = part.substring(0, colonIdx).trim();
        const name = part.substring(colonIdx + 1).trim();
        if (translatorRoles.some(r => role.includes(r))) translators.push(name);
        else writers.push(name);
      } else {
        if (translatorRoles.some(k => part.includes(k))) translators.push(part);
        else writers.push(part);
      }
    }
    return { writers, translators };
  };

  const { writers, translators } = parseAuthors(book.authors);

  const publishDate = book.datetime
    ? new Date(book.datetime).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 책 상단 정보 */}
        <View style={styles.hero}>
          <Image
            source={{ uri: book.thumbnail || 'https://via.placeholder.com/120x170' }}
            style={styles.cover}
            resizeMode="cover"
          />
          <View style={styles.heroInfo}>
            <Text style={styles.title}>{book.title}</Text>
            {writers.length > 0 && (
              <Text style={styles.author}>지은이  {writers.join(', ')}</Text>
            )}
            {translators.length > 0 && (
              <Text style={styles.author}>옮긴이  {translators.join(', ')}</Text>
            )}
            <Text style={styles.publisher}>{book.publisher}</Text>
            {publishDate ? <Text style={styles.date}>{publishDate}</Text> : null}
            {book.sale_price > 0 && (
              <Text style={styles.price}>{book.sale_price.toLocaleString()}원</Text>
            )}
          </View>
        </View>

        {/* 구매 버튼 */}
        <TouchableOpacity
          style={[styles.purchaseBtn, purchased && styles.purchasedBtn]}
          onPress={handlePurchaseToggle}
        >
          <Text style={styles.purchaseBtnText}>
            {purchased ? '구매 취소' : '구매하기'}
          </Text>
        </TouchableOpacity>

        {/* 책 소개 */}
        {book.contents ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>책 소개</Text>
            <Text style={styles.contents}>{book.contents}</Text>
          </View>
        ) : null}

        {/* 연관 도서 */}
        {related.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>함께 읽기 좋은 책</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {related.map(b => (
                <BookCard key={b.isbn + b.title} book={b} onPress={handleRelatedPress} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  hero: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.card,
  },
  cover: {
    width: 100,
    height: 142,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  heroInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  author: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  publisher: {
    fontSize: 12,
    color: Colors.textHint,
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.textHint,
    marginTop: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 10,
  },
  purchaseBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchasedBtn: {
    backgroundColor: Colors.border,
  },
  purchaseBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  contents: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
});
