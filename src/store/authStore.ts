import { create } from 'zustand';

export interface User {
  id: number;
  first_name: string;
  last_name?: string | null;
  username: string;
  email: string;
  is_admin?: boolean;
  business?: {
    id: number;
    name: string;
  };
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
  can: (permissionName: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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

  can: (permissionName: string) => {
    const { permissions, user } = get();
    // Admin users typically bypass permission checks in POS systems
    if (user?.is_admin) return true;
    return permissions.includes(permissionName);
  },
}));
