import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/getUser";
import { LoginForm } from "./_components/LoginForm";

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/dashboard");
  return <LoginForm />;
}
