"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/input";

const PREFIX = /^\s*(?:[-•*]|\d+[.)])\s*/;

/** Toglie i numeri vecchi e rinumera le righe piene: «1. », «2. »… (le righe vuote spariscono). */
function renumber(text: string) {
  const lines = text.split("\n").map((l) => l.replace(PREFIX, "").trimEnd());
  const full = lines.filter((l) => l.trim());
  return full.map((l, i) => `${i + 1}. ${l.trimStart()}`).join("\n");
}

/**
 * Campo «Passi» della finestra obiettivo, numerato mentre si scrive: al primo tocco compare «1. »,
 * Invio va a capo col numero successivo, uscendo dal campo i numeri si rimettono in ordine.
 * Il server toglie comunque numeri e trattini (work-actions), quindi il testo salvato è pulito.
 */
export function NumberedStepsField({ id, name }: { id: string; name: string }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.metaKey || e.ctrlKey || e.altKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    const el = e.currentTarget;
    const before = value.slice(0, el.selectionStart);
    const after = value.slice(el.selectionEnd);
    // Riga vuota con solo il numero: Invio non aggiunge altre righe.
    const currentLine = before.split("\n").pop() ?? "";
    if (!currentLine.replace(PREFIX, "").trim()) return;
    const next = before.split("\n").length + 1;
    const insert = `\n${next}. `;
    const raw = before + insert + after;
    // Rinumera tutto tranne la riga appena aperta (vuota), poi rimette il cursore dopo il suo numero.
    const lines = raw.split("\n");
    const cursorLine = before.split("\n").length; // indice della nuova riga
    const fixed = lines.map((l, i) => `${i + 1}. ${l.replace(PREFIX, "").trimStart()}`).join("\n");
    setValue(fixed);
    const pos = fixed.split("\n").slice(0, cursorLine + 1).join("\n").length;
    requestAnimationFrame(() => ref.current?.setSelectionRange(pos, pos));
  }

  return (
    <Textarea
      ref={ref}
      id={id}
      name={name}
      rows={5}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onFocus={() => {
        if (!value.trim()) {
          setValue("1. ");
          requestAnimationFrame(() => ref.current?.setSelectionRange(3, 3));
        }
      }}
      onBlur={() => setValue((v) => (v.replace(PREFIX, "").trim() ? renumber(v) : ""))}
      onKeyDown={onKeyDown}
      placeholder={"1. Chiedere il preventivo al fornitore\n2. Approvare il campione"}
    />
  );
}
