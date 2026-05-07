import { useEffect, useState } from "react";
import BackButton from "./BackButton";
import { confirmSignUp } from "aws-amplify/auth";

type VerifyEmailProps = {
  onBack: () => void;
  onVerified: () => void; // what to do next (navigate later)
};

export default function VerifyEmail({ onBack, onVerified }: VerifyEmailProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Prefill email from session (saved during signup)
    const stored = sessionStorage.getItem("pendingSignupProfile");
    if (stored) {
      const parsed = JSON.parse(stored);
      setEmail(parsed.email || "");
    }
  }, []);

  const handleConfirm = async () => {
    setMessage("");
    setIsError(false);

    if (!email || !code) {
      setIsError(true);
      setMessage("Please enter email and verification code.");
      return;
    }

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      setIsError(false);
      setIsVerified(true);
      setMessage("Email verified successfully 🎉");

      // 👉 Next step later: call backend to save profile

    } catch (error: any) {
      console.error("Confirm error:", error);
      setIsError(true);
      setMessage(error.message || "Verification failed. Try again.");
    }
  };

  const renderInput = (
    name: string,
    label: string,
    value: string,
    type: string = "text",
    onChange: (v: string) => void
  ) => {
    const isActive = focusedField === name || value;

    return (
      <div style={styles.inputGroup}>
        <input
          style={{
            ...styles.input,
            ...(focusedField === name ? styles.inputFocused : {}),
          }}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
        <BackButton label="Back" onClick={onBack} />

        <div style={styles.card}>
          <div style={styles.badge}>📩 Verify your email</div>

          <div style={styles.emoji}>🔐</div>

          <h1 style={styles.title}>Enter Verification Code</h1>

          <p style={styles.subtitle}>
            We’ve sent a code to your email. Enter it below to activate your account.
          </p>

          <div style={styles.grid}>
            {renderInput("email", "Email", email, "email", setEmail)}
            {renderInput("code", "Verification Code", code, "text", setCode)}
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

          <button style={styles.primaryButton} onClick={handleConfirm}>
            Verify Account ✅
          </button>

          {isVerified && (
            <button style={styles.signinButton} onClick={onVerified}>
              Continue 🚀
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
  },
  title: {
    fontSize: "28px",
    margin: "0 0 10px",
    color: "#064e3b",
    fontWeight: 900,
  },
  subtitle: {
    fontSize: "14px",
    color: "#475569",
    marginBottom: "20px",
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
    padding: "18px 16px 10px",
    borderRadius: "15px",
    border: "1.5px solid #a7f3d0",
    fontSize: "15px",
    outline: "none",
    background: "white",
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
    padding: "14px",
    borderRadius: "14px",
    marginTop: "12px",
    fontWeight: "bold",
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
    borderRadius: "18px",
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "white",
    fontWeight: "bold",
    marginTop: "16px",
    cursor: "pointer",
  },
  signinButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "18px",
    border: "none",
    background: "#047857",
    color: "white",
    fontWeight: "bold",
    marginTop: "12px",
    cursor: "pointer",
  },
};