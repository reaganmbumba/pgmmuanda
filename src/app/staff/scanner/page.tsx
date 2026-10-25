import { EnTete } from "@/components/ui/Carte";
import { Scanner } from "./Scanner";

export const metadata = { title: "Scanner une carte" };

export default function PageScanner() {
  return (
    <>
      <EnTete
        titre="Scanner une carte"
        description="Vérifiez la validité d'une carte de choriste avec la caméra ou par matricule."
      />
      <Scanner />
    </>
  );
}
