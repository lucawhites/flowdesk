"use client";

import { useRouter } from "next/navigation";
import { LensSegmented } from "@/components/ui/lens-segmented";

/** Settimana / Mese del Calendario, con la capsula a lente come la barra in basso. */
export function CalendarViewSwitch({
  view,
  weekHref,
  monthHref,
}: {
  view: "settimana" | "mese";
  weekHref: string;
  monthHref: string;
}) {
  const router = useRouter();
  return (
    <LensSegmented
      ariaLabel="Vista del calendario"
      value={view}
      onChange={(next) => router.push(next === "settimana" ? weekHref : monthHref)}
      options={[
        { value: "settimana", label: "Settimana" },
        { value: "mese", label: "Mese" },
      ]}
    />
  );
}
