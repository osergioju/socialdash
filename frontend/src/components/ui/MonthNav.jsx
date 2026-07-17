import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { C } from "../../utils/colors";

// Navegador de mês por setas (substitui a antiga fileira de pills com scroll horizontal).
// `months` deve estar em ordem cronológica ascendente (índice maior = mês mais recente).
export default function MonthNav({ months, selected, onSelect, color = C.primary, extra }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const canPrev = selected > 0;
  const canNext = selected < months.length - 1;
  const label = months[selected]?.monthLabel ?? "—";

  const arrowStyle = (enabled) => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`,
    background: C.card, cursor: enabled ? "pointer" : "default",
    opacity: enabled ? 1 : 0.35, color: C.textMuted, flexShrink: 0,
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
      {extra}
      <div ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }}>
        <button disabled={!canPrev} onClick={() => onSelect(selected - 1)} style={arrowStyle(canPrev)} aria-label="Mês anterior">
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            padding: "5px 16px", borderRadius: 8, border: `1px solid ${color}50`,
            background: color + "18", color, cursor: "pointer",
            fontSize: 12, fontWeight: 700, fontFamily: "inherit", minWidth: 92, textAlign: "center",
          }}
        >
          {label}
        </button>

        <button disabled={!canNext} onClick={() => onSelect(selected + 1)} style={arrowStyle(canNext)} aria-label="Próximo mês">
          <ChevronRight size={16} />
        </button>

        {open && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 38, zIndex: 20,
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: 6, display: "flex", flexDirection: "column", gap: 2,
            maxHeight: 240, overflowY: "auto", minWidth: 110,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}>
            {months.map((mo, i) => (
              <button
                key={i}
                onClick={() => { onSelect(i); setOpen(false); }}
                style={{
                  padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600, fontFamily: "inherit", textAlign: "left",
                  background: i === selected ? color + "20" : "transparent",
                  color: i === selected ? color : C.textMuted,
                }}
              >
                {mo.monthLabel}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
