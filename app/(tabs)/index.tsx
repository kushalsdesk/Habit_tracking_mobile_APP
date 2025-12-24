import {
  client,
  COLLECTION_ID,
  DATABASE_ID,
  databases,
  RealtimeResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/authContext";
import { Habit } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Button, Surface, Text } from "react-native-paper";

export default function Index() {
  const { signOut, user } = useAuth();

  const [habits, setHabits] = useState<Habit[]>();

  useEffect(() => {
    if (user?.$id) {
      fetchHabits();
    }
    const habitSub = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`,
      (resp: RealtimeResponse) => {},
    );
  }, [user?.$id]);

  const fetchHabits = async () => {
    if (!user?.$id) return;
    try {
      const resp = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal("user_ID", user?.$id ?? ""),
      ]);
      setHabits(resp.documents as Habit[]);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Todays Habit
        </Text>

        <Button
          mode="text"
          onPress={signOut}
          icon={"logout"}
          style={{ marginTop: 10 }}
        >
          Log Out
        </Button>
      </View>

      {habits?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No Habits Yet.</Text>
        </View>
      ) : (
        habits?.map((habit, key) => (
          <Surface key={habit.$id} style={styles.card} elevation={4}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{habit.title}</Text>
              <Text style={styles.cardDesc}>{habit.description}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.streakBadge}>
                  <MaterialCommunityIcons
                    name="fire"
                    size={18}
                    color={"#ff9800"}
                  />
                  <Text style={styles.streakText}>
                    {habit.streak_count} day streak
                  </Text>
                </View>
                <View style={styles.freqBadge}>
                  <Text style={styles.freqText}>
                    {habit.frequency.charAt(0).toUpperCase() +
                      habit.frequency.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#f7f2fa",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {},
    }),
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#22223b",
  },
  cardDesc: {
    fontSize: 15,
    marginBottom: 12,
    color: "#6c6c80",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  streakText: {
    marginLeft: 6,
    color: "#ff9800",
    fontWeight: "bold",
    fontSize: 14,
  },
  freqBadge: {
    backgroundColor: "#ede7f6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  freqText: {
    color: "#7c4dff",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    color: "#666666",
  },
});
