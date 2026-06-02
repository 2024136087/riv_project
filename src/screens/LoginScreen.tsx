import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { getUser, startSession } from '../services/storage';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const Colors = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = useCallback(async () => {
    setEmailError('');
    setPasswordError('');

    if (!email.trim() || !password.trim()) {
      if (!email.trim()) setEmailError('이메일을 입력해주세요.');
      if (!password.trim()) setPasswordError('비밀번호를 입력해주세요.');
      return;
    }
    const user = await getUser();
    if (!user || user.email.toLowerCase() !== email.trim().toLowerCase()) {
      setEmailError('등록된 이메일을 찾을 수 없습니다.');
      return;
    }
    if (user.password && user.password !== password) {
      setPasswordError('비밀번호가 올바르지 않습니다.');
      return;
    }
    await startSession();
    navigation.navigate('Main');
  }, [email, password, navigation]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flexGrow: 1, paddingBottom: 40 },

    backBtn: {
      margin: 16,
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: Colors.card,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },

    heroSection: {
      alignItems: 'center',
      paddingVertical: 32, paddingHorizontal: 24,
    },
    iconCircle: {
      width: 96, height: 96, borderRadius: 48,
      backgroundColor: Colors.primaryLight,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 20,
    },
    heroTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
    heroSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

    formCard: {
      marginHorizontal: 20,
      backgroundColor: Colors.card, borderRadius: 20, padding: 24,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
    input: {
      height: 50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
      paddingHorizontal: 14, fontSize: 15, color: Colors.textPrimary,
      backgroundColor: Colors.background, marginBottom: 18,
    },
    inputError: { borderColor: Colors.error, marginBottom: 4 },
    passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    eyeBtn: { position: 'absolute', right: 14 },
    errorText: { fontSize: 12, color: Colors.error, marginTop: 4, marginBottom: 10 },

    loginBtn: {
      height: 52, backgroundColor: Colors.primary, borderRadius: 14,
      justifyContent: 'center', alignItems: 'center',
      marginTop: 4,
      shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    divider: { flex: 1, height: 1, backgroundColor: Colors.border },
    dividerText: { marginHorizontal: 12, fontSize: 13, color: Colors.textHint },

    signupBtn: {
      height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary,
      justifyContent: 'center', alignItems: 'center',
    },
    signupBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} enabled={Platform.OS !== 'web'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <Ionicons name="book-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>다시 만나요!</Text>
            <Text style={styles.heroSubtitle}>로그인하고 나만의 독서 기록을{'\n'}이어가세요.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>이메일</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="이메일을 입력해주세요"
              placeholderTextColor={Colors.textHint}
              value={email}
              onChangeText={v => { setEmail(v); setEmailError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>비밀번호</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 },
                  passwordError ? { borderColor: Colors.error } : null,
                ]}
                placeholder="비밀번호를 입력해주세요"
                placeholderTextColor={Colors.textHint}
                value={password}
                onChangeText={v => { setPassword(v); setPasswordError(''); }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textHint} />
              </TouchableOpacity>
            </View>
            {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
              <Text style={styles.loginBtnText}>로그인</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.signupBtn} onPress={() => navigation.navigate('SignUp')} activeOpacity={0.85}>
              <Text style={styles.signupBtnText}>회원가입</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
