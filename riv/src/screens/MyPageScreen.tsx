import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, SafeAreaView, FlatList, Modal, KeyboardAvoidingView, Platform,
  Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import BookCard from '../components/BookCard';
import { ColorScheme } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { GENRES } from '../constants/genres';
import {
  getUser, saveUser, removeUser,
  getRecentBooks, getPurchasedBooks, addRecentBook,
  getCash, setCash, getCards, addCard, removeCard,
} from '../services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, User, PaymentCard } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CARD_COLORS = ['#4F6EF7', '#2EC4B6', '#E63946', '#F4A261', '#6A0572'];
const CHARGE_PRESETS = [1000, 3000, 5000, 10000, 30000, 50000];

const toggleStyles = StyleSheet.create({
  track: {
    width: 56,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [isDark, anim]);

  const thumbX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 29],
  });

  const trackBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#6B8AFF'],
  });

  return (
    <TouchableOpacity onPress={toggleTheme} activeOpacity={0.9}>
      <Animated.View style={[toggleStyles.track, { backgroundColor: trackBg }]}>
        <Animated.View style={[toggleStyles.thumb, { transform: [{ translateX: thumbX }] }]}>
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={14}
            color={isDark ? '#6B8AFF' : '#F59E0B'}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function makeStyles(C: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },

    profileSection: {
      backgroundColor: C.card, marginHorizontal: 20, marginTop: 20, marginBottom: 20,
      borderRadius: 14, padding: 18,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    profileInfo: { flexDirection: 'row', alignItems: 'center' },
    profileAvatar: {
      width: 50, height: 50, borderRadius: 25,
      backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    profileAvatarText: { color: C.primary, fontSize: 20, fontWeight: '700' },
    profileName: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
    profileEmail: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
    genreSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border },
    genreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    genreTitle: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
    genreEditBtn: { fontSize: 13, fontWeight: '600', color: C.primary },
    genreTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    genreTag: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20, borderWidth: 1, borderColor: C.border,
      backgroundColor: C.background,
    },
    genreTagActive: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 20, backgroundColor: C.primary,
    },
    genreTagText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
    genreTagTextActive: { fontSize: 13, color: C.white, fontWeight: '600' },
    genreEmpty: { fontSize: 13, color: C.textHint, fontStyle: 'italic' },
    logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border },
    logoutBtnText: { fontSize: 13, color: C.textSecondary },
    loginTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 14 },
    loginInput: {
      height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 10,
      paddingHorizontal: 14, fontSize: 14, color: C.textPrimary,
      marginBottom: 10, backgroundColor: C.background,
    },
    loginBtnRow: { flexDirection: 'row', gap: 10 },
    loginBtn: {
      flex: 1, height: 46, backgroundColor: C.primary,
      borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    },
    loginBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },
    loginPrompt: { alignItems: 'center', paddingVertical: 8 },
    loginPromptText: { fontSize: 14, color: C.textSecondary, marginBottom: 14 },
    loginStartBtn: { backgroundColor: C.primary, paddingHorizontal: 32, paddingVertical: 11, borderRadius: 12 },
    loginStartBtnText: { color: C.white, fontWeight: '700', fontSize: 15 },

    settingsBox: {
      backgroundColor: C.card, borderRadius: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
      overflow: 'hidden',
    },
    settingsRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 15,
    },
    settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingsLabel: { fontSize: 15, color: C.textPrimary, fontWeight: '500' },
    settingsDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 14 },
    sectionCount: { fontSize: 13, color: C.textSecondary },
    emptyText: { fontSize: 13, color: C.textHint, marginBottom: 16 },

    cashBox: {
      backgroundColor: C.card, borderRadius: 14, padding: 18,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    cashLeft: { flexDirection: 'row', alignItems: 'center' },
    cashLabel: { fontSize: 12, color: C.textSecondary },
    cashAmount: { fontSize: 22, fontWeight: '800', color: C.primary, marginTop: 2 },
    chargeBtn: {
      backgroundColor: C.primaryLight, paddingHorizontal: 16,
      paddingVertical: 8, borderRadius: 20,
    },
    chargeBtnText: { color: C.primary, fontWeight: '700', fontSize: 14 },

    cardItem: {
      width: 200, height: 118, borderRadius: 14, padding: 16,
      marginRight: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
    },
    cardTop: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    cardDeleteBtn: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center', alignItems: 'center',
    },
    cardNickname: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
    cardNumber: { color: 'rgba(255,255,255,0.85)', fontSize: 13, letterSpacing: 1, marginTop: 16 },
    cardExpiry: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
    cardConfirmRow: {
      flexDirection: 'row', gap: 6, marginTop: 10,
    },
    cardConfirmBtn: {
      flex: 1, paddingVertical: 6, borderRadius: 8,
      backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center',
    },
    cardConfirmDeleteBtn: {
      flex: 1, paddingVertical: 6, borderRadius: 8,
      backgroundColor: 'rgba(220,50,50,0.85)', alignItems: 'center',
    },
    cardConfirmText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    cardAdd: {
      width: 200, height: 118, borderRadius: 14,
      backgroundColor: C.background,
      borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed',
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    cardHint: { fontSize: 11, color: C.textHint, marginTop: 8 },

    presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    presetBtn: {
      width: '30%', paddingVertical: 12, borderRadius: 10,
      borderWidth: 1, borderColor: C.border,
      alignItems: 'center', backgroundColor: C.background,
    },
    presetBtnActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
    presetText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
    presetTextActive: { color: C.primary },
    customInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    customUnit: { fontSize: 16, fontWeight: '700', color: C.textSecondary },
    chargeSummary: {
      marginTop: 14, padding: 14, backgroundColor: C.primaryLight,
      borderRadius: 12, alignItems: 'center',
    },
    chargeSummaryText: { fontSize: 14, color: C.textSecondary },
    chargeSummaryAmount: { fontWeight: '800', color: C.primary, fontSize: 16 },

    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContainer: { flex: 1, justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 36,
    },
    modalHandle: {
      width: 40, height: 4, backgroundColor: C.border,
      borderRadius: 2, alignSelf: 'center', marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginBottom: 6 },
    modalInput: {
      height: 46, borderWidth: 1, borderColor: C.border, borderRadius: 10,
      paddingHorizontal: 14, fontSize: 15, color: C.textPrimary,
      marginBottom: 16, backgroundColor: C.background,
    },
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    modalBtn: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  });
}

export default function MyPageScreen() {
  const navigation = useNavigation<Nav>();
  const { colors: C, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(C);

  const [user, setUser] = useState<User | null>(null);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [purchasedBooks, setPurchasedBooks] = useState<Book[]>([]);
  const [cash, setCashState] = useState(0);
  const [cards, setCards] = useState<PaymentCard[]>([]);

  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [editingGenres, setEditingGenres] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [chargeModalVisible, setChargeModalVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [cardNickname, setCardNickname] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');

  const chargeBackdrop = useRef(new Animated.Value(0)).current;
  const chargeSheet = useRef(new Animated.Value(500)).current;
  const cardBackdrop = useRef(new Animated.Value(0)).current;
  const cardSheet = useRef(new Animated.Value(500)).current;

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
        const [u, rb, pb, c, cds] = await Promise.all([
          getUser(), getRecentBooks(), getPurchasedBooks(), getCash(), getCards(),
        ]);
        setUser(u);
        setRecentBooks(rb);
        setPurchasedBooks(pb);
        setCashState(c);
        setCards(cds);
      })();
    }, [])
  );

  const handleLogin = useCallback(async () => {
    if (!loginName.trim() || !loginEmail.trim()) {
      Alert.alert('알림', '이름과 이메일을 입력해주세요.');
      return;
    }
    const newUser: User = {
      id: Date.now().toString(),
      name: loginName.trim(),
      email: loginEmail.trim(),
      favoriteGenres: [],
    };
    await saveUser(newUser);
    setUser(newUser);
    setShowLogin(false);
    setLoginName('');
    setLoginEmail('');
  }, [loginName, loginEmail]);

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

  const handleLogout = useCallback(async () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃', style: 'destructive',
        onPress: async () => { await removeUser(); setUser(null); },
      },
    ]);
  }, []);

  const handlePasswordChange = useCallback(() => {
    Alert.alert('비밀번호 변경', '비밀번호 변경 기능은 준비 중입니다.');
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert('회원 탈퇴', '탈퇴하면 모든 데이터가 삭제되며 복구할 수 없습니다.\n정말 탈퇴하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴', style: 'destructive',
        onPress: async () => {
          await Promise.all([
            removeUser(),
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
        },
      },
    ]);
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

  const handleCharge = useCallback(async () => {
    if (chargeAmount <= 0) { Alert.alert('알림', '충전할 금액을 선택하거나 입력해주세요.'); return; }
    if (cards.length === 0) { Alert.alert('알림', '먼저 결제 카드를 등록해주세요.'); return; }
    const newCash = cash + chargeAmount;
    await setCash(newCash);
    setCashState(newCash);
    closeChargeModal();
    setSelectedPreset(null);
    setCustomAmount('');
    Alert.alert('충전 완료', `${chargeAmount.toLocaleString()}C가 충전되었습니다.\n현재 잔액: ${newCash.toLocaleString()}C`);
  }, [chargeAmount, cash, cards, closeChargeModal]);

  const handleRemoveCard = useCallback(async (id: string) => {
    await removeCard(id);
    setCards(prev => prev.filter(c => c.id !== id));
    setDeletingCardId(null);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>

        {/* 프로필 */}
        <View style={styles.profileSection}>
          {user ? (
            <>
            <View style={styles.profileInfo}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{user.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user.name}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>로그아웃</Text>
              </TouchableOpacity>
            </View>
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
                        {active && <Ionicons name="checkmark" size={12} color={C.white} style={{ marginRight: 3 }} />}
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
          ) : showLogin ? (
            <View>
              <Text style={styles.loginTitle}>로그인</Text>
              <TextInput style={styles.loginInput} placeholder="이름" placeholderTextColor={C.textHint} value={loginName} onChangeText={setLoginName} />
              <TextInput style={styles.loginInput} placeholder="이메일" placeholderTextColor={C.textHint} value={loginEmail} onChangeText={setLoginEmail} keyboardType="email-address" autoCapitalize="none" />
              <View style={styles.loginBtnRow}>
                <TouchableOpacity style={[styles.loginBtn, { backgroundColor: C.border }]} onPress={() => setShowLogin(false)}>
                  <Text style={{ color: C.textSecondary, fontWeight: '600' }}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                  <Text style={styles.loginBtnText}>로그인</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>로그인하고 독서 기록을 관리하세요</Text>
              <TouchableOpacity style={styles.loginStartBtn} onPress={() => setShowLogin(true)}>
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
              <Ionicons name="wallet-outline" size={28} color={C.primary} />
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
            {cards.map((card, index) => {
              const isDeleting = deletingCardId === card.id;
              return (
                <View
                  key={card.id}
                  style={[styles.cardItem, { backgroundColor: CARD_COLORS[index % CARD_COLORS.length] }]}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardNickname} numberOfLines={1}>{card.nickname}</Text>
                    <TouchableOpacity
                      style={styles.cardDeleteBtn}
                      onPress={() => setDeletingCardId(isDeleting ? null : card.id)}
                    >
                      <Ionicons name={isDeleting ? 'close' : 'trash-outline'} size={13} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardNumber}>**** **** **** {card.number}</Text>
                  <Text style={styles.cardExpiry}>{card.expiry}</Text>
                  {isDeleting && (
                    <View style={styles.cardConfirmRow}>
                      <TouchableOpacity
                        style={styles.cardConfirmBtn}
                        onPress={() => setDeletingCardId(null)}
                      >
                        <Text style={styles.cardConfirmText}>취소</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cardConfirmDeleteBtn}
                        onPress={() => handleRemoveCard(card.id)}
                      >
                        <Text style={styles.cardConfirmText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
            <TouchableOpacity style={styles.cardAdd} onPress={openCardModal}>
              <Ionicons name="add" size={36} color={C.textHint} />
            </TouchableOpacity>
          </ScrollView>
          <Text style={styles.cardHint}>휴지통 아이콘을 눌러 카드를 삭제할 수 있습니다</Text>
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

        {/* 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>설정</Text>
          <View style={styles.settingsBox}>
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
              activeOpacity={0.7}
            >
              <View style={styles.settingsLeft}>
                <Ionicons name="person-outline" size={20} color={C.textPrimary} />
                <Text style={styles.settingsLabel}>프로필 설정</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textHint} />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <View style={styles.settingsRow}>
              <View style={styles.settingsLeft}>
                <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={C.textPrimary} />
                <Text style={styles.settingsLabel}>{isDark ? '화이트 모드로 전환' : '블랙 모드로 전환'}</Text>
              </View>
              <ThemeToggle />
            </View>
          </View>
        </View>

        {/* 기타 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기타</Text>
          <View style={styles.settingsBox}>
            <TouchableOpacity style={styles.settingsRow} onPress={handlePasswordChange} activeOpacity={0.7}>
              <View style={styles.settingsLeft}>
                <Ionicons name="lock-closed-outline" size={20} color={C.textPrimary} />
                <Text style={styles.settingsLabel}>비밀번호 변경</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textHint} />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <TouchableOpacity style={styles.settingsRow} onPress={handleLogout} activeOpacity={0.7}>
              <View style={styles.settingsLeft}>
                <Ionicons name="log-out-outline" size={20} color={C.textPrimary} />
                <Text style={styles.settingsLabel}>로그아웃</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textHint} />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <TouchableOpacity style={styles.settingsRow} onPress={handleDeleteAccount} activeOpacity={0.7}>
              <View style={styles.settingsLeft}>
                <Ionicons name="trash-outline" size={20} color={C.error} />
                <Text style={[styles.settingsLabel, { color: C.error }]}>회원 탈퇴</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textHint} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

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
                placeholderTextColor={C.textHint}
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
                style={[styles.modalBtn, { backgroundColor: C.border }]}
                onPress={() => { closeChargeModal(); setSelectedPreset(null); setCustomAmount(''); }}
              >
                <Text style={{ color: C.textSecondary, fontWeight: '600' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.primary }]} onPress={handleCharge}>
                <Text style={{ color: C.white, fontWeight: '700' }}>충전하기</Text>
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
              placeholderTextColor={C.textHint}
              value={cardNickname}
              onChangeText={setCardNickname}
            />

            <Text style={styles.inputLabel}>카드 번호</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={C.textHint}
              value={cardNumber}
              onChangeText={v => setCardNumber(formatCardNumber(v))}
              keyboardType="numeric"
              maxLength={19}
            />

            <Text style={styles.inputLabel}>유효기간</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="MM/YY"
              placeholderTextColor={C.textHint}
              value={cardExpiry}
              onChangeText={v => setCardExpiry(formatExpiry(v))}
              keyboardType="numeric"
              maxLength={5}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: C.border }]}
                onPress={() => {
                  closeCardModal();
                  setCardNickname(''); setCardNumber(''); setCardExpiry('');
                }}
              >
                <Text style={{ color: C.textSecondary, fontWeight: '600' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: C.primary }]} onPress={handleAddCard}>
                <Text style={{ color: C.white, fontWeight: '700' }}>등록</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
