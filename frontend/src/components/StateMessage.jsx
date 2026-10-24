
import styles from "./StateMessage.module.css";

export function LoadingState() {
  return (
    <div className={styles.container} role="status">
      <span className={styles.spinner} />
      <p>Loading wind forecast data…</p>
    </div>
  );
}

export function EmptyState({ message = "No data available for this period." }) {
  return (
    <div className={styles.container}>
      <span className={styles.emptyIcon} aria-hidden="true">∅</span>
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.container} role="alert">
      <p className={styles.errorTitle}>Unable to load dashboard data</p>
      <p>{message}</p>
      <button className={styles.retryButton} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
