import { useState } from "react";
import BackButton from "./BackButton";
import { API_ENDPOINTS } from "../api/apiConfig";

export default function Signin({
  onSigninSuccess,
  onBack,
}: {
  onSigninSuccess: (userData: any) => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [user, setUser] = useState<any>(null);

  const handleSubmit = async () => {
    setMessage("");
    setIsError(false);
    setUser(null);

    try {
      const payload = { email };

      console.log("API → post/users/email", payload);

      const emailResponse = await fetch(API_ENDPOINTS.loginByEmail, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

      const emailData = await emailResponse.json();

      if (!emailResponse.ok) {
        setIsError(true);
        setMessage(emailData.message || "Signin failed. Please try again.");
        return;
      }

      const userId = emailData.userId;

      if (!userId) {
        setIsError(true);
        setMessage("Login successful, but userId was not returned.");
        return;
      }

      localStorage.setItem("userId", userId);

      const url = `${API_ENDPOINTS.getUser}?userId=${userId}`;

      console.log("API → get/users/me", { userId });

      const userResponse = await fetch(url);

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        setIsError(true);
        setMessage(userData.message || "Unable to load user details.");
        return;
      }

      setUser(userData);
      setIsError(false);
      onSigninSuccess(userData);
      setMessage("Signin successful 🎉");
    } catch (error) {
      setIsError(true);
      setMessage("Unable to connect to server. Please try again.");
    }
  };

  return (
    <div style={styles.page}>
  <div style={styles.container}>
    <BackButton label="Home" onClick={onBack} />

    <div style={styles.card}>
      <div style={styles.emoji}>🥗</div>

        <h1 style={styles.title}>Welcome Back</h1>

        <p style={styles.subtitle}>
          Sign in with your email to continue tracking your goals.
        </p>

        <input
          style={styles.input}
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

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

        <button style={styles.primaryButton} onClick={handleSubmit}>
          Sign In
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
  card: {
  width: "100%",
  maxWidth: "430px",
  padding: "30px 24px",
  borderRadius: "28px",
  background: "rgba(255, 255, 255, 0.88)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
  textAlign: "center",
  animation: "fadeIn 0.8s ease",
  boxSizing: "border-box", // add this
},
  emoji: {
    fontSize: "54px",
    marginBottom: "8px",
    animation: "bounce 1.8s infinite",
  },
  title: {
    fontSize: "32px",
    margin: "0 0 8px",
    color: "#064e3b",
  },
  container: {
  maxWidth: "430px",
  margin: "0 auto",
},
  subtitle: {
    fontSize: "15px",
    color: "#475569",
    lineHeight: 1.5,
    marginBottom: "22px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1.5px solid #a7f3d0",
    fontSize: "15px",
    outline: "none",
    background: "white",
    marginBottom: "18px",
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
  boxSizing: "border-box", // add this
  padding: "15px",
  borderRadius: "16px",
  border: "none",
  background: "#10b981",
  color: "white",
  fontSize: "17px",
  fontWeight: "bold",
  cursor: "pointer",
},
};