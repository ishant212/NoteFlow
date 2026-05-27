import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  ToastAndroid,
  Alert,
} from 'react-native';
import { saveNotes } from '../storage/notesStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = ['Personal', 'Work', 'Idea'];
const CAT_STYLES = {
  Personal: { bg: '#FEF3E8', text: '#B07030', border: '#E0C090' },
  Work:     { bg: '#EAF3DE', text: '#3B6D11', border: '#9FD070' },
  Idea:     { bg: '#EEEDFE', text: '#534AB7', border: '#AFA9EC' },
};
const CHAR_LIMIT = 2000;

export default function EditNoteScreen({ navigation, setNotes, route }) {
  const insets = useSafeAreaInsets();
  const existingNote = route.params?.existingNote;

  const [title,    setTitle]    = useState(existingNote?.title    ?? '');
  const [body,     setBody]     = useState(existingNote?.body     ?? '');
  const [category, setCategory] = useState(existingNote?.category ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

 async function handleSave() {
  if (!title.trim() && !body.trim()) {
  ToastAndroid.show(
    'Cannot save an empty note.',
    ToastAndroid.SHORT
  );
  return;
}

  setSaving(true);

  const now = new Date().toISOString();

  let updatedNotes = [];

  try {
    setNotes(prev => {
      updatedNotes = existingNote
        ? prev.map(n =>
            n.id === existingNote.id
              ? {
                  ...n,
                  title,
                  body,
                  category,
                  updatedAt: now,
                }
              : n
          )
        : [{
            id: Date.now().toString(),
            title,
            body,
            category,
            createdAt: now,
            updatedAt: now,
          }, ...prev];

      return updatedNotes;
    });

    const success = await saveNotes(updatedNotes);

    if (!success) {
      ToastAndroid.show(
        'Failed to save note.',
        ToastAndroid.SHORT
      );
      return;
    }

    ToastAndroid.show(
      'Note saved successfully.',
      ToastAndroid.SHORT
    );

    navigation.goBack();

  } catch (e) {
    console.error(e);

    ToastAndroid.show(
      'Something went wrong while saving.',
      ToastAndroid.SHORT
    );
  } finally {
    setSaving(false);
  }
}

  function formatMeta(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString([], {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }


  function getChipStyle(cat) {
    const active = category === cat;
    if (!active) return [styles.chip, styles.chipInactive];
    const c = CAT_STYLES[cat];
    return [styles.chip, { backgroundColor: c.bg, borderColor: c.border }];
  }

  function getChipTextStyle(cat) {
    const active = category === cat;
    if (!active) return [styles.chipText, styles.chipTextInactive];
    return [styles.chipText, { color: CAT_STYLES[cat].text }];
  }

  const remaining = CHAR_LIMIT - body.length;

  const originalTitle = existingNote?.title ?? '';
const originalBody = existingNote?.body ?? '';
const originalCategory = existingNote?.category ?? null;

const hasChanges =
  title !== originalTitle ||
  body !== originalBody ||
  category !== originalCategory;

useEffect(() => {
  const unsubscribe = navigation.addListener('beforeRemove', (e) => {
    if (!hasChanges || saving) {
      return;
    }

    e.preventDefault();

    Alert.alert(
      'Discard changes?',
      'Your edits will be lost.',
      [
        {
          text: 'Keep Editing',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]
    );
  });

  return unsubscribe;
}, [navigation, hasChanges, saving]);

return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>

  
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (!title.trim() && !body.trim()) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving || (!title.trim() && !body.trim())}
        >
        <Text style={styles.saveBtnText}>
          {saving ? 'Saving...' : 'Save'}
        </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chipRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={getChipStyle(cat)}
              onPress={() => setCategory(category === cat ? null : cat)}
            >
              <Text style={getChipTextStyle(cat)}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          placeholderTextColor="#C4BCB0"
          value={title}
          onChangeText={setTitle}
          maxLength={120}
          returnKeyType="next"
        />

        <View style={styles.divider} />

        <TextInput
          style={styles.bodyInput}
          placeholder="Write your note…"
          placeholderTextColor="#C4BCB0"
          value={body}
          onChangeText={t => { if (t.length <= CHAR_LIMIT) setBody(t); }}
          multiline
          textAlignVertical="top"
        />

        <Text style={[styles.charCount, remaining < 0 && { color: '#D84040' }]}>
          {remaining} characters remaining
        </Text>

        {existingNote && (
          <>
            <View style={styles.metaDivider} />
            <View style={styles.metaBlock}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Created</Text>
                <Text style={styles.metaValue}>{formatMeta(existingNote.createdAt)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Last edited</Text>
                <Text style={styles.metaValue}>{formatMeta(existingNote.updatedAt)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE2',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { fontSize: 18, color: '#8A7F72', lineHeight: 22 },
  backLabel: { fontSize: 14, color: '#8A7F72' },
  saveBtn: {
    backgroundColor: '#2C2620',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnDisabled: { backgroundColor: '#D4CFC8' },
  saveBtnText: { color: '#FAF8F3', fontSize: 14, fontWeight: '600' },
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { padding: 20, paddingBottom: 48 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipInactive: { borderColor: '#E2DDD4', backgroundColor: 'transparent' },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextInactive: { color: '#B5AD9E' },
  titleInput: {
    fontSize: 24,
    fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia',
    fontWeight: '400',
    color: '#2C2620',
    paddingVertical: 0,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EBE2',
    marginBottom: 14,
  },
  bodyInput: {
    fontSize: 16,
    color: '#4A4238',
    lineHeight: 26,
    minHeight: 200,
    paddingVertical: 0,
  },
  charCount: {
    fontSize: 11,
    color: '#B5AD9E',
    textAlign: 'right',
    marginTop: 10,
  },
  metaDivider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E8E2D8',
    marginVertical: 20,
  },
  metaBlock: { gap: 8 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: { fontSize: 12, color: '#B5AD9E' },
  metaValue: { fontSize: 12, color: '#8A7F72' },
});