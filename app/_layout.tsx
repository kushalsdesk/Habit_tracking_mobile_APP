import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export function useAuthRedirect(isAuth: boolean) {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for navigation to be fully ready
    if (!navigationState?.key) return;
    setIsReady(true);
  }, [navigationState?.key]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "auth";

    if (!isAuth && !inAuthGroup) {
      router.replace("/auth");
    } else if (isAuth && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isReady, isAuth, segments, router]);
}

export default function RootLayout() {
  const isAuth = false;
  const navigationState = useRootNavigationState();

  useAuthRedirect(isAuth);

  if (!navigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: true }} />
    </Stack>
  );
}
