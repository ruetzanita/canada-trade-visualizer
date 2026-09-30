import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0B0D17',
      color: '#FFFFFF',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '72px', margin: '0 0 16px', color: '#F03A47' }}>404</h1>
      <h2 style={{ fontSize: '24px', margin: '0 0 16px', fontWeight: 600 }}>Page Not Found</h2>
      <p style={{ color: '#94A3B8', maxWidth: '400px', marginBottom: '32px', lineHeight: 1.6 }}>
        The macroeconomic trade view or dataset you requested is not available.
      </p>
      <Link 
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          background: '#F03A47',
          color: '#FFFFFF',
          borderRadius: '24px',
          textDecoration: 'none',
          fontWeight: 600,
          transition: 'background 0.2s'
        }}
      >
        Return to Global Dashboard
      </Link>
    </div>
  );
}
