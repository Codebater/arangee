import { requireUser } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();
  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <Sidebar name={user.name} username={user.username} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-6 py-8 md:px-10 md:py-10 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
