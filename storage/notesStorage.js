import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_KEY = '@notes_v1';

export async function saveNotes(notes) {
  try {
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return true;
  } catch (e) {
    console.error('[notesStorage] save failed:', e);
    return false;
  }
}

export async function loadNotes() {
  try {
    const raw = await AsyncStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[notesStorage] load failed:', e);
    return [];
  }
}