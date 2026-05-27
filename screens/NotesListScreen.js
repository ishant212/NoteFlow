import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, TextInput, StatusBar, Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastAndroid } from 'react-native';
import { saveNotes } from '../storage/notesStorage';

const CATEGORY_COLORS = {
  Work:     { bg: '#EAF3DE', text: '#3B6D11' },
  Personal: { bg: '#FEF3E8', text: '#B07030' },
  Idea:     { bg: '#EEEDFE', text: '#534AB7' },
};

export default function NotesListScreen({ navigation, notes, setNotes }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState(''); 
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = [...notes]
  .sort(
    (a, b) =>
      new Date(b.updatedAt) -
      new Date(a.updatedAt)
  )
  .filter(n => {
    const matchesSearch =
      (n.title || '')
        .toLowerCase()
        .includes(search.toLowerCase()) ||

      (n.body || '')
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      n.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

function deleteNote(id) {
  Alert.alert(
    'Delete Note',
    'Are you sure you want to delete this note?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          let updatedNotes = [];

          try {
            setNotes(prev => {
              updatedNotes = prev.filter(n => n.id !== id);
              return updatedNotes;
            });

            const success = await saveNotes(updatedNotes);

            if (!success) {
              ToastAndroid.show(
                'Failed to delete note.',
                ToastAndroid.SHORT
              );
              return;
            }

            ToastAndroid.show(
              'Note deleted.',
              ToastAndroid.SHORT
            );

          } catch (e) {
            console.error(e);

            ToastAndroid.show(
              'Something went wrong.',
              ToastAndroid.SHORT
            );
          }
        },
      },
    ]
  );
}

  function formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday)     return `Today · ${time}`;
    if (isYesterday) return `Yesterday · ${time}`;
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F3" />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>YOUR WORKSPACE</Text>
          <Text style={styles.heading}>NoteFlow</Text>
          <Text style={styles.subCount}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('EditNote')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes…"
          placeholderTextColor="#B5AD9E"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.filterRow}>
  {['All', 'Personal', 'Work', 'Idea'].map(cat => {
    const active = selectedCategory === cat;

    return (
      <TouchableOpacity
        key={cat}
        style={[
          styles.filterChip,
          active && styles.filterChipActive,
        ]}
        onPress={() => setSelectedCategory(cat)}
      >
        <Text
          style={[
            styles.filterChipText,
            active && styles.filterChipTextActive,
          ]}
        >
          {cat}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptyBody}>
              {search
  ? 'No results for that search.'
  : selectedCategory !== 'All'
    ? `No ${selectedCategory} notes yet.`
    : 'Tap + to capture your first thought.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cat = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Idea'];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('EditNote', { existingNote: item })}
            >
              {item.category && (
                <View style={[styles.tag, { backgroundColor: cat.bg }]}>
                  <Text style={[styles.tagText, { color: cat.text }]}>
                    {item.category.toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title || 'Untitled'}
              </Text>
              <Text style={styles.cardBody} numberOfLines={2}>
                {item.body}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardTime}>{formatDate(item.updatedAt)}</Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteNote(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#A89C8A',
    fontWeight: '500',
    marginBottom: 2,
  },
  heading: {
    fontSize: 32,
    fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia',
    fontWeight: '400',
    color: '#2C2620',
    lineHeight: 38,
  },
  subCount: {
    fontSize: 12,
    color: '#A89C8A',
    marginTop: 2,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2C2620',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    elevation: 4,
    shadowColor: '#2C2620',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabText: {
    color: '#FAF8F3',
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
    marginTop: -2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EBE2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchIcon: { fontSize: 16, color: '#A89C8A' },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C2620',
    padding: 0,
  },
  searchClear: { fontSize: 13, color: '#A89C8A', padding: 2 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8DF',
    padding: 16,
    marginBottom: 10,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia',
    fontWeight: '400',
    color: '#2C2620',
    marginBottom: 5,
  },
  cardBody: {
    fontSize: 13,
    color: '#8A7F72',
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTime: { fontSize: 11, color: '#B5AD9E' },
  deleteBtn: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deleteBtnText: { color: '#D84040', fontSize: 11, fontWeight: '600' },
  emptyWrap: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.3 },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia',
    color: '#2C2620',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: '#A89C8A',
    textAlign: 'center',
    lineHeight: 21,
  },
  filterRow: {
  flexDirection: 'row',
  gap: 8,
  marginBottom: 16,
},

filterChip: {
  paddingHorizontal: 14,
  paddingVertical: 7,
  borderRadius: 20,
  backgroundColor: '#F0EBE2',
},

filterChipActive: {
  backgroundColor: '#2C2620',
},

filterChipText: {
  fontSize: 12,
  color: '#8A7F72',
  fontWeight: '600',
},

filterChipTextActive: {
  color: '#FAF8F3',
},
});