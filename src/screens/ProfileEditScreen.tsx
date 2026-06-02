import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Image, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '../contexts/ThemeContext';
import { getUser, saveUser } from '../services/storage';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileEditScreen() {
  const navigation = useNavigation<Nav>();
  const Colors = useColors();
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [initialLetter, setInitialLetter] = useState('');

  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (user) {
        setName(user.name);
        setInitialLetter(user.name.charAt(0));
        if (user.avatarUri) setAvatarUri(user.avatarUri);
      }
    })();
  }, []);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }
    const user = await getUser();
    if (!user) return;
    const updated = {
      ...user,
      name: name.trim(),
      avatarUri: avatarUri ?? user.avatarUri,
    };
    await saveUser(updated);
    navigation.goBack();
  }, [name, avatarUri, navigation]);

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

    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatarWrapper: { position: 'relative', width: 110, height: 110 },
    avatarImage: {
      width: 110, height: 110, borderRadius: 55,
      borderWidth: 3, borderColor: Colors.primary,
    },
    avatarFallback: {
      width: 110, height: 110, borderRadius: 55,
      backgroundColor: Colors.primary,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarLetter: { fontSize: 44, fontWeight: '800', color: Colors.white },
    cameraOverlay: {
      position: 'absolute', bottom: 0, right: 0,
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: Colors.textSecondary,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: Colors.white,
    },
    avatarHint: { marginTop: 10, fontSize: 13, color: Colors.textHint },

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
      backgroundColor: Colors.background, marginBottom: 24,
    },
    saveBtn: {
      height: 52, backgroundColor: Colors.primary, borderRadius: 14,
      justifyContent: 'center', alignItems: 'center',
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

          <Text style={styles.pageTitle}>프로필 편집</Text>

          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} activeOpacity={0.8}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>{initialLetter}</Text>
                </View>
              )}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={20} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>탭하여 사진 변경</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="이름을 입력해주세요"
              placeholderTextColor={Colors.textHint}
              value={name}
              onChangeText={v => { setName(v); setInitialLetter(v.charAt(0)); }}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>저장</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
