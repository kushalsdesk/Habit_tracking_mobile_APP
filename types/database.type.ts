import { Models } from "react-native-appwrite";

export type HabitFrequency = "daily" | "weekly" | "monthly";

export interface Habit extends Models.Document {
  user_ID: string;
  title: string;
  description: string;
  frequency: string;
  streak_count: number;
  last_completed: string | null;
}

export interface HabitCompletion extends Models.Document {
  habit_ID: string;
  user_ID: string;
  completed_at: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedDate: string | null;
}

/*
Data required for creating record
*/
export interface CreateHabitPayload {
  user_ID: string;
  title: string;
  description: string;
  frequency: HabitFrequency;
  streak_count?: number;
  last_completed?: string | null;
}

/*
Data required for updating record
*/

export interface UpdateHabitPayload {
  title?: string;
  description?: string;
  frequency?: HabitFrequency;
  streak_count?: number;
  last_completed?: string | null;
}

/*
Data required for updating record
*/

export interface CreateCompletionPayload {
  habit_ID: string;
  user_ID: string;
  completed_at: string;
}

//Type guards

/*
if a value valid HabitFrequency
*/

export function isValidFrequency(value: string): value is HabitFrequency {
  return ["daily", "weekly", "monthly"].includes(value);
}

/*
if a habit completed today
*/

export function isCompetedToday(habit: Habit): boolean {
  if (!habit.last_completed) return false;

  const today = new Date().toDateString();
  const lastCompleted = new Date(habit.last_completed).toDateString();

  return today === lastCompleted;
}

/*
if habit overdue based on frequency
*/

export function isOverdue(habit: Habit): boolean {
  if (!habit.last_completed) return true;

  const lastCompleted = new Date(habit.last_completed);
  const now = new Date();
  const daysSinceCompletion = Math.floor(
    (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24),
  );

  switch (habit.frequency) {
    case "daily":
      return daysSinceCompletion >= 1;
    case "weekly":
      return daysSinceCompletion >= 7;
    case "monthly":
      return daysSinceCompletion >= 30;
    default:
      return false;
  }
}

/*
display text for frequency
*/

export function getFrequencyLabel(frequency: HabitFrequency): string {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
}

/*
Calculate streak from completion history
*/

export function calculateStreak(completions: HabitCompletion[]): StreakData {
  if (completions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      lastCompletedDate: null,
    };
  }

  const sorted = [...completions].sort(
    (a, b) =>
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
  );

  let currentStreak = 0,
    longestStreak = 0,
    tempStreak = 1,
    previousDate = new Date(sorted[0].completed_at);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastCompletion = new Date(sorted[0].completed_at);
  lastCompletion.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff <= 1) {
    currentStreak = 1;

    //calculating current streak

    for (let i = 1; i < sorted.length; i++) {
      const currentDate = new Date(sorted[i].completed_at);
      const diffDays = Math.floor(
        (previousDate.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        currentStreak++;
        previousDate = currentDate;
      } else {
        break;
      }
    }
  }

  // calculating longest streak

  for (let i = 1; i < sorted.length; i++) {
    const currentDate = new Date(sorted[i].completed_at);
    const diffDays = Math.floor(
      (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
    previousDate = currentDate;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak: Math.max(currentStreak, longestStreak),
    longestStreak,
    totalCompletions: completions.length,
    lastCompletedDate: sorted[0].completed_at,
  };
}

/*
validate habit creation payload
*/
export function validateHabitPayload(payload: Partial<CreateHabitPayload>): {
  valid: boolean;
  error?: string;
} {
  if (!payload.title || payload.title.trim().length === 0) {
    return { valid: false, error: "Title is required" };
  }

  if (payload.title.trim().length > 100) {
    return { valid: false, error: "Title must be less than 100 characters" };
  }

  if (!payload.description || payload.description.trim().length === 0) {
    return { valid: false, error: "Description is required" };
  }

  if (payload.description.trim().length > 500) {
    return {
      valid: false,
      error: "Description must be less than 500 characters",
    };
  }

  if (!payload.frequency || !isValidFrequency(payload.frequency)) {
    return { valid: false, error: "Valid frequency is required" };
  }

  if (!payload.user_ID) {
    return { valid: false, error: "User ID is required" };
  }

  return { valid: true };
}
