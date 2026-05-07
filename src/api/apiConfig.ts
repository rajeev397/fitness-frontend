export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const API_ENDPOINTS = {
  registerUser: `${API_BASE_URL}/users/register`,
  loginByEmail: `${API_BASE_URL}/users/email`,
  getUser: `${API_BASE_URL}/users/me`,
  trackerHistory: `${API_BASE_URL}/daily-tracker/history`,
  trackerToday: `${API_BASE_URL}/daily-tracker/today`,
  dailyTracker: `${API_BASE_URL}/daily-tracker`,
};

export const COGNITO_CONFIG = {
  userPoolId: "us-east-2_g2GbqwNLg",
  userPoolClientId: "14a85m22ocm5hobbphnlur4m7n",
};