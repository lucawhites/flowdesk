"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TeamMember } from "@/lib/types";

export function MemberSelect({
  id,
  name,
  members,
  currentUserId,
  defaultValue,
}: {
  id: string;
  name: string;
  members: TeamMember[];
  currentUserId: string;
  defaultValue: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {members.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            {member.id === currentUserId ? `${member.name} (tu)` : member.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
