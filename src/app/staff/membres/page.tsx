import { UserPlus } from "lucide-react";
import { Bouton } from "@/components/ui/Bouton";
import { EnTete } from "@/components/ui/Carte";
import { membres, paroisses } from "@/lib/demo-data";
import { TableMembres } from "./TableMembres";

export const metadata = { title: "Membres" };

export default function PageMembres() {
  return (
    <>
      <EnTete
        titre="Membres"
        description="Fiches des choristes de toutes les paroisses de Muanda."
        actions={
          <Bouton>
            <UserPlus className="size-4" aria-hidden /> Nouveau membre
          </Bouton>
        }
      />
      <TableMembres membres={membres} paroisses={paroisses} />
    </>
  );
}
