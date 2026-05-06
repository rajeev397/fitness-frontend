import React, { useState } from "react";

type GoalCardProps = {
  title: string;
  value: number;
  goal: number;
  unit: string;
  emoji: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuickChange?: (name: string, delta: number) => void;
};

export default function GoalCard({
  title,
  value,
  goal,
  unit,
  emoji,
  name,
  onChange,
  onQuickChange,
}: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const rawPercentage = goal > 0 ? (value / goal) * 100 : 0;
  const displayPercentage = Math.min(rawPercentage, 100);
  const roundedPercentage = Math.round(rawPercentage);
  const remaining = goal - value;

  let barColor = "#ef4444";
  if (rawPercentage >= 80 && rawPercentage <= 100) barColor = "#10b981";
  else if (rawPercentage >= 50) barColor = "#f59e0b";
  if (rawPercentage > 100) barColor = "#3b82f6";

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div style={styles.titleRow}>
          <span style={styles.emoji}>{emoji}</span>
          <span style={styles.title}>{title}</span>
        </div>

        <div style={{ ...styles.percentBadge, color: barColor }}>
          {roundedPercentage}%
        </div>
      </div>

      <div style={styles.mainValue}>
        {value} <span style={styles.unit}>{unit}</span>
      </div>

      <div style={styles.metaRow}>
        <span>Goal {goal} {unit}</span>
        <span>
          {remaining > 0 ? `${remaining} left` : `${Math.abs(remaining)} extra`}
        </span>
      </div>

      <div style={styles.barBackground}>
        <div
          style={{
            ...styles.barFill,
            width: `${displayPercentage}%`,
            background: barColor,
          }}
        />
      </div>

      {!isEditing ? (
        <button style={styles.updateButton} onClick={() => setIsEditing(true)}>
          Tap to update
        </button>
      ) : (
        <div style={styles.editSection}>
          <button
            style={styles.quickButton}
            onClick={() => name && onQuickChange?.(name, -10)}
          >
            -10
          </button>

          <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            style={styles.input}
          />

          <button
            style={styles.quickButton}
            onClick={() => name && onQuickChange?.(name, 10)}
          >
            +10
          </button>

          <button style={styles.doneButton} onClick={() => setIsEditing(false)}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "26px",
    padding: "20px",
    marginBottom: "18px",
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.08)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  emoji: {
    fontSize: "22px",
  },
  title: {
    fontSize: "17px",
    fontWeight: 800,
    color: "#064e3b",
  },
  percentBadge: {
    fontSize: "15px",
    fontWeight: 800,
    background: "#f8fafc",
    padding: "6px 10px",
    borderRadius: "999px",
  },
  mainValue: {
    fontSize: "34px",
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1,
    marginBottom: "8px",
  },
  unit: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#64748b",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "14px",
  },
  barBackground: {
    width: "100%",
    height: "12px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  barFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.45s ease",
  },
  updateButton: {
    width: "100%",
    border: "none",
    background: "#ecfdf5",
    color: "#047857",
    padding: "12px",
    borderRadius: "16px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  editSection: {
    display: "grid",
    gridTemplateColumns: "64px 1fr 64px",
    gap: "10px",
    alignItems: "center",
  },
  quickButton: {
    border: "none",
    background: "#f1f5f9",
    color: "#0f172a",
    borderRadius: "14px",
    padding: "12px 0",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1.5px solid #bbf7d0",
    borderRadius: "14px",
    padding: "12px",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: 800,
    outline: "none",
  },
  doneButton: {
    gridColumn: "1 / -1",
    border: "none",
    background: "#10b981",
    color: "white",
    borderRadius: "14px",
    padding: "12px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
};