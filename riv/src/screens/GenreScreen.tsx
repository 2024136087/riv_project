import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Animated, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import BookCard from '../components/BookCard';
import { ColorScheme } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { GENRES } from '../constants/genres';
import { getBooksByGenre, searchBooksInGenre } from '../services/bookApi';
import { addRecentBook } from '../services/storage';
import { Book } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TAB_HEIGHT = 94;
const SEARCH_BAR_HEIGHT = 56;
const HEADER_HEIGHT = TAB_HEIGHT + SEARCH_BAR_HEIGHT;

function makeStyles(C: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: HEADER_HEIGHT },

    searchWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      backgroundColor: C.card,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 10,
      paddingLeft: 12,
      height: 40,
      backgroundColor: C.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    searchIcon: { marginRight: 6 },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: C.textPrimary,
      paddingVertical: 0,
    },
    searchClear: { padding: 6 },
    searchBtn: {
      height: 40,
      paddingHorizontal: 14,
      backgroundColor: C.primary,
      borderTopRightRadius: 9,
      borderBottomRightRadius: 9,
      justifyContent: 'center',
    },
    searchBtnText: {
      color: C.white,
      fontWeight: '700',
      fontSize: 14,
    },

    tabGridWrapper: {
      position: 'absolute',
      top: SEARCH_BAR_HEIGHT,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: C.card,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    tabGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 8,
      height: TAB_HEIGHT,
    },
    tab: {
      width: '18%',
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: C.background,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: C.border,
    },
    tabActive: { backgroundColor: C.primary, borderColor: C.primary },
    tabText: { fontSize: 12, color: C.textSecondary, fontWeight: '500' },
    tabTextActive: { color: C.white, fontWeight: '700' },

    expandBtn: {
      position: 'absolute',
      top: SEARCH_BAR_HEIGHT + 6,
      left: 0,
      right: 0,
      zIndex: 15,
      alignItems: 'center',
      paddingVertical: 4,
    },

    list: {
      paddingTop: HEADER_HEIGHT + 8,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    empty: {
      textAlign: 'center',
      color: C.textHint,
      marginTop: 40,
    },
    topBtn: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    topBtnInner: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  });
}

export default function GenreScreen() {
  const navigation = useNavigation<Nav>();
  const { colors: C } = useTheme();
  const styles = makeStyles(C);

  const [selectedGenre, setSelectedGenre] = useState(GENRES[8]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const [tabsHidden, setTabsHidden] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const fabOpacity = useRef(new Animated.Value(0)).current;
  const fabVisible = useRef(false);
  const tabsHiddenRef = useRef(false);

  const tabAnim = useRef(new Animated.Value(1)).current;

  const tabTranslateY = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-TAB_HEIGHT, 0],
  });

  const hideTabs = useCallback(() => {
    if (tabsHiddenRef.current) return;
    tabsHiddenRef.current = true;
    setTabsHidden(true);
    Animated.timing(tabAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start();
  }, [tabAnim]);

  const showTabs = useCallback(() => {
    if (!tabsHiddenRef.current) return;
    tabsHiddenRef.current = false;
    setTabsHidden(false);
    Animated.timing(tabAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [tabAnim]);

  const loadBooks = useCallback(async (kdc: string) => {
    setLoading(true);
    const result = await getBooksByGenre(kdc);
    setBooks(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBooks(selectedGenre.kdc);
  }, [selectedGenre, loadBooks]);

  const handleGenreSelect = useCallback((genre: typeof GENRES[0]) => {
    setSelectedGenre(genre);
    setQuery('');
    setSearchResults([]);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (!text.trim()) setSearchResults([]);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    const results = await searchBooksInGenre(query.trim(), selectedGenre.kdc);
    setSearchResults(results);
    setSearching(false);
  }, [query, selectedGenre.kdc]);

  const handleBookPress = useCallback(
    async (book: Book) => {
      await addRecentBook(book);
      navigation.navigate('BookDetail', { book });
    },
    [navigation]
  );

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;

    const shouldShowFab = y > 100;
    if (shouldShowFab !== fabVisible.current) {
      fabVisible.current = shouldShowFab;
      Animated.timing(fabOpacity, {
        toValue: shouldShowFab ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    if (y > 60) hideTabs();
    else if (y <= 10) showTabs();
  }, [fabOpacity, hideTabs, showTabs]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchWrapper}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={15} color={C.textHint} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`'${selectedGenre.label}' 장르 내 검색`}
            placeholderTextColor={C.textHint}
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity style={styles.searchClear} onPress={() => handleQueryChange('')}>
              <Ionicons name="close-circle" size={16} color={C.textHint} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>검색</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.tabGridWrapper, { transform: [{ translateY: tabTranslateY }] }]}>
        <View style={styles.tabGrid}>
          {GENRES.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[styles.tab, selectedGenre.id === g.id && styles.tabActive]}
              onPress={() => handleGenreSelect(g)}
            >
              <Text style={[styles.tabText, selectedGenre.id === g.id && styles.tabTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {tabsHidden && (
        <TouchableOpacity style={styles.expandBtn} onPress={showTabs} activeOpacity={0.7}>
          <Ionicons name="chevron-down" size={20} color={C.textSecondary} />
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <Animated.FlatList
          ref={flatListRef}
          data={query.trim() ? searchResults : books}
          keyExtractor={item => item.isbn + item.title}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BookCard book={item} onPress={handleBookPress} horizontal />
          )}
          ListEmptyComponent={
            searching
              ? <ActivityIndicator style={{ marginTop: 40 }} color={C.primary} />
              : <Text style={styles.empty}>{query.trim() ? '검색 결과가 없습니다.' : '책이 없습니다.'}</Text>
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true, listener: handleScroll }
          )}
          scrollEventThrottle={16}
        />
      )}

      <Animated.View style={[styles.topBtn, { opacity: fabOpacity }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.topBtnInner} onPress={scrollToTop}>
          <Ionicons name="arrow-up" size={22} color={C.white} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
