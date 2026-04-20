import './globals.css';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, backgroundColor: '#0f172a' }}>{children}</body>
    </html>
  )
}
