import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { saveUser, getUser, startSession } from '../services/storage';
import { User } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SignUpScreen() {
  const navigation = useNavigation<Nav>();
  const Colors = useColors();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const submittingRef = React.useRef(false);

  const handleSignUp = useCallback(async () => {
    if (submittingRef.current) return;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setGeneralError('모든 항목을 입력해주세요.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    submittingRef.current = true;
    try {
      const existingUser = await getUser();
      if (existingUser?.email?.toLowerCase() === email.trim().toLowerCase()) {
        setEmailError('이미 가입된 이메일입니다.');
        return;
      }
      const newUser: User = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.trim(),
        favoriteGenres: [],
        password,
      };
      await saveUser(newUser);
      await startSession();
      navigation.navigate('GenreSelect');
    } finally {
      submittingRef.current = false;
    }
  }, [name, email, password, confirmPassword, navigation]);

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
      paddingVertical: 28, paddingHorizontal: 24,
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
    passwordRow: { flexDirection: 'row', alignItems: 'center' },
    eyeBtn: { position: 'absolute', right: 14 },
    errorText: { fontSize: 12, color: Colors.error, marginTop: 6, marginBottom: 4 },
    generalErrorBox: {
      backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginTop: 8, marginBottom: 4,
      borderWidth: 1, borderColor: '#FECACA',
    },
    generalErrorText: { fontSize: 13, color: Colors.error, textAlign: 'center' },

    signupBtn: {
      height: 52, backgroundColor: Colors.primary, borderRadius: 14,
      justifyContent: 'center', alignItems: 'center',
      marginTop: 22,
      shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    signupBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

    loginLinkBtn: {
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
      marginTop: 16, paddingVertical: 8,
    },
    loginLinkText: { fontSize: 14, color: Colors.textSecondary },
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
              <Ionicons name="person-add-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>회원가입</Text>
            <Text style={styles.heroSubtitle}>riv와 함께 독서 여정을{'\n'}시작해보세요.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="이름을 입력해주세요"
              placeholderTextColor={Colors.textHint}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />

            <Text style={styles.inputLabel}>이메일</Text>
            <TextInput
              style={[styles.input, emailError ? { borderColor: Colors.error, marginBottom: 4 } : null]}
              placeholder="이메일을 입력해주세요"
              placeholderTextColor={Colors.textHint}
              value={email}
              onChangeText={v => { setEmail(v); setEmailError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}

            <Text style={styles.inputLabel}>비밀번호</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 },
                  passwordError ? { borderColor: Colors.error } : null,
                ]}
                placeholder="6자 이상 입력해주세요"
                placeholderTextColor={Colors.textHint}
                value={password}
                onChangeText={v => { setPassword(v); setPasswordError(''); }}
                secureTextEntry={!showPassword}
                returnKeyType="next"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textHint} />
              </TouchableOpacity>
            </View>
            {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

            <Text style={[styles.inputLabel, { marginTop: 18 }]}>비밀번호 확인</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 },
                  confirmPassword.length > 0
                    ? { borderColor: confirmPassword === password ? Colors.primary : Colors.error }
                    : null,
                ]}
                placeholder="비밀번호를 다시 입력해주세요"
                placeholderTextColor={Colors.textHint}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textHint} />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && confirmPassword !== password && (
              <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
            )}

            {!!generalError && (
              <View style={styles.generalErrorBox}>
                <Text style={styles.generalErrorText}>{generalError}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.signupBtn} onPress={handleSignUp} activeOpacity={0.85}>
              <Text style={styles.signupBtnText}>회원가입</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLinkBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={styles.loginLinkText}>이미 계정이 있으신가요? </Text>
              <Text style={[styles.loginLinkText, { color: Colors.primary, fontWeight: '700' }]}>로그인</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
