import { HABITS_COLLECTION_ID, DATABASE_ID, databases } from "@/lib/appwrite";
import { useAuth } from "@/lib/authContext";
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
} from "react-native-paper";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCIES)[number];

const AddHabitScreen = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDesc] = useState<string>("");
  const [freq, setFreq] = useState<Frequency>("daily");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

    setError("");
    setIsLoading(true);

    try {
      await databases.createDocument(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        ID.unique(),
        {
          user_ID: user.$id,
          title: title.trim(),
          description: description.trim(),
          frequency: freq,
          streak_count: 0,
          last_completed: "",
        },
      );

      setTitle("");
      setDesc("");
      setFreq("daily");
      setError("");

      router.back();
    } catch (err) {
      console.error("Error creating habit:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("There was an error creating the habit");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <TextInput
          style={styles.textInput}
          label="Title"
          mode="outlined"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Morning Exercise"
          disabled={isLoading}
        />

        <TextInput
          style={styles.textInput}
          label="Description"
          mode="outlined"
          value={description}
          onChangeText={setDesc}
          placeholder="e.g., 30 minutes of cardio"
          multiline
          numberOfLines={3}
          disabled={isLoading}
        />

        <View style={styles.freqContainer}>
          <Text style={styles.freqLabel}>Frequency</Text>
          <SegmentedButtons
            value={freq}
            onValueChange={(value) => setFreq(value as Frequency)}
            buttons={FREQUENCIES.map((frequency) => ({
              value: frequency,
              label: frequency.charAt(0).toUpperCase() + frequency.slice(1),
            }))}
          />
        </View>

        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          disabled={!title.trim() || !description.trim() || isLoading}
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.submitButton}
        >
          {isLoading ? "Creating..." : "Add Habit"}
        </Button>
      </View>
    </KeyboardAvoidingView>
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
    padding: 16,
    justifyContent: "center",
  },
  textInput: {
    marginBottom: 16,
  },
  freqContainer: {
    marginBottom: 16,
  },
  freqLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  errorText: {
    marginBottom: 12,
    fontSize: 14,
  },
  submitButton: {
    marginTop: 8,
  },
});
