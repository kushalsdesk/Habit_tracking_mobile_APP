import {
  DATABASE_ID,
  COLLECTION_ID,
  COMPLETIONS_COLLECTION_ID,
  RealtimeResponse,
  client,
  databases,
  getRealtimeChannel,
  hasChangeEvent,
  isCreateEvent,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/authContext";
import { Habit, HabitCompletion, calculateStreak } from "@/types/database.type";
import { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Query } from "react-native-appwrite";
import { ScrollView } from "react-native-gesture-handler";
import { Card, Text, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

const StreaksScreen = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHabits = useCallback(async () => {
    if (!user?.$id) return;

    try {
      const resp = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.equal("user_ID", user.$id),
      ]);
      setHabits(resp.documents as Habit[]);
    } catch (err) {
      console.error("❌ Error fetching habits:", err);
    }
  }, [user?.$id]);

  const fetchCompletions = useCallback(async () => {
    if (!user?.$id) return;

    try {
      const resp = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("user_ID", user.$id),
          Query.orderDesc("completed_at"), // ✅ Get most recent first
          Query.limit(1000), // Fetch more for accurate calculations
        ],
      );
      setCompletions(resp.documents as HabitCompletion[]);
    } catch (err) {
      console.error("❌ Error fetching completions:", err);
    }
  }, [user?.$id]);

  useEffect(() => {
    if (!user?.$id) return;

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchHabits(), fetchCompletions()]);
      setIsLoading(false);
    };

    loadData();

    // Set up realtime subscriptions
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
          fetchCompletions();
        }
      },
    );

    return () => {
      habitsUnsubscribe();
      completionsUnsubscribe();
    };
  }, [user?.$id, fetchHabits, fetchCompletions]);

  const habitStats: HabitWithStats[] = habits.map((habit) => {
    const habitCompletions = completions.filter(
      (c) => c.habit_ID === habit.$id,
    );

    const stats = calculateStreak(habitCompletions);

    return {
      ...habit,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      totalCompletions: stats.totalCompletions,
    };
  });

  const rankedHabits = [...habitStats].sort(
    (a, b) => b.longestStreak - a.longestStreak,
  );

  const topThree = rankedHabits.slice(0, 3);
  const badgeColors = ["#ffd700", "#c0c0c0", "#cd7f32"]; // Gold, Silver, Bronze

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading streak data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="chart-line" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No Habits Yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first habit to start tracking streaks!
          </Text>
        </View>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <View style={styles.podiumContainer}>
              <Text style={styles.podiumTitle}>🏆 Top Performers</Text>
              {topThree.map((item, index) => (
                <View key={item.$id} style={styles.podiumRow}>
                  <View
                    style={[
                      styles.podiumBadge,
                      { backgroundColor: badgeColors[index] },
                    ]}
                  >
                    <Text style={styles.podiumRank}>{index + 1}</Text>
                  </View>
                  <Text style={styles.podiumHabit} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.podiumStreak}>
                    <MaterialCommunityIcons
                      name="fire"
                      size={16}
                      color="#ff9800"
                    />
                    <Text style={styles.podiumStreakText}>
                      {item.longestStreak}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* All Habits List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {rankedHabits.map((habit, index) => (
              <Card
                key={habit.$id}
                style={[styles.card, index === 0 && styles.firstCard]}
              >
                <Card.Content>
                  <View style={styles.habitHeader}>
                    <Text variant="titleMedium" style={styles.habitTitle}>
                      {habit.title}
                    </Text>
                    {index < 3 && (
                      <View
                        style={[
                          styles.rankBadge,
                          { backgroundColor: badgeColors[index] },
                        ]}
                      >
                        <Text style={styles.rankText}>#{index + 1}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.habitDesc} numberOfLines={2}>
                    {habit.description}
                  </Text>

                  <View style={styles.statsRow}>
                    <View style={styles.statsBadge}>
                      <MaterialCommunityIcons
                        name="fire"
                        size={20}
                        color="#ff9800"
                      />
                      <Text style={styles.statsNumber}>
                        {habit.currentStreak}
                      </Text>
                      <Text style={styles.statsLabel}>Current</Text>
                    </View>

                    <View style={styles.statsBadgeGold}>
                      <MaterialCommunityIcons
                        name="trophy"
                        size={20}
                        color="#ffc107"
                      />
                      <Text style={styles.statsNumber}>
                        {habit.longestStreak}
                      </Text>
                      <Text style={styles.statsLabel}>Best</Text>
                    </View>

                    <View style={styles.statsBadgeGreen}>
                      <MaterialCommunityIcons
                        name="check-all"
                        size={20}
                        color="#4caf50"
                      />
                      <Text style={styles.statsNumber}>
                        {habit.totalCompletions}
                      </Text>
                      <Text style={styles.statsLabel}>Total</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
};

export default StreaksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
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
  title: {
    fontWeight: "bold",
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  podiumContainer: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  podiumTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 16,
    color: "#6200ee",
  },
  podiumRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  podiumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  podiumRank: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 16,
  },
  podiumHabit: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  podiumStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  podiumStreakText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff9800",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  firstCard: {
    borderWidth: 2,
    borderColor: "#6200ee",
    elevation: 4,
  },
  habitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  habitTitle: {
    fontWeight: "bold",
    fontSize: 18,
    flex: 1,
    color: "#22223b",
  },
  rankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  rankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  habitDesc: {
    color: "#6c6c80",
    marginBottom: 16,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statsBadge: {
    flex: 1,
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statsBadgeGold: {
    flex: 1,
    backgroundColor: "#fffde7",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statsBadgeGreen: {
    flex: 1,
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statsNumber: {
    fontWeight: "bold",
    fontSize: 20,
    color: "#22223b",
    marginTop: 4,
  },
  statsLabel: {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
    fontWeight: "500",
  },
});
