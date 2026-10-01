import { Platform } from "react-native";
export const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === "web" && typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:3000` : "http://localhost:3000");
