import { Carte, EnTete } from "@/components/ui/Carte";
import { ModulePrevu } from "@/components/ui/ModulePrevu";
import { exigerAcces } from "@/lib/auth/session";
import { rolesAttribuables, type Role } from "@/lib/auth/roles";
import { menuStaff } from "@/lib/navigation";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { supabaseActif } from "@/lib/supabase/config";
import { creerClientServeur } from "@/lib/supabase/server";
import { FormulaireInvitation, LigneUtilisateur } from "./Formulaires";

export const metadata = { title: "Utilisateurs et permissions" };

export default async function PageUtilisateurs() {
  if (!supabaseActif) return <ModulePrevu entree={menuStaff.find((e) => e.href === "/staff/utilisateurs")!} />;
  const moi = (await exigerAcces("/staff/utilisateurs"))!;
  const supabase = await creerClientServeur();

  const [{ data: profils, error }, { data: paroisses }, { data: commissions }] = await Promise.all([
    supabase.from("profils").select("id, identifiant, nom_affiche, role, paroisse_id, commission_id, actif").order("nom_affiche"),
    supabase.from("paroisses").select("id, nom").order("nom"),
    supabase.from("commissions").select("id, nom").order("nom"),
  ]);

  // Les adresses e-mail sont dans Supabase Auth : lecture côté serveur uniquement.
  const emails = new Map<string, string>();
  const admin = creerClientAdmin();
  if (admin) {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    data?.users.forEach((u) => u.email && emails.set(u.id, u.email));
  }

  const listes = { roles: rolesAttribuables(moi.role), paroisses: paroisses ?? [], commissions: commissions ?? [] };

  return (
    <>
      <EnTete titre="Utilisateurs et permissions" description="Comptes du staff et des choristes, rôles et périmètres d'accès." />
      <div className="space-y-6">
        <Carte titre="Inviter une personne">
          <p className="mb-4 text-sm text-slate-500">
            La personne reçoit un e-mail pour choisir son mot de passe. Elle n&apos;aura accès qu&apos;aux fonctions de son rôle.
          </p>
          {admin ? (
            <FormulaireInvitation {...listes} />
          ) : (
            <p className="rounded-xl bg-or-100 p-3 text-sm text-or-600">
              Pour envoyer des invitations, ajoutez la clé SUPABASE_SERVICE_ROLE_KEY dans la configuration du serveur.
            </p>
          )}
        </Carte>
        <Carte titre={`Comptes (${profils?.length ?? 0})`}>
          {error && <p className="p-4 text-sm text-red-700">Impossible de charger les comptes.</p>}
          <div className="-mx-5 -mb-5">
            {profils?.map((p) => (
              <LigneUtilisateur
                key={p.id}
                {...listes}
                estMoi={p.id === moi.id}
                u={{
                  id: p.id,
                  nom: p.nom_affiche || "Sans nom",
                  email: emails.get(p.id) ?? null,
                  identifiant: p.identifiant,
                  role: p.role as Role,
                  paroisseId: p.paroisse_id,
                  commissionId: p.commission_id,
                  actif: p.actif,
                }}
              />
            ))}
          </div>
        </Carte>
      </div>
    </>
  );
}
