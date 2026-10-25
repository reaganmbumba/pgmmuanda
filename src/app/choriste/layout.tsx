import { ChoristeShell } from "@/components/layout/ChoristeShell";
import { BandeauDemo } from "@/components/ui/BandeauDemo";

export default function ChoristeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BandeauDemo />
      <ChoristeShell>{children}</ChoristeShell>
    </>
  );
}
