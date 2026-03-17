const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001";
export const API_URL = `${BASE_API_URL.replace(/\/$/, "")}/api`;
