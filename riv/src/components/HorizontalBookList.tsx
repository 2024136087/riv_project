import React, { useRef, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, Text, StyleSheet, LayoutChangeEvent,
} from 'react-native';
import BookCard from './BookCard';
import { ColorScheme } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { Book } from '../types';

interface Props {
  books: Book[];
  onBookPress: (book: Book) => void;
}

const SCROLL_AMOUNT = 280;

function makeStyles(C: ColorScheme) {
  return StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    scroll: {
      flex: 1,
    },
    arrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: C.card,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 10,
    },
    arrowLeft: {
      marginRight: 6,
    },
    arrowRight: {
      marginLeft: 6,
    },
    arrowHidden: {
      opacity: 0,
      pointerEvents: 'none',
    } as any,
    arrowText: {
      fontSize: 22,
      color: C.textPrimary,
      lineHeight: 26,
      fontWeight: '300',
    },
  });
}

export default function HorizontalBookList({ books, onBookPress }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const { colors: C } = useTheme();
  const styles = makeStyles(C);

  const canScrollLeft = scrollX > 0;
  const canScrollRight = contentWidth > containerWidth && scrollX < contentWidth - containerWidth - 4;

  const scrollLeft = () => {
    const next = Math.max(0, scrollX - SCROLL_AMOUNT);
    scrollRef.current?.scrollTo({ x: next, animated: true });
  };

  const scrollRight = () => {
    const next = scrollX + SCROLL_AMOUNT;
    scrollRef.current?.scrollTo({ x: next, animated: true });
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.arrow, styles.arrowLeft, !canScrollLeft && styles.arrowHidden]}
        onPress={scrollLeft}
        disabled={!canScrollLeft}
      >
        <Text style={styles.arrowText}>‹</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={e => setScrollX(e.nativeEvent.contentOffset.x)}
        onLayout={(e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentWidth(w)}
        style={styles.scroll}
      >
        {books.map(item => (
          <BookCard key={item.isbn + item.title} book={item} onPress={onBookPress} />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.arrow, styles.arrowRight, !canScrollRight && styles.arrowHidden]}
        onPress={scrollRight}
        disabled={!canScrollRight}
      >
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}
