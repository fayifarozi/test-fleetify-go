import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
  id: number;
  username: string;
  role: "admin" | "kerani";
}

export interface InvoiceItem {
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  price: number;
}

export interface Step1Data {
  senderName: string;
  senderAddress: string;
  receiverName: string;
}

interface StoreState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;

  step: number;
  step1: Step1Data;
  items: InvoiceItem[];
  setStep: (step: number) => void;
  setStep1: (data: Step1Data) => void;
  setItems: (items: InvoiceItem[]) => void;
  resetWizard: () => void;
}

const initialStep1: Step1Data = { senderName: "", senderAddress: "", receiverName: "" };

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),

      step: 1,
      step1: initialStep1,
      items: [],
      setStep: (step) => set({ step }),
      setStep1: (data) => set({ step1: data }),
      setItems: (items) => set({ items }),
      resetWizard: () => set({ step: 1, step1: initialStep1, items: [] }),
    }),
    {
      name: "fleetify-store",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") return localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        step: state.step,
        step1: state.step1,
        items: state.items,
      }),
    }
  )
);
