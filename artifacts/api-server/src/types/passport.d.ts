declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      discriminator: string;
      avatar: string | null;
      email?: string | null;
      balance: number;
      joinedAt: string;
      isAdmin: boolean;
    }
  }
}

export {};
