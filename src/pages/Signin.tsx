import { useEffect, useRef, useState } from "react";
import {
  signIn,
  fetchAuthSession,
  resetPassword,
  confirmResetPassword,
} from "aws-amplify/auth";
import BackButton from "./BackButton";
import { API_ENDPOINTS } from "../api/apiConfig";
import { signOut } from "aws-amplify/auth";

type AuthMode = "signin" | "forgot" | "reset";

export default function Signin({
  onSigninSuccess,
  onBack,
}: {
  onSigninSuccess: (userData: any) => void;
  onBack: () => void;
}) {
  const savedEmail = sessionStorage.getItem("loginEmail") || "";
  const successMessage = sessionStorage.getItem("loginSuccessMessage") || "";

  const [mode, setMode] = useState<AuthMode>("signin");

  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState("");

  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [message, setMessage] = useState(successMessage);
  const [isError, setIsError] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resetCodeError, setResetCodeError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const resetCodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (savedEmail) {
      passwordRef.current?.focus();
    }

    sessionStorage.removeItem("loginEmail");
    sessionStorage.removeItem("loginSuccessMessage");
  }, [savedEmail]);

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setResetCodeError("");
    setNewPasswordError("");
    setConfirmNewPasswordError("");
  };

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validateSigninForm = () => {
    let isValid = true;

    clearErrors();

    if (!email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    }

    return isValid;
  };

  const validateForgotForm = () => {
    let isValid = true;

    clearErrors();

    if (!email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      isValid = false;
    }

    return isValid;
  };

  const validateResetForm = () => {
    let isValid = true;

    clearErrors();

    if (!email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      isValid = false;
    }

    if (!resetCode.trim()) {
      setResetCodeError("Reset code is required.");
      isValid = false;
    }

    if (!newPassword) {
      setNewPasswordError("New password is required.");
      isValid = false;
    } else if (newPassword.length < 8) {
      setNewPasswordError("Password must be at least 8 characters.");
      isValid = false;
    }

    if (!confirmNewPassword) {
      setConfirmNewPasswordError("Confirm password is required.");
      isValid = false;
    } else if (newPassword !== confirmNewPassword) {
      setConfirmNewPasswordError("Passwords do not match.");
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

    if (!validateSigninForm()) {
      setIsError(true);
      setMessage("Please fix the highlighted fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      console.log("[SIGNIN] Step 3: Calling Cognito signIn", {
        username: email,
      });

      try {
  await signOut();
} catch {
  // ignore if no user is signed in
}

      const signInResult = await signIn({
        username: email,
        password,
      });

      console.log("[SIGNIN] Step 4: Cognito signIn success", signInResult);

      console.log("[SIGNIN] Step 5: Fetching Cognito auth session");
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken?.toString();

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

      const url = API_ENDPOINTS.getUser;

      console.log("API → get/users/me", { userId });
      console.log("[SIGNIN] Step 9: Calling Spring Boot get user API", {
        url,
        userId,
      });

      const userResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

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

  const handleSendResetCode = async () => {
    setMessage("");
    setIsError(false);
    setUser(null);

    if (!validateForgotForm()) {
      setIsError(true);
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);

      await resetPassword({
        username: email,
      });

      setIsError(false);
      setMessage("Password reset code sent to your email 📩");
      setMode("reset");

      setTimeout(() => {
        resetCodeRef.current?.focus();
      }, 0);
    } catch (error: any) {
      console.error("Reset password error:", error);

      setIsError(true);

      if (error.name === "UserNotFoundException") {
        setMessage("No account found with this email.");
      } else if (error.name === "LimitExceededException") {
        setMessage("Too many attempts. Please wait and try again.");
      } else {
        setMessage(error.message || "Unable to send reset code.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmResetPassword = async () => {
    setMessage("");
    setIsError(false);
    setUser(null);

    if (!validateResetForm()) {
      setIsError(true);
      setMessage("Please fix the highlighted fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      await confirmResetPassword({
        username: email,
        confirmationCode: resetCode.trim(),
        newPassword,
      });

      setPassword("");
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setMode("signin");

      setIsError(false);
      setMessage("Password updated successfully 🎉 Please sign in.");

      setTimeout(() => {
        passwordRef.current?.focus();
      }, 0);
    } catch (error: any) {
      console.error("Confirm reset password error:", error);

      setIsError(true);

      if (error.name === "CodeMismatchException") {
        setMessage("Invalid reset code. Please try again.");
      } else if (error.name === "ExpiredCodeException") {
        setMessage("Reset code expired. Please request a new code.");
      } else if (error.name === "InvalidPasswordException") {
        setMessage(error.message || "Password does not meet requirements.");
      } else {
        setMessage(error.message || "Unable to reset password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToForgotPassword = () => {
    clearErrors();
    setMessage("");
    setIsError(false);
    setUser(null);
    setMode("forgot");

    setTimeout(() => {
      emailRef.current?.focus();
    }, 0);
  };

  const goToSignin = () => {
    clearErrors();
    setMessage("");
    setIsError(false);
    setMode("signin");

    setTimeout(() => {
      if (email) {
        passwordRef.current?.focus();
      } else {
        emailRef.current?.focus();
      }
    }, 0);
  };

  const title =
    mode === "signin"
      ? "Continue your progress"
      : mode === "forgot"
        ? "Reset your password"
        : "Create new password";

  const subtitle =
    mode === "signin"
      ? "Sign in with your registered email and password to keep your daily goals on track."
      : mode === "forgot"
        ? "Enter your registered email and we’ll send you a password reset code."
        : "Enter the code from your email and choose a new password.";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <BackButton
          label={mode === "signin" ? "Home" : "Back to Sign In"}
          onClick={mode === "signin" ? onBack : goToSignin}
        />

        <div style={styles.card}>
          <div style={styles.badge}>
            {mode === "signin"
              ? "✨ Welcome back to FitTrack"
              : "🔐 Secure account recovery"}
          </div>

          <div style={styles.emoji}>{mode === "signin" ? "🥗" : "🔑"}</div>

          <h1 style={styles.title}>{title}</h1>

          <p style={styles.subtitle}>{subtitle}</p>

          {mode === "signin" && (
            <div style={styles.previewCard}>
              <div style={styles.previewItem}>🥗 Track nutrition</div>
              <div style={styles.previewItem}>🚶 Stay consistent</div>
              <div style={styles.previewItem}>📊 View progress</div>
            </div>
          )}

          <div style={styles.inputWrapper}>
            <input
              ref={emailRef}
              style={{
                ...styles.input,
                ...(emailError ? styles.inputError : {}),
              }}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitting) {
                  if (mode === "signin") {
                    passwordRef.current?.focus();
                  } else if (mode === "forgot") {
                    handleSendResetCode();
                  }
                }
              }}
            />
            {emailError && <div style={styles.fieldError}>{emailError}</div>}
          </div>

          {mode === "signin" && (
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
                  autoComplete="current-password"
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
          )}

          {mode === "reset" && (
            <>
              <div style={styles.inputWrapper}>
                <input
                  ref={resetCodeRef}
                  style={{
                    ...styles.input,
                    ...(resetCodeError ? styles.inputError : {}),
                  }}
                  name="resetCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Reset code"
                  value={resetCode}
                  onChange={(e) => {
                    setResetCode(e.target.value);
                    setResetCodeError("");
                  }}
                />
                {resetCodeError && (
                  <div style={styles.fieldError}>{resetCodeError}</div>
                )}
              </div>

              <div style={styles.inputWrapper}>
                <div style={styles.passwordWrapper}>
                  <input
                    style={{
                      ...styles.input,
                      ...styles.passwordInput,
                      ...(newPasswordError ? styles.inputError : {}),
                    }}
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setNewPasswordError("");
                    }}
                  />

                  <button
                    type="button"
                    style={styles.eyeButton}
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showNewPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {newPasswordError && (
                  <div style={styles.fieldError}>{newPasswordError}</div>
                )}
              </div>

              <div style={styles.inputWrapper}>
                <input
                  style={{
                    ...styles.input,
                    ...(confirmNewPasswordError ? styles.inputError : {}),
                  }}
                  name="confirmNewPassword"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    setConfirmNewPasswordError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isSubmitting) {
                      handleConfirmResetPassword();
                    }
                  }}
                />

                {confirmNewPasswordError && (
                  <div style={styles.fieldError}>
                    {confirmNewPasswordError}
                  </div>
                )}
              </div>
            </>
          )}

          <p style={styles.helperText}>
            {mode === "signin"
              ? "Cognito will verify your email and password."
              : mode === "forgot"
                ? "We’ll send the reset code to your Cognito-registered email."
                : "Your new password will be saved securely in Cognito."}
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

          {mode === "signin" && (
            <>
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

              <button
                type="button"
                style={styles.linkButton}
                onClick={goToForgotPassword}
              >
                Forgot password?
              </button>
            </>
          )}

          {mode === "forgot" && (
            <>
              <button
                style={{
                  ...styles.primaryButton,
                  ...(isSubmitting ? styles.disabledButton : {}),
                }}
                onClick={handleSendResetCode}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending Code..." : "Send Reset Code 📩"}
              </button>

              <button type="button" style={styles.linkButton} onClick={goToSignin}>
                Back to Sign In
              </button>
            </>
          )}

          {mode === "reset" && (
            <>
              <button
                style={{
                  ...styles.primaryButton,
                  ...(isSubmitting ? styles.disabledButton : {}),
                }}
                onClick={handleConfirmResetPassword}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating Password..." : "Update Password 🔐"}
              </button>

              <button
                type="button"
                style={styles.linkButton}
                onClick={handleSendResetCode}
                disabled={isSubmitting}
              >
                Resend reset code
              </button>
            </>
          )}
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
    fontSize: "16px",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    caretColor: "#047857",
    opacity: 1,
    WebkitTextFillColor: "#0f172a",
    WebkitAppearance: "none",
    appearance: "none",
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