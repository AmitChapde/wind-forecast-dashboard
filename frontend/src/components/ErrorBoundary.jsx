
import { Component } from "react";
import styles from "./ErrorBoundary.module.css";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Replace with your monitoring service if one is added later.
    console.error("Dashboard rendering error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className={styles.page}>
          <section className={styles.card} role="alert">
            <span className={styles.icon} aria-hidden="true">
              !
            </span>
            <h1>Something went wrong</h1>
            <p>
              The dashboard couldn't render correctly. You can try loading
              the interface again.
            </p>
            <button onClick={this.handleRetry}>
              Try again
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
