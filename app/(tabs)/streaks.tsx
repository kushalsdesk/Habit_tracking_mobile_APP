import {
  DATABASE_ID,
  HABITS_COLLECTION_ID,
  HABITS_COMPLETIONS_ID,
  databases,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/authContext";
import { Habit, HabitCompletion, StreakData } from "@/types/database.type";
import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Query } from "react-native-appwrite";
import { Card, Text } from "react-native-paper";

const StreaksScreen = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.$id) return;

    fetchHabits();
    fetchCompletions();
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

  const fetchCompletions = async () => {
    if (!user?.$id) return;

    setIsLoading(true);
    try {
      const resp = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COMPLETIONS_ID,
        [Query.equal("user_ID", user.$id ?? "")],
      );
      const completedHabits = resp.documents as HabitCompletion[];
      setCompletedHabits(completedHabits);
    } catch (err) {
      console.error("Error fetching habits:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStreakData = (habit_ID: string): StreakData => {
    const habitCompleted = completedHabits
      ?.filter((ch) => ch.habit_ID === habit_ID)
      .sort(
        (a, b) =>
          new Date(a.completed_at).getTime() -
          new Date(b.completed_at).getTime(),
      );

    if (habitCompleted?.length === 0) {
      return { streak: 0, bestStreak: 0, total: 0 };
    }

    let streak: number = 0,
      bestStreak: number = 0,
      total: number = habitCompleted.length;
    let lastDate: Date | null = null,
      currentStreak: number = 0;

    habitCompleted?.forEach((ch) => {
      const date = new Date(ch.completed_at);
      if (lastDate) {
        const diff =
          (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diff <= 1.5) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      } else {
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        streak = currentStreak;
        lastDate = date;
      }
    });

    return {
      streak,
      bestStreak,
      total,
    };
  };

  const habitStreaks = habits.map((habit) => {
    const { streak, bestStreak, total } = getStreakData(habit.$id);
    return { habit, bestStreak, streak, total };
  });
  const rankedHabits = habitStreaks.sort((a, b) => a.bestStreak - b.bestStreak);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habits Streaks</Text>
      {habits.length === 0 ? (
        <View>
          <Text> No habits yet. Add your first Habit!</Text>
        </View>
      ) : (
        rankedHabits.map(({ habit, streak, bestStreak, total }, key) => (
          <Card key={key} style={[styles.card, key === 0 && styles.firstCard]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.habitTitle}>
                {habit.title}
              </Text>
              <Text style={styles.habitDesc}>{habit.description}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statsBadge}>
                  <Text style={styles.statsText}>🔥 {streak}</Text>
                  <Text style={styles.statsLabel}>Current</Text>
                </View>

                <View style={styles.statsBadgeGold}>
                  <Text style={styles.statsText}>🏆{bestStreak}</Text>
                  <Text style={styles.statsLabel}>Best</Text>
                </View>

                <View style={styles.statsBadgeGreen}>
                  <Text style={styles.statsText}>✅{total}</Text>
                  <Text style={styles.statsLabel}>Total</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5f5f5",
    padding: 16,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },

  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "f0f0f0",
  },
  firstCard: {
    borderWidth: 2,
    borderColor: "#7c4dff",
  },
  habitTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 2,
  },
  habitDesc: {
    color: "#6c6c80",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 8,
  },
  statsBadge: {
    backgroundColor: "#fff3e0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },

  statsBadgeGold: {
    backgroundColor: "#fffde7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },

  statsBadgeGreen: {
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 60,
  },
  statsText: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#22223b",
  },
  statsLabel: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
    fontWeight: "500",
  },
});

export default StreaksScreen;
