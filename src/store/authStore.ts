import { create } from 'zustand';

export interface User {
  id: number;
  name: string;
  email: string;
  // Other user fields
}

interface AuthState {
  token: string | null;
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: User, permissions: string[]) => void;
  logout: () => void;
  setLoading: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true, // true by default until we check secure storage
  
  setAuth: (token, user, permissions) => 
    set({ token, user, permissions, isAuthenticated: true, isLoading: false }),
    
  logout: () => 
    set({ token: null, user: null, permissions: [], isAuthenticated: false, isLoading: false }),
    
  setLoading: (status) => set({ isLoading: status }),
}));
