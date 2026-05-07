import { useState } from "react";
import BackButton from "./BackButton";
import { API_ENDPOINTS } from "../api/apiConfig";
import AuthHeader from "../AuthHeader";

type TrackerHistoryDetailProps = {
  item: any;
  onBack: () => void;
  onLogout: () => void;
};

type EditForm = {
  weight: number;
  calories: number;
  steps: number;
  protein: number;
  fiber: number;
  water: number;
  gymDone: boolean;
  vitamins: boolean;
  notes: string;
};

export default function TrackerHistoryDetail({
  item,
  onBack,
  onLogout,
}: TrackerHistoryDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [form, setForm] = useState<EditForm>({
    weight: Number(item?.weight || 0),
    calories: Number(item?.calories || 0),
    steps: Number(item?.steps || 0),
    protein: Number(item?.protein || 0),
    fiber: Number(item?.fiber || 0),
    water: Number(item?.water || 0),
    gymDone: Boolean(item?.gymDone),
    vitamins: Boolean(item?.vitamins),
    notes: item?.notes || "",
  });

  if (!item) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <BackButton label="Back" onClick={onBack} />
          <div style={styles.card}>No history item selected.</div>
        </div>
      </div>
    );
  }

  const formattedDate = item.logDate
    ? (() => {
      const [y, m, d] = item.logDate.split("-").map(Number);

      return new Date(y, m - 1, d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    })()
    : "Tracker Detail";

  const updateNumber = (key: keyof EditForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value === "" ? 0 : Number(value),
    }));
  };

  const handleCancel = () => {
    setForm({
      weight: Number(item?.weight || 0),
      calories: Number(item?.calories || 0),
      steps: Number(item?.steps || 0),
      protein: Number(item?.protein || 0),
      fiber: Number(item?.fiber || 0),
      water: Number(item?.water || 0),
      gymDone: Boolean(item?.gymDone),
      vitamins: Boolean(item?.vitamins),
      notes: item?.notes || "",
    });

    setSaveError("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError("");

      const payload = {
        weight: form.weight,
        calories: form.calories,
        steps: form.steps,
        protein: form.protein,
        fiber: form.fiber,
        water: form.water,
        gymDone: form.gymDone,
        vitamins: form.vitamins,
        notes: form.notes,
      };

      console.log("API → PUT/daily-tracker", {
        logDate: item.logDate,
        userId: item.userId || "user-1",
        payload,
      });

      const response = await fetch(
        `${API_ENDPOINTS.dailyTracker}/${item.logDate}?userId=${item.userId || "user-1"}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update tracker.");
      }

      Object.assign(item, data);
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <AuthHeader onLogout={onLogout} />
        <div style={styles.topRow}>
          <BackButton label="History" onClick={onBack} />

          {!isEditing ? (
            <button style={styles.editButton} onClick={() => setIsEditing(true)}>
              Edit
            </button>
          ) : (
            <div style={styles.editActions}>
              <button style={styles.cancelButton} onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button style={styles.saveButton} onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div style={styles.header}>
          <h1 style={styles.title}>{formattedDate}</h1>
          <p style={styles.subtitle}>
            {isEditing ? "Edit daily tracker details" : "Your activity snapshot for this day"}
          </p>
        </div>

        {saveError && <div style={styles.error}>{saveError}</div>}

        <div style={styles.card}>
          <div style={styles.grid}>
            <DetailMetric
              label="Steps"
              value={form.steps}
              unit="steps"
              emoji="🥾"
              editing={isEditing}
              inputType="number"
              onChange={(value) => updateNumber("steps", value)}
            />

            <DetailMetric
              label="Protein"
              value={form.protein}
              unit="g"
              emoji="🥩"
              editing={isEditing}
              inputType="number"
              onChange={(value) => updateNumber("protein", value)}
            />

            <DetailMetric
              label="Fiber"
              value={form.fiber}
              unit="g"
              emoji="🌾"
              editing={isEditing}
              inputType="number"
              onChange={(value) => updateNumber("fiber", value)}
            />

            <DetailMetric
              label="Water"
              value={form.water}
              unit="L"
              emoji="💧"
              editing={isEditing}
              inputType="number"
              step="0.1"
              onChange={(value) => updateNumber("water", value)}
            />

            <DetailMetric
              label="Calories"
              value={form.calories}
              unit="cal"
              emoji="🔥"
              editing={isEditing}
              inputType="number"
              onChange={(value) => updateNumber("calories", value)}
            />

            <DetailMetric
              label="Weight"
              value={form.weight}
              unit="kg"
              emoji="⚖️"
              editing={isEditing}
              inputType="number"
              step="0.1"
              onChange={(value) => updateNumber("weight", value)}
            />
          </div>

          <div style={styles.statusSection}>
            <button
              type="button"
              disabled={!isEditing}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  gymDone: !prev.gymDone,
                }))
              }
              style={{
                ...styles.statusPill,
                background: form.gymDone ? "#ecfdf5" : "#f1f5f9",
                color: form.gymDone ? "#065f46" : "#64748b",
                cursor: isEditing ? "pointer" : "default",
                border: isEditing ? "2px solid #10b981" : "none",
              }}
            >
              🏋️ {form.gymDone ? "Gym completed" : "Rest day"}
            </button>

            <button
              type="button"
              disabled={!isEditing}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  vitamins: !prev.vitamins,
                }))
              }
              style={{
                ...styles.statusPill,
                background: form.vitamins ? "#d1fae5" : "#f1f5f9",
                color: form.vitamins ? "#065f46" : "#64748b",
                cursor: isEditing ? "pointer" : "default",
                border: isEditing ? "2px solid #10b981" : "none",
              }}
            >
              💊 {form.vitamins ? "Vitamins taken" : "Missed vitamins"}
            </button>
          </div>

          {(form.notes || isEditing) && (
            <div style={styles.notesBox}>
              <div style={styles.notesLabel}>Notes</div>

              {isEditing ? (
                <textarea
                  style={styles.notesInput}
                  value={form.notes}
                  placeholder="Add notes..."
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              ) : (
                <div style={styles.notesText}>{form.notes}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailMetric({
  label,
  value,
  unit,
  emoji,
  editing,
  inputType,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  emoji: string;
  editing: boolean;
  inputType: string;
  step?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={styles.metricBox}>
      <div style={styles.metricLabel}>
        <span>{emoji}</span>
        <span>{label}</span>
      </div>

      {editing ? (
        <div style={styles.inputWrap}>
          <input
            style={styles.metricInput}
            type={inputType}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <span style={styles.metricUnit}>{unit}</span>
        </div>
      ) : (
        <div style={styles.metricValue}>
          {value ?? 0} <span style={styles.metricUnit}>{unit}</span>
        </div>
      )}
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
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
  },
  editButton: {
  border: "none",
  borderRadius: "999px",
  padding: "10px 18px",
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(16, 185, 129, 0.25)",
},
  editActions: {
    display: "flex",
    gap: "8px",
  },
  cancelButton: {
    border: "none",
    borderRadius: "999px",
    padding: "10px 14px",
    background: "#e2e8f0",
    color: "#334155",
    fontWeight: 900,
    cursor: "pointer",
  },
  saveButton: {
    border: "none",
    borderRadius: "999px",
    padding: "10px 16px",
    background: "#064e3b",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  header: {
    marginBottom: "18px",
    textAlign: "center",
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
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: "16px",
    fontSize: "14px",
    fontWeight: 800,
    marginBottom: "12px",
  },
  card: {
    background: "rgba(255,255,255,0.96)",
    padding: "18px",
    borderRadius: "24px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  metricBox: {
  background: "#f8fafc",
  borderRadius: "18px",
  padding: "14px",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  transition: "transform 0.15s ease",
},
  metricLabel: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 800,
    marginBottom: "8px",
  },
  metricValue: {
  fontSize: "26px",
  fontWeight: 900,
  color: "#0f172a",
},
  metricUnit: {
    fontSize: "12px",
    opacity: 0.7,
    color: "#64748b",
    fontWeight: 700,
  },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  metricInput: {
    width: "100%",
    minWidth: 0,
    border: "2px solid #d1fae5",
    borderRadius: "12px",
    padding: "8px",
    fontSize: "18px",
    fontWeight: 900,
    color: "#0f172a",
    outline: "none",
    background: "white",
  },
  statusSection: {
  display: "grid",
  gap: "12px",
  marginTop: "18px",
},
  statusPill: {
    padding: "12px 14px",
    borderRadius: "16px",
    fontSize: "14px",
    fontWeight: 800,
    textAlign: "center",
  },
  notesBox: {
    marginTop: "16px",
    background: "#f8fafc",
    borderRadius: "18px",
    padding: "14px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  notesLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 900,
    marginBottom: "6px",
    textAlign: "center",
    letterSpacing: "0.5px",
  },
  notesText: {
    fontSize: "14px",
    color: "#334155",
    lineHeight: 1.6,
    textAlign: "center",
  },
  notesInput: {
    width: "100%",
    minHeight: "90px",
    border: "2px solid #d1fae5",
    borderRadius: "14px",
    padding: "10px",
    fontSize: "14px",
    color: "#334155",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "Arial, sans-serif",
  },
};