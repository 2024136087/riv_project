import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet,
  TouchableOpacity, Alert, SafeAreaView, Linking,
  Modal, Animated,
} from 'react-native';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import {
  isPurchased, addRecentBook,
  isInCart, addToCart, removeFromCart, updateCartQuantity,
} from '../services/storage';
import { searchBooks, getTodayRecommended } from '../services/bookApi';
import { Book } from '../types';
import BookCard from '../components/BookCard';
import BottomTabBar from '../components/BottomTabBar';
import { RootStackParamList } from '../../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Route = RouteProp<RootStackParamList, 'BookDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const UNIT_PRICE = 10000;

export default function BookDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const Colors = useColors();
  const { book } = route.params;

  const [purchased, setPurchased] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [related, setRelated] = useState<Book[]>([]);
  const [purchasedChecked, setPurchasedChecked] = useState(false);

  // 장바구니 바텀시트
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(500)).current;

  // 토스트
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastVisible(true);
    toastAnim.setValue(0);
    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, bounciness: 6 }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setToastVisible(false);
      });
    }, 2500);
  }, [toastAnim]);

  const openCartModal = useCallback(() => {
    setQuantity(1);
    setCartModalVisible(true);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(sheetAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [backdropAnim, sheetAnim]);

  const closeCartModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetAnim, { toValue: 500, duration: 250, useNativeDriver: true }),
    ]).start(() => setCartModalVisible(false));
  }, [backdropAnim, sheetAnim]);

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
      setPurchasedChecked(true);

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

  // 결제 후 돌아왔을 때 구매 상태 갱신
  useFocusEffect(useCallback(() => {
    if (purchasedChecked) {
      isPurchased(book.isbn).then(setPurchased);
    }
  }, [book.isbn, purchasedChecked]));

  const handlePurchasePress = useCallback(() => {
    navigation.navigate('BookPurchase', { book });
  }, [book, navigation]);

  const handleCartBtnPress = useCallback(() => {
    if (inCart) {
      Alert.alert('장바구니 취소', '장바구니에서 제거할까요?', [
        { text: '취소', style: 'cancel' },
        {
          text: '제거', style: 'destructive',
          onPress: async () => { await removeFromCart(book.isbn); setInCart(false); },
        },
      ]);
    } else {
      openCartModal();
    }
  }, [inCart, book, openCartModal]);

  const handleAddToCart = useCallback(async () => {
    await addToCart(book);
    await updateCartQuantity(book.isbn, quantity);
    setInCart(true);
    closeCartModal();
    showToast();
  }, [book, quantity, closeCartModal, showToast]);

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

  const isbnList = book.isbn.split(' ').filter(Boolean);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flex: 1 },
    divider: { height: 8, backgroundColor: Colors.background },

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

    // 가격 + 버튼
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
      width: 44, height: 44, borderRadius: 10,
      borderWidth: 1.5, borderColor: Colors.primary,
      justifyContent: 'center', alignItems: 'center',
    },
    cartBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
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

    // 바텀시트 모달
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContainer: { flex: 1, justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: Colors.card,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40,
    },
    modalHandle: {
      width: 40, height: 4, backgroundColor: Colors.border,
      borderRadius: 2, alignSelf: 'center', marginBottom: 20,
    },
    modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 20 },
    modalBookRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      marginBottom: 24,
      paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    modalThumb: { width: 52, height: 74, borderRadius: 8, backgroundColor: Colors.border },
    modalBookTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1, lineHeight: 20 },
    modalBookPrice: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
    qtyLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 12 },
    qtyRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 24,
    },
    qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    qtyBtn: {
      width: 40, height: 40, borderRadius: 10,
      backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
      justifyContent: 'center', alignItems: 'center',
    },
    qtyBtnDisabled: { borderColor: Colors.border, opacity: 0.4 },
    qtyNum: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, minWidth: 32, textAlign: 'center' },
    totalText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
    modalBtnRow: { flexDirection: 'row', gap: 10 },
    modalBtn: {
      flex: 1, height: 52, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center',
    },

    // 토스트
    toast: {
      position: 'absolute', top: 16, alignSelf: 'center',
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#1A1A2E', borderRadius: 24,
      paddingHorizontal: 18, paddingVertical: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    },
    toastText: { color: '#fff', fontSize: 13, fontWeight: '600' },
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
              onPress={handleCartBtnPress}
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
              onPress={handlePurchasePress}
              activeOpacity={0.8}
            >
              <Text style={styles.purchaseBtnText}>
                {purchased ? '다시 구매' : '구매하기'}
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

      {/* 장바구니 담기 바텀시트 */}
      <Modal visible={cartModalVisible} transparent animationType="none">
        <Animated.View style={[styles.modalBackdrop, { opacity: backdropAnim }]} />
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={closeCartModal}
        >
          <Animated.View
            style={[styles.modalSheet, { transform: [{ translateY: sheetAnim }] }]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>장바구니에 담기</Text>

              <View style={styles.modalBookRow}>
                <Image
                  source={{ uri: book.thumbnail || 'https://via.placeholder.com/52x74' }}
                  style={styles.modalThumb}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalBookTitle} numberOfLines={2}>{book.title}</Text>
                  <Text style={styles.modalBookPrice}>{UNIT_PRICE.toLocaleString()}원 / 권</Text>
                </View>
              </View>

              <Text style={styles.qtyLabel}>수량 선택</Text>
              <View style={styles.qtyRow}>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                    onPress={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <Ionicons name="remove" size={18} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity(q => q + 1)}
                  >
                    <Ionicons name="add" size={18} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.totalText}>{(UNIT_PRICE * quantity).toLocaleString()}원</Text>
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.border }]}
                  onPress={closeCartModal}
                >
                  <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: Colors.primary }]}
                  onPress={handleAddToCart}
                >
                  <Text style={{ color: Colors.white, fontWeight: '700' }}>장바구니에 추가</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* 장바구니 추가 토스트 */}
      <Modal visible={toastVisible} transparent animationType="none" statusBarTranslucent>
        <Animated.View
          style={[styles.toast, {
            opacity: toastAnim,
            transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          }]}
          pointerEvents="none"
        >
          <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
          <Text style={styles.toastText}>장바구니에 추가되었습니다.</Text>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}
