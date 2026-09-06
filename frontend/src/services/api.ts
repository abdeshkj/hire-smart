import axios, { AxiosInstance, AxiosResponse } from "axios";

export interface HealthStatusResponse {
  status: string;
  timestamp: string;
  service: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

/**
 * Axios instance preconfigured with base URL and default headers
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Generic request helper
 */
export async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  data?: unknown
): Promise<T> {
  const response: AxiosResponse<T> = await apiClient({
    method,
    url,
    data,
  });
  return response.data;
}

/**
 * Health check endpoint service
 */
export async function getHealthStatus(): Promise<HealthStatusResponse> {
  return request<HealthStatusResponse>("GET", "/api/health");
}

export default apiClient;
