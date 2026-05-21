import React from 'react'
import styles from './AuthLayout.module.css'

interface AuthLayoutProps {
  children: React.ReactNode
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className={styles.root}>
      {/* Decorative left panel */}
      <div className={styles.panel}>
        <div className={styles.panelContent}>
          <div className={styles.brand}>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.card}>
          {children}
        </div>
      </main>
    </div>
  )
}