import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string | null;
  balance: number;
  joinedAt: string;
  isAdmin: boolean;
}

interface AuthState {
  user: DiscordUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isSignedIn: false,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      const data = await res.json() as { user: DiscordUser | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isSignedIn: !!user, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function avatarUrl(user: DiscordUser): string {
  if (!user.avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator) % 5}.png`;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=128`;
}
