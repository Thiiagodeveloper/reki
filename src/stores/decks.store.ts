import { create } from 'zustand';
import { decksDao } from '../lib/database';
import type { Deck } from '../types';

interface DecksState {
  decks: Deck[];
  loading: boolean;
  error: string | null;
  loadDecks: () => Promise<void>;
  addDeck: (name: string, description?: string) => Promise<number>;
  editDeck: (id: number, name: string, description: string) => Promise<void>;
  removeDeck: (id: number) => Promise<void>;
}

export const useDecksStore = create<DecksState>((set, get) => ({
  decks: [],
  loading: false,
  error: null,

  loadDecks: async () => {
    set({ loading: true, error: null });
    try {
      const decks = await decksDao.getAllDecks();
      set({ decks, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  addDeck: async (name, description = '') => {
    const id = await decksDao.createDeck(name, description);
    await get().loadDecks();
    return id;
  },

  editDeck: async (id, name, description) => {
    await decksDao.updateDeck(id, name, description);
    await get().loadDecks();
  },

  removeDeck: async (id) => {
    await decksDao.deleteDeck(id);
    await get().loadDecks();
  },
}));
