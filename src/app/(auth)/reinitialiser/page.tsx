import { FormulaireReinit } from "./FormulaireReinit";

export const metadata = { title: "Nouveau mot de passe" };

export default function PageReinitialiser() {
  return (
    <>
      <h1 className="text-2xl font-bold text-marine-900">Choisir un mot de passe</h1>
      <p className="mt-1 text-sm text-slate-500">Ce mot de passe vous servira à vous connecter à PGM Muanda Digital.</p>
      <FormulaireReinit />
    </>
  );
}
