import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, FlatList, Image,
} from 'react-native';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import {
  getCash, setCash, addPurchasedBook, removeFromCart, incrementPurchaseCount,
} from '../services/storage';
import { CartItem } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CartCheckout'>;

const UNIT_PRICE = 10000;

export default function CartCheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { items, total } = route.params;
  const Colors = useColors();

  const [cash, setCashState] = useState(0);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    getCash().then(setCashState);
  }, []);

  useFocusEffect(useCallback(() => {
    getCash().then(setCashState);
  }, []));

  const remaining = cash - total;
  const canBuy = cash >= total;

  const handlePurchase = useCallback(async () => {
    if (!canBuy) return;
    await setCash(cash - total);
    await Promise.all(
      items.map(async item => {
        await addPurchasedBook(item.book);
        await incrementPurchaseCount(item.book.isbn);
        await removeFromCart(item.book.isbn);
      })
    );
    setPaid(true);
  }, [canBuy, cash, total, items]);

  const s = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: Colors.card,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerBackBtn: {
      width: 32, height: 32, borderRadius: 8,
      justifyContent: 'center', alignItems: 'center',
      marginRight: 8,
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
    headerCount: { fontSize: 13, color: Colors.textSecondary },

    list: { flex: 1 },

    card: {
      backgroundColor: Colors.card,
      marginHorizontal: 16, marginTop: 16,
      borderRadius: 16, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardTitle: {
      fontSize: 13, fontWeight: '700', color: Colors.textSecondary,
      marginBottom: 12, letterSpacing: 0.3,
    },

    // 주문 아이템
    itemRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    itemRowLast: { borderBottomWidth: 0 },
    thumb: { width: 42, height: 60, borderRadius: 6, backgroundColor: Colors.border },
    itemInfo: { flex: 1 },
    itemTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, lineHeight: 18 },
    itemSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },

    rowSep: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },

    // 금액
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    priceLabel: { fontSize: 14, color: Colors.textSecondary },
    priceVal: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    totalLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
    totalVal: { fontSize: 20, fontWeight: '800', color: Colors.primary },

    // 캐시
    cashRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    cashLabel: { fontSize: 14, color: Colors.textSecondary },
    cashVal: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

    warningBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#FFF3F3', borderRadius: 10,
      padding: 12, marginTop: 12,
      borderWidth: 1, borderColor: '#FFCDD2',
    },
    warningText: { fontSize: 13, color: Colors.error, flex: 1, fontWeight: '500' },
    chargeBtn: {
      paddingHorizontal: 12, paddingVertical: 6,
      backgroundColor: Colors.error, borderRadius: 8,
    },
    chargeBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },

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
      flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
    },
    completedIcon: { marginBottom: 20 },
    completedTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
    completedSub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 36, textAlign: 'center' },
    completedCard: {
      width: '100%', backgroundColor: Colors.card, borderRadius: 16,
      padding: 20, marginBottom: 36,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    completedRow: {
      flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
    },
    completedLabel: { fontSize: 14, color: Colors.textSecondary },
    completedValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    completedSep: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
    doneBtn: {
      height: 54, backgroundColor: Colors.primary, borderRadius: 14,
      paddingHorizontal: 48, justifyContent: 'center', alignItems: 'center',
    },
    doneBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  }), [Colors]);

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  if (paid) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.completedWrap}>
          <View style={s.completedIcon}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
          </View>
          <Text style={s.completedTitle}>주문 완료!</Text>
          <Text style={s.completedSub}>{items.length}종 {totalQty}권이 구매 목록에 추가되었습니다.</Text>

          <View style={s.completedCard}>
            <View style={s.completedRow}>
              <Text style={s.completedLabel}>주문 도서</Text>
              <Text style={s.completedValue}>
                {items[0].book.title}{items.length > 1 ? ` 외 ${items.length - 1}종` : ''}
              </Text>
            </View>
            <View style={s.completedRow}>
              <Text style={s.completedLabel}>총 수량</Text>
              <Text style={s.completedValue}>{totalQty}권</Text>
            </View>
            <View style={s.completedSep} />
            <View style={s.completedRow}>
              <Text style={s.completedLabel}>결제 금액</Text>
              <Text style={[s.completedValue, { color: Colors.primary }]}>{total.toLocaleString()}C</Text>
            </View>
            <View style={s.completedRow}>
              <Text style={s.completedLabel}>남은 캐시</Text>
              <Text style={s.completedValue}>{remaining.toLocaleString()}C</Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.doneBtn}
            onPress={() => navigation.navigate('Main', { screen: 'MyPage' })}
          >
            <Text style={s.doneBtnText}>마이페이지로 이동</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.headerBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>주문하기</Text>
        <Text style={s.headerCount}>{items.length}종 {totalQty}권</Text>
      </View>

      <FlatList
        style={s.list}
        data={[1]}
        keyExtractor={() => 'checkout'}
        showsVerticalScrollIndicator={false}
        renderItem={() => (
          <View>
            {/* 주문 목록 */}
            <View style={s.card}>
              <Text style={s.cardTitle}>주문 목록</Text>
              {items.map((item, idx) => (
                <View
                  key={item.book.isbn}
                  style={[s.itemRow, idx === items.length - 1 && s.itemRowLast]}
                >
                  <Image
                    source={{ uri: item.book.thumbnail || 'https://via.placeholder.com/42x60' }}
                    style={s.thumb}
                    resizeMode="cover"
                  />
                  <View style={s.itemInfo}>
                    <Text style={s.itemTitle} numberOfLines={2}>{item.book.title}</Text>
                    <Text style={s.itemSub}>{item.quantity}권</Text>
                  </View>
                  <Text style={s.itemPrice}>{(UNIT_PRICE * item.quantity).toLocaleString()}C</Text>
                </View>
              ))}
            </View>

            {/* 결제 금액 */}
            <View style={s.card}>
              <Text style={s.cardTitle}>결제 금액</Text>
              <View style={s.priceRow}>
                <Text style={s.priceLabel}>상품 수 ({items.length}종)</Text>
                <Text style={s.priceVal}>{totalQty}권</Text>
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
                <Text style={s.cashLabel}>결제 후 잔액</Text>
                <Text style={[s.cashVal, { color: canBuy ? Colors.textPrimary : Colors.error }]}>
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
                    onPress={() => navigation.navigate('CashPayment', {
                      amount: total - cash,
                      returnToPurchase: true,
                    })}
                  >
                    <Text style={s.chargeBtnText}>충전</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={{ height: 16 }} />
          </View>
        )}
      />

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.buyBtn, !canBuy && s.buyBtnDisabled]}
          onPress={handlePurchase}
          disabled={!canBuy}
          activeOpacity={0.85}
        >
          <Text style={s.buyBtnText}>
            {canBuy ? `${total.toLocaleString()}C로 주문하기` : '캐시 부족'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
