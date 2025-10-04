import { api } from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<{ data: UserResponse }>("/auth/login", payload);
  return data.data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get<{ data: UserResponse | null }>("/auth/me");
  return data.data;
}
