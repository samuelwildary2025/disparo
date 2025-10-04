import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true
});

export interface PaginatedResponse<T> {
  data: T;
  total?: number;
}
