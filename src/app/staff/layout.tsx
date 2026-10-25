import { StaffShell } from "@/components/layout/StaffShell";
import { BandeauDemo } from "@/components/ui/BandeauDemo";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BandeauDemo />
      <StaffShell>{children}</StaffShell>
    </>
  );
}
