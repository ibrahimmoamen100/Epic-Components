import { useState, useEffect, useCallback } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { vendorsService } from "@/lib/firebase";
import type { Vendor } from "@/types/vendor";
import { toast } from "sonner";

export interface VendorSession {
  user: User;
  vendor: Vendor;
}

interface UseVendorAuthReturn {
  loading: boolean;
  error: string | null;
  session: VendorSession | null;
  isAuthenticated: boolean;
  signup: (payload: {
    name: string;
    phoneNumber: string;
    storeLocation: string;
    productLimit?: number;
    logoUrl?: string;
    username: string;
    gmailAccount: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useVendorAuth = (): UseVendorAuthReturn => {
  const [session, setSession] = useState<VendorSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadVendorForUser = useCallback(async (user: User | null) => {
    if (!user) {
      setSession(null);
      return;
    }
    try {
      const vendor = await vendorsService.getVendorByAuthUid(user.uid);
      if (!vendor) {
        setSession(null);
        return;
      }
      setSession({ user, vendor });
    } catch (err) {
      console.error("Error loading vendor for user:", err);
      setSession(null);
    }
  }, []);

  // Initialize from Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        await loadVendorForUser(user);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [loadVendorForUser]);

  const signup: UseVendorAuthReturn["signup"] = useCallback(
    async ({
      name,
      phoneNumber,
      storeLocation,
      productLimit,
      logoUrl,
      username,
      gmailAccount,
      password,
    }) => {
      try {
        setLoading(true);
        setError(null);

        // 1) Create Firebase Auth user
        const cred = await createUserWithEmailAndPassword(auth, gmailAccount, password);

        // 2) Create vendor document in Firestore
        const vendor = await vendorsService.addVendor({
          name,
          phoneNumber,
          storeLocation,
          productLimit: typeof productLimit === "number" ? productLimit : 5,
          logoUrl: logoUrl || undefined,
          username,
          gmailAccount,
          authUid: cred.user.uid,
        });

        setSession({ user: cred.user, vendor });
        toast.success("تم إنشاء حساب البائع بنجاح");
        return { success: true };
      } catch (err: any) {
        console.error("Vendor signup error:", err);
        const message =
          err?.code === "auth/email-already-in-use"
            ? "هذا البريد مستخدم بالفعل"
            : err?.message || "حدث خطأ أثناء إنشاء حساب البائع";
        setError(message);
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const login: UseVendorAuthReturn["login"] = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const vendor = await vendorsService.getVendorByAuthUid(cred.user.uid);
      if (!vendor) {
        const msg = "لم يتم العثور على حساب بائع مرتبط بهذا المستخدم";
        setSession(null);
        setError(msg);
        toast.error(msg);
        // Optional: sign out if not vendor
        await signOut(auth);
        return { success: false, error: msg };
      }

      setSession({ user: cred.user, vendor });
      toast.success("تم تسجيل الدخول كبائع");
      return { success: true };
    } catch (err: any) {
      console.error("Vendor login error:", err);
      const message =
        err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential"
          ? "كلمة المرور أو البريد غير صحيحة"
          : err?.message || "حدث خطأ أثناء تسجيل الدخول";
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setSession(null);
      toast.success("تم تسجيل الخروج من حساب البائع");
    } catch (err) {
      console.error("Vendor logout error:", err);
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    session,
    isAuthenticated: !!session,
    signup,
    login,
    logout,
    refreshSession: async () => {
      if (auth.currentUser) {
        await loadVendorForUser(auth.currentUser);
      }
    },
  };
};


