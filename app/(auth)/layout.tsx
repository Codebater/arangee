export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[--bg] text-[--ink] flex items-center justify-center px-6">
      {children}
    </main>
  );
}
