import { Suspense } from "react";
import { OuvertureSession } from "./OuvertureSession";

export const metadata = { title: "Connexion en cours" };

export default function Page() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-marine-50 p-6">
      <Suspense>
        <OuvertureSession />
      </Suspense>
    </main>
  );
}
