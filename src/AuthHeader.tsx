import { signOut } from "aws-amplify/auth";

type AuthHeaderProps = {
  onLogout: () => void;
};

export default function AuthHeader({ onLogout }: AuthHeaderProps) {
  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem("userId");
    onLogout();
  };

  return (
  <div style={styles.header}>
    <button style={styles.logoutButton} onClick={handleLogout}>
      🚪 Logout
    </button>
  </div>
);
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "16px",
  },

  logoutButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    background: "linear-gradient(135deg, #fff1f2, #ffffff)",
    color: "#be123c",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(239, 68, 68, 0.15)",
    transition: "all 0.2s ease",
  },
};