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

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="var(--accent)"/>
      <path d="M8 24L16 8L24 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 19H21.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function DecorativeLines() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" opacity="0.15">
      <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="1"/>
      <circle cx="100" cy="100" r="55" stroke="white" strokeWidth="1"/>
      <circle cx="100" cy="100" r="30" stroke="white" strokeWidth="1"/>
      <line x1="100" y1="20" x2="100" y2="180" stroke="white" strokeWidth="0.5"/>
      <line x1="20" y1="100" x2="180" y2="100" stroke="white" strokeWidth="0.5"/>
      <line x1="43" y1="43" x2="157" y2="157" stroke="white" strokeWidth="0.5"/>
      <line x1="157" y1="43" x2="43" y2="157" stroke="white" strokeWidth="0.5"/>
    </svg>
  )
}