import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ColorScheme } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { sendMessage } from '../services/aiService';
import { searchBooks } from '../services/bookApi';
import { addRecentBook } from '../services/storage';
import { ChatMessage, Book } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function makeId() {
  return Math.random().toString(36).slice(2);
}

function extractTitles(text: string): string[] {
  const matches = text.match(/\*\*([^*]+)\*\*/g) ?? [];
  return matches
    .map(m => m.replace(/\*\*/g, '').trim())
    .filter(t => t.length > 1 && !t.includes('추천') && !t.includes('도서'));
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'assistant',
  content:
    '안녕하세요! 저는 리브의 AI 사서예요. 딱 맞는 책을 찾아드릴게요.\n\n먼저, 어떤 장르를 주로 좋아하시나요? (예: 소설, 자기계발, 역사, 과학 등)',
  timestamp: Date.now(),
  suggestions: ['소설', '자기계발', '역사/사회', '과학/철학'],
};

function makeStyles(C: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: C.card,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: C.textPrimary,
    },
    resetBtn: {
      fontSize: 14,
      color: C.primary,
      fontWeight: '600',
    },
    messageList: {
      padding: 16,
      paddingBottom: 8,
    },
    messageRow: {
      flexDirection: 'row',
      marginBottom: 16,
      alignItems: 'flex-start',
    },
    rowAI: { justifyContent: 'flex-start' },
    rowUser: { justifyContent: 'flex-end' },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: C.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
      marginTop: 2,
      flexShrink: 0,
    },
    avatarText: {
      color: C.primary,
      fontSize: 11,
      fontWeight: '700',
    },
    bubbleColumn: {
      flex: 1,
      maxWidth: '80%',
    },
    bubble: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    bubbleAI: {
      backgroundColor: C.aiMessage,
      borderTopLeftRadius: 4,
    },
    bubbleUser: {
      backgroundColor: C.userMessage,
      borderTopRightRadius: 4,
      alignSelf: 'flex-end',
    },
    messageText: {
      fontSize: 14,
      lineHeight: 21,
      color: C.textPrimary,
    },
    messageTextUser: {
      color: C.white,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
      paddingHorizontal: 8,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: C.border,
    },
    dividerText: {
      fontSize: 12,
      color: C.textHint,
      marginHorizontal: 10,
      fontWeight: '500',
    },
    suggestionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    suggestionBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: C.primary,
      backgroundColor: C.card,
    },
    suggestionText: {
      fontSize: 13,
      color: C.primary,
      fontWeight: '600',
    },
    bookScroll: {
      marginTop: 10,
    },
    bookScrollContent: {
      paddingRight: 8,
    },
    bookCard: {
      width: 100,
      marginRight: 10,
      backgroundColor: C.card,
      borderRadius: 12,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 3,
    },
    bookImage: {
      width: 84,
      height: 118,
      borderRadius: 8,
      backgroundColor: C.border,
    },
    bookTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: C.textPrimary,
      marginTop: 6,
      lineHeight: 15,
    },
    bookAuthor: {
      fontSize: 10,
      color: C.textSecondary,
      marginTop: 2,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    loadingBubble: {
      backgroundColor: C.aiMessage,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: C.card,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      backgroundColor: C.background,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: C.textPrimary,
      borderWidth: 1,
      borderColor: C.border,
    },
    sendBtn: {
      marginLeft: 8,
      backgroundColor: C.primary,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    sendBtnDisabled: {
      backgroundColor: C.border,
    },
    sendBtnText: {
      color: C.white,
      fontWeight: '700',
      fontSize: 14,
    },
    notFoundContainer: {
      marginTop: 10,
      gap: 6,
    },
    notFoundRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: C.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    notFoundText: {
      flex: 1,
      fontSize: 12,
      color: C.textSecondary,
      lineHeight: 17,
    },
    notFoundTitle: {
      fontWeight: '700',
      color: C.textPrimary,
    },
  });
}

export default function RecommendScreen() {
  const navigation = useNavigation<Nav>();
  const { colors: C } = useTheme();
  const styles = makeStyles(C);

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!overrideText) setInput('');
    setLoading(true);

    try {
      const lastDividerIdx = [...nextMessages].map(m => m.isDivider).lastIndexOf(true);
      const sessionMessages = lastDividerIdx >= 0
        ? nextMessages.slice(lastDividerIdx + 1)
        : nextMessages;
      const apiMessages = sessionMessages.filter(m => m.id !== 'init' && !m.isDivider);
      const { content: reply, suggestions } = await sendMessage(apiMessages);

      const titles = extractTitles(reply);
      let books: Book[] = [];
      let notFoundTitles: string[] = [];
      if (titles.length > 0) {
        const results = await Promise.all(titles.map(t => searchBooks(t, 1)));
        results.forEach((r, i) => {
          if (r[0]) {
            books.push(r[0]);
          } else {
            notFoundTitles.push(titles[i]);
          }
        });
        books = books.filter((b, i, arr) => arr.findIndex(x => x.isbn === b.isbn) === i);
      }

      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        books: books.length > 0 ? books : undefined,
        notFoundTitles: notFoundTitles.length > 0 ? notFoundTitles : undefined,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          content: '죄송해요, 일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleReset = useCallback(() => {
    setInput('');
    setMessages(prev => [
      ...prev,
      {
        id: 'divider-' + makeId(),
        role: 'assistant' as const,
        content: '── 새 추천 시작 ──',
        timestamp: Date.now(),
        isDivider: true,
      },
      { ...INITIAL_MESSAGE, id: makeId(), timestamp: Date.now() },
    ]);
  }, []);

  const handleBookPress = useCallback(
    async (book: Book) => {
      await addRecentBook(book);
      navigation.navigate('BookDetail', { book });
    },
    [navigation]
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.isDivider) {
      return (
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>새 추천</Text>
          <View style={styles.dividerLine} />
        </View>
      );
    }
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.rowUser : styles.rowAI]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        )}
        <View style={styles.bubbleColumn}>
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
            <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
              {item.content}
            </Text>
          </View>

          {!item.books &&
            item.suggestions && item.suggestions.length > 0 &&
            item.id === [...messages].reverse().find(m => m.role === 'assistant')?.id && (
            <View style={styles.suggestionsRow}>
              {item.suggestions.map(s => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionBtn}
                  onPress={() => handleSend(s)}
                  disabled={loading}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {(item.books || item.notFoundTitles) && (
            <View>
              {item.books && item.books.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.bookScroll}
                  contentContainerStyle={styles.bookScrollContent}
                >
                  {item.books.map(book => (
                    <TouchableOpacity
                      key={book.isbn + book.title}
                      style={styles.bookCard}
                      onPress={() => handleBookPress(book)}
                    >
                      <Image
                        source={{ uri: book.thumbnail || 'https://picsum.photos/seed/default/80/110' }}
                        style={styles.bookImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                      <Text style={styles.bookAuthor} numberOfLines={1}>{book.authors[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {item.notFoundTitles && item.notFoundTitles.length > 0 && (
                <View style={styles.notFoundContainer}>
                  {item.notFoundTitles.map(title => (
                    <View key={title} style={styles.notFoundRow}>
                      <Ionicons name="book-outline" size={13} color={C.textHint} style={{ marginTop: 1 }} />
                      <Text style={styles.notFoundText}>
                        <Text style={styles.notFoundTitle}>《{title}》</Text>
                        {' '}은(는) 리브에 존재하지 않는 책입니다.
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {item.id === [...messages].reverse().find(m => m.role === 'assistant')?.id && (
                <TouchableOpacity
                  style={[styles.suggestionBtn, { marginTop: 10, alignSelf: 'flex-start' }]}
                  onPress={handleReset}
                  disabled={loading}
                >
                  <Text style={styles.suggestionText}>다른 책을 추천받을래요</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI 책 추천</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetBtn}>새 대화</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
        />

        {loading && (
          <View style={styles.loadingRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={C.primary} />
            </View>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요"
            placeholderTextColor={C.textHint}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
