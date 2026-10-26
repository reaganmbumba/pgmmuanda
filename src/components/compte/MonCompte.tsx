import { KeyRound } from "lucide-react";
import { changerMotDePasse } from "@/app/compte/actions";
import { Champ } from "@/components/ui/Champ";
import { classeChamp } from "@/components/ui/Formulaire";
import { FormulaireRapide } from "@/components/ui/FormulaireRapide";
import { LIBELLES_ROLES, type Role } from "@/lib/auth/roles";

/** Informations du compte et changement de mot de passe (staff et choristes). */
export function MonCompte({ nom, email, role }: { nom: string; email: string | null; role: Role }) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-marine-900">Mon compte</h2>
        <dl className="mt-3 divide-y divide-slate-100 text-sm">
          <div className="flex justify-between gap-3 py-2"><dt className="text-slate-500">Nom</dt><dd className="font-medium text-marine-900">{nom}</dd></div>
          {email && <div className="flex justify-between gap-3 py-2"><dt className="text-slate-500">Adresse e-mail</dt><dd className="break-all text-right font-medium text-marine-900">{email}</dd></div>}
          <div className="flex justify-between gap-3 py-2"><dt className="text-slate-500">Rôle</dt><dd className="font-medium text-marine-900">{LIBELLES_ROLES[role]}</dd></div>
        </dl>
      </section>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-semibold text-marine-900">Changer mon mot de passe</h2>
        <p className="mb-4 text-sm text-slate-500">Au moins 10 caractères, avec des lettres et au moins un chiffre.</p>
        <FormulaireRapide action={changerMotDePasse} libelle="Changer le mot de passe" grille={false} icone={<KeyRound className="size-4" aria-hidden />}>
          <Champ libelle="Mot de passe actuel"><input name="actuel" type="password" required autoComplete="current-password" className={classeChamp} /></Champ>
          <Champ libelle="Nouveau mot de passe"><input name="motDePasse" type="password" required minLength={10} autoComplete="new-password" className={classeChamp} /></Champ>
          <Champ libelle="Retapez le nouveau mot de passe"><input name="confirmation" type="password" required autoComplete="new-password" className={classeChamp} /></Champ>
        </FormulaireRapide>
      </section>
    </div>
  );
}
