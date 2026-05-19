import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Book } from '../types';
import { Colors } from '../constants/colors';

interface Props {
  book: Book;
  onPress: (book: Book) => void;
  horizontal?: boolean;
}

export default function BookCard({ book, onPress, horizontal }: Props) {
  if (horizontal) {
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={() => onPress(book)}>
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
    <TouchableOpacity style={styles.card} onPress={() => onPress(book)}>
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

const styles = StyleSheet.create({
  card: {
    width: 120,
    marginRight: 12,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 104,
    height: 148,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  author: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  horizontalImage: {
    width: 64,
    height: 90,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  horizontalInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  publisher: {
    fontSize: 11,
    color: Colors.textHint,
    marginTop: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 6,
  },
});
