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
  const now = new Date();
const timeString = now.toLocaleTimeString();
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <div style={styles.page}>
      <div style={styles.heroCard}>
        <div style={styles.badge}>✨ Simple daily health tracking</div>

        <div style={styles.emoji}>🥗</div>

        <h1 style={styles.title}>FitTrack</h1>

        <p style={styles.heroTitle}>Build better habits. One day at a time.</p>

        <p style={styles.subtitle}>
          Track protein, fiber, calories, water, steps, gym sessions, and daily
          progress.
        </p>
        <p style={{ fontSize: "12px", color: "#64748b" }}>
  {timeString} ({timeZone})
</p>

        <div style={styles.previewCard}>
          <div style={styles.previewRow}>
            <span>🚶 Steps</span>
            <strong>8,200</strong>
          </div>

          <div style={styles.progressBar}>
            <div style={styles.progressFill} />
          </div>

          <div style={styles.previewGrid}>
            <div style={styles.miniStat}>🥩 120g</div>
            <div style={styles.miniStat}>💧 3L</div>
            <div style={styles.miniStat}>🔥 1,850</div>
          </div>
        </div>

        <button style={styles.primaryButton} onClick={onSignup}>
          Start Tracking 🚀
        </button>

        <button style={styles.secondaryButton} onClick={onSignin}>
          I already have an account
        </button>

        <div style={styles.trustRow}>
          <span>✅ Free</span>
          <span>⚡ Fast</span>
          <span>📱 Mobile friendly</span>
        </div>
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [screen, setScreen] = useState<
    | "home"
    | "signup"
    | "signin"
    | "dashboard"
    | "history"
    | "summary"
    | "historyDetail"
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
      <TrackerSummary user={user} onBack={() => setScreen("dashboard")} />
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
  heroCard: {
    width: "100%",
    maxWidth: "390px",
    padding: "32px 24px",
    borderRadius: "32px",
    background: "rgba(255, 255, 255, 0.92)",
    boxShadow: "0 24px 60px rgba(6, 78, 59, 0.18)",
    textAlign: "center",
    boxSizing: "border-box",
  },
  badge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "#ecfdf5",
    color: "#047857",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "18px",
  },
  emoji: {
    fontSize: "56px",
    lineHeight: 1,
    marginBottom: "16px",
  },
  title: {
    fontSize: "42px",
    lineHeight: 1.05,
    margin: "0 0 10px",
    color: "#064e3b",
    fontWeight: 900,
  },
  heroTitle: {
    fontSize: "22px",
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.25,
    margin: "0 0 10px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#475569",
    lineHeight: 1.5,
    margin: "0 0 22px",
  },
  previewCard: {
    background: "linear-gradient(135deg, #ecfdf5, #ffffff)",
    border: "1px solid #bbf7d0",
    borderRadius: "22px",
    padding: "16px",
    marginBottom: "22px",
    boxShadow: "0 10px 24px rgba(16, 185, 129, 0.12)",
  },
  previewRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "15px",
    color: "#064e3b",
    marginBottom: "10px",
  },
  progressBar: {
    height: "10px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
    marginBottom: "14px",
  },
  progressFill: {
    width: "68%",
    height: "100%",
    background: "#10b981",
    borderRadius: "999px",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
  },
  miniStat: {
    background: "white",
    padding: "10px 6px",
    borderRadius: "14px",
    fontSize: "13px",
    fontWeight: 800,
    color: "#064e3b",
  },
  primaryButton: {
    width: "100%",
    padding: "15px",
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "12px",
    boxShadow: "0 10px 24px rgba(16, 185, 129, 0.28)",
  },
  secondaryButton: {
    width: "100%",
    padding: "15px",
    borderRadius: "18px",
    border: "2px solid #10b981",
    background: "white",
    color: "#047857",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  trustRow: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "16px",
    flexWrap: "wrap",
    fontSize: "12px",
    fontWeight: 800,
    color: "#047857",
  },
};

export default App;