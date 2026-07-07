import React, { useState, useEffect, useCallback } from "react";
import { Search, Globe, Image, FileText, Check, RefreshCw, PlugZap, Eye, Users } from "lucide-react";
import { campaignsApi } from "../../services/api";
import SectionHeader from "../../components/ui/SectionHeader";
import { LoadingState, ErrorState } from "../../components/ui/LoadingState";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

const inputStyle = {
  width: "100%", padding: "9px 12px 9px 34px", borderRadius: 9,
  border: `1px solid ${C.border}`, background: C.cardHover,
  color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

const dateStyle = {
  padding: "8px 10px", borderRadius: 9, border: `1px solid ${C.border}`,
  background: C.cardHover, color: C.text, fontSize: 12, fontFamily: "inherit", outline: "none",
};

function toInputDate(d) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
      <Search size={14} color={C.textDim} style={{ position: "absolute", left: 11, top: 10 }} />
      <input style={inputStyle} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PeriodFilter({ from, to, onFrom, onTo }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input type="date" style={dateStyle} value={from} onChange={(e) => onFrom(e.target.value)} title="Data inicial do filtro" />
      <span style={{ color: C.textDim, fontSize: 11 }}>até</span>
      <input type="date" style={dateStyle} value={to} onChange={(e) => onTo(e.target.value)} title="Data final do filtro" />
    </div>
  );
}

// Integração não conectada: aviso informativo, não erro.
function NotConnected({ message }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", background: C.card, border: `1px dashed ${C.border}`, borderRadius: 12 }}>
      <PlugZap size={18} color={C.textDim} />
      <p style={{ margin: 0, fontSize: 12.5, color: C.textMuted }}>{message}</p>
    </div>
  );
}

function SaveBar({ count, saving, saved, onSave }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
      <button onClick={onSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, border: "none", background: saving ? C.border : `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", cursor: saving ? "default" : "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
        {saving ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
        {saving ? "Salvando…" : `Salvar seleção (${count})`}
      </button>
      {saved && <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Seleção salva</span>}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── 1. Website (GA4): páginas do período — apenas seleção, nada é criado ─────

function PagePicker({ campaign, onChanged }) {
  const [pages, setPages]         = useState(null);
  const [error, setError]         = useState(null);
  const [notConnected, setNotConnected] = useState(null);
  const [q, setQ]                 = useState("");
  const [from, setFrom]           = useState(toInputDate(campaign.startDate));
  const [to, setTo]               = useState(toInputDate(campaign.endDate));
  const [selected, setSelected]   = useState(() => new Map(
    (campaign.pages || []).map((p) => [p.pagePath, p.label])
  ));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const load = useCallback(() => {
    setError(null);
    setNotConnected(null);
    setPages(null);
    campaignsApi.assetsPages(campaign.id, { from: from || undefined, to: to || undefined })
      .then(setPages)
      .catch((e) => {
        const msg = e.response?.data?.error || "Erro ao carregar páginas";
        if (e.response?.status === 400) setNotConnected(msg);
        else setError(msg);
      });
  }, [campaign.id, from, to]);

  useEffect(() => { load(); }, [load]);

  function toggle(page) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(page.pagePath)) next.delete(page.pagePath);
      else next.set(page.pagePath, page.label);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      await campaignsApi.setPages(campaign.id, [...selected.entries()].map(([pagePath, label]) => ({ pagePath, label })));
      setSaved(true);
      onChanged?.();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao salvar seleção");
    } finally {
      setSaving(false);
    }
  }

  if (notConnected) return <NotConnected message={`${notConnected}. Conecte o Google Analytics na tela do cliente para vincular páginas.`} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const filtered = pages && q
    ? pages.filter((p) => p.pagePath.toLowerCase().includes(q.toLowerCase()) || (p.label || "").toLowerCase().includes(q.toLowerCase()))
    : pages;

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <SearchBox value={q} onChange={setQ} placeholder="Pesquisar por URL ou título… ex: /dia-das-maes" />
        <PeriodFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </div>

      {!pages && <LoadingState message="Buscando páginas do site no período…" />}

      {filtered && filtered.length === 0 && (
        <p style={{ color: C.textDim, fontSize: 12 }}>Nenhuma página com tráfego encontrada nesse período.</p>
      )}

      {filtered && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
          {filtered.map((page) => {
            const isSel = selected.has(page.pagePath);
            return (
              <div key={page.pagePath} onClick={() => toggle(page)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                background: C.card, border: `1px solid ${isSel ? C.primary : C.border}`,
              }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: isSel ? C.primary : "transparent", border: `1px solid ${isSel ? C.primary : C.textDim}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isSel && <Check size={12} color="#fff" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {page.label && <div style={{ fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.label}</div>}
                  <div style={{ fontSize: 11, color: page.label ? C.textDim : C.text, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.pagePath}</div>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 10.5, color: C.textMuted, whiteSpace: "nowrap", flexShrink: 0 }}>
                  <span title="Visualizações" style={{ display: "flex", alignItems: "center", gap: 3 }}><Eye size={10} />{fmt(page.views)}</span>
                  <span title="Usuários" style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={10} />{fmt(page.users)}</span>
                  <span title="Sessões">{fmt(page.sessions)} sess.</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pages && <SaveBar count={selected.size} saving={saving} saved={saved} onSave={save} />}
    </>
  );
}

// ─── 2/3. Instagram e LinkedIn: publicações já existentes — apenas seleção ────

const IG_TYPE_FILTERS = [
  { value: "",               label: "Todos" },
  { value: "IMAGE",          label: "Feed" },
  { value: "REEL",           label: "Reel" },
  { value: "CAROUSEL_ALBUM", label: "Carrossel" },
  { value: "VIDEO",          label: "Vídeo" },
];

const LI_TYPE_FILTERS = [
  { value: "",        label: "Todos" },
  { value: "TEXT",    label: "Texto" },
  { value: "MEDIA",   label: "Mídia" },
  { value: "ARTICLE", label: "Artigo" },
];

const MEDIA_LABEL = { IMAGE: "Feed", CAROUSEL_ALBUM: "Carrossel", REEL: "Reel", VIDEO: "Vídeo", TEXT: "Texto", MEDIA: "Mídia", ARTICLE: "Artigo" };

function PostPicker({ campaign, channel, onChanged }) {
  const isIg = channel === "INSTAGRAM";
  const [items, setItems]       = useState(null);
  const [error, setError]       = useState(null);
  const [notConnected, setNotConnected] = useState(null);
  const [q, setQ]               = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [from, setFrom]         = useState(toInputDate(campaign.startDate));
  const [to, setTo]             = useState(toInputDate(campaign.endDate));
  const [selected, setSelected] = useState(() => new Set(
    (campaign.posts || []).filter((p) => p.channel === channel).map((p) => p.externalId)
  ));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const load = useCallback(() => {
    setError(null);
    setNotConnected(null);
    setItems(null);
    const fetcher = isIg ? campaignsApi.assetsInstagram : campaignsApi.assetsLinkedin;
    fetcher(campaign.id)
      .then(setItems)
      .catch((e) => {
        const msg = e.response?.data?.error || "Erro ao carregar conteúdos";
        if (e.response?.status === 400) setNotConnected(msg);
        else setError(msg);
      });
  }, [campaign.id, isIg]);

  useEffect(() => { load(); }, [load]);

  function toggle(externalId) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(externalId)) next.delete(externalId);
      else next.add(externalId);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const posts = (items || []).filter((i) => selected.has(i.externalId));
      await campaignsApi.setPosts(campaign.id, channel, posts);
      setSaved(true);
      onChanged?.();
    } catch (e) {
      setError(e.response?.data?.error || "Erro ao salvar seleção");
    } finally {
      setSaving(false);
    }
  }

  if (notConnected) {
    return <NotConnected message={`${notConnected}. Conecte a integração na tela do cliente para vincular publicações.`} />;
  }
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!items) return <LoadingState message={`Buscando publicações do ${isIg ? "Instagram" : "LinkedIn"}…`} />;

  let filtered = items;
  if (q) filtered = filtered.filter((i) => (i.caption || "").toLowerCase().includes(q.toLowerCase()));
  if (typeFilter) {
    filtered = filtered.filter((i) => isIg && typeFilter === "VIDEO"
      ? (i.mediaType === "VIDEO" || i.mediaType === "REEL")
      : i.mediaType === typeFilter);
  }
  if (from) filtered = filtered.filter((i) => i.publishedAt && toInputDate(i.publishedAt) >= from);
  if (to)   filtered = filtered.filter((i) => i.publishedAt && toInputDate(i.publishedAt) <= to);

  const typeFilters = isIg ? IG_TYPE_FILTERS : LI_TYPE_FILTERS;

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <SearchBox value={q} onChange={setQ} placeholder={isIg ? "Pesquisar por legenda…" : "Pesquisar por texto…"} />
        <PeriodFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />
        <div style={{ display: "flex", gap: 5 }}>
          {typeFilters.map((f) => (
            <button key={f.value} onClick={() => setTypeFilter(f.value)} style={{
              padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
              border: `1px solid ${typeFilter === f.value ? C.primary : C.border}`,
              background: typeFilter === f.value ? C.primary + "22" : "transparent",
              color: typeFilter === f.value ? C.primaryLight : C.textMuted,
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <p style={{ color: C.textDim, fontSize: 12 }}>Nenhuma publicação encontrada com esses filtros.</p>}

      <div style={{ display: "grid", gridTemplateColumns: isIg ? "repeat(auto-fill, minmax(190px, 1fr))" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
        {filtered.map((item) => {
          const isSel = selected.has(item.externalId);
          const m = item.metrics || {};
          return (
            <div key={item.externalId} onClick={() => toggle(item.externalId)} style={{
              background: C.card, borderRadius: 12, overflow: "hidden", cursor: "pointer", position: "relative",
              border: `2px solid ${isSel ? C.primary : C.border}`,
            }}>
              <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 6, background: isSel ? C.primary : "rgba(0,0,0,0.5)", border: `1px solid ${isSel ? C.primary : C.textDim}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                {isSel && <Check size={13} color="#fff" />}
              </div>

              {isIg && (
                item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt="" style={{ width: "100%", height: 120, objectFit: "cover", background: C.cardHover }} />
                ) : (
                  <div style={{ width: "100%", height: 120, background: C.cardHover, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Image size={24} color={C.textDim} />
                  </div>
                )
              )}

              <div style={{ padding: "9px 11px" }}>
                <p style={{ margin: 0, fontSize: 11, color: C.text, display: "-webkit-box", WebkitLineClamp: isIg ? 2 : 3, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: isIg ? 28 : 42 }}>
                  {item.caption || "(sem legenda)"}
                </p>
                <div style={{ fontSize: 9, color: C.textDim, marginTop: 4 }}>
                  {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("pt-BR") : ""} · {MEDIA_LABEL[item.mediaType] || item.mediaType || ""}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 9, color: C.textMuted, flexWrap: "wrap" }}>
                  {isIg ? (
                    <>
                      <span title="Alcance">👁 {fmt(m.reach ?? 0)}</span>
                      <span title="Curtidas">❤️ {fmt(m.likes ?? 0)}</span>
                      <span title="Comentários">💬 {fmt(m.comments ?? 0)}</span>
                    </>
                  ) : (
                    <>
                      <span title="Impressões">👁 {fmt(m.impressions ?? 0)}</span>
                      <span title="Reações">👍 {fmt(m.reactions ?? 0)}</span>
                      <span title="Comentários">💬 {fmt(m.comments ?? 0)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SaveBar count={selected.size} saving={saving} saved={saved} onSave={save} />
    </>
  );
}

// ─── Tela de seleção: as três grandes seções ──────────────────────────────────
// A campanha é uma "pasta inteligente" — as seções aparecem sempre (conforme a
// integração conectada) e o usuário apenas marca o que pertence à campanha.

export default function CampaignContentTab({ campaign, onChanged }) {
  if (!campaign) return <LoadingState />;

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <SectionHeader icon={Globe} title="1 · Website (Google Analytics)" subtitle="Marque as páginas do site que fazem parte desta campanha" color={C.ga4} />
        <PagePicker campaign={campaign} onChanged={onChanged} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <SectionHeader icon={Image} title="2 · Instagram (Meta)" subtitle="Marque os posts, reels, carrosséis e vídeos desta campanha" color={C.instagram} />
        <PostPicker campaign={campaign} channel="INSTAGRAM" onChanged={onChanged} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <SectionHeader icon={FileText} title="3 · LinkedIn" subtitle="Marque as publicações do LinkedIn desta campanha" color={C.linkedin} />
        <PostPicker campaign={campaign} channel="LINKEDIN" onChanged={onChanged} />
      </div>
    </>
  );
}
