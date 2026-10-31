import { AccueilSite } from "@/components/site/SitePublic";

// Tout le monde voit le site public de l'antenne, membres connectés compris :
// le bouton « Mon espace » de l'en-tête les mène à leur espace.
export default function Accueil() {
  return <AccueilSite />;
}
