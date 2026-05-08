import { useEffect, useRef, useState } from "react";
import { signIn, fetchAuthSession } from "aws-amplify/auth";
import BackButton from "./BackButton";
import { API_ENDPOINTS } from "../api/apiConfig";

export default function Signin({
  onSigninSuccess,
  onBack,
}: {
  onSigninSuccess: (userData: any) => void;
  onBack: () => void;
}) {
  const savedEmail = sessionStorage.getItem("loginEmail") || "";
  const successMessage = sessionStorage.getItem("loginSuccessMessage") || "";

  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState(successMessage);
  const [isError, setIsError] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (savedEmail) {
      passwordRef.current?.focus();
    }

    sessionStorage.removeItem("loginEmail");
    sessionStorage.removeItem("loginSuccessMessage");
  }, [savedEmail]);

  const validateForm = () => {
    let isValid = true;

    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    console.log("[SIGNIN] Step 1: Sign in button clicked");
    setMessage("");
    setIsError(false);
    setUser(null);

    console.log("[SIGNIN] Step 2: Validating form", { email });

    if (!validateForm()) {
      setIsError(true);
      setMessage("Please fix the highlighted fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      console.log("[SIGNIN] Step 3: Calling Cognito signIn", {
        username: email,
      });

      const signInResult = await signIn({
        username: email,
        password,
      });

      console.log("[SIGNIN] Step 4: Cognito signIn success", signInResult);

      console.log("[SIGNIN] Step 5: Fetching Cognito auth session");
      const session = await fetchAuthSession();

      console.log("[SIGNIN] Step 6: Auth session received", {
        hasAccessToken: Boolean(session.tokens?.accessToken),
        hasIdToken: Boolean(session.tokens?.idToken),
      });

      const userId = session.tokens?.idToken?.payload?.sub as string | undefined;

      console.log("[SIGNIN] Step 7: Extracted Cognito userId/sub", {
        userId,
      });

      if (!userId) {
        console.log("[SIGNIN] Step 7 Failed: userId/sub missing");
        setIsError(true);
        setMessage("Signin successful, but Cognito userId was not found.");
        return;
      }

      localStorage.setItem("userId", userId);

      const url = `${API_ENDPOINTS.getUser}?userId=${userId}`;

      console.log("API → get/users/me", { userId });
      console.log("[SIGNIN] Step 9: Calling Spring Boot get user API", {
        url,
        userId,
      });

      const userResponse = await fetch(url);

      console.log("[SIGNIN] Step 10: Spring Boot response received", {
        status: userResponse.status,
        ok: userResponse.ok,
      });

      const userData = await userResponse.json();

      console.log("[SIGNIN] Step 11: Spring Boot user data", userData);

      if (!userResponse.ok) {
        setIsError(true);
        setMessage(userData.message || "Unable to load user details.");
        return;
      }

      setUser(userData);
      setIsError(false);
      setMessage("Signin successful 🎉");

      console.log("[SIGNIN] Step 12: Signin complete, calling onSigninSuccess", {
        userData,
      });

      onSigninSuccess(userData);
    } catch (error: any) {
      console.error("Signin error:", error);

      setIsError(true);

      if (error.name === "NotAuthorizedException") {
        setMessage("Incorrect email or password.");
      } else if (error.name === "UserNotConfirmedException") {
        setMessage("Please verify your email before signing in.");
      } else if (error.name === "UserNotFoundException") {
        setMessage("No account found with this email.");
      } else {
        setMessage(error.message || "Signin failed. Please try again.");
      }
    } finally {
      console.log("[SIGNIN] Step 13: Signin flow finished");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <BackButton label="Home" onClick={onBack} />

        <div style={styles.card}>
          <div style={styles.badge}>✨ Welcome back to FitTrack</div>

          <div style={styles.emoji}>🥗</div>

          <h1 style={styles.title}>Continue your progress</h1>

          <p style={styles.subtitle}>
            Sign in with your registered email and password to keep your daily
            goals on track.
          </p>

          <div style={styles.previewCard}>
            <div style={styles.previewItem}>🥗 Track nutrition</div>
            <div style={styles.previewItem}>🚶 Stay consistent</div>
            <div style={styles.previewItem}>📊 View progress</div>
          </div>

          <div style={styles.inputWrapper}>
            <input
              style={{
                ...styles.input,
                ...(emailError ? styles.inputError : {}),
              }}
              name="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
            />
            {emailError && <div style={styles.fieldError}>{emailError}</div>}
          </div>

          <div style={styles.inputWrapper}>
            <div style={styles.passwordWrapper}>
              <input
                ref={passwordRef}
                style={{
                  ...styles.input,
                  ...styles.passwordInput,
                  ...(passwordError ? styles.inputError : {}),
                }}
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmitting) {
                    handleSubmit();
                  }
                }}
              />

              <button
                type="button"
                style={styles.eyeButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {passwordError && (
              <div style={styles.fieldError}>{passwordError}</div>
            )}
          </div>

          <p style={styles.helperText}>
            Cognito will verify your email and password.
          </p>

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

          {user && (
            <div style={styles.userBox}>
              <p style={styles.userName}>
                Hi, {user.firstName} {user.lastName}
              </p>
              <p style={styles.userEmail}>{user.email}</p>
            </div>
          )}

          <button
            style={{
              ...styles.primaryButton,
              ...(isSubmitting ? styles.disabledButton : {}),
            }}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
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
    fontSize: "30px",
    lineHeight: 1.15,
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
  previewCard: {
    display: "grid",
    gap: "10px",
    background: "linear-gradient(135deg, #ecfdf5, #ffffff)",
    border: "1px solid #bbf7d0",
    borderRadius: "20px",
    padding: "14px",
    marginBottom: "20px",
  },
  previewItem: {
    background: "white",
    borderRadius: "14px",
    padding: "10px",
    color: "#064e3b",
    fontSize: "14px",
    fontWeight: 800,
  },
  inputWrapper: {
    marginBottom: "10px",
    textAlign: "left",
  },
  passwordWrapper: {
    position: "relative",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1.5px solid #a7f3d0",
    fontSize: "15px",
    outline: "none",
    background: "white",
    WebkitTextFillColor: "#0f172a"
  },
  passwordInput: {
    paddingRight: "48px",
  },
  inputError: {
    border: "1.5px solid #ef4444",
    boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.12)",
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
  helperText: {
    margin: "0 0 18px",
    fontSize: "12px",
    color: "#64748b",
    textAlign: "center",
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
  userBox: {
    background: "#ecfdf5",
    border: "1.5px solid #a7f3d0",
    borderRadius: "16px",
    padding: "14px",
    marginBottom: "18px",
    animation: "popIn 0.45s ease",
  },
  userName: {
    margin: "0 0 4px",
    fontSize: "17px",
    fontWeight: "bold",
    color: "#064e3b",
  },
  userEmail: {
    margin: 0,
    fontSize: "14px",
    color: "#475569",
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
};