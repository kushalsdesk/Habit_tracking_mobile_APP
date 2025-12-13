import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const [isNavigationReady, setNavigationReady] = useState(false);
  const isAuth = false;

  useEffect(() => {
    if (!isNavigationReady && navigationState?.key) {
      setNavigationReady(true);
    }
  }, [navigationState?.key, isNavigationReady]);

  useEffect(() => {
    if (!isNavigationReady) return;

    const inAuthGroup = segments[0] === "(tabs)" || segments[0] === "auth";

    if (!isAuth && !inAuthGroup) {
      router.replace("/auth");
    } else if (isAuth && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isNavigationReady, router, segments, isAuth]);

  if (!isNavigationReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
