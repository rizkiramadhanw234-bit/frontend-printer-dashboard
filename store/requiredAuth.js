export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  return { isInitialized, isAuthenticated };
}