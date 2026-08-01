import axios, { type AxiosInstance } from "axios";
import { useAuthStore } from "../store/authStore";

export class ApiError extends Error {
  statusCode: number;
  error: string;
  messages: string[];
  path?: string;
  timestamp?: string;

  constructor(statusCode: number, error: string, messages: string[], path?: string, timestamp?: string) {
    // Standard Error constructor accepts string message
    super(messages[0] || error);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.error = error;
    this.messages = messages;
    this.path = path;
    this.timestamp = timestamp;
  }
}

// Main API Axios instance
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://rolad-backend-api.vercel.app/api/v1",
});

// Dedicated AI Endpoints Axios instance
export const aiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_AI_URL || "https://rolad-backend-ai.vercel.app/api/v1",
});

// Helper to register Auth and Service Key interceptors
const setupInterceptors = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const serviceKey = import.meta.env.VITE_X_SERVICE_KEY;
      if (serviceKey && !config.url?.endsWith("/health") && config.url !== "/") {
        config.headers["X-Service-Key"] = serviceKey;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      return response.data;
    },
    (error) => {
      if (error.response) {
        const { data, status } = error.response;
        const statusCode = data?.statusCode || status || 500;
        const errName = data?.error || "UnknownError";
        const rawMessage = data?.message || error.message || "An unexpected error occurred";

        const messages = Array.isArray(rawMessage) ? rawMessage : [rawMessage];
        const path = data?.path;
        const timestamp = data?.timestamp;

        if (statusCode === 401) {
          useAuthStore.getState().logout();
          if (!window.location.pathname.endsWith("/login")) {
            window.location.href = "/login";
          }
        }

        if (statusCode === 429) {
          console.warn("Rate limit triggered: Too many attempts.");
        }

        const apiError = new ApiError(statusCode, errName, messages, path, timestamp);
        return Promise.reject(apiError);
      }

      const networkError = new ApiError(
        0,
        "NetworkError",
        [error.message || "Network connection failed. Verify internet connection."],
        "",
        new Date().toISOString()
      );
      return Promise.reject(networkError);
    }
  );
};

setupInterceptors(client);
setupInterceptors(aiClient);

export default client;
