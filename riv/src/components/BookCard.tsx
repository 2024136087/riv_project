import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Book } from '../types';
import { ColorScheme } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

interface Props {
  book: Book;
  onPress: (book: Book) => void;
  horizontal?: boolean;
}

function makeStyles(C: ColorScheme) {
  return StyleSheet.create({
    card: {
      width: 116,
      marginRight: 12,
      backgroundColor: C.card,
      borderRadius: 12,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 3,
    },
    image: {
      width: 100,
      height: 142,
      borderRadius: 8,
      backgroundColor: C.border,
    },
    title: {
      fontSize: 12,
      fontWeight: '600',
      color: C.textPrimary,
      marginTop: 8,
      lineHeight: 17,
    },
    author: {
      fontSize: 11,
      color: C.textSecondary,
      marginTop: 3,
    },
    horizontalCard: {
      flexDirection: 'row',
      backgroundColor: C.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    horizontalImage: {
      width: 62,
      height: 88,
      borderRadius: 8,
      backgroundColor: C.border,
    },
    horizontalInfo: {
      flex: 1,
      marginLeft: 14,
      justifyContent: 'center',
    },
    publisher: {
      fontSize: 11,
      color: C.textHint,
      marginTop: 3,
    },
    price: {
      fontSize: 13,
      fontWeight: '700',
      color: C.primary,
      marginTop: 8,
    },
  });
}

export default function BookCard({ book, onPress, horizontal }: Props) {
  const { colors: C } = useTheme();
  const styles = makeStyles(C);

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={() => onPress(book)} activeOpacity={0.7}>
        <Image
          source={{ uri: book.thumbnail || 'https://via.placeholder.com/80x110' }}
          style={styles.horizontalImage}
          resizeMode="cover"
        />
        <View style={styles.horizontalInfo}>
          <Text style={styles.title} numberOfLines={2}>{book.title.trim()}</Text>
          <Text style={styles.author} numberOfLines={1}>{book.authors.join(', ')}</Text>
          <Text style={styles.publisher} numberOfLines={1}>{book.publisher}</Text>
          {book.sale_price > 0 && (
            <Text style={styles.price}>{book.sale_price.toLocaleString()}원</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(book)} activeOpacity={0.7}>
      <Image
        source={{ uri: book.thumbnail || 'https://via.placeholder.com/80x110' }}
        style={styles.image}
        resizeMode="cover"
      />
      <Text style={styles.title} numberOfLines={2}>{book.title.trim()}</Text>
      <Text style={styles.author} numberOfLines={1}>{book.authors.join(', ')}</Text>
    </TouchableOpacity>
  );
}
