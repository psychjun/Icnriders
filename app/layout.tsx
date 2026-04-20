export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body style={{ margin: 0, backgroundColor: '#0f172a' }}>
        {children}
      </body>
    </html>
  )
}
