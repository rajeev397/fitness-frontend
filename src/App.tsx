import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import DailyTracker from "./pages/DailyTracker";
import TrackerHistory from "./pages/TrackerHistory";
import TrackerSummary from "./pages/TrackerSummary";
import TrackerHistoryDetail from "./pages/TrackerHistoryDetail";

function Home({
  onSignup,
  onSignin,
}: {
  onSignup: () => void;
  onSignin: () => void;
}) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.emoji}>🥗</div>

        <h1 style={styles.title}>FitTrack</h1>

        <p style={styles.subtitle}>
          Track your protein, fiber, calories, water, and daily steps.
        </p>

        <button style={styles.primaryButton} onClick={onSignup}>
          Create Account
        </button>

        <button style={styles.secondaryButton} onClick={onSignin}>
          Sign In
        </button>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [screen, setScreen] = useState<
    "home" | "signup" | "signin" | "dashboard" | "history" | "summary" | "historyDetail"
  >("home");

  const [user, setUser] = useState<any>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

  if (screen === "signup") {
  return (
    <Signup
      onBack={() => setScreen("home")}
      onSignin={() => setScreen("signin")}
    />
  );
}

  if (screen === "signin") {
  return (
    <Signin
      onBack={() => setScreen("home")}
      onSigninSuccess={(userData) => {
        setUser(userData);
        setScreen("dashboard");
      }}
    />
  );
}

  if (screen === "dashboard") {
    return (
      <DailyTracker
        user={user}
        onViewHistory={() => setScreen("history")}
        onViewSummary={() => setScreen("summary")}
      />
    );
  }

  if (screen === "history") {
    return (
      <TrackerHistory
        user={user}
        onBack={() => setScreen("dashboard")}
        onSelectDay={(item) => {
          setSelectedHistoryItem(item);
          setScreen("historyDetail");
        }}
      />
    );
  }

  if (screen === "historyDetail") {
    return (
      <TrackerHistoryDetail
        item={selectedHistoryItem}
        onBack={() => setScreen("history")}
      />
    );
  }

  if (screen === "summary") {
    return (
      <TrackerSummary
        user={user}
        onBack={() => setScreen("dashboard")}
      />
    );
  }

  return (
    <Home
      onSignup={() => setScreen("signup")}
      onSignin={() => setScreen("signin")}
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    background:
      "linear-gradient(135deg, #d1fae5 0%, #ecfeff 50%, #fef3c7 100%)",
    fontFamily: "Arial, sans-serif",
  },
  card: {
  width: "100%",
  maxWidth: "390px",
  padding: "36px 24px",
  borderRadius: "28px",
  background: "rgba(255, 255, 255, 0.85)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
  textAlign: "center",
  animation: "fadeIn 0.8s ease",
},

emoji: {
  fontSize: "56px",
  lineHeight: 1,
  marginBottom: "18px",
},

title: {
  fontSize: "38px",
  lineHeight: 1.1,
  margin: "0 0 12px",
  color: "#064e3b",
},
  subtitle: {
    fontSize: "16px",
    color: "#475569",
    lineHeight: 1.5,
    marginBottom: "28px",
  },
  primaryButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "16px",
    border: "none",
    background: "#10b981",
    color: "white",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "12px",
  },
  secondaryButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "16px",
    border: "2px solid #10b981",
    background: "white",
    color: "#047857",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default App;