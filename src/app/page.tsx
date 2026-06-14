import { redirect } from "next/navigation";
import { getCurrentActor } from "@users/presentation/session";

export default async function Home() {
  const actor = await getCurrentActor();
  if (actor) redirect("/dashboard");
  redirect("/login");
}
