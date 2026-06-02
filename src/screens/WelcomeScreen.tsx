import React, { useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const Colors = useColors();
  const { userName } = route.params;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

    iconWrap: { marginBottom: 36 },
    iconCircleOuter: {
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: Colors.primaryLight,
      justifyContent: 'center', alignItems: 'center',
    },
    iconCircleInner: {
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: Colors.primary,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
    },

    greeting: {
      fontSize: 26, fontWeight: '700', color: Colors.textSecondary,
      textAlign: 'center', marginBottom: 4,
    },
    name: {
      fontSize: 32, fontWeight: '800', color: Colors.textPrimary,
      textAlign: 'center', marginBottom: 16,
    },
    sub: {
      fontSize: 15, color: Colors.textSecondary,
      textAlign: 'center', lineHeight: 24, marginBottom: 36,
    },

    features: {
      width: '100%',
      backgroundColor: Colors.card, borderRadius: 20, padding: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
      gap: 16,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    featureIcon: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: Colors.primaryLight,
      justifyContent: 'center', alignItems: 'center',
    },
    featureText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500', flex: 1 },

    btnArea: { paddingHorizontal: 24, paddingBottom: 32 },
    startBtn: {
      height: 56, backgroundColor: Colors.primary, borderRadius: 16,
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
      shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
    },
    startBtnText: { color: Colors.white, fontWeight: '800', fontSize: 17 },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconCircleOuter}>
            <View style={styles.iconCircleInner}>
              <Ionicons name="checkmark" size={52} color={Colors.white} />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.greeting}>환영합니다,</Text>
          <Text style={styles.name}>{userName}님! 🎉</Text>
          <Text style={styles.sub}>
            riv에 오신 것을 환영해요.{'\n'}
            취향에 딱 맞는 책들을 추천해드릴게요.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
          {[
            { icon: 'sparkles-outline' as const,     text: 'AI가 취향 맞춤 도서 추천' },
            { icon: 'bookmark-outline' as const,     text: '독서 기록 & 구매 관리' },
            { icon: 'heart-outline' as const,        text: '선호 장르 기반 큐레이션' },
          ].map(item => (
            <View key={item.text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={item.icon} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </Animated.View>

      </View>

      <Animated.View style={[styles.btnArea, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('Main')}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>독서 시작하기</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
