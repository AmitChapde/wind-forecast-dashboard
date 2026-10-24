
import styles from "./MetricCard.module.css";

export default function MetricCard({
  label,
  value,
  description,
  icon,
  tone = "default",
}) {
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.icon} ${styles[tone]}`} aria-hidden="true">
          {icon}
        </span>
      </div>

      <p className={styles.value}>{value}</p>
      <p className={styles.description}>{description}</p>
    </article>
  );
}
