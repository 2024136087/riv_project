import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, SafeAreaView, FlatList, Modal, KeyboardAvoidingView, Platform,
  Animated, Switch, Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import BookCard from '../components/BookCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { GENRES } from '../constants/genres';
import {
  getLoggedInUser, saveUser, removeUser, endSession,
  getRecentBooks, getPurchasedBooks, addRecentBook,
  getCash, setCash, getCards, addCard, removeCard,
  getCart, removeFromCart, clearCart, addPurchasedBook,
} from '../services/storage';
import { Book, User, PaymentCard, CartItem } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CARD_COLORS = ['#4F6EF7', '#2EC4B6', '#E63946', '#F4A261', '#6A0572'];
const CHARGE_PRESETS = [1000, 3000, 5000, 10000, 30000, 50000];

export default function MyPageScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark, toggleDark, colors: Colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [purchasedBooks, setPurchasedBooks] = useState<Book[]>([]);
  const [cash, setCashState] = useState(0);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [editingGenres, setEditingGenres] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const [chargeModalVisible, setChargeModalVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [cardNickname, setCardNickname] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');


  const chargeBackdrop = useRef(new Animated.Value(0)).current;
  const chargeSheet = useRef(new Animated.Value(500)).current;
  const cardBackdrop = useRef(new Animated.Value(0)).current;
  const cardSheet = useRef(new Animated.Value(500)).current;

  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

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

  const openChargeModal = useCallback(() => {
    setChargeModalVisible(true);
    Animated.parallel([
      Animated.timing(chargeBackdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(chargeSheet, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [chargeBackdrop, chargeSheet]);

  const closeChargeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(chargeBackdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(chargeSheet, { toValue: 500, duration: 250, useNativeDriver: true }),
    ]).start(() => setChargeModalVisible(false));
  }, [chargeBackdrop, chargeSheet]);

  const openCardModal = useCallback(() => {
    setCardModalVisible(true);
    Animated.parallel([
      Animated.timing(cardBackdrop, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(cardSheet, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [cardBackdrop, cardSheet]);

  const closeCardModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(cardBackdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(cardSheet, { toValue: 500, duration: 250, useNativeDriver: true }),
    ]).start(() => setCardModalVisible(false));
  }, [cardBackdrop, cardSheet]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [u, rb, pb, c, cds, ct] = await Promise.all([
          getLoggedInUser(), getRecentBooks(), getPurchasedBooks(), getCash(), getCards(), getCart(),
        ]);
        setUser(u);
        setRecentBooks(rb);
        setPurchasedBooks(pb);
        setCashState(c);
        setCards(cds);
        setCart(ct);
      })();
    }, [])
  );

  const handleToggleGenre = useCallback(async (label: string) => {
    if (!user) return;
    const has = user.favoriteGenres.includes(label);
    const updated = has
      ? user.favoriteGenres.filter(g => g !== label)
      : [...user.favoriteGenres, label];
    const newUser = { ...user, favoriteGenres: updated };
    await saveUser(newUser);
    setUser(newUser);
  }, [user]);

  const handleLogout = useCallback(() => {
    setConfirmModal({
      title: '로그아웃',
      message: '로그아웃 하시겠습니까?',
      onConfirm: async () => {
        await endSession();
        setUser(null);
        navigation.navigate('Main', { screen: 'Home' });
      },
    });
  }, []);

  const handlePasswordChange = useCallback(() => {
    navigation.navigate('PasswordChange');
  }, [navigation]);

  const handleDeleteAccount = useCallback(() => {
    setConfirmModal({
      title: '회원 탈퇴',
      message: '탈퇴하면 모든 데이터가 삭제되며\n복구할 수 없습니다. 정말 탈퇴하시겠습니까?',
      onConfirm: async () => {
        await Promise.all([
          removeUser(),
          endSession(),
          AsyncStorage.removeItem('riv_recent_books'),
          AsyncStorage.removeItem('riv_purchased_books'),
          AsyncStorage.removeItem('riv_cash'),
          AsyncStorage.removeItem('riv_cards'),
        ]);
        setUser(null);
        setRecentBooks([]);
        setPurchasedBooks([]);
        setCashState(0);
        setCards([]);
        navigation.navigate('Main', { screen: 'Home' });
      },
    });
  }, []);

  const handleBookPress = useCallback(async (book: Book) => {
    await addRecentBook(book);
    navigation.navigate('BookDetail', { book });
  }, [navigation]);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleAddCard = useCallback(async () => {
    if (!cardNickname.trim()) { Alert.alert('알림', '카드 별칭을 입력해주세요.'); return; }
    if (cardNumber.replace(/\s/g, '').length < 16) { Alert.alert('알림', '카드 번호 16자리를 입력해주세요.'); return; }
    if (cardExpiry.length < 5) { Alert.alert('알림', '유효기간을 입력해주세요.'); return; }

    const newCard: PaymentCard = {
      id: Date.now().toString(),
      nickname: cardNickname.trim(),
      number: cardNumber.replace(/\s/g, '').slice(-4),
      expiry: cardExpiry,
    };
    await addCard(newCard);
    setCards(prev => [...prev, newCard]);
    closeCardModal();
    setCardNickname('');
    setCardNumber('');
    setCardExpiry('');
  }, [cardNickname, cardNumber, cardExpiry, closeCardModal]);

  const chargeAmount = selectedPreset ?? (parseInt(customAmount.replace(/,/g, ''), 10) || 0);

  const handleCharge = useCallback(() => {
    if (chargeAmount <= 0) { Alert.alert('알림', '충전할 금액을 선택하거나 입력해주세요.'); return; }
    if (cards.length === 0) { showToast(); return; }
    closeChargeModal();
    setSelectedPreset(null);
    setCustomAmount('');
    navigation.navigate('CashPayment', { amount: chargeAmount });
  }, [chargeAmount, cards, closeChargeModal, navigation]);

  const handleRemoveCard = useCallback((id: string) => {
    setConfirmModal({
      title: '카드 삭제',
      message: '이 카드를 삭제하시겠습니까?',
      onConfirm: async () => {
        await removeCard(id);
        setCards(prev => prev.filter(c => c.id !== id));
      },
    });
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    pageHeader: {
      flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    pageHeaderTitle: { fontSize: 17, fontWeight: '800', color: Colors.textSecondary },
    cartIconBtn: { padding: 4, position: 'relative' },
    cartBadgeWrap: { position: 'relative' },
    cartBadge: {
      position: 'absolute', top: -4, right: -6,
      minWidth: 16, height: 16, borderRadius: 8,
      backgroundColor: Colors.error, justifyContent: 'center', alignItems: 'center',
      paddingHorizontal: 3,
    },
    cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

    profileSection: {
      backgroundColor: Colors.card, margin: 16, marginBottom: 24, borderRadius: 14,
      padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    profileInfo: { flexDirection: 'row', alignItems: 'center' },
    profileAvatar: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    profileAvatarText: { color: Colors.white, fontSize: 22, fontWeight: '700' },
    profileAvatarImage: { width: 52, height: 52, borderRadius: 26 },
    profileName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
    profileEmail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    genreSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
    genreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    genreTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
    genreEditBtn: { fontSize: 13, fontWeight: '600', color: Colors.primary },
    genreTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    genreTag: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
      backgroundColor: Colors.background,
    },
    genreTagActive: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20, backgroundColor: Colors.primary,
    },
    genreTagText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
    genreTagTextActive: { fontSize: 13, color: Colors.white, fontWeight: '700' },
    genreEmpty: { fontSize: 13, color: Colors.textHint, fontStyle: 'italic' },
    logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
    logoutBtnText: { fontSize: 13, color: Colors.textSecondary },
    loginTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
    loginInput: {
      height: 44, borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
      paddingHorizontal: 12, fontSize: 14, color: Colors.textPrimary,
      marginBottom: 10, backgroundColor: Colors.background,
    },
    loginBtnRow: { flexDirection: 'row', gap: 10 },
    loginBtn: {
      flex: 1, height: 44, backgroundColor: Colors.primary,
      borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    },
    loginBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
    loginPrompt: { alignItems: 'center', paddingVertical: 8 },
    loginPromptText: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
    loginStartBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 10, borderRadius: 10 },
    loginStartBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },

    settingsBox: {
      backgroundColor: Colors.card, borderRadius: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
      overflow: 'hidden',
    },
    settingsRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
    },
    settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingsLabel: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
    settingsDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },

    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
    sectionCount: { fontSize: 13, color: Colors.textSecondary },
    emptyText: { fontSize: 13, color: Colors.textHint, marginBottom: 16 },

    cashBox: {
      backgroundColor: Colors.card, borderRadius: 14, padding: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    cashLeft: { flexDirection: 'row', alignItems: 'center' },
    cashLabel: { fontSize: 12, color: Colors.textSecondary },
    cashAmount: { fontSize: 22, fontWeight: '800', color: Colors.primary, marginTop: 2 },
    chargeBtn: {
      backgroundColor: Colors.primaryLight, paddingHorizontal: 16,
      paddingVertical: 8, borderRadius: 20,
    },
    chargeBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },

    cardItem: {
      width: 200, height: 120, borderRadius: 16, padding: 18,
      marginRight: 12, justifyContent: 'space-between',
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
    },
    cardNickname: { color: '#fff', fontSize: 14, fontWeight: '700' },
    cardNumber: { color: 'rgba(255,255,255,0.85)', fontSize: 13, letterSpacing: 1 },
    cardExpiry: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
    cardAdd: {
      width: 200, height: 120, borderRadius: 16,
      backgroundColor: Colors.background,
      borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    cardHint: { fontSize: 11, color: Colors.textHint, marginTop: 8 },

    confirmBackdrop: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center', alignItems: 'center', padding: 32,
    },
    confirmBox: {
      backgroundColor: Colors.card, borderRadius: 20, padding: 24,
      width: '100%', maxWidth: 340,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    },
    confirmTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
    confirmMessage: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 24 },
    confirmBtnRow: { flexDirection: 'row', gap: 10 },
    confirmBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    presetGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    },
    presetBtn: {
      width: '30%', paddingVertical: 12, borderRadius: 10,
      borderWidth: 1.5, borderColor: Colors.border,
      alignItems: 'center', backgroundColor: Colors.background,
    },
    presetBtnActive: {
      borderColor: Colors.primary, backgroundColor: Colors.primaryLight,
    },
    presetText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
    presetTextActive: { color: Colors.primary },
    customInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    customUnit: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
    chargeSummary: {
      marginTop: 14, padding: 12, backgroundColor: Colors.primaryLight,
      borderRadius: 10, alignItems: 'center',
    },
    chargeSummaryText: { fontSize: 14, color: Colors.textSecondary },
    chargeSummaryAmount: { fontWeight: '800', color: Colors.primary, fontSize: 16 },

    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContainer: {
      flex: 1, justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 36,
    },
    modalHandle: {
      width: 40, height: 4, backgroundColor: Colors.border,
      borderRadius: 2, alignSelf: 'center', marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
    modalInput: {
      height: 48, borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
      paddingHorizontal: 14, fontSize: 15, color: Colors.textPrimary,
      marginBottom: 16, backgroundColor: Colors.background,
    },
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },

    cartItem: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
      gap: 12,
    },
    cartItemLast: { borderBottomWidth: 0 },
    cartThumb: { width: 44, height: 62, borderRadius: 6, backgroundColor: Colors.border },
    cartItemInfo: { flex: 1 },
    cartItemTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, lineHeight: 20 },
    cartItemAuthor: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    cartItemPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 4 },
    cartDeleteBtn: { padding: 6 },
    cartFooter: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 16, paddingTop: 14, borderTopWidth: 1.5, borderTopColor: Colors.border,
    },
    cartTotal: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
    cartTotalAmount: { color: Colors.primary },
    cartBuyBtn: {
      backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10,
      borderRadius: 10,
    },
    cartBuyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
    cartEmpty: { fontSize: 13, color: Colors.textHint, paddingVertical: 8 },

    toast: {
      position: 'absolute', top: 16, alignSelf: 'center',
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: '#1A1A2E', borderRadius: 24,
      paddingHorizontal: 18, paddingVertical: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
      zIndex: 999,
    },
    toastText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    modalBtn: {
      flex: 1, height: 50, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center',
    },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 페이지 헤더 */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageHeaderTitle}>마이페이지</Text>
        <TouchableOpacity style={styles.cartBadgeWrap} onPress={() => navigation.navigate('Cart')} activeOpacity={0.7}>
          <Ionicons name="cart-outline" size={26} color={Colors.textPrimary} />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>

        {/* 프로필 */}
        <View style={styles.profileSection}>
          {user ? (
            <>
            <View style={styles.profileInfo}>
              <View style={styles.profileAvatar}>
                {user.avatarUri ? (
                  <Image source={{ uri: user.avatarUri }} style={styles.profileAvatarImage} />
                ) : (
                  <Text style={styles.profileAvatarText}>{user.name.charAt(0)}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user.name}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                <Text style={styles.logoutBtnText}>로그아웃</Text>
              </TouchableOpacity>
            </View>
            {/* 장르 태그 */}
            <View style={styles.genreSection}>
              <View style={styles.genreHeader}>
                <Text style={styles.genreTitle}>선호 장르</Text>
                <TouchableOpacity onPress={() => setEditingGenres(e => !e)}>
                  <Text style={styles.genreEditBtn}>{editingGenres ? '완료' : '편집'}</Text>
                </TouchableOpacity>
              </View>

              {editingGenres ? (
                <View style={styles.genreTagsWrap}>
                  {GENRES.map(g => {
                    const active = user.favoriteGenres.includes(g.label);
                    return (
                      <TouchableOpacity
                        key={g.id}
                        style={[styles.genreTag, active && styles.genreTagActive]}
                        onPress={() => handleToggleGenre(g.label)}
                      >
                        {active && <Ionicons name="checkmark" size={12} color={Colors.white} style={{ marginRight: 3 }} />}
                        <Text style={[styles.genreTagText, active && styles.genreTagTextActive]}>
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.genreTagsWrap}>
                  {user.favoriteGenres.length === 0 ? (
                    <TouchableOpacity onPress={() => setEditingGenres(true)}>
                      <Text style={styles.genreEmpty}>+ 선호 장르를 추가해보세요</Text>
                    </TouchableOpacity>
                  ) : (
                    user.favoriteGenres.map(g => (
                      <View key={g} style={styles.genreTagActive}>
                        <Text style={styles.genreTagTextActive}>{g}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
            </>
          ) : (
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>로그인하고 독서 기록을 관리하세요</Text>
              <TouchableOpacity style={styles.loginStartBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginStartBtnText}>로그인</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 보유 캐시 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>보유 캐시</Text>
          <View style={styles.cashBox}>
            <View style={styles.cashLeft}>
              <Ionicons name="wallet-outline" size={28} color={Colors.primary} />
              <View style={{ marginLeft: 14 }}>
                <Text style={styles.cashLabel}>사용 가능 캐시</Text>
                <Text style={styles.cashAmount}>{cash.toLocaleString()} C</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.chargeBtn} onPress={openChargeModal}>
              <Text style={styles.chargeBtnText}>충전</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 결제 카드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 카드</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {cards.map((card, index) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.cardItem, { backgroundColor: CARD_COLORS[index % CARD_COLORS.length] }]}
                onLongPress={() => handleRemoveCard(card.id)}
              >
                <Text style={styles.cardNickname}>{card.nickname}</Text>
                <Text style={styles.cardNumber}>**** **** **** {card.number}</Text>
                <Text style={styles.cardExpiry}>{card.expiry}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cardAdd} onPress={openCardModal}>
              <Ionicons name="add" size={36} color={Colors.textHint} />
            </TouchableOpacity>
          </ScrollView>
          <Text style={styles.cardHint}>카드를 길게 누르면 삭제됩니다</Text>
        </View>

        {/* 최근 본 책 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 본 책</Text>
            <Text style={styles.sectionCount}>{recentBooks.length}권</Text>
          </View>
          {recentBooks.length === 0 ? (
            <Text style={styles.emptyText}>아직 본 책이 없어요.</Text>
          ) : (
            <FlatList
              data={recentBooks.slice(0, 10)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.isbn + item.title + 'recent'}
              renderItem={({ item }) => <BookCard book={item} onPress={handleBookPress} />}
            />
          )}
        </View>

        {/* 구매한 책 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>구매한 책</Text>
            <Text style={styles.sectionCount}>{purchasedBooks.length}권</Text>
          </View>
          {purchasedBooks.length === 0 ? (
            <Text style={styles.emptyText}>구매한 책이 없어요.</Text>
          ) : (
            purchasedBooks.map(book => (
              <BookCard key={book.isbn + book.title + 'purchased'} book={book} onPress={handleBookPress} horizontal />
            ))
          )}
        </View>

        {/* 기타 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기타</Text>
          <View style={styles.settingsBox}>
            <TouchableOpacity style={styles.settingsRow} onPress={() => navigation.navigate('ProfileEdit')} activeOpacity={0.7}>
              <View style={styles.settingsLeft}>
                <Ionicons name="person-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.settingsLabel}>프로필 설정</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <View style={styles.settingsRow}>
              <View style={styles.settingsLeft}>
                <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={Colors.textPrimary} />
                <Text style={styles.settingsLabel}>{isDark ? '화이트 모드' : '블랙 모드'}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleDark}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingsDivider} />

            <TouchableOpacity style={styles.settingsRow} onPress={handlePasswordChange} activeOpacity={0.7}>
              <View style={styles.settingsLeft}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.settingsLabel}>비밀번호 변경</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <TouchableOpacity style={styles.settingsRow} onPress={handleLogout} activeOpacity={0.7}>
              <View style={styles.settingsLeft}>
                <Ionicons name="log-out-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.settingsLabel}>로그아웃</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <TouchableOpacity style={styles.settingsRow} onPress={handleDeleteAccount} activeOpacity={0.7}>
              <View style={styles.settingsLeft}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
                <Text style={[styles.settingsLabel, { color: Colors.error }]}>회원 탈퇴</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textHint} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* 확인 모달 */}
      <Modal visible={!!confirmModal} transparent animationType="fade">
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>{confirmModal?.title}</Text>
            <Text style={styles.confirmMessage}>{confirmModal?.message}</Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: Colors.border }]}
                onPress={() => setConfirmModal(null)}
              >
                <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: Colors.error }]}
                onPress={() => { confirmModal?.onConfirm(); setConfirmModal(null); }}
              >
                <Text style={{ color: Colors.white, fontWeight: '700' }}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 충전 모달 */}
      <Modal visible={chargeModalVisible} transparent animationType="none">
        <Animated.View style={[styles.modalBackdrop, { opacity: chargeBackdrop }]} />
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: chargeSheet }] }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>캐시 충전</Text>

            <Text style={styles.inputLabel}>충전 금액 선택</Text>
            <View style={styles.presetGrid}>
              {CHARGE_PRESETS.map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.presetBtn, selectedPreset === amount && styles.presetBtnActive]}
                  onPress={() => { setSelectedPreset(amount); setCustomAmount(''); }}
                >
                  <Text style={[styles.presetText, selectedPreset === amount && styles.presetTextActive]}>
                    {amount.toLocaleString()}C
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>직접 입력</Text>
            <View style={styles.customInputRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                placeholder="금액 입력"
                placeholderTextColor={Colors.textHint}
                value={customAmount}
                onChangeText={v => {
                  setCustomAmount(v.replace(/[^0-9]/g, ''));
                  setSelectedPreset(null);
                }}
                keyboardType="numeric"
              />
              <Text style={styles.customUnit}>C</Text>
            </View>

            {chargeAmount > 0 && (
              <View style={styles.chargeSummary}>
                <Text style={styles.chargeSummaryText}>
                  충전 후 잔액: <Text style={styles.chargeSummaryAmount}>{(cash + chargeAmount).toLocaleString()}C</Text>
                </Text>
              </View>
            )}

            <View style={[styles.modalBtnRow, { marginTop: 20 }]}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.border }]}
                onPress={() => { closeChargeModal(); setSelectedPreset(null); setCustomAmount(''); }}
              >
                <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.primary }]} onPress={handleCharge}>
                <Text style={{ color: Colors.white, fontWeight: '700' }}>충전하기</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 카드 등록 모달 */}
      <Modal visible={cardModalVisible} transparent animationType="none">
        <Animated.View style={[styles.modalBackdrop, { opacity: cardBackdrop }]} />
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: cardSheet }] }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>카드 등록</Text>

            <Text style={styles.inputLabel}>카드 별칭</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="예: 신한카드, 내 체크카드"
              placeholderTextColor={Colors.textHint}
              value={cardNickname}
              onChangeText={setCardNickname}
            />

            <Text style={styles.inputLabel}>카드 번호</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={Colors.textHint}
              value={cardNumber}
              onChangeText={v => setCardNumber(formatCardNumber(v))}
              keyboardType="numeric"
              maxLength={19}
            />

            <Text style={styles.inputLabel}>유효기간</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="MM/YY"
              placeholderTextColor={Colors.textHint}
              value={cardExpiry}
              onChangeText={v => setCardExpiry(formatExpiry(v))}
              keyboardType="numeric"
              maxLength={5}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.border }]}
                onPress={() => {
                  closeCardModal();
                  setCardNickname(''); setCardNumber(''); setCardExpiry('');
                }}
              >
                <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.primary }]} onPress={handleAddCard}>
                <Text style={{ color: Colors.white, fontWeight: '700' }}>등록</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 카드 미등록 토스트 — 항상 최상단 레이어 */}
      <Modal visible={toastVisible} transparent animationType="none" statusBarTranslucent>
        <Animated.View style={[styles.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        }]} pointerEvents="none">
          <Ionicons name="warning-outline" size={16} color="#fff" />
          <Text style={styles.toastText}>결제할 카드가 등록되지 않았습니다.</Text>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}
