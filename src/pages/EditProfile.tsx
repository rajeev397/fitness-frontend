import { useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import BackButton from "./BackButton";
import AuthHeader from "../AuthHeader";

type EditProfileProps = {
  user: any;
  onBack: () => void;
  onLogout: () => void;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  dailyProteinGoal: string;
  dailyFiberGoal: string;
  dailyStepsGoal: string;
  dailyWaterGoal: string;
  dailyCalorieGoal: string;
};

const buildInitialForm = (user: any): FormState => ({
  firstName: user?.firstName || "",
  lastName: user?.lastName || "",
  email: user?.email || "",
  dailyProteinGoal: String(user?.goals?.dailyProteinGoal ?? ""),
  dailyFiberGoal: String(user?.goals?.dailyFiberGoal ?? ""),
  dailyStepsGoal: String(user?.goals?.dailyStepsGoal ?? ""),
  dailyWaterGoal: String(user?.goals?.dailyWaterGoal ?? ""),
  dailyCalorieGoal: String(user?.goals?.dailyCalorieGoal ?? ""),
});

export default function EditProfile({
  user,
  onBack,
  onLogout,
}: EditProfileProps) {
  const originalForm = buildInitialForm(user);

  const [form, setForm] = useState<FormState>(originalForm);
  const [savedForm, setSavedForm] = useState<FormState>(originalForm);

  const [focusedField, setFocusedField] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = JSON.stringify(form) !== JSON.stringify(savedForm);
  const isSaveDisabled = !hasChanges || isSaving;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage("");
    setIsError(false);

    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.dailyProteinGoal ||
      !form.dailyFiberGoal ||
      !form.dailyStepsGoal ||
      !form.dailyWaterGoal ||
      !form.dailyCalorieGoal
    ) {
      return "Please fill all fields.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }

    const numericFields = [
      form.dailyProteinGoal,
      form.dailyFiberGoal,
      form.dailyStepsGoal,
      form.dailyWaterGoal,
      form.dailyCalorieGoal,
    ];

    if (numericFields.some((value) => Number(value) <= 0)) {
      return "Goals must be greater than 0.";
    }

    return "";
  };

  const handleSave = async () => {
    setMessage("");
    setIsError(false);

    if (!hasChanges || isSaving) return;

    const validationError = validateForm();

    if (validationError) {
      setIsError(true);
      setMessage(validationError);
      return;
    }

    try {
      setIsSaving(true);

      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      if (!accessToken) {
        throw new Error("User session not found. Please sign in again.");
      }

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        dailyProteinGoal: Number(form.dailyProteinGoal),
        dailyFiberGoal: Number(form.dailyFiberGoal),
        dailyStepsGoal: Number(form.dailyStepsGoal),
        dailyWaterGoal: Number(form.dailyWaterGoal),
        dailyCalorieGoal: Number(form.dailyCalorieGoal),
      };

      const response = await fetch("http://localhost:8080/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile.");
      }

      setSavedForm(form);
      setIsError(false);
      setMessage("Changes saved successfully.");
    } catch (error: any) {
      console.error("PATCH profile error:", error);
      setIsError(true);
      setMessage(error.message || "Unable to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = (
    name: keyof FormState,
    label: string,
    value: string,
    type: string = "text"
  ) => {
    const isActive = focusedField === name || value;

    return (
      <div style={styles.inputWrapper}>
        <div style={styles.inputGroup}>
          <input
            name={name}
            type={type}
            value={value}
            onChange={handleChange}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField("")}
            placeholder=" "
            style={{
              ...styles.input,
              ...(focusedField === name ? styles.inputFocused : {}),
            }}
          />

          <label
            style={{
              ...styles.label,
              ...(isActive ? styles.labelActive : {}),
            }}
          >
            {label}
          </label>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <AuthHeader onLogout={onLogout} onEditProfile={() => {}} />

        <BackButton label="Dashboard" onClick={onBack} />

        <div style={styles.card}>
          <div style={styles.badge}>⚙️ Account Settings</div>

          <div style={styles.emoji}>👤</div>

          <h1 style={styles.title}>Edit Profile</h1>

          <p style={styles.subtitle}>
            Update your profile details and daily fitness goals.
          </p>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>👤</span>
              <span style={styles.sectionTitle}>Profile</span>
            </div>

            <div style={styles.grid}>
              {renderInput("firstName", "First Name", form.firstName)}
              {renderInput("lastName", "Last Name", form.lastName)}
              {renderInput("email", "Email", form.email, "email")}
            </div>
          </div>

          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionIcon}>🎯</span>
              <span style={styles.sectionTitle}>Daily Goals</span>
            </div>

            <p style={styles.helperText}>
              These goals power your tracker and monthly summary.
            </p>

            <div style={styles.grid}>
              {renderInput(
                "dailyProteinGoal",
                "Protein Goal (g)",
                form.dailyProteinGoal,
                "number"
              )}
              {renderInput(
                "dailyFiberGoal",
                "Fiber Goal (g)",
                form.dailyFiberGoal,
                "number"
              )}
              {renderInput(
                "dailyStepsGoal",
                "Steps Goal",
                form.dailyStepsGoal,
                "number"
              )}
              {renderInput(
                "dailyWaterGoal",
                "Water Goal (L)",
                form.dailyWaterGoal,
                "number"
              )}
              {renderInput(
                "dailyCalorieGoal",
                "Calorie Goal",
                form.dailyCalorieGoal,
                "number"
              )}
            </div>
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
            style={{
              ...styles.primaryButton,
              ...(isSaveDisabled ? styles.disabledButton : {}),
            }}
            onClick={handleSave}
            disabled={isSaveDisabled}
          >
            {isSaving
              ? "Saving..."
              : hasChanges
              ? "Save Changes"
              : "No Changes to Save"}
          </button>

          <button style={styles.secondaryButton} onClick={onBack}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px 24px",
    background:
      "linear-gradient(135deg, #d1fae5 0%, #ecfeff 50%, #fef3c7 100%)",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "430px",
    margin: "0 auto",
  },

  card: {
    width: "100%",
    padding: "36px 28px",
    borderRadius: "32px",
    background: "rgba(255, 255, 255, 0.96)",
    boxShadow: "0 28px 70px rgba(6, 78, 59, 0.18)",
    textAlign: "center",
    boxSizing: "border-box",
  },

  badge: {
    display: "inline-block",
    padding: "8px 16px",
    borderRadius: "999px",
    background: "#ecfdf5",
    color: "#047857",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "20px",
  },

  emoji: {
    fontSize: "58px",
    marginBottom: "14px",
  },

  title: {
    fontSize: "34px",
    lineHeight: 1.1,
    margin: "0 0 14px",
    color: "#064e3b",
    fontWeight: 900,
  },

  subtitle: {
    fontSize: "15px",
    color: "#475569",
    lineHeight: 1.6,
    margin: "0 0 28px",
  },

  sectionCard: {
    background: "#f9fffb",
    border: "1px solid #d1fae5",
    borderRadius: "24px",
    padding: "22px",
    marginBottom: "22px",
    boxShadow: "0 12px 28px rgba(16, 185, 129, 0.08)",
    textAlign: "left",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  },

  sectionIcon: {
    fontSize: "18px",
  },

  sectionTitle: {
    fontSize: "16px",
    fontWeight: 900,
    color: "#064e3b",
  },

  helperText: {
    margin: "-6px 0 16px",
    fontSize: "12px",
    color: "#64748b",
    lineHeight: 1.5,
  },

  grid: {
    display: "grid",
    gap: "20px",
  },

  inputWrapper: {
    width: "100%",
  },

  inputGroup: {
    position: "relative",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "20px 16px 12px",
    borderRadius: "16px",
    border: "1.5px solid #d1fae5",
    fontSize: "15px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    fontWeight: 400,
    transition: "all 0.2s ease",
  },

  inputFocused: {
    border: "1.5px solid #10b981",
    boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.12)",
  },

  label: {
    position: "absolute",
    left: "16px",
    top: "15px",
    fontSize: "15px",
    color: "#94a3b8",
    pointerEvents: "none",
    transition: "all 0.2s ease",
    background: "#ffffff",
    padding: "0 6px",
  },

  labelActive: {
    top: "-8px",
    fontSize: "12px",
    color: "#10b981",
    fontWeight: 800,
  },

  message: {
    padding: "14px 16px",
    borderRadius: "16px",
    fontSize: "14px",
    fontWeight: 700,
    marginBottom: "20px",
  },

  successMessage: {
    background: "#d1fae5",
    color: "#065f46",
    border: "1.5px solid #10b981",
  },

  errorMessage: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1.5px solid #ef4444",
  },

  primaryButton: {
    width: "100%",
    boxSizing: "border-box",
    padding: "16px",
    borderRadius: "20px",
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(16, 185, 129, 0.28)",
    marginTop: "6px",
  },

  secondaryButton: {
    width: "100%",
    boxSizing: "border-box",
    padding: "16px",
    borderRadius: "20px",
    border: "2px solid #10b981",
    background: "white",
    color: "#047857",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    marginTop: "14px",
  },

  disabledButton: {
    opacity: 0.65,
    cursor: "not-allowed",
    boxShadow: "none",
  },
};