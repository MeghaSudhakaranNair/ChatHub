/**
 * Provides a React Context for authentication, managing the current user’s state
 * across the application and exposing user data and actions.
 *
 * Components wrapped within this provider have access to:
 * - `user`: the current authenticated user object or `null` if unauthenticated.
 * - `setUser`: a state setter to update the user object.
 * - `isLoading`: boolean indicating if authentication state is still loading.
 *
 * On mount, it automatically fetches the current authenticated user from your backend
 * (`/api/auth/fetchUser`) using credentials-included GET request.
 * It initializes loading state to `true` and sets `user` accordingly:
 * - Sets `user` to the fetched user data on success.
 * - Sets `user` to `null` on failure (e.g. unauthenticated, network error).
 * - Sets `isLoading` to `false` once fetching completes.
 *
 * The custom hook `useAuth` allows any child component to access this authentication
 * context. It throws an error if used outside of the `AuthProvider` context scope,
 * ensuring proper usage.
 *
 * This context design supports centralized authentication management, prevents
 * prop drilling, and improves code modularity and testability.
 */
"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  name: string;
  id: number;
  userName: string;
  photoUrl: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5001/api/auth/fetchUser", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
