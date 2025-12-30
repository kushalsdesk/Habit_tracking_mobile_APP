import {
  client,
  HABITS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  RealtimeResponse,
  HABITS_COMPLETIONS_ID,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/authContext";
import { Habit, HabitCompletion } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View, ScrollView } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface, Text } from "react-native-paper";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<string[]>();
  const [isLoading, setIsLoading] = useState(false);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  useEffect(() => {
    if (!user?.$id) return;

    fetchHabits();

    const habits_channel = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
    const completions_channel = `databases.${DATABASE_ID}.collections.${HABITS_COMPLETIONS_ID}.documents`;

    const habits_unsubscribe = client.subscribe(
      habits_channel,
      (resp: RealtimeResponse) => {
        const hasCreate = resp.events.includes(
          "databases.*.collections.*.documents.*.create",
        );
        const hasUpdate = resp.events.includes(
          "databases.*.collections.*.documents.*.update",
        );
        const hasDelete = resp.events.includes(
          "databases.*.collections.*.documents.*.delete",
        );

        if (hasCreate || hasUpdate || hasDelete) {
          fetchHabits();
        }
      },
    );

    const completions_unsubscribe = client.subscribe(
      completions_channel,
      (resp: RealtimeResponse) => {
        const hasCreate = resp.events.includes(
          "databases.*.collections.*.documents.*.create",
        );

        if (hasCreate) {
          fetchTodayCompletions();
        }
      },
    );

    return () => {
      habits_unsubscribe();
      completions_unsubscribe();
    };
  }, [user?.$id]);

  const fetchHabits = async () => {
    if (!user?.$id) return;

    setIsLoading(true);
    try {
      const resp = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_ID", user.$id)],
      );
      setHabits(resp.documents as Habit[]);
    } catch (err) {
      console.error("Error fetching habits:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodayCompletions = async () => {
    if (!user?.$id) return;

    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const resp = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COMPLETIONS_ID,
        [
          Query.equal("user_ID", user.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ],
      );
      const completedHabits = resp.documents as HabitCompletion[];
      setCompletedHabits(completedHabits.map((ch) => ch.habit_ID));
    } catch (err) {
      console.error("Error fetching habits:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, HABITS_COLLECTION_ID, id);
    } catch (err) {
      console.log(err);
    }
  };

  const handleCompleteHabit = async (id: string) => {
    if (!user || completedHabits?.includes(id)) return;
    try {
      await databases.createDocument(
        DATABASE_ID,
        HABITS_COMPLETIONS_ID,
        ID.unique(),
        {
          habit_ID: id,
          user_ID: user.$id,
          completed_at: new Date().toISOString(),
        },
      );
      const habit = habits?.find((h) => h.$id === id);
      if (!habit) return;
      await databases.updateDocument(DATABASE_ID, HABITS_COLLECTION_ID, id, {
        streak_count: habit.streak_count + 1,
        last_completed: new Date().toISOString(),
      });
    } catch (err) {
      console.log(err);
    }
  };

  const isCompleted = (habit_id: string) => completedHabits?.includes(habit_id);

  const renderLeft = () => (
    <View style={styles.swipeActionLeft}>
      <MaterialCommunityIcons
        name="trash-can-outline"
        size={32}
        color={"#FFF"}
      />
    </View>
  );

  const renderRight = (habit_id: string) => (
    <View style={styles.swipeActionRight}>
      {isCompleted(habit_id) ? (
        <Text style={{ color: "#FFF" }}>Completed!</Text>
      ) : (
        <MaterialCommunityIcons
          name="check-circle-outline"
          size={32}
          color={"#FFF"}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Todays Habits
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

      {isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Loading habits...</Text>
        </View>
      ) : habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No Habits Yet.</Text>
          <Text style={styles.emptyStateSubtext}>
            Tap the + button to create your first habit!
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {habits.map((habit) => (
            <Swipeable
              ref={(ref) => {
                swipeableRefs.current[habit.$id] = ref;
              }}
              key={habit?.$id}
              overshootLeft={false}
              overshootRight={true}
              renderLeftActions={renderLeft}
              renderRightActions={() => renderRight(habit.$id)}
              onSwipeableOpen={(direction) => {
                if (direction === "left") {
                  handleDeleteHabit(habit?.$id);
                } else if (direction === "right") {
                  handleCompleteHabit(habit?.$id);
                }
                swipeableRefs.current[habit?.$id]?.close();
              }}
            >
              <Surface
                style={[
                  styles.card,
                  isCompleted(habit.$id) && styles.cardCompleted,
                ]}
                elevation={0}
              >
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
            </Swipeable>
          ))}
        </ScrollView>
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
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        shadowColor: "#000",
      },
    }),
    borderBottomWidth: Platform.OS === "android" ? 4 : 0,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  cardCompleted: {
    backgroundColor: "orange",
    opacity: 0.6,
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
    fontSize: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "#999999",
    fontSize: 14,
  },
  swipeActionLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    backgroundColor: "#e53935",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingLeft: 16,
  },
  swipeActionRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    backgroundColor: "#4caf50",
    borderRadius: 18,
    marginBottom: 18,
    marginTop: 2,
    paddingRight: 16,
  },
});
