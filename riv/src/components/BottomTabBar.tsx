import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ColorScheme } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList, TabParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabName = keyof TabParamList;

const TABS: { name: TabName; label: string; inactive: string }[] = [
  { name: 'Home',      label: '홈',        inactive: 'home-outline' },
  { name: 'Genre',     label: '장르',       inactive: 'book-outline' },
  { name: 'Recommend', label: 'AI추천',     inactive: 'sparkles-outline' },
  { name: 'MyPage',    label: '마이페이지', inactive: 'person-circle-outline' },
];

function makeStyles(C: ColorScheme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: C.card,
      borderTopWidth: 1,
      borderTopColor: C.border,
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
      color: C.textSecondary,
    },
  });
}

export default function BottomTabBar() {
  const navigation = useNavigation<Nav>();
  const { colors: C } = useTheme();
  const styles = makeStyles(C);

  return (
    <View style={styles.container}>
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tab}
          onPress={() => navigation.navigate('Main', { screen: tab.name })}
          activeOpacity={0.7}
        >
          <Ionicons name={tab.inactive as any} size={24} color={C.textSecondary} />
          <Text style={styles.label}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
