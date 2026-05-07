import { useState } from "react";
import BackButton from "./BackButton";
import { API_ENDPOINTS } from "../api/apiConfig";

type SignupProps = {
  onBack: () => void;
  onSignin: () => void;
};

export default function Signup({ onBack, onSignin }: SignupProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dailyProteinGoal: "",
    dailyFiberGoal: "",
    dailyStepsGoal: "",
    dailyWaterGoal: "",
    dailyCalorieGoal: "",
  });

  const [focusedField, setFocusedField] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setMessage("");
    setIsError(false);
    setIsCreated(false);

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        dailyProteinGoal: Number(form.dailyProteinGoal),
        dailyFiberGoal: Number(form.dailyFiberGoal),
        dailyStepsGoal: Number(form.dailyStepsGoal),
        dailyWaterGoal: Number(form.dailyWaterGoal),
        dailyCalorieGoal: Number(form.dailyCalorieGoal),
      };

      console.log("API → post/users/register", payload);

      const response = await fetch(API_ENDPOINTS.registerUser, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || "Signup failed. Please try again.");
        return;
      }

      if (data.userId) {
        localStorage.setItem("userId", data.userId);
      }

      setIsError(false);
      setIsCreated(true);
      setMessage("User created successfully 🎉");
    } catch (error) {
      setIsError(true);
      setMessage("Unable to connect to server. Please try again.");
    }
  };

  const renderInput = (
    name: keyof typeof form,
    label: string,
    value: string,
    type: string = "text"
  ) => {
    const isActive = focusedField === name || value;

    return (
      <div style={styles.inputGroup}>
        <input
          style={{
            ...styles.input,
            ...(focusedField === name ? styles.inputFocused : {}),
          }}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={() => setFocusedField(name)}
          onBlur={() => setFocusedField("")}
          placeholder=" "
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
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <BackButton label="Home" onClick={onBack} />

        <div style={styles.card}>
          <div style={styles.badge}>✨ Start your FitTrack journey</div>

          <div style={styles.emoji}>🥗</div>

          <h1 style={styles.title}>Create Account</h1>

          <p style={styles.subtitle}>
            Set your profile and daily goals so FitTrack can personalize your
            progress.
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
              You can always adjust these goals later.
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

          <button style={styles.primaryButton} onClick={handleSubmit}>
            Create My Account 🚀
          </button>

          {isCreated && (
            <button style={styles.signinButton} onClick={onSignin}>
              Continue to Sign In
            </button>
          )}

          {!isCreated && (
            <button style={styles.linkButton} onClick={onSignin}>
              Already have an account? Sign In
            </button>
          )}
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
    padding: "30px 24px",
    borderRadius: "30px",
    background: "rgba(255, 255, 255, 0.92)",
    boxShadow: "0 24px 60px rgba(6, 78, 59, 0.18)",
    textAlign: "center",
    animation: "fadeIn 0.8s ease",
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
    marginBottom: "16px",
  },
  emoji: {
    fontSize: "54px",
    marginBottom: "8px",
    animation: "bounce 1.8s infinite",
  },
  title: {
    fontSize: "32px",
    lineHeight: 1.1,
    margin: "0 0 10px",
    color: "#064e3b",
    fontWeight: 900,
  },
  subtitle: {
    fontSize: "15px",
    color: "#475569",
    lineHeight: 1.5,
    margin: "0 0 20px",
  },
  sectionCard: {
    background: "linear-gradient(135deg, #ecfdf5, #ffffff)",
    border: "1px solid #bbf7d0",
    borderRadius: "22px",
    padding: "16px",
    marginBottom: "18px",
    boxShadow: "0 10px 24px rgba(16, 185, 129, 0.1)",
    textAlign: "left",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  sectionIcon: {
    fontSize: "18px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: 900,
    color: "#064e3b",
  },
  helperText: {
    margin: "-4px 0 14px",
    fontSize: "12px",
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gap: "14px",
  },
  inputGroup: {
    position: "relative",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "18px 16px 10px",
    borderRadius: "15px",
    border: "1.5px solid #a7f3d0",
    fontSize: "15px",
    outline: "none",
    background: "white",
    color: "#0f172a",
  },
  inputFocused: {
    border: "1.5px solid #10b981",
    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.12)",
  },
  label: {
    position: "absolute",
    left: "16px",
    top: "14px",
    fontSize: "15px",
    color: "#94a3b8",
    pointerEvents: "none",
    transition: "all 0.2s ease",
    background: "white",
    padding: "0 4px",
  },
  labelActive: {
    top: "-8px",
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "bold",
  },
  message: {
    padding: "14px 16px",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: "bold",
    marginBottom: "18px",
    animation: "popIn 0.45s ease",
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
    padding: "15px",
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(16, 185, 129, 0.28)",
  },
  signinButton: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    borderRadius: "18px",
    border: "none",
    background: "#047857",
    color: "white",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "12px",
  },
  linkButton: {
    border: "none",
    background: "transparent",
    color: "#047857",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "16px",
  },
};