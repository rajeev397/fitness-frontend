import GoalCard from "./GoalCard";

export default function Dashboard() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Your Daily Progress</h1>

        <GoalCard
          title="Steps"
          value={4500}
          goal={9000}
          unit="steps"
          emoji="🥾"
        />

        <GoalCard
          title="Protein"
          value={60}
          goal={120}
          unit="g"
          emoji="🥩"
        />

        <GoalCard
          title="Water"
          value={2}
          goal={3.5}
          unit="L"
          emoji="💧"
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    background:
      "linear-gradient(135deg, #d1fae5 0%, #ecfeff 50%, #fef3c7 100%)",
    fontFamily: "Arial, sans-serif",
  },
  container: {
    maxWidth: "420px",
    margin: "0 auto",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#064e3b",
  },
};