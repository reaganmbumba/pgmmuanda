export function SansCarte({ relie }: { relie: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
      <p className="font-semibold text-marine-900">{relie ? "Votre carte n'a pas encore été émise" : "Votre fiche n'est pas encore disponible"}</p>
      <p className="mt-2 text-sm text-slate-500">
        {relie
          ? "Elle sera disponible ici dès que le staff l'aura émise. Votre fiche doit être au statut « Actif »."
          : "Votre compte n'est pas encore relié à votre fiche de membre. Contactez le secrétariat de la PGM ou le responsable de votre paroisse."}
      </p>
    </div>
  );
}
