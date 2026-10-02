import api from "./api";
import type { User } from "@/types/models";
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
export interface LoginInput {
  email: string;
  password: string;
}
interface AuthResult {
  user: User;
  accessToken: string;
}
export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const { data } = await api.post<{ data: AuthResult }>(
      "/auth/register",
      input,
    );
    return data.data;
  },
  async login(input: LoginInput): Promise<AuthResult> {
    const { data } = await api.post<{ data: AuthResult }>("/auth/login", input);
    return data.data;
  },
  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
  async getMe(): Promise<User> {
    const { data } = await api.get<{ data: User }>("/auth/me");
    return data.data;
  },
};
