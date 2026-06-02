import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { GENRES } from '../constants/genres';
import { getUser, saveUser } from '../services/storage';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const GENRE_META: Record<string, { icon: IoniconName; color: string }> = {
  총류:     { icon: 'library-outline',       color: '#6366F1' },
  철학:     { icon: 'bulb-outline',           color: '#8B5CF6' },
  종교:     { icon: 'heart-outline',          color: '#EC4899' },
  사회과학: { icon: 'people-outline',         color: '#F59E0B' },
  자연과학: { icon: 'leaf-outline',           color: '#10B981' },
  기술과학: { icon: 'construct-outline',      color: '#3B82F6' },
  예술:     { icon: 'color-palette-outline',  color: '#F97316' },
  언어:     { icon: 'chatbubble-outline',     color: '#06B6D4' },
  문학:     { icon: 'pencil-outline',         color: '#84CC16' },
  역사:     { icon: 'time-outline',           color: '#EF4444' },
};

export default function GenreSelectScreen() {
  const navigation = useNavigation<Nav>();
  const Colors = useColors();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((label: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    const user = await getUser();
    if (user) {
      await saveUser({ ...user, favoriteGenres: Array.from(selected) });
      navigation.navigate('Welcome', { userName: user.name });
    } else {
      navigation.navigate('Main');
    }
  }, [selected, navigation]);

  const handleSkip = useCallback(async () => {
    const user = await getUser();
    if (user) {
      navigation.navigate('Welcome', { userName: user.name });
    } else {
      navigation.navigate('Main');
    }
  }, [navigation]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingBottom: 40 },

    hero: { alignItems: 'center', paddingTop: 40, paddingBottom: 32, paddingHorizontal: 24 },
    iconCircle: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: Colors.primaryLight,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 20,
    },
    heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
    heroSubtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

    grid: {
      flexDirection: 'row', flexWrap: 'wrap',
      paddingHorizontal: 16, gap: 12,
      justifyContent: 'center',
    },
    genreCard: {
      width: '44%',
      backgroundColor: Colors.card,
      borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border,
      padding: 16, alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
      position: 'relative',
    },
    genreLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },

    countText: {
      textAlign: 'center', marginTop: 20,
      fontSize: 13, color: Colors.primary, fontWeight: '700',
    },

    btnArea: { paddingHorizontal: 20, marginTop: 28 },
    confirmBtn: {
      height: 54, backgroundColor: Colors.primary, borderRadius: 14,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    confirmBtnDisabled: { backgroundColor: Colors.border },
    confirmBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
    skipBtn: { alignItems: 'center', marginTop: 14, paddingVertical: 8 },
    skipBtnText: { fontSize: 14, color: Colors.textHint },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="heart-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>어떤 책을 좋아하세요?</Text>
          <Text style={styles.heroSubtitle}>
            선호하는 장르를 선택하면{'\n'}딱 맞는 책을 추천해드릴게요.
          </Text>
        </View>

        <View style={styles.grid}>
          {GENRES.map(g => {
            const meta = GENRE_META[g.label];
            const isSelected = selected.has(g.label);
            return (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.genreCard,
                  isSelected && { borderColor: meta.color, backgroundColor: meta.color + '18' },
                ]}
                onPress={() => toggle(g.label)}
                activeOpacity={0.75}
              >
                <View style={[{ width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }, { backgroundColor: meta.color + '22' }]}>
                  <Ionicons name={meta.icon} size={26} color={meta.color} />
                </View>
                <Text style={[styles.genreLabel, isSelected && { color: meta.color, fontWeight: '700' }]}>
                  {g.label}
                </Text>
                {isSelected && (
                  <View style={[{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }, { backgroundColor: meta.color }]}>
                    <Ionicons name="checkmark" size={12} color={Colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selected.size > 0 && (
          <Text style={styles.countText}>{selected.size}개 선택됨</Text>
        )}

        <View style={styles.btnArea}>
          <TouchableOpacity
            style={[styles.confirmBtn, selected.size === 0 && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            activeOpacity={0.85}
            disabled={selected.size === 0}
          >
            <Text style={styles.confirmBtnText}>시작하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>나중에 설정할게요</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
