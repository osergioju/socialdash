const IG_API_VERSION = "v22.0";

async function fetchInstagramData(igId, token, since, until) {
  const base = await httpGet(
    `https://graph.facebook.com/${IG_API_VERSION}/${igId}/insights` +
    `?metric=reach,impressions,follower_count` +
    `&period=day` +
    `&since=${since}&until=${until}`,
    token
  );

  const views = await httpGet(
    `https://graph.facebook.com/${IG_API_VERSION}/${igId}/insights` +
    `?metric=views,profile_views` +
    `&metric_type=total_value` +
    `&period=day` +
    `&since=${since}&until=${until}`,
    token
  );

  return { base, views };
}

function normalizeInsights(base, views) {
  const daily = {};

  for (const metric of base.data || []) {
    for (const v of metric.values || []) {
      const date = v.end_time?.slice(0, 10);
      if (!date) continue;

      if (!daily[date]) daily[date] = {};

      daily[date][metric.name] = v.value;
    }
  }

  for (const metric of views.data || []) {
    for (const v of metric.values || []) {
      const date = v.end_time?.slice(0, 10);
      if (!date) continue;

      if (!daily[date]) daily[date] = {};

      daily[date][metric.name] = v.value;
    }
  }

  return daily;
}

function aggregateByMonth(daily) {
  const monthly = {};

  for (const [date, values] of Object.entries(daily)) {
    const [year, month] = date.split("-");
    const key = `${year}-${month}`;

    if (!monthly[key]) {
      monthly[key] = {
        reach: 0,
        impressions: 0,
        views: 0,
        profile_views: 0,
        followers: 0,
        newFollowers: 0,
      };
    }

    monthly[key].reach += values.reach || 0;
    monthly[key].impressions += values.impressions || 0;
    monthly[key].views += values.views || 0;
    monthly[key].profile_views += values.profile_views || 0;

    if (values.follower_count !== undefined) {
      if (!monthly[key]._lastFollower) {
        monthly[key]._lastFollower = values.follower_count;
      } else {
        const delta = values.follower_count - monthly[key]._lastFollower;
        if (delta > 0) monthly[key].newFollowers += delta;
        monthly[key]._lastFollower = values.follower_count;
      }
      monthly[key].followers = values.follower_count;
    }
  }

  return monthly;
}

async function fetchMedia(igId, token, sinceDate) {
  let url = `https://graph.facebook.com/${IG_API_VERSION}/${igId}/media` +
    `?fields=id,media_type,timestamp,like_count,comments_count&limit=100`;

  const posts = [];

  while (url) {
    const res = await httpGet(url, token).catch(() => ({ data: [] }));
    const data = res.data || [];

    if (!data.length) break;

    for (const p of data) {
      if (new Date(p.timestamp) < sinceDate) return posts;
      posts.push(p);
    }

    url = res.paging?.next;
  }

  return posts;
}

async function fetchMediaInsightsBatch(pageToken, posts) {
  const insightsMap = {};
  const BATCH_SIZE = 50;

  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);

    const requests = batch.map(p => {
      let metrics = "reach";

      if (p.media_type === "REEL") {
        metrics = "reach,plays,total_interactions";
      } else if (p.media_type === "CAROUSEL_ALBUM" || p.media_type === "IMAGE") {
        metrics = "reach,impressions,saved,shares";
      }

      return { relative_url: `${p.id}/insights?metric=${metrics}` };
    });

    const results = await httpFacebookBatch(pageToken, requests).catch(() => []);

    for (let j = 0; j < batch.length; j++) {
      const item = results[j];
      if (!item || item.code !== 200) continue;

      try {
        const body = JSON.parse(item.body);
        const ins = {};

        for (const metric of body.data || []) {
          const val =
            metric.values?.[0]?.value ??
            metric.total_value?.value ??
            metric.value ??
            0;

          ins[metric.name] = val;
        }

        insightsMap[batch[j].id] = ins;
      } catch { }
    }
  }

  return insightsMap;
}

function aggregateMediaByMonth(posts, insightsMap) {
  const monthly = {};

  for (const p of posts) {
    const date = new Date(p.timestamp);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthly[key]) {
      monthly[key] = {
        posts: 0,
        reels: 0,
        likes: 0,
        comments: 0,
        reach: 0,
        interactions: 0,
      };
    }

    const ins = insightsMap[p.id] || {};

    monthly[key].posts++;
    monthly[key].likes += p.like_count || 0;
    monthly[key].comments += p.comments_count || 0;

    if (p.media_type === "REEL") {
      monthly[key].reels++;
      monthly[key].reach += ins.reach || 0;
      monthly[key].interactions += ins.total_interactions || 0;
    } else {
      monthly[key].reach += ins.reach || 0;
    }
  }

  return monthly;
}

async function syncMetaRefactored(clientId, conn) {
  const token = await getValidToken(conn);
  const meta = JSON.parse(conn.metadata || "{}");

  const igId = meta.instagramBusinessAccountId;
  const pageId = meta.pageId;

  if (!igId || !pageId) {
    throw new Error("Conta Meta não conectada corretamente.");
  }

  const pageTokenRes = await httpGet(
    `https://graph.facebook.com/${IG_API_VERSION}/${pageId}?fields=access_token`,
    token
  );

  const pageToken = pageTokenRes.access_token || token;

  const now = new Date();
  const sinceDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const since = Math.floor(sinceDate.getTime() / 1000);
  const until = Math.floor(now.getTime() / 1000);

  // 🔥 FETCH ÚNICO
  const { base, views } = await fetchInstagramData(igId, pageToken, since, until);

  // 🔥 NORMALIZAÇÃO
  const daily = normalizeInsights(base, views);

  // 🔥 AGREGAÇÃO
  const monthly = aggregateByMonth(daily);

  // 🔥 POSTS
  const posts = await fetchMedia(igId, pageToken, sinceDate);
  const insightsMap = await fetchMediaInsightsBatch(pageToken, posts);
  const mediaMonthly = aggregateMediaByMonth(posts, insightsMap);

  // 🔥 MERGE FINAL + SALVA
  for (const month in monthly) {
    const m = monthly[month];
    const media = mediaMonthly[month] || {};

    const data = {
      seguidores: m.followers,
      novosSeguidores: m.newFollowers,
      alcance: m.reach,
      impressoes: m.impressions,
      visualizacoes: m.views,
      visitasPerfil: m.profile_views,
      postagens: media.posts || 0,
      reels: media.reels || 0,
      curtidas: media.likes || 0,
      comentarios: media.comments || 0,
      interacoes: media.interactions || 0,
    };

    const existing = await prisma.instagramMetric.findUnique({
      where: { clientId_month: { clientId, month } },
    });

    if (existing) {
      await prisma.instagramMetric.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.instagramMetric.create({
        data: { clientId, month, ...data },
      });
    }
  }

  return {
    ok: true,
    months: Object.keys(monthly).length,
    posts: posts.length,
  };
}