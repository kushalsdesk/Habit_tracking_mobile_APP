import { Models } from "react-native-appwrite";

export interface Habit extends Models.Document {
  user_ID: string;
  title: string;
  description: string;
  frequency: string;
  streak_count: string;
  last_completed: string;
  created_at: string;
}

export interface HabitCompletion extends Models.Document {
  habit_ID: string;
  user_ID: string;
  completed_at: string;
}
