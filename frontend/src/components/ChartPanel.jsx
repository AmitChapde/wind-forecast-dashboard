
import styles from "./ChartPanel.module.css";

export default function ChartPanel({
  title,
  description,
  children,
  className = "",
}) {
  return (
    <section className={`${styles.panel} ${className}`}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>
      </header>

      <div className={styles.chart}>{children}</div>
    </section>
  );
}
