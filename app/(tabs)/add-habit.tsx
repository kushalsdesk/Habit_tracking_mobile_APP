import { COLLECTION_ID, DATABASE_ID, databases } from "@/lib/appwrite";
import { useAuth } from "@/lib/authContext";
import {
  CreateHabitPayload,
  Habit,
  HabitFrequency,
  validateHabitPayload,
} from "@/types/database.type";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  SegmentedButtons,
  TextInput,
  useTheme,
  Text,
  Snackbar,
} from "react-native-paper";

const FREQUENCIES: HabitFrequency[] = ["daily", "weekly", "monthly"];

const AddHabitScreen = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDesc] = useState<string>("");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!user) {
      setError("You must be logged in to create a habit");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    const payload: CreateHabitPayload = {
      user_ID: user.$id,
      title: title.trim(),
      description: description.trim(),
      frequency: frequency,
      streak_count: 0,
      last_completed: null,
    };
    const validation = validateHabitPayload(payload);
    if (!validation.valid) {
      setError(validation.error || "Invalid Input");
    }

    setError("");
    setIsLoading(true);

    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        payload,
      );

      setTitle("");
      setDesc("");
      setFrequency("daily");

      setShowSuccess(true);

      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("document_already_exists")) {
          setError("A habit with this title already exists");
        } else if (err.message.includes("unauthorized")) {
          setError("You don't have permission to create habits");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to create habit. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const isFormValid = title.trim().length > 0 && description.trim().length > 0;

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <View style={styles.content}>
          <TextInput
            style={styles.textInput}
            label="Habit Title"
            mode="outlined"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Morning Exercise"
            disabled={isLoading}
            maxLength={100}
            error={error.includes("Title") || error.includes("title")}
          />

          <TextInput
            style={styles.textInput}
            label="Description"
            mode="outlined"
            value={description}
            onChangeText={setDesc}
            placeholder="e.g., 30 minutes of cardio every morning"
            multiline
            numberOfLines={4}
            disabled={isLoading}
            maxLength={500}
            error={
              error.includes("Description") || error.includes("description")
            }
          />

          <View style={styles.freqContainer}>
            <Text style={styles.freqLabel}>Frequency</Text>
            <SegmentedButtons
              value={frequency}
              onValueChange={(value) => setFrequency(value as HabitFrequency)}
              buttons={FREQUENCIES.map((frequency) => ({
                value: frequency,
                label: frequency.charAt(0).toUpperCase() + frequency.slice(1),
              }))}
            />
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          <Button
            mode="contained"
            disabled={!isFormValid || isLoading}
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            {isLoading ? "Creating..." : "Create Habit"}
          </Button>

          <Text style={styles.helperText}>
            Your habit will appear on the &quot;Today&quot; tab and you can
            start tracking it immediately.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={2000}
        style={{ backgroundColor: "#4caf50" }}
      >
        ✅ Habit created successfully!
      </Snackbar>
    </>
  );
};

export default AddHabitScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  textInput: {
    marginBottom: 16,
  },
  freqContainer: {
    marginBottom: 20,
  },
  freqLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#c62828",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
  helperText: {
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    marginTop: 16,
    lineHeight: 18,
  },
});
