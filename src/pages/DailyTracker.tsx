import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GoalCard from "./GoalCard";
import { API_ENDPOINTS } from "../api/apiConfig";
import AuthHeader from "../AuthHeader";
import EditProfileModal from "./EditProfile";

type DailyTrackerProps = {
  user: any;
  onViewHistory: () => void;
  onViewSummary: () => void;
  onLogout: () => void;
  onEditProfile: () => void;
};

const emptyForm = {
  weight: "",
  calories: "",
  steps: "",
  protein: "",
  fiber: "",
  water: "",
  gymDone: false,
  vitamins: false,
  notes: "",
};

export default function DailyTracker({
  user,
  onViewHistory,
  onViewSummary,
  onLogout,
  onEditProfile,
}: DailyTrackerProps) {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const queryClient = useQueryClient();
  const userId = user?.userId;

  const { data: todayData } = useQuery({
    queryKey: ["daily-tracker-today", userId],
    enabled: !!userId,
    queryFn: async () => {
      console.log("API → get/daily-tracker/today", { userId });

      const response = await fetch(
        `${API_ENDPOINTS.trackerToday}?userId=${userId}`
      );
      console.log("API Response Status → trackerToday:", response.status);
      console.log("API Response OK → trackerToday:", response.ok);

      if (!response.ok) {
        return null;
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!todayData) return;

    setForm({
      weight: String(todayData.weight ?? ""),
      calories: String(todayData.calories ?? ""),
      steps: String(todayData.steps ?? ""),
      protein: String(todayData.protein ?? ""),
      fiber: String(todayData.fiber ?? ""),
      water: String(todayData.water ?? ""),
      gymDone: Boolean(todayData.gymDone),
      vitamins: Boolean(todayData.vitamins),
      notes: todayData.notes ?? "",
    });
  }, [todayData]);

  const saveTodayMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        userId,
        weight: Number(form.weight),
        calories: Number(form.calories),
        steps: Number(form.steps),
        protein: Number(form.protein),
        fiber: Number(form.fiber),
        water: Number(form.water),
        gymDone: form.gymDone,
        vitamins: form.vitamins,
        notes: form.notes,
      };

      console.log("API → Post/daily-tracker", payload);

      const response = await fetch(API_ENDPOINTS.dailyTracker, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save daily tracker.");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["daily-tracker-today", userId],
      });

      queryClient.invalidateQueries({
        queryKey: ["tracker-history", userId],
      });

      setIsError(false);
      setMessage("Daily tracker saved successfully 🎉");
    },
    onError: (error) => {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to server. Please try again."
      );
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm({ ...form, [target.name]: target.checked });
      return;
    }

    const value = target.value;

    setForm({
      ...form,
      [target.name]: value.replace(/^0+(?=\d)/, ""),
    });
  };

  const handleQuickChange = (name: string, delta: number) => {
    const increments: Record<string, number> = {
      steps: 100,
      water: 1,
      calories: 50,
    };

    const amount = increments[name] ?? Math.abs(delta);

    setForm((prev) => {
      const currentValue = Number(prev[name as keyof typeof prev]) || 0;
      const direction = delta < 0 ? -1 : 1;
      const newValue = Math.max(currentValue + direction * amount, 0);

      return {
        ...prev,
        [name]: String(newValue),
      };
    });
  };

  const handleWeightChange = (delta: number) => {
    setForm((prev) => {
      const currentValue = Number(prev.weight) || 0;
      const newValue = Math.max(currentValue + delta, 0);

      return {
        ...prev,
        weight: newValue.toFixed(1),
      };
    });
  };

  const handleSubmit = () => {
    setMessage("");
    setIsError(false);
    saveTodayMutation.mutate();
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <AuthHeader
  onLogout={onLogout}
  onEditProfile={() => onEditProfile()}
/>
        <div style={styles.header}>
          <h1 style={styles.title}>Today&apos;s Tracker</h1>
          <p style={styles.subtitle}>
            Hi {user?.firstName}, update your intake for today.
          </p>

          <div style={styles.headerActions}>
            <button style={styles.headerNavButton} onClick={onViewHistory}>
              📅 History
            </button>

            <button style={styles.headerNavButton} onClick={onViewSummary}>
              📊 Summary
            </button>
          </div>
        </div>

        <GoalCard
          title="Steps"
          value={Number(form.steps)}
          goal={user?.goals?.dailyStepsGoal || 0}
          unit="steps"
          emoji="🥾"
          name="steps"
          onChange={handleChange}
          onQuickChange={handleQuickChange}
        />

        <GoalCard
          title="Protein"
          value={Number(form.protein)}
          goal={user?.goals?.dailyProteinGoal || 0}
          unit="g"
          emoji="🥩"
          name="protein"
          onChange={handleChange}
          onQuickChange={handleQuickChange}
        />

        <GoalCard
          title="Fiber"
          value={Number(form.fiber)}
          goal={user?.goals?.dailyFiberGoal || 0}
          unit="g"
          emoji="🌾"
          name="fiber"
          onChange={handleChange}
          onQuickChange={handleQuickChange}
        />

        <GoalCard
          title="Water"
          value={Number(form.water)}
          goal={user?.goals?.dailyWaterGoal || 0}
          unit="L"
          emoji="💧"
          name="water"
          onChange={handleChange}
          onQuickChange={handleQuickChange}
        />

        <GoalCard
          title="Calories"
          value={Number(form.calories)}
          goal={user?.goals?.dailyCalorieGoal || 0}
          unit="cal"
          emoji="🔥"
          name="calories"
          onChange={handleChange}
          onQuickChange={handleQuickChange}
        />

        <div style={styles.formCard}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Body Weight</label>

            <div style={styles.weightStepper}>
              <button
                style={styles.stepperButton}
                onClick={() => handleWeightChange(-0.5)}
              >
                -0.5
              </button>

              <div style={styles.weightInputWrap}>
                <input
                  style={styles.weightInput}
                  name="weight"
                  placeholder="0"
                  value={form.weight}
                  onChange={handleChange}
                />
                <span style={styles.weightUnit}>kg</span>
              </div>

              <button
                style={styles.stepperButton}
                onClick={() => handleWeightChange(0.5)}
              >
                +0.5
              </button>
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Gym Session</label>

            <div
              style={{
                ...styles.toggleRow,
                background: form.gymDone ? "#d1fae5" : "#f1f5f9",
              }}
              onClick={() =>
                setForm((prev) => ({ ...prev, gymDone: !prev.gymDone }))
              }
            >
              <span style={styles.toggleText}>
                {form.gymDone ? "Completed today" : "Not done yet"}
              </span>

              <div
                style={{
                  ...styles.toggleSwitch,
                  background: form.gymDone ? "#10b981" : "#cbd5e1",
                }}
              >
                <div
                  style={{
                    ...styles.toggleCircle,
                    transform: form.gymDone
                      ? "translateX(22px)"
                      : "translateX(2px)",
                  }}
                />
              </div>
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Vitamins</label>

            <div
              style={{
                ...styles.toggleRow,
                background: form.vitamins ? "#d1fae5" : "#f1f5f9",
              }}
              onClick={() =>
                setForm((prev) => ({ ...prev, vitamins: !prev.vitamins }))
              }
            >
              <span style={styles.toggleText}>
                {form.vitamins ? "Taken today" : "Not taken yet"}
              </span>

              <div
                style={{
                  ...styles.toggleSwitch,
                  background: form.vitamins ? "#10b981" : "#cbd5e1",
                }}
              >
                <div
                  style={{
                    ...styles.toggleCircle,
                    transform: form.vitamins
                      ? "translateX(22px)"
                      : "translateX(2px)",
                  }}
                />
              </div>
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Notes</label>

            <textarea
              style={styles.textarea}
              name="notes"
              placeholder="Anything about today..."
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          {message && (
            <div
              style={{
                ...styles.message,
                ...(isError ? styles.errorMessage : styles.successMessage),
              }}
            >
              {message}
            </div>
          )}

          <button
            style={styles.primaryButton}
            onClick={handleSubmit}
            disabled={saveTodayMutation.isPending}
          >
            {saveTodayMutation.isPending ? "Saving..." : "Save Today"}
          </button>
        </div>
      </div>
    </div>
  );
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
    textAlign: "center",
    marginBottom: "28px",
  },
  title: {
    margin: 0,
    color: "#064e3b",
    fontSize: "42px",
    lineHeight: 1,
    fontWeight: 900,
  },
  subtitle: {
    marginTop: "10px",
    color: "#475569",
    fontSize: "16px",
  },
  formCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "24px",
    padding: "20px",
    marginTop: "20px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
  },
  fieldGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "700",
    color: "#064e3b",
    marginBottom: "8px",
  },
  weightStepper: {
    display: "grid",
    gridTemplateColumns: "70px 1fr 70px",
    gap: "10px",
    alignItems: "center",
  },
  stepperButton: {
    border: "none",
    background: "#f1f5f9",
    color: "#0f172a",
    borderRadius: "14px",
    padding: "12px 0",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  weightInputWrap: {
    position: "relative",
  },
  weightInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 38px 12px 12px",
    borderRadius: "14px",
    border: "1.5px solid #bbf7d0",
    fontSize: "16px",
    fontWeight: 800,
    textAlign: "center",
    outline: "none",
  },
  weightUnit: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "13px",
    fontWeight: 700,
    color: "#64748b",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    borderRadius: "14px",
    border: "1.5px solid #bbf7d0",
    fontSize: "15px",
    minHeight: "90px",
    outline: "none",
    resize: "none",
    fontFamily: "Arial, sans-serif",
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  toggleText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  toggleSwitch: {
    width: "44px",
    height: "24px",
    borderRadius: "999px",
    display: "flex",
    alignItems: "center",
    padding: "2px",
    transition: "all 0.2s ease",
  },
  toggleCircle: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "white",
    transition: "transform 0.25s ease",
  },
  message: {
    padding: "12px",
    borderRadius: "14px",
    textAlign: "center",
    marginBottom: "12px",
    fontWeight: "bold",
  },
  logoutButton: {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "14px",
  borderRadius: "18px",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  background: "linear-gradient(135deg, #fff1f2, #ffffff)",
  color: "#be123c",
  fontSize: "14px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(239, 68, 68, 0.12)",
},
  successMessage: {
    background: "#d1fae5",
    color: "#065f46",
  },
  errorMessage: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  primaryButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "16px",
    background: "#10b981",
    color: "white",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
  },
  historyButton: {
    marginTop: "14px",
    padding: "10px 16px",
    borderRadius: "999px",
    border: "none",
    background: "#ecfdf5",
    color: "#047857",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  headerActions: {
    display: "flex",
    gap: "10px",
    marginTop: "14px",
    justifyContent: "center",
  },

  primaryButtonSmall: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "none",
    background: "#10b981",
    color: "white",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "2px solid #10b981",
    background: "white",
    color: "#047857",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },

  headerNavButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",

    padding: "14px",
    borderRadius: "18px",

    border: "1px solid rgba(16, 185, 129, 0.2)",

    background: "linear-gradient(135deg, #ffffff, #f0fdf4)",
    color: "#065f46",

    fontSize: "14px",
    fontWeight: 900,

    cursor: "pointer",

    boxShadow: "0 6px 18px rgba(16, 185, 129, 0.12)",
    transition: "all 0.2s ease",
  },

  headerButton: {
    padding: "12px",
    borderRadius: "16px",
    border: "none",
    background: "rgba(255,255,255,0.95)",
    color: "#047857",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
  },
};