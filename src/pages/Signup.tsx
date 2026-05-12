import { useEffect, useState } from "react";
import {
  confirmSignUp,
  signIn,
  fetchAuthSession,
  signOut,
  resendSignUpCode,
} from "aws-amplify/auth";
import BackButton from "./BackButton";
import { API_ENDPOINTS } from "../api/apiConfig";

type SignupProps = {
  onBack: () => void;
  onSignin: () => void;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dailyProteinGoal: string;
  dailyFiberGoal: string;
  dailyStepsGoal: string;
  dailyWaterGoal: string;
  dailyCalorieGoal: string;
};

type FormErrors = Partial<Record<keyof FormState | "verificationCode", string>>;

export default function Signup({ onBack, onSignin }: SignupProps) {
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dailyProteinGoal: "100",
    dailyFiberGoal: "25",
    dailyStepsGoal: "8000",
    dailyWaterGoal: "3",
    dailyCalorieGoal: "2000",
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [showVerification, setShowVerification] = useState(false);

  const [focusedField, setFocusedField] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const validateField = (
    name: keyof FormState,
    value: string,
    updatedForm: FormState = form
  ) => {
    if (name === "firstName" && !value.trim()) return "First name is required.";
    if (name === "lastName" && !value.trim()) return "Last name is required.";

    if (name === "email") {
      if (!value.trim()) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Enter a valid email address.";
      }
    }

    if (name === "password") {
      if (!value) return "Password is required.";
      if (value.length < 8) return "Password must be at least 8 characters.";
    }

    if (name === "confirmPassword") {
      if (!value) return "Confirm password is required.";
      if (value !== updatedForm.password) return "Passwords do not match.";
    }

    const goalFields: Array<keyof FormState> = [
      "dailyProteinGoal",
      "dailyFiberGoal",
      "dailyStepsGoal",
      "dailyWaterGoal",
      "dailyCalorieGoal",
    ];

    if (goalFields.includes(name)) {
      if (!value) return "This goal is required.";
      if (Number(value) <= 0) return "Goal must be greater than 0.";
    }

    return "";
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    Object.keys(form).forEach((key) => {
      const fieldName = key as keyof FormState;
      const error = validateField(fieldName, form[fieldName], form);

      if (error) newErrors[fieldName] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormState;

    const updatedForm = {
      ...form,
      [fieldName]: value,
    };

    setForm(updatedForm);

    const fieldError = validateField(fieldName, value, updatedForm);

    setErrors((prev) => {
      const updatedErrors = {
        ...prev,
        [fieldName]: fieldError,
      };

      if (fieldName === "password" && updatedForm.confirmPassword) {
        updatedErrors.confirmPassword = validateField(
          "confirmPassword",
          updatedForm.confirmPassword,
          updatedForm
        );
      }

      Object.keys(updatedErrors).forEach((errorKey) => {
        if (!updatedErrors[errorKey as keyof FormErrors]) {
          delete updatedErrors[errorKey as keyof FormErrors];
        }
      });

      return updatedErrors;
    });
  };

  const handleSubmit = async () => {
    setMessage("");
    setIsError(false);

    if (!validateForm()) {
      setIsError(true);
      setMessage("Please fix the highlighted fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      sessionStorage.setItem(
        "pendingSignupProfile",
        JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          dailyProteinGoal: form.dailyProteinGoal,
          dailyFiberGoal: form.dailyFiberGoal,
          dailyStepsGoal: form.dailyStepsGoal,
          dailyWaterGoal: form.dailyWaterGoal,
          dailyCalorieGoal: form.dailyCalorieGoal,
        })
      );

      setShowVerification(true);
      setIsError(false);
      setMessage("Verification code sent to your email 📩");
      setResendCooldown(30);
    } catch (error: any) {
      console.error("Signup error:", error);
      setIsError(true);

      if (error.name === "UsernameExistsException") {
        setMessage("User already exists. Try signing in.");
      } else if (error.name === "InvalidPasswordException") {
        setMessage(error.message || "Password does not meet requirements.");
      } else {
        setMessage(error.message || "Signup failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setMessage("");
    setIsError(false);

    if (resendCooldown > 0 || isResending) return;

    if (!form.email.trim()) {
      setIsError(true);
      setMessage("Email not found. Please go back and sign up again.");
      return;
    }

    try {
      setIsResending(true);

      await resendSignUpCode({
        username: form.email.trim(),
      });

      setIsError(false);
      setMessage("Verification code resent to your email 📩");
      setResendCooldown(30);
    } catch (error: any) {
      console.error("Resend verification code error:", error);
      setIsError(true);
      setMessage(error.message || "Unable to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async () => {
    setMessage("");
    setIsError(false);

    if (!verificationCode.trim()) {
      setErrors((prev) => ({
        ...prev,
        verificationCode: "Verification code is required.",
      }));
      setIsError(true);
      setMessage("Please enter the verification code.");
      return;
    }

    try {
      setIsSubmitting(true);

      await confirmSignUp({
        username: form.email,
        confirmationCode: verificationCode.trim(),
      });

      try {
        await signOut();
      } catch {
        // ignore
      }

      await signIn({
        username: form.email,
        password: form.password,
      });

      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

      if (!accessToken) {
        throw new Error("Access token not found after signup.");
      }

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

      const response = await fetch(API_ENDPOINTS.registerUser, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Email verified, but profile save failed.");
      }

      sessionStorage.setItem("loginEmail", form.email);
      sessionStorage.setItem(
        "loginSuccessMessage",
        "Email verified successfully 🎉 Your FitTrack account has been created. Please sign in."
      );

      onSignin();
    } catch (error: any) {
      console.error("Verification error:", error);
      setIsError(true);

      if (error.name === "CodeMismatchException") {
        setMessage("Invalid verification code. Please try again.");
      } else if (error.name === "ExpiredCodeException") {
        setMessage("Verification code expired. Please request a new code.");
      } else {
        setMessage(error.message || "Verification failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    name: keyof FormState,
    label: string,
    value: string,
    type: string = "text",
    options?: {
      showToggle?: boolean;
      showValue?: boolean;
      onToggle?: () => void;
    }
  ) => {
    const isActive = focusedField === name || value;
    const hasError = Boolean(errors[name]);

    return (
      <div style={styles.inputWrapper}>
        <div style={styles.inputGroup}>
          <input
            style={{
              ...styles.input,
              ...(focusedField === name ? styles.inputFocused : {}),
              ...(hasError ? styles.inputError : {}),
              ...(options?.showToggle ? styles.inputWithIcon : {}),
            }}
            name={name}
            type={options?.showToggle && options.showValue ? "text" : type}
            value={value}
            onChange={handleChange}
            onFocus={() => setFocusedField(name)}
            onBlur={() => {
              setFocusedField("");
              const error = validateField(name, form[name], form);
              setErrors((prev) => ({
                ...prev,
                [name]: error || undefined,
              }));
            }}
            placeholder=" "
          />

          <label
            style={{
              ...styles.label,
              ...(isActive ? styles.labelActive : {}),
              ...(hasError ? styles.labelError : {}),
            }}
          >
            {label}
          </label>

          {options?.showToggle && (
            <button
              type="button"
              style={styles.eyeButton}
              onClick={options.onToggle}
              aria-label={options.showValue ? "Hide password" : "Show password"}
            >
              {options.showValue ? "🙈" : "👁️"}
            </button>
          )}
        </div>

        {hasError && <div style={styles.fieldError}>{errors[name]}</div>}
      </div>
    );
  };

  const renderVerificationInput = () => {
    const isActive = focusedField === "verificationCode" || verificationCode;
    const hasError = Boolean(errors.verificationCode);

    return (
      <div style={styles.inputWrapper}>
        <div style={styles.inputGroup}>
          <input
            style={{
              ...styles.input,
              ...(focusedField === "verificationCode" ? styles.inputFocused : {}),
              ...(hasError ? styles.inputError : {}),
            }}
            value={verificationCode}
            onChange={(e) => {
              setVerificationCode(e.target.value);
              setErrors((prev) => ({
                ...prev,
                verificationCode: e.target.value.trim()
                  ? undefined
                  : "Verification code is required.",
              }));
            }}
            onFocus={() => setFocusedField("verificationCode")}
            onBlur={() => setFocusedField("")}
            placeholder=" "
          />

          <label
            style={{
              ...styles.label,
              ...(isActive ? styles.labelActive : {}),
              ...(hasError ? styles.labelError : {}),
            }}
          >
            Verification Code
          </label>
        </div>

        {hasError && (
          <div style={styles.fieldError}>{errors.verificationCode}</div>
        )}
      </div>
    );
  };

  const isResendDisabled = isResending || resendCooldown > 0 || isSubmitting;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <BackButton label="Home" onClick={onBack} />

        <div style={styles.card}>
          <div style={styles.badge}>✨ Start your FitTrack journey</div>

          <div style={styles.emoji}>{showVerification ? "📩" : "🥗"}</div>

          <h1 style={styles.title}>
            {showVerification ? "Verify Email" : "Create Account"}
          </h1>

          <p style={styles.subtitle}>
            {showVerification
              ? `We sent a verification code to ${form.email}. Enter it below to activate your account.`
              : "Set your profile and daily goals so FitTrack can personalize your progress."}
          </p>

          {!showVerification && (
            <>
              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionIcon}>👤</span>
                  <span style={styles.sectionTitle}>Profile</span>
                </div>

                <div style={styles.grid}>
                  {renderInput("firstName", "First Name", form.firstName)}
                  {renderInput("lastName", "Last Name", form.lastName)}
                  {renderInput("email", "Email", form.email, "email")}
                  {renderInput("password", "Password", form.password, "password", {
                    showToggle: true,
                    showValue: showPassword,
                    onToggle: () => setShowPassword((prev) => !prev),
                  })}
                  {renderInput(
                    "confirmPassword",
                    "Confirm Password",
                    form.confirmPassword,
                    "password",
                    {
                      showToggle: true,
                      showValue: showConfirmPassword,
                      onToggle: () => setShowConfirmPassword((prev) => !prev),
                    }
                  )}
                </div>
              </div>

              <div style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionIcon}>🎯</span>
                  <span style={styles.sectionTitle}>Daily Goals</span>
                </div>

                <p style={styles.helperText}>
                  We added general defaults. You can adjust them anytime.
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
            </>
          )}

          {showVerification && (
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionIcon}>🔐</span>
                <span style={styles.sectionTitle}>Email Verification</span>
              </div>

              <p style={styles.helperText}>
                Check your inbox and enter the code Cognito sent you.
              </p>

              <div style={styles.grid}>{renderVerificationInput()}</div>
            </div>
          )}

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

          {!showVerification && (
            <button
              style={{
                ...styles.primaryButton,
                ...(isSubmitting ? styles.disabledButton : {}),
              }}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create My Account 🚀"}
            </button>
          )}

          {showVerification && (
            <>
              <button
                style={{
                  ...styles.primaryButton,
                  ...(isSubmitting ? styles.disabledButton : {}),
                }}
                onClick={handleVerifyCode}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Verifying..." : "Verify Account ✅"}
              </button>

              <button
                style={{
                  ...styles.resendButton,
                  ...(isResendDisabled ? styles.resendButtonDisabled : {}),
                }}
                onClick={handleResendCode}
                disabled={isResendDisabled}
              >
                {isResending
                  ? "Resending..."
                  : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Didn’t receive the code? Resend"}
              </button>
            </>
          )}

          {!showVerification && (
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
  inputWrapper: {
    width: "100%",
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
  inputWithIcon: {
    paddingRight: "48px",
  },
  inputFocused: {
    border: "1.5px solid #10b981",
    boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.12)",
  },
  inputError: {
    border: "1.5px solid #ef4444",
    boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.12)",
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
  labelError: {
    color: "#ef4444",
  },
  fieldError: {
    marginTop: "6px",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: 700,
  },
  eyeButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "17px",
    padding: "4px",
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
  disabledButton: {
    opacity: 0.7,
    cursor: "not-allowed",
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
  resendButton: {
    border: "none",
    background: "transparent",
    color: "#047857",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "14px",
  },
  resendButtonDisabled: {
    color: "#94a3b8",
    cursor: "not-allowed",
  },
};