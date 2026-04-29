import { requireAdmin } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="min-h-screen flex bg-[--bg]">
      <Sidebar name={session.user.name} />
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-5xl px-6 md:px-10 py-8 md:py-10 animate-fade-up">
          {children}
        </div>
      </main>
    </div>
  );
}
