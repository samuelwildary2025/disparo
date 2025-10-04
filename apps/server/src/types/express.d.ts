import type { Role } from "@app-disparo/shared";

declare global {
  namespace Express {
    interface UserInfo {
      id: string;
      role: Role;
    }

    interface Request {
      user?: UserInfo;
    }
  }
}

export {};
