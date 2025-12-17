import { COLLECTION_ID, DATABASE_ID, databases } from "@/lib/appwrite";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { ID } from "react-native-appwrite";
import {
  Button,
  SegmentedButtons,
  TextInput,
  useTheme,
  Text,
} from "react-native-paper";

const FREQUENCIES = ["daily", "weekly", "monthly"];
type Frequncy = (typeof FREQUENCIES)[number];

const AddHabitScreen = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDesc] = useState<string>("");
  const [freq, setFreq] = useState<Frequncy>("daily");
  const [err, setError] = useState<string>("");
  const { user } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!user) return;
    try {
      await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        user_ID: user.$id,
        title,
        description,
        frequency: freq,
        streak_count: 0,
        last_completed: new Date().toISOString(),
        $createdAt: new Date().toISOString(),
      });
      router.back();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        return;
      }
      setError("There was error creating habit");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        label="Title"
        mode="outlined"
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.textInput}
        label="Description"
        mode="outlined"
        onChangeText={setDesc}
      />
      <View style={styles.freqContainer}>
        <SegmentedButtons
          value={freq}
          onValueChange={(value) => setFreq(value as Frequncy)}
          buttons={FREQUENCIES.map((freq) => ({
            value: freq,
            label: freq.charAt(0).toUpperCase() + freq.slice(1),
          }))}
        />
      </View>
      <Button
        mode="contained"
        disabled={!title || !description}
        onPress={handleSubmit}
      >
        Add Habit
      </Button>
      {err && <Text style={{ color: theme.colors.error }}>{err}</Text>}
    </View>
  );
};
export default AddHabitScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "f5f5f5",
    justifyContent: "center",
  },
  textInput: {
    marginBottom: 16,
  },
  freqContainer: {
    marginBottom: 16,
  },
});
