import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../constants/colors';
import { RootStackParamList, TabParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabName = keyof TabParamList;

const TABS: { name: TabName; label: string; active: string; inactive: string }[] = [
  { name: 'Home',      label: '홈',        active: 'home',          inactive: 'home-outline' },
  { name: 'Genre',     label: '장르',       active: 'book',          inactive: 'book-outline' },
  { name: 'Recommend', label: 'AI추천',     active: 'sparkles',      inactive: 'sparkles-outline' },
  { name: 'MyPage',    label: '마이페이지', active: 'person-circle', inactive: 'person-circle-outline' },
];

export default function BottomTabBar() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tab}
          onPress={() => navigation.navigate('Main', { screen: tab.name })}
          activeOpacity={0.7}
        >
          <Ionicons name={tab.inactive as any} size={24} color={Colors.textSecondary} />
          <Text style={styles.label}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 60,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
