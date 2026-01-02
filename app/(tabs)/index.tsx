import {
  client,
  COLLECTION_ID,
  COMPLETIONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  RealtimeResponse,
  getRealtimeChannel,
  hasChangeEvent,
  isCreateEvent,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/authContext";
import { Habit, HabitCompletion } from "@/types/database.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View, ScrollView, Alert } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface, Text, ActivityIndicator } from "react-native-paper";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const fetchHabits = useCallback(async () => {
    if (!user?.$id) return;

    try {
      const resp = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal("user_ID", user.$id),
      ]);
      setHabits(resp.documents as Habit[]);
    } catch (err) {
      console.error("Error fetching habits:", err);
      Alert.alert("Error", "Failed to load habits. Please try again.");
    }
  }, [user?.$id]);

  const fetchTodayCompletions = useCallback(async () => {
    if (!user?.$id) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const resp = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("user_ID", user.$id),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ],
      );

      const completions = resp.documents as HabitCompletion[];
      const habitIds = completions.map((ch) => ch.habit_ID);
      setCompletedHabits(habitIds);
    } catch (err) {
      console.error("Error fetching completions:", err);
    }
  }, [user?.$id]);

  useEffect(() => {
    if (!user?.$id) return;

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchHabits(), fetchTodayCompletions()]);
      setIsLoading(false);
    };

    loadData();

    const habitsChannel = getRealtimeChannel(COLLECTION_ID);
    const completionsChannel = getRealtimeChannel(COMPLETIONS_COLLECTION_ID);

    const habitsUnsubscribe = client.subscribe(
      habitsChannel,
      (resp: RealtimeResponse) => {
        if (hasChangeEvent(resp.events)) {
          fetchHabits();
        }
      },
    );

    const completionsUnsubscribe = client.subscribe(
      completionsChannel,
      (resp: RealtimeResponse) => {
        if (isCreateEvent(resp.events)) {
          fetchTodayCompletions();
        }
      },
    );

    return () => {
      habitsUnsubscribe();
      completionsUnsubscribe();
    };
  }, [user?.$id, fetchHabits, fetchTodayCompletions]);

  const handleDeleteHabit = useCallback(async (habitId: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, habitId);
    } catch (err) {
      console.error("Error deleting habit:", err);
      Alert.alert("Error", "Failed to delete habit. Please try again.");
    }
  }, []);

  const handleCompleteHabit = useCallback(
    async (habitId: string) => {
      if (!user || completedHabits.includes(habitId)) {
        return;
      }

      try {
        const habit = habits.find((h) => h.$id === habitId);
        if (!habit) {
          console.error("❌ Habit not found");
          return;
        }

        await databases.createDocument(
          DATABASE_ID,
          COMPLETIONS_COLLECTION_ID,
          ID.unique(),
          {
            habit_ID: habitId,
            user_ID: user.$id,
            completed_at: new Date().toISOString(),
          },
        );

        const newStreakCount = Number(habit.streak_count) + 1;

        await databases.updateDocument(DATABASE_ID, COLLECTION_ID, habitId, {
          streak_count: newStreakCount,
          last_completed: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error completing habit:", err);
        Alert.alert(
          "Error",
          "Failed to mark habit as complete. Please try again.",
        );
      }
    },
    [user, habits, completedHabits],
  );

  const isCompleted = useCallback(
    (habitId: string) => completedHabits.includes(habitId),
    [completedHabits],
  );

  const renderLeftAction = useCallback(
    () => (
      <View style={styles.swipeActionLeft}>
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={32}
          color="#FFF"
        />
        <Text style={styles.swipeActionText}>Delete</Text>
      </View>
    ),
    [],
  );

  const renderRightAction = useCallback(
    (habitId: string) => {
      const completed = isCompleted(habitId);

      return (
        <View style={styles.swipeActionRight}>
          {completed ? (
            <>
              <MaterialCommunityIcons
                name="check-circle"
                size={32}
                color="#FFF"
              />
              <Text style={styles.swipeActionText}>Done!</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={32}
                color="#FFF"
              />
              <Text style={styles.swipeActionText}>Complete</Text>
            </>
          )}
        </View>
      );
    },
    [isCompleted],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading your habits...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>
            {completedHabits.length} of {habits.length} completed
          </Text>
        </View>

        <Button mode="text" onPress={signOut} icon="logout" compact>
          Log Out
        </Button>
      </View>

      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="calendar-blank"
            size={64}
            color="#ccc"
          />
          <Text style={styles.emptyStateText}>No Habits Yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Tap the + button below to create your first habit!
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {habits.map((habit) => (
            <Swipeable
              ref={(ref) => {
                swipeableRefs.current[habit.$id] = ref;
              }}
              key={habit.$id}
              overshootLeft={false}
              overshootRight={false}
              renderLeftActions={renderLeftAction}
              renderRightActions={() => renderRightAction(habit.$id)}
              onSwipeableOpen={(direction) => {
                if (direction === "left") {
                  handleDeleteHabit(habit.$id);
                } else if (direction === "right") {
                  handleCompleteHabit(habit.$id);
                }
                swipeableRefs.current[habit.$id]?.close();
              }}
            >
              <Surface
                style={[
                  styles.card,
                  isCompleted(habit.$id) && styles.cardCompleted,
                ]}
                elevation={2}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{habit.title}</Text>
                    {isCompleted(habit.$id) && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color="#4caf50"
                      />
                    )}
                  </View>

                  <Text style={styles.cardDesc}>{habit.description}</Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.streakBadge}>
                      <MaterialCommunityIcons
                        name="fire"
                        size={18}
                        color="#ff9800"
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
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
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
  },
  cardCompleted: {
    backgroundColor: "#e8f5e9",
    opacity: 0.8,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#22223b",
    flex: 1,
  },
  cardDesc: {
    fontSize: 15,
    marginBottom: 12,
    color: "#6c6c80",
    lineHeight: 20,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    color: "#666",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  swipeActionLeft: {
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    backgroundColor: "#e53935",
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  swipeActionRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    backgroundColor: "#4caf50",
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  swipeActionText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 12,
    marginTop: 4,
  },
});
