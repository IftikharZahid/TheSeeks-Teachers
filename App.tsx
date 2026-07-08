import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import * as SplashScreenNative from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreenNative.preventAutoHideAsync().catch(() => {});
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import { initAuthListener } from './src/store/slices/authSlice';
import { loadSavedTheme } from './src/store/slices/themeSlice';
import { initCoursesListener } from './src/store/slices/coursesSlice';
import { initTeachersListener } from './src/store/slices/teachersSlice';
import { initNotificationsListener } from './src/store/slices/notificationsSlice';
import { initVideoGalleriesListener, initLikedVideosListener } from './src/store/slices/videosSlice';
import { initMessagesListener, loadLastReadTimestamp } from './src/store/slices/messagesSlice';
import { initSyncListener } from './src/store/syncManager';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Audio } from 'expo-av';

/**
 * Inner component that has access to Redux dispatch
 * and initialises all Firebase listeners once on mount.
 */
function AppContent() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const profile = useAppSelector((state) => state.auth.profile);

  // ── Global Auth & Data Listeners ────────────────────
  useEffect(() => {
    // Configure audio to play even if the device is on silent mode
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});

    // Dismiss the native Expo splash screen once our app is ready
    SplashScreenNative.hideAsync().catch(() => {});

    dispatch(loadSavedTheme());
    dispatch(loadLastReadTimestamp());

    const unsubAuth = initAuthListener(dispatch);
    const unsubCourses = initCoursesListener(dispatch);
    const unsubTeachers = initTeachersListener(dispatch);
    const unsubNotifications = initNotificationsListener(dispatch);
    const unsubGalleries = initVideoGalleriesListener(dispatch);
    const unsubSync = initSyncListener(dispatch);

    return () => {
      unsubAuth();
      unsubCourses();
      unsubTeachers();
      unsubNotifications();
      unsubGalleries();
      unsubSync();
    };
  }, [dispatch]);

  // ── User-Specific Data Listeners ────────────────────
  useEffect(() => {
    if (user && user.uid) {
      const unsubLikedVideos = initLikedVideosListener(dispatch, user.uid);
      return () => {
        unsubLikedVideos();
      };
    }
  }, [dispatch, user?.uid]);

  // ── Profile-Dependent Global Listeners ────────────────
  useEffect(() => {
    if (profile) {
      const unsubMessages = initMessagesListener(dispatch, profile);
      return () => {
        unsubMessages();
      };
    }
  }, [dispatch, profile]);

  return <AppNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <StatusBar backgroundColor="#030b2e" barStyle="light-content" translucent={false} />
          <AppContent />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}