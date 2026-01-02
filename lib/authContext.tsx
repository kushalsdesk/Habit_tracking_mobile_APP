import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ID, Models } from "react-native-appwrite";
import { account } from "./appwrite";

export interface AuthError {
  message: string;
  code?: string;
}
type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  signUp: (email: string, password: string) => Promise<AuthError | null>;
  signIn: (email: string, password: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoadingUser: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null,
  );
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

  useEffect(() => {
    if (!hasInitialized) {
      getUser();
      setHasInitialized(true);
    }
  }, [hasInitialized]);

  const getUser = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (err) {
      setUser(null);
    }
  }, []);

  const signUp = async (
    email: string,
    password: string,
  ): Promise<AuthError | null> => {
    try {
      await account.create(ID.unique(), email, password);
      const singInError = await signIn(email, password);
      return singInError;
    } catch (err) {
      if (err instanceof Error) {
        return {
          message: err.message,
          code: (err as any).code,
        };
      }
      return {
        message: "An error occurred while signing up. Please try again",
      };
    }
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<AuthError | null> => {
    try {
      await account.createEmailPasswordSession(email, password);
      await getUser();
      return null;
    } catch (err) {
      if (err instanceof Error) {
        let message = err.message;
        if (message.includes("Invalid Credentials")) {
          message = "Invalid email or password. Please try again.";
        } else if (message.includes("rate limit")) {
          message = "Too many login attempts. Please try again later.";
        }
        return {
          message,
          code: (err as any).code,
        };
      }
      return {
        message: "An error occurred while signing in. Please try again.",
      };
    }
  };

  const signOut = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (err) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, signIn, signUp, signOut, refreshUser, isLoadingUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useAuth must be inside of the AuthProvider." +
        "Wrap the app with <AuthProvider> in _layout.tsx",
    );
  }
  return context;
};

export const useIsAuthenticated = (): boolean => {
  const { user } = useAuth();
  return user !== null;
};

export const useRequireAuth = (): string => {
  const { user } = useAuth();
  if (!user) {
    throw new Error("User must be authenticated to use this feature.");
  }
  return user.$id;
};
