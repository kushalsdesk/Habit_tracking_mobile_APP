import { useAuth } from "@/lib/authContext";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View, StyleSheet } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const theme = useTheme();
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Fill out all the values");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      let errorMessage: string | null;

      if (isSignUp) {
        errorMessage = await signUp(email, password);
      } else {
        errorMessage = await signIn(email, password);
      }

      if (errorMessage) {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = () => {
    setIsSignUp((prev) => !prev);
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title} variant="headlineMedium">
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>
        <TextInput
          style={styles.input}
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          disabled={isLoading}
        />

        <TextInput
          style={styles.input}
          label="Password"
          aria-label="password"
          secureTextEntry
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          disabled={isLoading}
        />

        {error && (
          <Text style={{ color: theme.colors.error, marginBottom: 8 }}>
            {error}
          </Text>
        )}

        <Button
          style={styles.button}
          mode="contained"
          onPress={handleAuth}
          loading={isLoading}
          disabled={isLoading}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        <Button
          mode="text"
          onPress={handleSwitch}
          style={styles.switchMode}
          disabled={isLoading}
        >
          {isSignUp
            ? "Already have an Account? Sign In"
            : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  switchMode: {
    marginTop: 16,
  },
});
