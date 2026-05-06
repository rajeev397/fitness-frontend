type BackButtonProps = {
  label?: string;
  onClick: () => void;
};

export default function BackButton({
  label = "Back",
  onClick,
}: BackButtonProps) {
  return (
    <button style={styles.backButton} onClick={onClick}>
      ← {label}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backButton: {
    marginBottom: "16px",
    border: "none",
    background: "#ecfdf5",
    color: "#047857",
    padding: "10px 14px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: 800,
  },
};