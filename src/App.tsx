import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { Suspense, useEffect } from "react";
import ToastRenderer from "./shared/ToastRenderer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds staleTime per Phase 1 instructions
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      hydrateSession();
    }
  }, [accessToken, hydrateSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="p-8">Loading…</div>}>
          <AppRoutes />
        </Suspense>
        <ToastRenderer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
