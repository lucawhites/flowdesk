import type { Period, Priority, Status } from "@/generated/prisma/enums";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
};

export type TaskWithRelations = {
  id: string;
  title: string;
  description: string | null;
  period: Period;
  status: Status;
  priority: Priority;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  assignee: { id: string; name: string };
  creatorId: string;
};
