import { redirect } from "next/navigation";

export default async function FunnelPageRoute({
  params,
}: {
  params: Promise<{ pageName: string }>;
}) {
  const { pageName } = await params;
  redirect(`/f/${pageName}`);
}
