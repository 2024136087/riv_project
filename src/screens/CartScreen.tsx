import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, FlatList, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { getCart, removeFromCart, updateCartQuantity } from '../services/storage';
import { CartItem } from '../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const UNIT_PRICE = 10000;

export default function CartScreen() {
  const navigation = useNavigation<Nav>();
  const Colors = useColors();

  const [items, setItems] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCart().then(cart => {
      setItems(cart);
      setSelected(new Set(cart.map(i => i.book.isbn)));
    });
  }, []);

  const allSelected = items.length > 0 && selected.size === items.length;

  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(items.map(i => i.book.isbn)));
  }, [allSelected, items]);

  const toggleOne = useCallback((isbn: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(isbn) ? next.delete(isbn) : next.add(isbn);
      return next;
    });
  }, []);

  const handleRemoveSelected = useCallback(async () => {
    for (const isbn of selected) await removeFromCart(isbn);
    const next = items.filter(i => !selected.has(i.book.isbn));
    setItems(next);
    setSelected(new Set());
  }, [items, selected]);

  const handleQty = useCallback(async (isbn: string, delta: number) => {
    const item = items.find(i => i.book.isbn === isbn);
    if (!item) return;
    const next = Math.max(1, item.quantity + delta);
    await updateCartQuantity(isbn, next);
    setItems(prev => prev.map(i => i.book.isbn === isbn ? { ...i, quantity: next } : i));
  }, [items]);

  const selectedItems = items.filter(i => selected.has(i.book.isbn));
  const total = selectedItems.reduce((sum, i) => sum + UNIT_PRICE * i.quantity, 0);
  const totalQty = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

  const C = Colors;
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
      gap: 8,
    },
    backBtn: { padding: 2, marginRight: 4 },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.textPrimary },
    deleteBtn: {
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 8, borderWidth: 1, borderColor: C.border,
    },
    deleteBtnText: { fontSize: 13, color: C.error, fontWeight: '600' },
    deleteBtnDisabled: { borderColor: C.border },
    deleteBtnTextDisabled: { color: C.textHint },

    selectAllRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border,
      gap: 10,
    },
    checkbox: {
      width: 22, height: 22, borderRadius: 6,
      borderWidth: 2, borderColor: C.border,
      justifyContent: 'center', alignItems: 'center',
    },
    checkboxActive: { backgroundColor: C.primary, borderColor: C.primary },
    selectAllText: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
    selectCount: { fontSize: 13, color: C.textSecondary },

    list: { flex: 1 },
    listContent: { padding: 16, gap: 12 },

    item: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.card, borderRadius: 14,
      padding: 14, gap: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    thumb: { width: 56, height: 80, borderRadius: 8, backgroundColor: C.border },
    info: { flex: 1, gap: 4 },
    title: { fontSize: 14, fontWeight: '700', color: C.textPrimary, lineHeight: 20 },
    price: { fontSize: 14, fontWeight: '800', color: C.primary },

    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    qtyBtn: {
      width: 28, height: 28, borderRadius: 8,
      backgroundColor: C.background, borderWidth: 1, borderColor: C.border,
      justifyContent: 'center', alignItems: 'center',
    },
    qtyBtnDisabled: { borderColor: C.border, backgroundColor: C.background },
    qtyText: { fontSize: 15, fontWeight: '700', color: C.textPrimary, minWidth: 20, textAlign: 'center' },

    emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    emptyText: { fontSize: 15, color: C.textHint },

    footer: {
      backgroundColor: C.card,
      borderTopWidth: 1, borderTopColor: C.border,
      padding: 16, gap: 12,
    },
    totalRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    },
    totalLabelWrap: { gap: 2 },
    totalLabel: { fontSize: 13, color: C.textSecondary },
    totalQty: { fontSize: 12, color: C.textHint },
    totalAmount: { fontSize: 22, fontWeight: '800', color: C.textPrimary },
    orderBtn: {
      height: 52, backgroundColor: C.primary, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center',
    },
    orderBtnDisabled: { backgroundColor: C.border },
    orderBtnText: { color: C.white, fontSize: 16, fontWeight: '700' },
  });

  const canOrder = selected.size > 0;

  return (
    <SafeAreaView style={s.container}>
      {/* 헤더 */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>장바구니</Text>
        <TouchableOpacity
          style={[s.deleteBtn, selected.size === 0 && s.deleteBtnDisabled]}
          onPress={handleRemoveSelected}
          disabled={selected.size === 0}
        >
          <Text style={[s.deleteBtnText, selected.size === 0 && s.deleteBtnTextDisabled]}>
            삭제
          </Text>
        </TouchableOpacity>
      </View>

      {/* 전체 선택 */}
      {items.length > 0 && (
        <TouchableOpacity style={s.selectAllRow} onPress={toggleAll} activeOpacity={0.7}>
          <View style={[s.checkbox, allSelected && s.checkboxActive]}>
            {allSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={s.selectAllText}>전체 선택</Text>
          <Text style={s.selectCount}>{selected.size}/{items.length}</Text>
        </TouchableOpacity>
      )}

      {items.length === 0 ? (
        <View style={s.emptyWrap}>
          <Ionicons name="cart-outline" size={56} color={C.textHint} />
          <Text style={s.emptyText}>장바구니가 비어있어요.</Text>
        </View>
      ) : (
        <FlatList
          style={s.list}
          contentContainerStyle={s.listContent}
          data={items}
          keyExtractor={item => item.book.isbn}
          renderItem={({ item }) => {
            const checked = selected.has(item.book.isbn);
            return (
              <TouchableOpacity
                style={s.item}
                activeOpacity={0.85}
                onPress={() => toggleOne(item.book.isbn)}
              >
                <View style={[s.checkbox, checked && s.checkboxActive]}>
                  {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Image
                  source={{ uri: item.book.thumbnail || 'https://via.placeholder.com/56x80' }}
                  style={s.thumb}
                  resizeMode="cover"
                />
                <View style={s.info}>
                  <Text style={s.title} numberOfLines={2}>{item.book.title}</Text>
                  <Text style={s.price}>
                    {(UNIT_PRICE * item.quantity).toLocaleString()}원
                  </Text>
                  <View style={s.qtyRow}>
                    <TouchableOpacity
                      style={[s.qtyBtn, item.quantity <= 1 && s.qtyBtnDisabled]}
                      onPress={() => handleQty(item.book.isbn, -1)}
                      disabled={item.quantity <= 1}
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={item.quantity <= 1 ? C.textHint : C.textPrimary}
                      />
                    </TouchableOpacity>
                    <Text style={s.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={s.qtyBtn}
                      onPress={() => handleQty(item.book.isbn, 1)}
                    >
                      <Ionicons name="add" size={16} color={C.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {items.length > 0 && (
        <View style={s.footer}>
          <View style={s.totalRow}>
            <View style={s.totalLabelWrap}>
              <Text style={s.totalLabel}>주문 금액</Text>
              <Text style={s.totalQty}>선택 {totalQty}권</Text>
            </View>
            <Text style={s.totalAmount}>{total.toLocaleString()}원</Text>
          </View>
          <TouchableOpacity
            style={[s.orderBtn, !canOrder && s.orderBtnDisabled]}
            disabled={!canOrder}
            onPress={() => navigation.navigate('CartCheckout', {
              items: selectedItems,
              total,
            })}
          >
            <Text style={s.orderBtnText}>
              {selected.size === 0 ? '항목을 선택해주세요' : `${total.toLocaleString()}원 주문하기`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
