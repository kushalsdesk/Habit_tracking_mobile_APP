import { Account, Client, Databases } from "react-native-appwrite";

const requiredEnvVars = {
  EXPO_PUBLIC_APPWRITE_ENDPOINT: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  EXPO_PUBLIC_DB_ID: process.env.EXPO_PUBLIC_DB_ID,
  EXPO_PUBLIC_APPWRITE_PROJECT_NAME:
    process.env.EXPO_PUBLIC_APPWRITE_PROJECT_NAME,
  EXPO_PUBLIC_DB_HABITS_COLLECTION_ID:
    process.env.EXPO_PUBLIC_DB_HABITS_COLLECTION_ID,
  EXPO_PUBLIC_DB_HABITS_COMPLETIONS_ID:
    process.env.EXPO_PUBLIC_DB_HABITS_COMPLETIONS_ID,
} as const;

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Please check your .env file and ensure all Appwrite configuration is set.`,
    );
  }
});

export const client = new Client()
  .setEndpoint(requiredEnvVars.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(requiredEnvVars.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setPlatform(requiredEnvVars.EXPO_PUBLIC_APPWRITE_PROJECT_NAME!);

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = requiredEnvVars.EXPO_PUBLIC_DB_ID!;
export const COLLECTION_ID =
  requiredEnvVars.EXPO_PUBLIC_DB_HABITS_COLLECTION_ID!;
export const COMPLETIONS_COLLECTION_ID =
  requiredEnvVars.EXPO_PUBLIC_DB_HABITS_COMPLETIONS_ID!;

export interface RealtimeResponse<T = any> {
  events: string[];
  channels: string[];
  timestamp: number;
  payload: T;
}

export function getRealtimeChannel(collectionId: string): string {
  return `databases.${DATABASE_ID}.collections.${collectionId}.documents`;
}

export function isCreateEvent(events: string[]): boolean {
  return events.some((event) =>
    event.includes("databases.*.collections.*.documents.*.create"),
  );
}
export function isUpdateEvent(events: string[]): boolean {
  return events.some((event) =>
    event.includes("databases.*.collections.*.documents.*.update"),
  );
}
export function isDeleteEvent(events: string[]): boolean {
  return events.some((event) =>
    event.includes("databases.*.collections.*.documents.*.delete"),
  );
}
export function hasChangeEvent(events: string[]): boolean {
  return (
    isCreateEvent(events) || isUpdateEvent(events) || isDeleteEvent(events)
  );
}
