import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  FlatList, Dimensions, StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { getCards, getCash, setCash, addPurchasedBook, clearCart } from '../services/storage';
import { PaymentCard } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CashPayment'>;

const CARD_COLORS = ['#4F6EF7', '#2EC4B6', '#E63946', '#F4A261', '#6A0572'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.75, 300);
const CARD_GAP = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const H_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

// 외부 결제 페이지는 앱 테마와 무관하게 고정 색상 사용
const P = {
  bg: '#F2F4F7',
  white: '#FFFFFF',
  border: '#E0E4EA',
  text: '#1A1D23',
  textSub: '#6B7280',
  textHint: '#9CA3AF',
  accent: '#1B64DA',
  accentLight: '#EBF1FC',
  success: '#0AB573',
  successLight: '#E6F8F1',
  divider: '#EAEDF2',
};

export default function CashPaymentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { amount, books } = route.params;

  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [paid, setPaid] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    getCards().then(setCards);
  }, []);

  const handlePay = useCallback(async () => {
    const current = await getCash();
    await setCash(current + amount);
    if (books && books.length > 0) {
      await Promise.all(books.map(b => addPurchasedBook(b)));
      await clearCart();
    }
    setPaid(true);
  }, [amount, books]);

  if (paid) {
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="dark-content" backgroundColor={P.bg} />
        <View style={s.completedWrap}>
          <View style={s.completedIconWrap}>
            <Ionicons name="checkmark-circle" size={72} color={P.success} />
          </View>
          <Text style={s.completedTitle}>결제가 완료되었습니다.</Text>
          <Text style={s.completedSub}>{amount.toLocaleString()}C 충전 완료</Text>

          <View style={s.completedCard}>
            <View style={s.completedRow}>
              <Text style={s.completedRowLabel}>결제 금액</Text>
              <Text style={s.completedRowValue}>{amount.toLocaleString()}C</Text>
            </View>
            <View style={s.completedDivider} />
            <View style={s.completedRow}>
              <Text style={s.completedRowLabel}>결제 수단</Text>
              <Text style={s.completedRowValue}>
                {cards[selectedIndex]
                  ? `${cards[selectedIndex].nickname} (${cards[selectedIndex].number})`
                  : '카드'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.navigate('Main', { screen: 'MyPage' })}
          >
            <Text style={s.backBtnText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color={P.textSub} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Ionicons name="lock-closed" size={13} color={P.accent} style={{ marginRight: 4 }} />
          <Text style={s.headerBrand}>RIV Pay</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      {/* 결제 금액 */}
      <View style={s.amountSection}>
        <Text style={s.amountLabel}>결제 금액</Text>
        <Text style={s.amountValue}>{amount.toLocaleString()}<Text style={s.amountUnit}> C</Text></Text>
      </View>

      <View style={s.divider} />

      {/* 카드 선택 */}
      <View style={s.cardSection}>
        <Text style={s.sectionTitle}>결제 카드 선택</Text>
        <Text style={s.sectionSub}>좌우로 밀어 카드를 선택하세요</Text>
      </View>

      <View style={s.sliderWrap}>
        <FlatList
          ref={flatListRef}
          data={cards}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: H_PADDING }}
          ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
          keyExtractor={item => item.id}
          onMomentumScrollEnd={e => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
            setSelectedIndex(Math.max(0, Math.min(index, cards.length - 1)));
          }}
          renderItem={({ item, index }) => (
            <View style={[
              s.cardItem,
              { backgroundColor: CARD_COLORS[index % CARD_COLORS.length] },
              index === selectedIndex && s.cardItemSelected,
            ]}>
              {/* 카드 칩 */}
              <View style={s.cardChip} />
              <View style={s.cardBottom}>
                <Text style={s.cardNickname}>{item.nickname}</Text>
                <Text style={s.cardNumber}>•••• •••• •••• {item.number}</Text>
                <Text style={s.cardExpiry}>{item.expiry}</Text>
              </View>
              {index === selectedIndex && (
                <View style={s.cardCheck}>
                  <Ionicons name="checkmark-circle" size={22} color="rgba(255,255,255,0.95)" />
                </View>
              )}
            </View>
          )}
        />
      </View>

      {/* 페이지 도트 */}
      {cards.length > 1 && (
        <View style={s.dots}>
          {cards.map((_, i) => (
            <View key={i} style={[s.dot, i === selectedIndex && s.dotActive]} />
          ))}
        </View>
      )}

      <View style={{ flex: 1 }} />

      {/* 보안 배지 */}
      <View style={s.securityBadge}>
        <Ionicons name="shield-checkmark-outline" size={13} color={P.textHint} />
        <Text style={s.securityText}>SSL 암호화 보안 결제</Text>
      </View>

      {/* 결제 버튼 */}
      <View style={s.footer}>
        <TouchableOpacity style={s.payBtn} onPress={handlePay} activeOpacity={0.85}>
          <Text style={s.payBtnText}>{amount.toLocaleString()}C 결제하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: P.white, borderBottomWidth: 1, borderBottomColor: P.border,
  },
  closeBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerBrand: { fontSize: 14, fontWeight: '700', color: P.accent, letterSpacing: 0.5 },

  merchantBar: {
    backgroundColor: P.white, paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: P.border,
    alignItems: 'center',
  },
  merchantName: { fontSize: 15, fontWeight: '700', color: P.text },
  merchantDesc: { fontSize: 12, color: P.textSub, marginTop: 2 },

  amountSection: {
    backgroundColor: P.white, paddingHorizontal: 24, paddingVertical: 20,
    alignItems: 'center',
  },
  amountLabel: { fontSize: 12, color: P.textSub, marginBottom: 6, letterSpacing: 0.3 },
  amountValue: { fontSize: 36, fontWeight: '800', color: P.text },
  amountUnit: { fontSize: 20, fontWeight: '600', color: P.textSub },

  divider: { height: 8, backgroundColor: P.divider },

  cardSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: P.text },
  sectionSub: { fontSize: 12, color: P.textHint, marginTop: 3 },

  sliderWrap: { height: 180 },
  cardItem: {
    width: CARD_WIDTH, height: 166, borderRadius: 18, padding: 18,
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  cardItemSelected: {
    shadowOpacity: 0.32, shadowRadius: 16, elevation: 10,
  },
  cardChip: {
    width: 32, height: 24, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  cardBottom: { gap: 3 },
  cardNickname: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cardNumber: { color: 'rgba(255,255,255,0.85)', fontSize: 13, letterSpacing: 1.5 },
  cardExpiry: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },
  cardCheck: { position: 'absolute', top: 14, right: 14 },

  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: P.border },
  dotActive: { width: 18, backgroundColor: P.accent },

  securityBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingBottom: 12,
  },
  securityText: { fontSize: 11, color: P.textHint },

  footer: {
    paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: P.white, borderTopWidth: 1, borderTopColor: P.border, paddingTop: 16,
  },
  payBtn: {
    backgroundColor: P.accent, height: 52, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // 완료 화면
  completedWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  completedIconWrap: { marginBottom: 16 },
  completedTitle: { fontSize: 20, fontWeight: '800', color: P.text, marginBottom: 6 },
  completedSub: { fontSize: 14, color: P.textSub, marginBottom: 32 },
  completedCard: {
    width: '100%', backgroundColor: P.white, borderRadius: 16,
    padding: 20, marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  completedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  completedRowLabel: { fontSize: 14, color: P.textSub },
  completedRowValue: { fontSize: 14, fontWeight: '600', color: P.text },
  completedDivider: { height: 1, backgroundColor: P.divider, marginVertical: 10 },
  backBtn: {
    backgroundColor: P.accent, paddingHorizontal: 48, paddingVertical: 14,
    borderRadius: 12,
  },
  backBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
