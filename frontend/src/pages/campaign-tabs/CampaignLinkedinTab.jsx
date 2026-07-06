import React from "react";
import { Eye, ThumbsUp, MessageCircle, MousePointerClick, Users, TrendingUp, FileText } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import MetricCard from "../../components/ui/MetricCard";
import SectionHeader from "../../components/ui/SectionHeader";
import CustomTooltip from "../../components/ui/CustomTooltip";
import { C } from "../../utils/colors";
import { fmt } from "../../utils/format";

function PostRow({ post }) {
  const m = post.metrics || {};
  return (
    <a href={post.permalink || "#"} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
      <p style={{ margin: 0, fontSize: 12, color: C.text, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {post.caption || "(sem texto)"}
      </p>
      <div style={{ fontSize: 10, color: C.textDim, marginTop: 6 }}>
        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("pt-BR") : ""} · {post.mediaType || ""}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 10, color: C.textMuted, flexWrap: "wrap" }}>
        <span>👁 {fmt(m.impressions ?? 0)} impressões</span>
        <span>👍 {fmt(m.reactions ?? 0)} reações</span>
        <span>💬 {fmt(m.comments ?? 0)} comentários</span>
        <span>🖱 {fmt(m.clicks ?? 0)} cliques</span>
      </div>
    </a>
  );
}

export default function CampaignLinkedinTab({ data }) {
  const li = data.linkedin;

  if (!li) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <FileText size={48} color={C.textDim} style={{ marginBottom: 14 }} />
        <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>Nenhuma publicação do LinkedIn associada à campanha.</p>
      </div>
    );
  }

  const t = li.totals;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
        <MetricCard title="Publicações"  value={li.postsCount}      icon={FileText}          color={C.linkedin} small />
        <MetricCard title="Impressões"   value={fmt(t.impressions)} icon={Eye}               color={C.linkedin} small />
        <MetricCard title="Reações"      value={fmt(t.reactions)}   icon={ThumbsUp}          color={C.primary} small />
        <MetricCard title="Comentários"  value={fmt(t.comments)}    icon={MessageCircle}     color={C.cyan} small />
        <MetricCard title="Cliques"      value={fmt(t.clicks)}      icon={MousePointerClick} color={C.accent} small />
        <MetricCard title="CTR"          value={`${t.ctr}%`}        icon={TrendingUp}        color={C.green} small />
        {li.followersGained != null && (
          <MetricCard title="Seg. Ganhos" value={`+${fmt(li.followersGained)}`} icon={Users} color={C.purple} small subtitle="no período" />
        )}
      </div>

      {li.timeseries?.length > 0 && (
        <>
          <SectionHeader icon={TrendingUp} title="Evolução Temporal" subtitle="Impressões e engajamento por dia de publicação" color={C.linkedin} />
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 18px", marginBottom: 28 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={li.timeseries} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="impressions" fill={C.linkedin} name="Impressões"  radius={[4, 4, 0, 0]} />
                <Bar dataKey="engagement"  fill={C.accent}   name="Engajamento" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <SectionHeader icon={FileText} title="Publicações Utilizadas" subtitle="Ordenadas por engajamento" color={C.linkedin} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {li.posts.map((post) => <PostRow key={post.id} post={post} />)}
      </div>
    </>
  );
}
