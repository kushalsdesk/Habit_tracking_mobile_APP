import { AuthProvider, useAuth } from "@/lib/authContext";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Models } from "react-native-appwrite";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const useAuthRedirect = (
  isAuth: Models.User<Models.Preferences> | null,
  isLoading: boolean,
) => {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!isAuth && !inAuthGroup) {
      router.replace("/auth");
    } else if (isAuth && inAuthGroup) {
      router.replace("/");
    }
  }, [isLoading, isAuth, segments, router]);
};

export const RootLayoutNav = () => {
  const { user, isLoadingUser } = useAuth();
  const navigationState = useRootNavigationState();

  useAuthRedirect(user, isLoadingUser);
  const isLoading = !navigationState?.key || isLoadingUser;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="auth"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SafeAreaProvider>
          <RootLayoutNav />
        </SafeAreaProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
