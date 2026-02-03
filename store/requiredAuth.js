import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";

export function useRequireAuth() {
  const router = useRouter();
  const { isLoggedIn, loading, init } = useAuthStore();

  useEffect(() => {
    init(); 
  }, [init]);

  useEffect(() => {
    
    if (!loading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [loading, isLoggedIn, router]);

  return { loading, isLoggedIn };
}
