import { useQuery } from "@tanstack/react-query";
import BackButton from "./BackButton";
import { API_ENDPOINTS } from "../api/apiConfig";
import AuthHeader from "../AuthHeader";

type TrackerHistoryProps = {
  user: any;
  onBack: () => void;
  onLogout: () => void;
  onSelectDay: (item: TrackerHistoryItem) => void;
};

type TrackerHistoryItem = {
  logId?: string;
  userId?: string;
  logDate?: string;
  weight?: number;
  calories?: number;
  steps?: number;
  protein?: number;
  fiber?: number;
  water?: number;
  gymDone?: boolean;
  vitamins?: boolean;
  notes?: string;
};

export default function TrackerHistory({
  user,
  onBack,
  onSelectDay,
  onLogout,
}: TrackerHistoryProps) {
  const userId = user?.userId;
  const days = 30;

  const {
    data: history = [],
    isLoading: loading,
    error,
  } = useQuery<TrackerHistoryItem[]>({
    queryKey: ["tracker-history", userId, days],
    enabled: !!userId,
    queryFn: async () => {
      console.log("API → get/daily-tracker/history", { userId, days });

      const response = await fetch(
        `${API_ENDPOINTS.trackerHistory}?userId=${userId}&days=${days}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load history.");
      }

      return data;
    },
  });

  const message = !userId
    ? "User not found. Please login again."
    : error instanceof Error
      ? error.message
      : "";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <AuthHeader onLogout={onLogout} />
        <div style={styles.header}>
          <BackButton label="Today" onClick={onBack} />

          <h1 style={styles.title}>Tracker History</h1>
          <p style={styles.subtitle}>Last {days} days</p>
        </div>

        {loading && <div style={styles.emptyCard}>Loading...</div>}

        {message && <div style={styles.error}>{message}</div>}

        {!loading && history.length === 0 && (
          <div style={styles.emptyCard}>
            <div style={{ fontSize: "42px", marginBottom: "10px" }}>🌱</div>
            <div>No history found yet</div>
            <div style={{ fontSize: "13px", marginTop: "6px", color: "#94a3b8" }}>
              Save your daily tracker to see history here.
            </div>
          </div>
        )}
        {!loading && history.length > 0 && (
          <div style={styles.summaryCard}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryValue}>
                {history.filter(h => h.gymDone).length}
              </div>
              <div style={styles.summaryLabel}>Gym days</div>
            </div>

            <div style={styles.summaryItem}>
              <div style={styles.summaryValue}>
                {history.filter(h => h.vitamins).length}
              </div>
              <div style={styles.summaryLabel}>Vitamins</div>
            </div>

            <div style={styles.summaryItem}>
              <div style={styles.summaryValue}>{history.length}</div>
              <div style={styles.summaryLabel}>Total days</div>
            </div>
          </div>
        )}
        {!loading &&
          history.length > 0 &&
          history.map((item, index) => {
            const formattedDate = formatDate(item.logDate, index);

            return (
              <button
                key={item.logId || item.logDate || index}
                style={styles.rowCard}
                onClick={() => onSelectDay(item)}
              >
                <div style={styles.rowTop}>
                  <div>
                    <div style={styles.date}>{formattedDate}</div>
                    <div style={styles.metricsLine}>
                      🚶 {formatSteps(item.steps)} · 🥩 {item.protein ?? 0}g · 🔥 {item.calories ?? 0}
                    </div>
                  </div>

                  <div style={styles.chevron}>→</div>
                </div>

                <div style={styles.badgeRow}>
                  <span
                    style={{
                      ...styles.badge,
                      ...(item.gymDone ? styles.successBadge : styles.mutedBadge),
                    }}
                  >
                    {item.gymDone ? "🏋️ Gym" : "😴 No gym"}
                  </span>

                  <span
                    style={{
                      ...styles.badge,
                      ...(item.vitamins ? styles.successBadge : styles.mutedBadge),
                    }}
                  >
                    {item.vitamins ? "💊 Vitamins" : "❌ No vitamins"}
                  </span>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

function formatDate(logDate?: string, index?: number) {
  if (!logDate) return `Day ${(index ?? 0) + 1}`;

  const [y, m, d] = logDate.split("-").map(Number);

  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSteps(steps?: number) {
  const value = steps ?? 0;

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return String(value);
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "30px 20px",
    background:
      "linear-gradient(135deg, #dffcf1 0%, #ecfeff 50%, #fff7db 100%)",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "430px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    color: "#064e3b",
    lineHeight: 1,
    fontWeight: 900,
  },
  subtitle: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "15px",
  },
  rowCard: {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "rgba(255,255,255,0.96)",
    padding: "16px",
    borderRadius: "20px",
    marginBottom: "12px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },
  date: {
    fontSize: "17px",
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: "6px",
  },
  summaryCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    background: "rgba(255,255,255,0.96)",
    padding: "16px",
    borderRadius: "22px",
    marginBottom: "14px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.07)",
  },

  summaryItem: {
    flex: 1,
    textAlign: "center",
  },

  summaryValue: {
    fontSize: "20px",
    fontWeight: 900,
    color: "#064e3b",
  },

  summaryLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  },
  metricsLine: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 700,
    lineHeight: 1.4,
  },
  chevron: {
    fontSize: "28px",
    color: "#94a3b8",
    lineHeight: 1,
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "12px",
  },
  badge: {
    padding: "7px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
  },
  successBadge: {
    background: "#d1fae5",
    color: "#065f46",
  },
  mutedBadge: {
    background: "#f1f5f9",
    color: "#64748b",
  },
  emptyCard: {
    background: "rgba(255,255,255,0.96)",
    padding: "18px",
    borderRadius: "20px",
    color: "#64748b",
    fontWeight: 800,
    textAlign: "center",
    animation: "fadeInUp 0.5s ease",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px",
    borderRadius: "16px",
    fontWeight: 800,
  },
};