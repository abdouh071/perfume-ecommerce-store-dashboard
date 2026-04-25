import React from 'react';

/**
 * ErrorBoundary — catches any unhandled render/lifecycle errors in the tree below it.
 * Without this, a single component crash blanks the entire app with no message.
 * Must be a class component — React does not yet support hooks-based error boundaries.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Firestore SDK v12 throws harmless INTERNAL ASSERTION FAILED errors
    // during onSnapshot listener cleanup when navigating away from pages.
    // These are SDK-internal race conditions, not real app errors.
    if (error?.message?.includes('INTERNAL ASSERTION FAILED')) {
      console.warn('[ErrorBoundary] Suppressed Firestore SDK internal assertion (harmless):', error.message);
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Suppress Firestore SDK internal assertion errors
    if (error?.message?.includes('INTERNAL ASSERTION FAILED')) {
      console.warn('[ErrorBoundary] Suppressed Firestore SDK assertion during cleanup.');
      return;
    }
    // Log to console in development; swap for Sentry/LogRocket in production
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReload() {
    window.location.href = '/';
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#faf9f7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Manrope, sans-serif',
          padding: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: '#fff',
            border: '1px solid #e2e2e4',
            borderRadius: '2rem',
            padding: '3rem 2.5rem',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#fff5f5',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: '1.75rem',
              fontFamily: "'Noto Serif', serif",
              color: '#1a1c1d',
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em',
            }}
          >
            Something went wrong
          </h1>

          <p style={{ color: '#a69b91', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            An unexpected error occurred. We're sorry for the inconvenience.
            Please return to the homepage and try again.
          </p>

          {/* Error detail (dev-friendly) */}
          {this.state.error && (
            <details
              style={{
                textAlign: 'left',
                background: '#f9f9f9',
                border: '1px solid #e2e2e4',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                marginBottom: '2rem',
                cursor: 'pointer',
              }}
            >
              <summary
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#a69b91',
                  userSelect: 'none',
                }}
              >
                Error details
              </summary>
              <pre
                style={{
                  marginTop: '0.5rem',
                  fontSize: '0.7rem',
                  color: '#dc2626',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowX: 'auto',
                }}
              >
                {this.state.error.toString()}
              </pre>
            </details>
          )}

          {/* CTA */}
          <button
            onClick={this.handleReload}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: '#1a1c1d',
              color: '#fff',
              border: 'none',
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.target.style.background = '#826a11'; }}
            onMouseLeave={(e) => { e.target.style.background = '#1a1c1d'; }}
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }
}
