import { requireAdmin } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="min-h-screen flex">
      <Sidebar name={session.user.name} />
      <div className="flex-1 max-w-5xl mx-auto p-6 md:p-10 animate-fade-up">{children}</div>
    </div>
  );
}
