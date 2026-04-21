import { Suspense } from "react";
import { SetupPasswordClient } from "./_components/SetupPasswordClient";

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetupPasswordClient />
    </Suspense>
  );
}
