import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { getUser, saveUser } from '../services/storage';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PasswordChangeScreen() {
  const navigation = useNavigation<Nav>();
  const Colors = useColors();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentError, setCurrentError] = useState('');
  const [nextError, setNextError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = useCallback(async () => {
    setCurrentError('');
    setNextError('');
    setSuccessMsg('');

    if (!current || !next || !confirm) {
      if (!current) setCurrentError('현재 비밀번호를 입력해주세요.');
      if (!next) setNextError('새 비밀번호를 입력해주세요.');
      return;
    }

    const user = await getUser();
    if (!user) return;

    if (user.password && user.password !== current) {
      setCurrentError('현재 비밀번호가 올바르지 않습니다.');
      return;
    }
    if (next.length < 6) {
      setNextError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (next !== confirm) {
      setNextError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (next === current) {
      setNextError('현재 비밀번호와 동일합니다.');
      return;
    }

    await saveUser({ ...user, password: next });
    setSuccessMsg('비밀번호가 변경되었습니다.');
    setCurrent('');
    setNext('');
    setConfirm('');
    setTimeout(() => navigation.goBack(), 1200);
  }, [current, next, confirm, navigation]);

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
    pageTitle: {
      fontSize: 22, fontWeight: '800', color: Colors.textPrimary,
      paddingHorizontal: 20, marginBottom: 32,
    },

    formCard: {
      marginHorizontal: 20,
      backgroundColor: Colors.card, borderRadius: 20, padding: 24,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    input: {
      flex: 1,
      height: 50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
      paddingHorizontal: 14, paddingRight: 44,
      fontSize: 15, color: Colors.textPrimary,
      backgroundColor: Colors.background,
    },
    inputError: { borderColor: Colors.error },
    eyeBtn: { position: 'absolute', right: 14 },
    errorText: { fontSize: 12, color: Colors.error, marginBottom: 16 },
    spacer: { height: 16 },

    successBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: Colors.success + '18',
      borderRadius: 10, padding: 12, marginBottom: 16,
      borderWidth: 1, borderColor: Colors.success + '40',
    },
    successText: { fontSize: 13, color: Colors.success, fontWeight: '600' },

    saveBtn: {
      height: 52, backgroundColor: Colors.primary, borderRadius: 14,
      justifyContent: 'center', alignItems: 'center',
      marginTop: 8,
      shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    saveBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        enabled={Platform.OS !== 'web'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.pageTitle}>비밀번호 변경</Text>

          <View style={styles.formCard}>

            {/* 현재 비밀번호 */}
            <Text style={styles.inputLabel}>현재 비밀번호</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, currentError ? styles.inputError : null]}
                placeholder="현재 비밀번호를 입력해주세요"
                placeholderTextColor={Colors.textHint}
                value={current}
                onChangeText={v => { setCurrent(v); setCurrentError(''); }}
                secureTextEntry={!showCurrent}
                returnKeyType="next"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(v => !v)}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textHint} />
              </TouchableOpacity>
            </View>
            {currentError ? (
              <Text style={styles.errorText}>{currentError}</Text>
            ) : (
              <View style={styles.spacer} />
            )}

            {/* 새 비밀번호 */}
            <Text style={styles.inputLabel}>새 비밀번호</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, nextError ? styles.inputError : null]}
                placeholder="6자 이상 입력해주세요"
                placeholderTextColor={Colors.textHint}
                value={next}
                onChangeText={v => { setNext(v); setNextError(''); }}
                secureTextEntry={!showNext}
                returnKeyType="next"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNext(v => !v)}>
                <Ionicons name={showNext ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textHint} />
              </TouchableOpacity>
            </View>
            {nextError ? (
              <Text style={styles.errorText}>{nextError}</Text>
            ) : (
              <View style={styles.spacer} />
            )}

            {/* 새 비밀번호 확인 */}
            <Text style={styles.inputLabel}>새 비밀번호 확인</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[
                  styles.input,
                  confirm.length > 0
                    ? { borderColor: confirm === next ? Colors.primary : Colors.error }
                    : null,
                ]}
                placeholder="새 비밀번호를 다시 입력해주세요"
                placeholderTextColor={Colors.textHint}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showConfirm}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textHint} />
              </TouchableOpacity>
            </View>
            <View style={styles.spacer} />

            {/* 성공 메시지 */}
            {!!successMsg && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>변경하기</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
