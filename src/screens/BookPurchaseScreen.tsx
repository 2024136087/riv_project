import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Image, ScrollView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { getCash, setCash, addPurchasedBook, isPurchased, incrementPurchaseCount } from '../services/storage';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BookPurchase'>;

const UNIT_PRICE = 10000;

export default function BookPurchaseScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { book } = route.params;
  const Colors = useColors();

  const [cash, setCashState] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [paid, setPaid] = useState(false);
  const [alreadyOwned, setAlreadyOwned] = useState(false);

  useEffect(() => {
    Promise.all([getCash(), isPurchased(book.isbn)]).then(([c, owned]) => {
      setCashState(c);
      setAlreadyOwned(owned);
    });
  }, [book.isbn]);

  // 충전 후 돌아왔을 때 캐시 잔액 갱신
  useFocusEffect(useCallback(() => {
    getCash().then(setCashState);
  }, []));

  const total = UNIT_PRICE * quantity;
  const remaining = cash - total;
  const canBuy = cash >= total;

  const handlePurchase = useCallback(async () => {
    if (!canBuy) return;
    await setCash(cash - total);
    await addPurchasedBook(book);
    await incrementPurchaseCount(book.isbn);
    setPaid(true);
  }, [canBuy, cash, total, book]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: Colors.card,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
      gap: 8,
    },
    backBtn: { padding: 2 },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

    scroll: { flex: 1 },

    // 책 정보
    bookSection: {
      flexDirection: 'row', alignItems: 'center', gap: 16,
      backgroundColor: Colors.card,
      paddingHorizontal: 20, paddingVertical: 20,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    thumb: {
      width: 72, height: 102, borderRadius: 8,
      backgroundColor: Colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
    },
    bookInfo: { flex: 1, gap: 4 },
    bookTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22 },
    bookAuthor: { fontSize: 13, color: Colors.textSecondary },
    bookPublisher: { fontSize: 12, color: Colors.textHint },

    divider: { height: 8, backgroundColor: Colors.background },

    card: {
      backgroundColor: Colors.card,
      marginHorizontal: 16, marginTop: 16,
      borderRadius: 16, padding: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardTitle: {
      fontSize: 13, fontWeight: '700', color: Colors.textSecondary,
      marginBottom: 16, letterSpacing: 0.3,
    },

    // 수량
    qtyRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    qtyLabel: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
    qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    qtyBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: Colors.background,
      borderWidth: 1.5, borderColor: Colors.border,
      justifyContent: 'center', alignItems: 'center',
    },
    qtyBtnDisabled: { opacity: 0.35 },
    qtyNum: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, minWidth: 28, textAlign: 'center' },

    rowSep: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },

    // 금액 행
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    priceLabel: { fontSize: 14, color: Colors.textSecondary },
    priceVal: { fontSize: 14, color: Colors.textPrimary, fontWeight: '600' },
    totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
    totalVal: { fontSize: 20, fontWeight: '800', color: Colors.primary },

    // 캐시 잔액
    cashRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cashLabel: { fontSize: 14, color: Colors.textSecondary },
    cashVal: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    cashAfterLabel: { fontSize: 14, color: Colors.textSecondary },
    cashAfterVal: { fontSize: 14, fontWeight: '700' },

    // 부족 경고
    warningBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#FFF3F3', borderRadius: 10,
      padding: 12, marginTop: 14,
      borderWidth: 1, borderColor: '#FFCDD2',
    },
    warningText: { fontSize: 13, color: Colors.error, flex: 1, fontWeight: '500' },
    chargeBtn: {
      paddingHorizontal: 12, paddingVertical: 6,
      backgroundColor: Colors.error, borderRadius: 8,
    },
    chargeBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },

    // 이미 구매 배지
    ownedBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: Colors.primaryLight, borderRadius: 10,
      padding: 12, marginTop: 14,
    },
    ownedText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

    footer: {
      paddingHorizontal: 20, paddingVertical: 16,
      backgroundColor: Colors.card,
      borderTopWidth: 1, borderTopColor: Colors.border,
    },
    buyBtn: {
      height: 54, backgroundColor: Colors.primary,
      borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    },
    buyBtnDisabled: { backgroundColor: Colors.border },
    buyBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

    // 완료 화면
    completedWrap: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      paddingHorizontal: 32,
    },
    completedIcon: { marginBottom: 20 },
    completedTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
    completedSub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 40, textAlign: 'center' },
    completedCard: {
      width: '100%', backgroundColor: Colors.card, borderRadius: 16,
      padding: 20, marginBottom: 36,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    completedRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: 6,
    },
    completedLabel: { fontSize: 14, color: Colors.textSecondary },
    completedValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1, textAlign: 'right' },
    completedSep: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
    backBtn: {
      height: 54, backgroundColor: Colors.primary, borderRadius: 14,
      paddingHorizontal: 48, justifyContent: 'center', alignItems: 'center',
    },
    backBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  }), [Colors]);

  // 완료 화면
  if (paid) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.completedWrap}>
          <View style={s.completedIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={s.completedTitle}>구매 완료!</Text>
          <Text style={s.completedSub}>책이 구매 목록에 추가되었습니다.</Text>

          <View style={s.completedCard}>
            <View style={s.completedRow}>
              <Text style={s.completedLabel}>도서</Text>
              <Text style={s.completedValue} numberOfLines={2}>{book.title}</Text>
            </View>
            <View style={s.completedSep} />
            <View style={s.completedRow}>
              <Text style={s.completedLabel}>수량</Text>
              <Text style={s.completedValue}>{quantity}권</Text>
            </View>
            <View style={s.completedRow}>
              <Text style={s.completedLabel}>결제 금액</Text>
              <Text style={[s.completedValue, { color: Colors.primary }]}>{total.toLocaleString()}C</Text>
            </View>
            <View style={s.completedSep} />
            <View style={s.completedRow}>
              <Text style={s.completedLabel}>남은 캐시</Text>
              <Text style={s.completedValue}>{remaining.toLocaleString()}C</Text>
            </View>
          </View>

          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backBtnText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>구매하기</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* 책 정보 */}
        <View style={s.bookSection}>
          <Image
            source={{ uri: book.thumbnail || 'https://via.placeholder.com/72x102' }}
            style={s.thumb}
            resizeMode="cover"
          />
          <View style={s.bookInfo}>
            <Text style={s.bookTitle} numberOfLines={3}>{book.title}</Text>
            {book.authors.length > 0 && (
              <Text style={s.bookAuthor}>{book.authors[0]}</Text>
            )}
            <Text style={s.bookPublisher}>{book.publisher}</Text>
          </View>
        </View>

        {/* 수량 선택 */}
        <View style={s.card}>
          <Text style={s.cardTitle}>수량 선택</Text>
          <View style={s.qtyRow}>
            <Text style={s.qtyLabel}>권 수</Text>
            <View style={s.qtyControls}>
              <TouchableOpacity
                style={[s.qtyBtn, quantity <= 1 && s.qtyBtnDisabled]}
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={s.qtyNum}>{quantity}</Text>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => setQuantity(q => q + 1)}
              >
                <Ionicons name="add" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 결제 금액 */}
        <View style={s.card}>
          <Text style={s.cardTitle}>결제 금액</Text>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>단가</Text>
            <Text style={s.priceVal}>{UNIT_PRICE.toLocaleString()}C</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>수량</Text>
            <Text style={s.priceVal}>{quantity}권</Text>
          </View>
          <View style={s.rowSep} />
          <View style={s.priceRow}>
            <Text style={s.totalLabel}>합계</Text>
            <Text style={s.totalVal}>{total.toLocaleString()}C</Text>
          </View>
        </View>

        {/* 캐시 잔액 */}
        <View style={s.card}>
          <Text style={s.cardTitle}>캐시 잔액</Text>
          <View style={s.cashRow}>
            <Text style={s.cashLabel}>현재 잔액</Text>
            <Text style={s.cashVal}>{cash.toLocaleString()}C</Text>
          </View>
          <View style={s.cashRow}>
            <Text style={s.cashAfterLabel}>결제 후 잔액</Text>
            <Text style={[s.cashAfterVal, { color: canBuy ? Colors.textPrimary : Colors.error }]}>
              {canBuy ? remaining.toLocaleString() : '–'}C
            </Text>
          </View>

          {!canBuy && (
            <View style={s.warningBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
              <Text style={s.warningText}>
                캐시가 {(total - cash).toLocaleString()}C 부족합니다.
              </Text>
              <TouchableOpacity
                style={s.chargeBtn}
                onPress={() => navigation.navigate('CashPayment', { amount: total - cash, returnToPurchase: true })}
              >
                <Text style={s.chargeBtnText}>충전</Text>
              </TouchableOpacity>
            </View>
          )}

          {alreadyOwned && (
            <View style={s.ownedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={s.ownedText}>이미 구매한 책입니다. 다시 구매할 수 있습니다.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* 구매 버튼 */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.buyBtn, !canBuy && s.buyBtnDisabled]}
          onPress={handlePurchase}
          disabled={!canBuy}
          activeOpacity={0.85}
        >
          <Text style={s.buyBtnText}>
            {canBuy ? `${total.toLocaleString()}C로 구매하기` : '캐시 부족'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
