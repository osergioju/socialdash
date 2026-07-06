import React, { useState, useEffect, useCallback } from "react";
import { Search, Globe, Image, FileText, Check, RefreshCw } from "lucide-react";
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

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", maxWidth: 340, marginBottom: 14 }}>
      <Search size={14} color={C.textDim} style={{ position: "absolute", left: 11, top: 10 }} />
      <input style={inputStyle} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
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

// ─── Seletor de posts (Instagram / LinkedIn) ──────────────────────────────────

const MEDIA_FILTERS = [
  { value: "",               label: "Todos" },
  { value: "IMAGE",          label: "Posts" },
  { value: "REEL",           label: "Reels" },
  { value: "CAROUSEL_ALBUM", label: "Carrosséis" },
  { value: "VIDEO",          label: "Vídeos" },
];

function PostPicker({ campaign, channel, onChanged }) {
  const isIg = channel === "INSTAGRAM";
  const [items, setItems]       = useState(null);
  const [error, setError]       = useState(null);
  const [q, setQ]               = useState("");
  const [mediaFilter, setMediaFilter] = useState("");
  const [selected, setSelected] = useState(() => new Set(
    (campaign.posts || []).filter((p) => p.channel === channel).map((p) => p.externalId)
  ));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const load = useCallback(() => {
    setError(null);
    setItems(null);
    const fetcher = isIg ? campaignsApi.assetsInstagram : campaignsApi.assetsLinkedin;
    fetcher(campaign.id)
      .then(setItems)
      .catch((e) => setError(e.response?.data?.error || "Erro ao carregar conteúdos"));
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

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!items) return <LoadingState message={`Buscando conteúdos do ${isIg ? "Instagram" : "LinkedIn"}…`} />;

  let filtered = items;
  if (q) filtered = filtered.filter((i) => (i.caption || "").toLowerCase().includes(q.toLowerCase()));
  if (isIg && mediaFilter) {
    filtered = filtered.filter((i) => mediaFilter === "VIDEO"
      ? (i.mediaType === "VIDEO" || i.mediaType === "REEL")
      : i.mediaType === mediaFilter);
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <SearchBox value={q} onChange={setQ} placeholder="Pesquisar por legenda…" />
        </div>
        {isIg && (
          <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
            {MEDIA_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setMediaFilter(f.value)} style={{
                padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                border: `1px solid ${mediaFilter === f.value ? C.primary : C.border}`,
                background: mediaFilter === f.value ? C.primary + "22" : "transparent",
                color: mediaFilter === f.value ? C.primaryLight : C.textMuted,
              }}>
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 && <p style={{ color: C.textDim, fontSize: 12 }}>Nenhum conteúdo encontrado.</p>}

      <div style={{ display: "grid", gridTemplateColumns: isIg ? "repeat(auto-fill, minmax(190px, 1fr))" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
        {filtered.map((item) => {
          const isSel = selected.has(item.externalId);
          const m = item.metrics || {};
          return (
            <div key={item.externalId} onClick={() => toggle(item.externalId)} style={{
              background: C.card, borderRadius: 12, overflow: "hidden", cursor: "pointer", position: "relative",
              border: `2px solid ${isSel ? C.primary : C.border}`,
            }}>
              {/* Checkbox */}
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
                  {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("pt-BR") : ""} · {item.mediaType || ""}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 9, color: C.textMuted, flexWrap: "wrap" }}>
                  {isIg ? (
                    <>
                      <span>👁 {fmt(m.reach ?? 0)}</span>
                      <span>❤️ {fmt(m.likes ?? 0)}</span>
                      <span>💬 {fmt(m.comments ?? 0)}</span>
                      <span>↗ {fmt(m.shares ?? 0)}</span>
                      <span>🔖 {fmt(m.saved ?? 0)}</span>
                    </>
                  ) : (
                    <>
                      <span>👁 {fmt(m.impressions ?? 0)}</span>
                      <span>👍 {fmt(m.reactions ?? 0)}</span>
                      <span>💬 {fmt(m.comments ?? 0)}</span>
                      <span>🖱 {fmt(m.clicks ?? 0)}</span>
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

// ─── Seletor de páginas do site (GA4) ─────────────────────────────────────────

function PagePicker({ campaign, onChanged }) {
  const [pages, setPages]       = useState(null);
  const [error, setError]       = useState(null);
  const [q, setQ]               = useState("");
  const [selected, setSelected] = useState(() => new Map(
    (campaign.pages || []).map((p) => [p.pagePath, p.label])
  ));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const load = useCallback(() => {
    setError(null);
    setPages(null);
    campaignsApi.assetsPages(campaign.id)
      .then(setPages)
      .catch((e) => setError(e.response?.data?.error || "Erro ao carregar páginas"));
  }, [campaign.id]);

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

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!pages) return <LoadingState message="Buscando páginas do site…" />;

  const filtered = q
    ? pages.filter((p) => p.pagePath.toLowerCase().includes(q.toLowerCase()) || (p.label || "").toLowerCase().includes(q.toLowerCase()))
    : pages;

  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="Pesquisar página… ex: /dia-das-maes" />
      {filtered.length === 0 && <p style={{ color: C.textDim, fontSize: 12 }}>Nenhuma página encontrada.</p>}

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
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.pagePath}</div>
                {page.label && <div style={{ fontSize: 10, color: C.textDim }}>{page.label}</div>}
              </div>
              {page.lastViews != null && (
                <span style={{ fontSize: 10, color: C.textMuted, whiteSpace: "nowrap" }}>{fmt(page.lastViews)} views/mês</span>
              )}
            </div>
          );
        })}
      </div>

      <SaveBar count={selected.size} saving={saving} saved={saved} onSave={save} />
    </>
  );
}

// ─── Tab principal ────────────────────────────────────────────────────────────

export default function CampaignContentTab({ campaign, onChanged }) {
  if (!campaign) return <LoadingState />;
  const channels = new Set((campaign.channels || []).map((c) => c.channel));

  if (channels.size === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <FileText size={48} color={C.textDim} style={{ marginBottom: 14 }} />
        <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
          Nenhum canal selecionado. Edite a campanha e marque os canais (Instagram, LinkedIn, Website).
        </p>
      </div>
    );
  }

  return (
    <>
      {channels.has("INSTAGRAM") && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader icon={Image} title="Conteúdos do Instagram" subtitle="Selecione os posts, reels, carrosséis e vídeos desta campanha" color={C.instagram} />
          <PostPicker campaign={campaign} channel="INSTAGRAM" onChanged={onChanged} />
        </div>
      )}

      {channels.has("LINKEDIN") && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader icon={FileText} title="Publicações do LinkedIn" subtitle="Selecione as publicações desta campanha" color={C.linkedin} />
          <PostPicker campaign={campaign} channel="LINKEDIN" onChanged={onChanged} />
        </div>
      )}

      {channels.has("WEBSITE") && (
        <div style={{ marginBottom: 20 }}>
          <SectionHeader icon={Globe} title="Páginas do Site" subtitle="Selecione as páginas (GA4) vinculadas a esta campanha" color={C.ga4} />
          <PagePicker campaign={campaign} onChanged={onChanged} />
        </div>
      )}
    </>
  );
}
