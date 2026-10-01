// Store Zustand — rôle + persistance
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Role } from "./types";

interface AppState {
  role: Role;
  setRole: (r: Role) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      role: "GERANT",
      setRole: (role) => set({ role }),
    }),
    { name: "saverdev-store", storage: createJSONStorage(() => AsyncStorage) }
  )
);
