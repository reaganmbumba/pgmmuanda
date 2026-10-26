"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cheminSur } from "@/lib/auth/roles";
import { creerClientServeur } from "@/lib/supabase/server";

/** Marque une notification comme lue puis ouvre son lien. */
export async function ouvrirNotification(form: FormData) {
  const supabase = await creerClientServeur();
  await supabase.from("notifications").update({ lue: true }).eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
  redirect(cheminSur(String(form.get("lien") ?? ""), "/"));
}

export async function toutMarquerLu() {
  const supabase = await creerClientServeur();
  await supabase.from("notifications").update({ lue: true }).eq("lue", false);
  revalidatePath("/", "layout");
}
