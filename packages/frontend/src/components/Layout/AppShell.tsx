import type { ReactNode } from 'react';
import styles from './AppShell.module.css';

interface AppShellProps {
  header: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
}

/**
 * Main application layout shell
 * Provides consistent structure: header, main content area, and sidebar
 */
export function AppShell({ header, main, sidebar }: AppShellProps) {
  return (
    <div className={styles.app}>
      {header}
      <div className={styles.content}>
        <main className={styles.main}>{main}</main>
        <aside className={styles.sidebar}>{sidebar}</aside>
      </div>
    </div>
  );
}
