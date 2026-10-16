import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useDecksStore } from '@/src/stores/decks.store';
import type { Deck } from '@/src/types';

export default function DecksScreen() {
  const { decks, loading, loadDecks, addDeck, editDeck, removeDeck } = useDecksStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadDecks();
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingDeck(null);
    setName('');
    setDescription('');
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((deck: Deck) => {
    setEditingDeck(deck);
    setName(deck.name);
    setDescription(deck.description);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    if (editingDeck) {
      await editDeck(editingDeck.id, name.trim(), description.trim());
    } else {
      await addDeck(name.trim(), description.trim());
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
  }, [name, description, editingDeck, editDeck, addDeck]);

  const handleDelete = useCallback(
    (deck: Deck) => {
      Alert.alert('Delete Deck', `Are you sure you want to delete "${deck.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeDeck(deck.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]);
    },
    [removeDeck],
  );

  const renderDeck = useCallback(
    ({ item }: { item: Deck }) => (
      <Pressable
        style={styles.deckCard}
        onPress={() => router.push(`/deck/${item.id}`)}
        onLongPress={() => openEditModal(item)}
      >
        <View style={styles.deckHeader}>
          <Text style={styles.deckName}>{item.name}</Text>
          <Pressable onPress={() => handleDelete(item)} hitSlop={10}>
            <Text style={styles.deleteBtn}>✕</Text>
          </Pressable>
        </View>
        {item.description ? (
          <Text style={styles.deckDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.deckFooter}>
          <View style={styles.deckStats}>
            <Text style={styles.statBadge}>
              {item.cardCount} {item.cardCount === 1 ? 'card' : 'cards'}
            </Text>
            {item.newCount > 0 && (
              <Text style={[styles.statBadge, styles.newBadge]}>{item.newCount} new</Text>
            )}
            {item.dueCount > 0 && (
              <Text style={[styles.statBadge, styles.dueBadge]}>{item.dueCount} due</Text>
            )}
          </View>
          {(item.newCount > 0 || item.dueCount > 0) && (
            <Pressable style={styles.studyBtn} onPress={() => router.push(`/study/${item.id}`)}>
              <Text style={styles.studyBtnText}>Study</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    ),
    [openEditModal, handleDelete],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDeck}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadDecks}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No decks yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to create your first deck</Text>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingDeck ? 'Edit Deck' : 'New Deck'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Deck name"
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!name.trim()}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  deckCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deckName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  deleteBtn: {
    fontSize: 16,
    color: '#B2BEC3',
    padding: 4,
  },
  deckDescription: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  deckFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  deckStats: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  studyBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  studyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statBadge: {
    fontSize: 12,
    color: '#636E72',
    backgroundColor: '#F1F2F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  newBadge: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
  },
  dueBadge: {
    backgroundColor: '#FFF3E0',
    color: '#E65100',
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F1F2F6',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: '#2D3436',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#636E72',
  },
  saveBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
