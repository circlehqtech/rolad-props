import { create } from "zustand";
import client from "../api/client";

export interface StaffProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
}

export interface Role {
  code: string;
  label: string;
}

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  currency?: string;
  phonePrefix?: string;
  timezone?: string;
  terminologyOverrides?: Record<string, string>;
}

// Compat user shape expected by legacy UI pages and components
export interface CompatUser {
  id: string;
  name: string;
  role: string;
  email: string;
  photo: string;
}

// Dev login cards metadata for premium card selection (maps emails & mock photos for backend integration)
export interface MockCardProfile {
  id: string;
  name: string;
  role: string;
  roleCode: string;
  email: string;
  photo: string;
}

export const staffProfiles: MockCardProfile[] = [
  {
    id: "chuka",
    name: "Chuka Rolad",
    role: "MD / CEO",
    roleCode: "MD_CEO",
    email: "chuka@rolad.example.com",
    photo:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&q=80",
  },
  {
    id: "adaobi",
    name: "Adaobi Rolad",
    role: "Administrator",
    roleCode: "ADMINISTRATOR",
    email: "adaobi@rolad.example.com",
    photo:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80",
  },
  {
    id: "ngozi",
    name: "Ngozi Eze",
    role: "Accounts Lead",
    roleCode: "ACCOUNTS_LEAD",
    email: "ngozi@rolad.example.com",
    photo:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80",
  },
  {
    id: "david",
    name: "David Adekunle",
    role: "Project Manager",
    roleCode: "PROJECT_MANAGER",
    email: "david@rolad.example.com",
    photo:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&q=80",
  },
  {
    id: "zainab",
    name: "Zainab Yusuf",
    role: "Client Relations Officer",
    roleCode: "CLIENT_RELATIONS",
    email: "zainab@rolad.example.com",
    photo:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop&q=80",
  },
  {
    id: "tayo",
    name: "Tayo Bankole",
    role: "Sales Officer",
    roleCode: "SALES_OFFICER",
    email: "adeola@rolad.example.com",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80",
  },
  {
    id: "chidinma",
    name: "Chidinma Okafor",
    role: "Marketing Officer",
    roleCode: "MARKETING_OFFICER",
    email: "kelechi@rolad.example.com",
    photo:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80",
  },
  // {
  //   id: "funmi",
  //   name: "Funmi Ojo",
  //   role: "HR Officer",
  //   roleCode: "HR_OFFICER",
  //   email: "funmi@rolad.example.com",
  //   photo:
  //     "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&h=400&fit=crop&q=80",
  // },
];

interface LoginResponse {
  accessToken: string;
  staff: StaffProfile;
  role: Role;
}

interface MeResponse {
  staff: StaffProfile;
  role: Role;
  organization: Organization;
}

interface AuthState {
  accessToken: string | null;
  staff: StaffProfile | null;
  role: Role | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  user: CompatUser | null; // UI compatibility layer

  setSession: (
    token: string,
    staff: StaffProfile,
    role: Role,
    org?: Organization | null,
  ) => void;
  hydrateSession: () => Promise<void>;
  loginSession: (email: string, password: string) => Promise<void>;
  devLoginSession: (roleCode: string) => Promise<void>;
  logout: () => void;
}

// Read token, user, role from sessionStorage for refresh-safe caching
const getStoredToken = () => sessionStorage.getItem("rolad_access_token");
const getStoredUser = (): CompatUser | null => {
  try {
    const raw = sessionStorage.getItem("rolad_compat_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const getStoredRole = (): Role | null => {
  try {
    const raw = sessionStorage.getItem("rolad_role");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const getStoredStaff = (): StaffProfile | null => {
  try {
    const raw = sessionStorage.getItem("rolad_staff");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => {
  const initialToken = getStoredToken();
  const initialUser = getStoredUser();
  const initialRole = getStoredRole();
  const initialStaff = getStoredStaff();

  return {
    accessToken: initialToken,
    staff: initialStaff,
    role: initialRole,
    organization: null,
    isAuthenticated: !!initialToken,
    isHydrating: !!(initialToken && !initialUser),
    user: initialUser,

    setSession: (token, staff, role, org = null) => {
      sessionStorage.setItem("rolad_access_token", token);
      sessionStorage.setItem("rolad_staff", JSON.stringify(staff));
      sessionStorage.setItem("rolad_role", JSON.stringify(role));
      const compatUser: CompatUser = {
        id: staff.id,
        name: `${staff.firstName} ${staff.lastName}`,
        role: role.label,
        email: staff.email,
        photo: staff.avatarUrl || "",
      };
      sessionStorage.setItem("rolad_compat_user", JSON.stringify(compatUser));
      set({
        accessToken: token,
        staff,
        role,
        organization: org,
        isAuthenticated: true,
        isHydrating: false,
        user: compatUser,
      });
    },

    hydrateSession: async () => {
      const token = get().accessToken;
      if (!token) {
        get().logout();
        return;
      }
      // Local design and QA sessions never call the production auth service.
      if (token.startsWith("rolad-local-preview:")) {
        set({ isAuthenticated: true, isHydrating: false });
        return;
      }
      if (!get().user) {
        set({ isHydrating: true });
      }
      try {
        // Call GET /auth/me per §2 to hydrate the app shell configuration
        const meData = await client.get<any, MeResponse>("/auth/me");
        const compatUser: CompatUser = {
          id: meData.staff.id,
          name: `${meData.staff.firstName} ${meData.staff.lastName}`,
          role: meData.role.label,
          email: meData.staff.email,
          photo: meData.staff.avatarUrl || "",
        };
        sessionStorage.setItem("rolad_staff", JSON.stringify(meData.staff));
        sessionStorage.setItem("rolad_role", JSON.stringify(meData.role));
        sessionStorage.setItem("rolad_compat_user", JSON.stringify(compatUser));
        set({
          staff: meData.staff,
          role: meData.role,
          organization: meData.organization,
          isAuthenticated: true,
          isHydrating: false,
          user: compatUser,
        });
      } catch (err) {
        console.error("Token hydration failed. Logging out.", err);
        get().logout();
      }
    },

    loginSession: async (email, password) => {
      set({ isHydrating: true });
      // Call POST /auth/login per §2
      const loginData = await client.post<any, LoginResponse>("/auth/login", {
        email,
        password,
      });

      // Temporarily set session to fetch org info via /auth/me
      sessionStorage.setItem("rolad_access_token", loginData.accessToken);
      set({ accessToken: loginData.accessToken, isAuthenticated: true });

      // Instantly fetch org metadata to un-pause app render
      await get().hydrateSession();
    },

    devLoginSession: async (roleCode) => {
      set({ isHydrating: true });
      // Call POST /auth/dev-login per §7
      const loginData = await client.post<any, LoginResponse>("/auth/dev-login", {
        role: roleCode,
      });
      sessionStorage.setItem("rolad_access_token", loginData.accessToken);
      set({ accessToken: loginData.accessToken, isAuthenticated: true });
      await get().hydrateSession();
    },

    logout: () => {
      sessionStorage.removeItem("rolad_access_token");
      sessionStorage.removeItem("rolad_staff");
      sessionStorage.removeItem("rolad_role");
      sessionStorage.removeItem("rolad_compat_user");
      set({
        accessToken: null,
        staff: null,
        role: null,
        organization: null,
        isAuthenticated: false,
        isHydrating: false,
        user: null,
      });
    },
  };
});
