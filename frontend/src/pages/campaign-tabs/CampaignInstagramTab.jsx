import React from "react";
import { Eye, Heart, MessageCircle, Share2, Bookmark, TrendingUp, Image } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

function PostCard({ post }) {
  const m = post.metrics || {};
  return (
    <a href={post.permalink || "#"} target="_blank" rel="noreferrer" style={{ textDecoration: "none", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {post.thumbnailUrl ? (
        <img src={post.thumbnailUrl} alt="" style={{ width: "100%", height: 140, objectFit: "cover", background: C.cardHover }} />
      ) : (
        <div style={{ width: "100%", height: 140, background: C.cardHover, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Image size={28} color={C.textDim} />
        </div>
      )}
      <div style={{ padding: "10px 12px" }}>
        <p style={{ margin: 0, fontSize: 11, color: C.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 28 }}>
          {post.caption || "(sem legenda)"}
        </p>
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 5 }}>
          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("pt-BR") : ""} · {post.mediaType || ""}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 7, fontSize: 10, color: C.textMuted, flexWrap: "wrap" }}>
          <span>👁 {fmt(m.reach ?? 0)}</span>
          <span>❤️ {fmt(m.likes ?? 0)}</span>
          <span>💬 {fmt(m.comments ?? 0)}</span>
          <span>↗ {fmt(m.shares ?? 0)}</span>
          <span>🔖 {fmt(m.saved ?? 0)}</span>
        </div>
      </div>
    </a>
  );
}

export default function CampaignInstagramTab({ data }) {
  const ig = data.instagram;

  if (!ig) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <Image size={48} color={C.textDim} style={{ marginBottom: 14 }} />
        <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>Nenhum post do Instagram associado à campanha.</p>
      </div>
    );
  }

  const t = ig.totals;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
        <MetricCard title="Posts na Campanha" value={ig.postsCount}        icon={Image}         color={C.instagram} small />
        <MetricCard title="Alcance Total"     value={fmt(t.reach)}         icon={Eye}           color={C.primary} small />
        <MetricCard title="Impressões"        value={fmt(t.impressions)}   icon={TrendingUp}    color={C.purple} small />
        <MetricCard title="Curtidas"          value={fmt(t.likes)}         icon={Heart}         color={C.red} small />
        <MetricCard title="Comentários"       value={fmt(t.comments)}      icon={MessageCircle} color={C.cyan} small />
        <MetricCard title="Compartilham."     value={fmt(t.shares)}        icon={Share2}        color={C.green} small />
        <MetricCard title="Salvamentos"       value={fmt(t.saved)}         icon={Bookmark}      color={C.accent} small />
        <MetricCard title="Engajamento"       value={fmt(t.engagement)}    icon={Heart}         color={C.instagram} small />
      </div>

      {ig.timeseries?.length > 0 && (
        <>
          <SectionHeader icon={TrendingUp} title="Evolução Temporal" subtitle="Alcance e engajamento por dia de publicação" color={C.instagram} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 28 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ig.timeseries} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="reach"      fill={C.instagram} name="Alcance"     radius={[4, 4, 0, 0]} />
                <Bar dataKey="engagement" fill={C.accent}    name="Engajamento" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <SectionHeader icon={Image} title="Posts Utilizados" subtitle="Ordenados por engajamento" color={C.instagram} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {ig.posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </>
  );
}
