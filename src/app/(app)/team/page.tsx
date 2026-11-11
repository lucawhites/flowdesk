import { requireSessionUser } from "@/lib/dal";
import { getTeamWork } from "@/lib/queries";
import { computeKpis } from "@/lib/kpi";
import { AgentPanel } from "@/components/kpi/agent-panel";
import { TeamView } from "./team-view";

export default async function TeamPage() {
  const user = await requireSessionUser();
  const kpis = computeKpis(await getTeamWork(user.teamId));
  return (
    <>
      <TeamView kpis={kpis} teamName={user.teamName} currentUserId={user.id} />
      <AgentPanel teamId={user.teamId} isAdmin={user.role === "ADMIN"} />
    </>
  );
}
