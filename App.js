import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import NotesListScreen from './screens/NotesListScreen';
import EditNoteScreen  from './screens/EditNoteScreen';
import { saveNotes, loadNotes } from './storage/notesStorage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Load once on mount
  useEffect(() => {
    loadNotes().then(stored => {
      setNotes(stored);
      setLoaded(true);
    });
  }, []);

  // Persist whenever notes change (skip the initial empty load)
  useEffect(() => {
    if (loaded) saveNotes(notes);
  }, [notes, loaded]);

  if (!loaded) {
  return (
    <SafeAreaProvider>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FAF8F3',
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: '#8A7F72',
          }}
        >
          Loading notes...
        </Text>
      </View>
    </SafeAreaProvider>
  );
}

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,      // both screens use custom nav bars
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="Notes">
            {props => (
              <NotesListScreen {...props} notes={notes} setNotes={setNotes} />
            )}
          </Stack.Screen>
          <Stack.Screen name="EditNote">
            {props => (
              <EditNoteScreen {...props} setNotes={setNotes} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}