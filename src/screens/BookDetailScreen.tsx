import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet,
  TouchableOpacity, Alert, SafeAreaView, Linking,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import {
  isPurchased, addPurchasedBook, removePurchasedBook, addRecentBook,
  isInCart, addToCart, removeFromCart,
} from '../services/storage';
import { searchBooks, getTodayRecommended } from '../services/bookApi';
import { Book } from '../types';
import BookCard from '../components/BookCard';
import BottomTabBar from '../components/BottomTabBar';
import { RootStackParamList } from '../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Route = RouteProp<RootStackParamList, 'BookDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BookDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const Colors = useColors();
  const { book } = route.params;

  const [purchased, setPurchased] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [related, setRelated] = useState<Book[]>([]);

  useEffect(() => {
    (async () => {
      const exclude = (books: Book[]) => books.filter(b => b.isbn !== book.isbn).slice(0, 6);

      const [p, cart, byAuthor] = await Promise.all([
        isPurchased(book.isbn),
        isInCart(book.isbn),
        searchBooks(book.authors[0] ?? book.title),
      ]);
      setInCart(cart);
      setPurchased(p);

      let result = exclude(byAuthor);
      if (result.length === 0) {
        const byPublisher = await searchBooks(book.publisher);
        result = exclude(byPublisher);
      }
      if (result.length === 0) {
        const popular = await getTodayRecommended();
        result = exclude(popular);
      }
      setRelated(result);
    })();
  }, [book]);

  const handlePurchaseToggle = useCallback(async () => {
    if (purchased) {
      Alert.alert('구매 취소', '구매 목록에서 삭제할까요?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => { await removePurchasedBook(book.isbn); setPurchased(false); },
        },
      ]);
    } else {
      await addPurchasedBook(book);
      setPurchased(true);
      Alert.alert('완료', '구매한 책에 추가되었습니다.');
    }
  }, [book, purchased]);

  const handleCartToggle = useCallback(async () => {
    if (inCart) {
      await removeFromCart(book.isbn);
      setInCart(false);
    } else {
      await addToCart(book);
      setInCart(true);
    }
  }, [book, inCart]);

  const handleRelatedPress = useCallback(async (relatedBook: Book) => {
    await addRecentBook(relatedBook);
    navigation.push('BookDetail', { book: relatedBook });
  }, [navigation]);

  const parseAuthors = (authors: string[]) => {
    const translatorRoles = ['옮긴이', '옮김', '역', '번역', '편역'];
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
    ? new Date(book.datetime).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const displayPrice = book.price > 0 ? book.price : null;
  const salePrice = book.sale_price > 0 ? book.sale_price : displayPrice;
  const discountRate = displayPrice && salePrice && salePrice < displayPrice
    ? Math.round((1 - salePrice / displayPrice) * 100)
    : 0;

  const isbnList = book.isbn.split(' ').filter(Boolean);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flex: 1 },
    divider: { height: 8, backgroundColor: Colors.background },
    sectionDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 20 },

    // 히어로
    hero: { backgroundColor: Colors.card, padding: 20, flexDirection: 'row' },
    cover: {
      width: 110, height: 158, borderRadius: 10,
      backgroundColor: Colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
    },
    heroInfo: { flex: 1, marginLeft: 18, justifyContent: 'flex-start', paddingTop: 2 },
    title: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, lineHeight: 25 },
    authorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
    authorBadge: {
      backgroundColor: Colors.primaryLight, borderRadius: 6,
      paddingHorizontal: 7, paddingVertical: 2,
    },
    authorBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
    authorName: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
    publisherText: { fontSize: 12, color: Colors.textHint, marginTop: 6 },

    // 간단 설명
    briefSection: {
      backgroundColor: Colors.card, paddingHorizontal: 20, paddingVertical: 16,
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    },
    briefText: {
      flex: 1, fontSize: 14, color: Colors.textSecondary,
      lineHeight: 22, fontStyle: 'italic',
    },

    // 가격
    priceSection: {
      backgroundColor: Colors.card, paddingHorizontal: 20, paddingVertical: 16,
      flexDirection: 'row', alignItems: 'center',
    },
    priceWrap: { flex: 1 },
    priceLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
    priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    salePrice: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
    priceUnit: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 2 },
    btnRow: { flexDirection: 'row', gap: 8 },
    cartBtn: {
      width: 44, height: 44, borderRadius: 10, flexDirection: 'row',
      borderWidth: 1.5, borderColor: Colors.primary,
      justifyContent: 'center', alignItems: 'center',
    },
    cartBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    cartBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    cartBtnTextActive: { color: Colors.white },
    purchaseBtn: {
      height: 44, paddingHorizontal: 16, backgroundColor: Colors.primary,
      borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    },
    purchasedBtn: { backgroundColor: Colors.border },
    purchaseBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },

    // 책 소개
    section: { backgroundColor: Colors.card, padding: 20 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 14 },
    contents: { fontSize: 14, lineHeight: 24, color: Colors.textSecondary },

    // 상세 정보 테이블
    infoTable: { gap: 0 },
    infoRow: {
      flexDirection: 'row', paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    infoRowLast: { borderBottomWidth: 0 },
    infoKey: { width: 90, fontSize: 13, color: Colors.textHint, fontWeight: '600' },
    infoVal: { flex: 1, fontSize: 13, color: Colors.textPrimary, lineHeight: 20 },

    // 판매자 정보
    sellerCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: Colors.background, borderRadius: 12,
      padding: 14, borderWidth: 1, borderColor: Colors.border,
    },
    sellerLogo: {
      width: 44, height: 44, borderRadius: 10,
      backgroundColor: '#FFEB00', justifyContent: 'center', alignItems: 'center',
      marginRight: 14,
    },
    sellerLogoText: { fontSize: 16, fontWeight: '900', color: '#1A1A1A' },
    sellerName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
    sellerDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
    sellerLink: {
      flexDirection: 'row', alignItems: 'center',
      marginTop: 12, gap: 4,
    },
    sellerLinkText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* 히어로 */}
        <View style={styles.hero}>
          <Image
            source={{ uri: book.thumbnail || 'https://via.placeholder.com/120x170' }}
            style={styles.cover}
            resizeMode="cover"
          />
          <View style={styles.heroInfo}>
            <Text style={styles.title}>{book.title}</Text>
            {writers.length > 0 && (
              <View style={styles.authorRow}>
                <View style={styles.authorBadge}><Text style={styles.authorBadgeText}>지은이</Text></View>
                <Text style={styles.authorName}>{writers.join(', ')}</Text>
              </View>
            )}
            {translators.length > 0 && (
              <View style={styles.authorRow}>
                <View style={styles.authorBadge}><Text style={styles.authorBadgeText}>옮긴이</Text></View>
                <Text style={styles.authorName}>{translators.join(', ')}</Text>
              </View>
            )}
            <Text style={styles.publisherText}>{book.publisher}</Text>
            {publishDate ? <Text style={styles.publisherText}>{publishDate}</Text> : null}
          </View>
        </View>

        <View style={styles.divider} />

        {/* 간단한 설명 */}
        {book.contents ? (
          <>
            <View style={styles.briefSection}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.primary} />
              <Text style={styles.briefText}>
                {book.contents.length > 120 ? book.contents.slice(0, 120) + '…' : book.contents}
              </Text>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        {/* 가격 + 버튼 */}
        <View style={styles.priceSection}>
          <View style={styles.priceWrap}>
            <Text style={styles.priceLabel}>판매가</Text>
            <View style={styles.priceRow}>
              <Text style={styles.salePrice}>10,000</Text>
              <Text style={styles.priceUnit}>원</Text>
            </View>
          </View>
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.cartBtn, inCart && styles.cartBtnActive]}
              onPress={handleCartToggle}
              activeOpacity={0.8}
            >
              <Ionicons
                name={inCart ? 'cart' : 'cart-outline'}
                size={20}
                color={inCart ? Colors.white : Colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.purchaseBtn, purchased && styles.purchasedBtn]}
              onPress={handlePurchaseToggle}
              activeOpacity={0.8}
            >
              <Text style={styles.purchaseBtnText}>
                {purchased ? '구매 취소' : '구매하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 책 소개 */}
        {book.contents ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>책 소개</Text>
              <Text style={styles.contents}>{book.contents}</Text>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        {/* 상세 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 정보</Text>
          <View style={styles.infoTable}>
            {writers.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>지은이</Text>
                <Text style={styles.infoVal}>{writers.join(', ')}</Text>
              </View>
            )}
            {translators.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>옮긴이</Text>
                <Text style={styles.infoVal}>{translators.join(', ')}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>출판사</Text>
              <Text style={styles.infoVal}>{book.publisher}</Text>
            </View>
            {publishDate ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>출판일</Text>
                <Text style={styles.infoVal}>{publishDate}</Text>
              </View>
            ) : null}
            {isbnList.map((isbn, i) => (
              <View key={isbn} style={[styles.infoRow, i === isbnList.length - 1 && styles.infoRowLast]}>
                <Text style={styles.infoKey}>{i === 0 ? 'ISBN' : 'ISBN-13'}</Text>
                <Text style={styles.infoVal}>{isbn}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* 판매자 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>판매자 정보</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerLogo}>
              <Text style={styles.sellerLogoText}>K</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>카카오 북스</Text>
              <Text style={styles.sellerDesc}>Kakao Corp. 공식 도서 판매 플랫폼</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          </View>
          {book.url ? (
            <TouchableOpacity style={styles.sellerLink} onPress={() => Linking.openURL(book.url)}>
              <Ionicons name="open-outline" size={14} color={Colors.primary} />
              <Text style={styles.sellerLinkText}>카카오 북스에서 보기</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* 함께 읽기 좋은 책 */}
        {related.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>함께 읽기 좋은 책</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {related.map(b => (
                  <BookCard key={b.isbn + b.title} book={b} onPress={handleRelatedPress} />
                ))}
              </ScrollView>
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
      <BottomTabBar />
    </SafeAreaView>
  );
}
