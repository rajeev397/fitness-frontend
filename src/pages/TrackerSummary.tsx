import { useQuery } from "@tanstack/react-query";
import BackButton from "./BackButton";
import { jsPDF } from "jspdf";
import { FiShare2, FiDownload } from "react-icons/fi";
import { API_ENDPOINTS } from "../api/apiConfig";

type TrackerSummaryProps = {
  user: any;
  onBack: () => void;
};

type TrackerHistoryItem = {
  logId?: string;
  logDate?: string;
  weight?: number;
  calories?: number;
  steps?: number;
  protein?: number;
  fiber?: number;
  water?: number;
  gymDone?: boolean;
  vitamins?: boolean;
};

type SummaryMetric = {
  label: string;
  value: number;
  goal: number;
  unit: string;
};

export default function TrackerSummary({ user, onBack }: TrackerSummaryProps) {
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
      console.log("API → GET/daily-tracker/history");
      const response = await fetch(
        `${API_ENDPOINTS.trackerHistory}?userId=${userId}&days=${days}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load summary.");
      }

      return data;
    },
  });

  const message = !userId
    ? "User not found. Please login again."
    : error instanceof Error
      ? error.message
      : "";

  const summary = (() => {
    if (!history.length) return null;

    const count = history.length;

    const avg = (key: keyof TrackerHistoryItem) =>
      history.reduce((sum, item) => sum + Number(item[key] || 0), 0) / count;

    const metrics: SummaryMetric[] = [
      {
        label: "Steps",
        value: Math.round(avg("steps")),
        goal: user?.goals?.dailyStepsGoal || 0,
        unit: "steps",
      },
      {
        label: "Protein",
        value: Math.round(avg("protein")),
        goal: user?.goals?.dailyProteinGoal || 0,
        unit: "g",
      },
      {
        label: "Fiber",
        value: Math.round(avg("fiber")),
        goal: user?.goals?.dailyFiberGoal || 0,
        unit: "g",
      },
      {
        label: "Water",
        value: Number(avg("water").toFixed(1)),
        goal: user?.goals?.dailyWaterGoal || 0,
        unit: "L",
      },
      {
        label: "Calories",
        value: Math.round(avg("calories")),
        goal: user?.goals?.dailyCalorieGoal || 0,
        unit: "cal",
      },
    ];

    const scored = metrics.filter((m) => m.goal > 0);

    const overallScore = scored.length
      ? Math.round(
        scored.reduce(
          (sum, m) => sum + Math.min((m.value / m.goal) * 100, 100),
          0
        ) / scored.length
      )
      : 0;

    return {
      metrics,
      overallScore,
      avgWeight: Number(avg("weight").toFixed(1)),
      gymDays: history.filter((item) => item.gymDone).length,
      vitaminDays: history.filter((item) => item.vitamins).length,
      totalDays: count,
    };
  })();

  const coachInsight = summary ? getCoachInsight(summary.metrics) : "";
  const scoreTheme = summary ? getScoreTheme(summary.overallScore) : null;

  const createPdf = () => {
    if (!summary) return null;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Monthly Fitness Summary", 20, 20);

    doc.setFontSize(12);
    doc.text(`Last ${days} days performance`, 20, 30);
    doc.text(`Overall Score: ${summary.overallScore}%`, 20, 45);
    doc.text(`Status: ${getOverallText(summary.overallScore)}`, 20, 55);

    doc.text("Coach Insight:", 20, 75);
    doc.text(coachInsight, 20, 85, { maxWidth: 170 });

    let y = 105;

    doc.text("Performance", 20, y);
    y += 10;

    summary.metrics.forEach((metric) => {
      const percent =
        metric.goal > 0 ? Math.round((metric.value / metric.goal) * 100) : 0;

      doc.text(
        `${metric.label}: ${formatValue(metric.value, metric.unit)} / ${formatValue(
          metric.goal,
          metric.unit
        )} (${percent}%)`,
        20,
        y
      );
      y += 10;
    });

    y += 5;
    doc.text(`Average Weight: ${summary.avgWeight} kg`, 20, y);
    y += 10;
    doc.text(`Gym: ${summary.gymDays}/${summary.totalDays} days`, 20, y);
    y += 10;
    doc.text(`Vitamins: ${summary.vitaminDays}/${summary.totalDays} days`, 20, y);

    return doc;
  };

  const handleDownloadPdf = () => {
    const doc = createPdf();
    if (!doc) return;

    doc.save("monthly-summary.pdf");
  };

  const handleSharePdf = async () => {
    const doc = createPdf();
    if (!doc) return;

    const pdfBlob = doc.output("blob");

    const file = new File([pdfBlob], "monthly-summary.pdf", {
      type: "application/pdf",
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "Monthly Fitness Summary",
        text: "Here is my monthly fitness summary.",
        files: [file],
      });
    } else {
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "monthly-summary.pdf";
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {summary && (
          <div style={styles.actions}>
            <button style={styles.iconButton} onClick={handleSharePdf} title="Share PDF">
              <FiShare2 size={18} />
            </button>

            <button
              style={styles.iconButton}
              onClick={handleDownloadPdf}
              title="Download PDF"
            >
              <FiDownload size={18} />
            </button>
          </div>
        )}

        <BackButton label="Today" onClick={onBack} />

        <div style={styles.header}>
          <h1 style={styles.title}>Monthly Summary</h1>
          <p style={styles.subtitle}>Last {days} days performance</p>
        </div>

        {loading && <div style={styles.simpleCard}>Loading summary...</div>}
        {message && <div style={styles.error}>{message}</div>}

        {!loading && !message && !summary && (
          <div style={styles.simpleCard}>
            <div style={{ fontSize: "42px", marginBottom: "10px" }}>📊</div>
            <div>No summary yet</div>
            <div style={{ fontSize: "13px", marginTop: "6px", color: "#94a3b8" }}>
              Save a daily tracker entry first to generate your summary.
            </div>
          </div>
        )}

        {summary && (
          <>
            <div
              style={{
                ...styles.heroCard,
                background: scoreTheme?.background,
              }}
            >
              <div>
                <div style={styles.heroLabel}>Overall Score</div>
                <div style={styles.heroText}>
                  {getOverallText(summary.overallScore)}
                </div>
              </div>

              <div
                style={{
                  ...styles.scoreCircle,
                  borderColor: scoreTheme?.circle,
                }}
              >
                {summary.overallScore}%
              </div>
            </div>

            <div style={styles.coachCard}>
              <div style={styles.coachTitle}>✨ Coach Insight</div>
              <div style={styles.coachText}>{coachInsight}</div>
            </div>

            <div style={styles.sectionCard}>
              <div style={styles.sectionTitle}>Performance</div>

              <div style={styles.metricGrid}>
                {summary.metrics.map((metric) => (
                  <CircularMetric key={metric.label} metric={metric} />
                ))}
              </div>
            </div>

            <div style={styles.bottomGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Avg Weight</div>
                <div style={styles.statValue}>{summary.avgWeight} kg</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statLabel}>Gym</div>
                <div style={styles.statValue}>
                  {summary.gymDays}/{summary.totalDays}
                </div>
                <div style={styles.statSub}>days completed</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statLabel}>Vitamins</div>
                <div style={styles.statValue}>
                  {summary.vitaminDays}/{summary.totalDays}
                </div>
                <div style={styles.statSub}>days taken</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Helper Components & Functions ---------- */

function CircularMetric({ metric }: { metric: SummaryMetric }) {
  const percent =
    metric.goal > 0 ? Math.round((metric.value / metric.goal) * 100) : 0;

  const visualPercent = Math.min(percent, 100);
  const color = getProgressColor(percent);

  const size = 118;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (visualPercent / 100) * circumference;

  return (
    <div style={styles.circularMetricCard}>
      <div style={styles.ringWrap}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#eef2f7"
            strokeWidth={strokeWidth}
            fill="none"
          />

          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
style={{
  transition: "stroke-dashoffset 0.8s ease",
}}
          />
        </svg>

        <div style={styles.ringCenter}>
          <div style={styles.ringPercent}>{percent}%</div>
          {percent > 100 && <div style={styles.overGoal}>over</div>}
        </div>
      </div>

      <div style={styles.circularMetricName}>{metric.label}</div>
      <div style={styles.circularMetricNumbers}>
        {formatValue(metric.value, metric.unit)} / {formatValue(metric.goal, metric.unit)}
      </div>
    </div>
  );
}

function getProgressColor(percent: number) {
  if (percent >= 100) return "#3b82f6";
  if (percent >= 80) return "#10b981";
  if (percent >= 50) return "#f59e0b";
  return "#ef4444";
}

function getOverallText(score: number) {
  if (score >= 90) return "Excellent month";
  if (score >= 75) return "Good progress";
  if (score >= 50) return "Building momentum 🔥";
  return "Small steps, big wins";
}

function getCoachInsight(metrics: SummaryMetric[]) {
  const scored = metrics
    .filter((m) => m.goal > 0)
    .map((m) => ({
      label: m.label,
      percent: Math.round((m.value / m.goal) * 100),
    }));

  if (!scored.length) return "Set your goals to unlock better insights.";

  const best = [...scored].sort((a, b) => b.percent - a.percent)[0];
  const weakest = [...scored].sort((a, b) => a.percent - b.percent)[0];

  if (weakest.percent >= 80) {
    return `Strong month overall. ${best.label} is your strongest area.`;
  }

  return `${best.label} is your strongest area. Focus a little more on ${weakest.label} this week.`;
}

function getScoreTheme(score: number) {
  if (score >= 90) {
    return {
      background: "linear-gradient(135deg, #064e3b, #10b981)",
      circle: "rgba(255,255,255,0.55)",
    };
  }
  if (score >= 75) {
    return {
      background: "linear-gradient(135deg, #047857, #34d399)",
      circle: "rgba(255,255,255,0.55)",
    };
  }
  if (score >= 50) {
    return {
      background: "linear-gradient(135deg, #92400e, #f59e0b)",
      circle: "rgba(255,255,255,0.6)",
    };
  }
  return {
    background: "linear-gradient(135deg, #991b1b, #ef4444)",
    circle: "rgba(255,255,255,0.65)",
  };
}

function formatValue(value: number, unit: string) {
  if (unit === "steps" && value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  if (unit === "cal") return `${value}`;

  return `${value}${unit === "steps" ? "" : unit}`;
}

/* ---------- Styles ---------- */

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
    position: "relative",
  },
  actions: {
    position: "absolute",
    top: "10px",
    right: "0px",
    display: "flex",
    gap: "8px",
  },
  iconButton: {
    border: "none",
    borderRadius: "10px",
    padding: "8px",
    background: "#064e3b",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginBottom: "20px",
    textAlign: "center",
  },
  title: {
    margin: 0,
    fontSize: "38px",
    color: "#064e3b",
    fontWeight: 900,
  },
  subtitle: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "15px",
  },
  heroCard: {
    borderRadius: "28px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    color: "white",
  },
  heroLabel: {
    fontSize: "14px",
    fontWeight: 800,
  },
  heroText: {
    fontSize: "22px",
    fontWeight: 900,
  },
  scoreCircle: {
    width: "82px",
    height: "82px",
    borderRadius: "50%",
    border: "6px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: 900,
  },
  coachCard: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "24px",
    padding: "18px",
    marginBottom: "16px",
    textAlign: "center",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.07)",
  },
  coachTitle: {
    fontSize: "15px",
    fontWeight: 900,
    marginBottom: "8px",
  },
  coachText: {
    fontSize: "14px",
    lineHeight: 1.6,
  },
  sectionCard: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "26px",
    padding: "20px",
    marginBottom: "16px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.07)",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: 900,
    marginBottom: "18px",
    textAlign: "center",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px 14px",
  },
  circularMetricCard: {
    textAlign: "center",
    padding: "10px 4px",
  },
  ringWrap: {
    position: "relative",
    width: "118px",
    height: "118px",
    margin: "0 auto 10px",
  },
  ringCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  ringPercent: {
    fontSize: "24px",
    fontWeight: 900,
    color: "#334155",
  },
  overGoal: {
    marginTop: "2px",
    fontSize: "10px",
    fontWeight: 900,
    color: "#3b82f6",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  circularMetricName: {
    fontSize: "15px",
    fontWeight: 900,
    color: "#475569",
  },
  circularMetricNumbers: {
    marginTop: "4px",
    fontSize: "12px",
    color: "#64748b",
  },
  bottomGrid: {
    display: "grid",
    gap: "12px",
  },
  statCard: {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "22px",
    padding: "16px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.07)",
  },
  statLabel: {
    fontSize: "13px",
  },
  statValue: {
    fontSize: "22px",
    fontWeight: 900,
  },
  statSub: {
    fontSize: "12px",
  },
  simpleCard: {
    background: "rgba(255,255,255,0.96)",
    padding: "18px",
    borderRadius: "20px",
    textAlign: "center",
  },
  error: {
    background: "#fee2e2",
    padding: "14px",
    borderRadius: "16px",
  },
};