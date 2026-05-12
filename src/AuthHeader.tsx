import { useState, useRef, useEffect } from "react";
import { signOut } from "aws-amplify/auth";

type AuthHeaderProps = {
  onLogout: () => void;
  onEditProfile: () => void;
};

export default function AuthHeader({
  onLogout,
  onEditProfile,
}: AuthHeaderProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem("userId");
    onLogout();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div style={styles.header}>
      <div style={styles.container} ref={dropdownRef}>
        <button
          style={styles.profileButton}
          onClick={() => setOpen((prev) => !prev)}
        >
          👤▾
        </button>

        {open && (
          <div style={styles.dropdown}>
            <button
              style={styles.menuItem}
              onClick={() => {
                setOpen(false);
                onEditProfile();
              }}
            >
              ✏️ Edit Profile
            </button>

            <button
              style={{ ...styles.menuItem, color: "#be123c" }}
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "16px",
  },

  container: {
    position: "relative",
  },

  profileButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(0, 0, 0, 0.08)",
    background: "linear-gradient(135deg, #ffffff, #f9fafb)",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
  },

  dropdown: {
    position: "absolute",
    top: "110%",
    right: 0,
    width: "160px",
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
    border: "1px solid rgba(0,0,0,0.05)",
    overflow: "hidden",
    zIndex: 10,
  },

  menuItem: {
    width: "100%",
    padding: "10px 14px",
    textAlign: "left",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    transition: "background 0.2s",
  },
};