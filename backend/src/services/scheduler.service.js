/**
 * Daily auto-sync scheduler.
 * Runs syncClient() for every client that has at least one CONNECTED platform.
 * Uses plain setInterval (no external deps). Fires once on startup (after 30s)
 * then every 24h.
 *
 * Também agenda a coleta do Social Listening (a cada 6h) para todos os
 * monitoramentos ativos.
 */

const prisma = require("../config/prisma");
const { syncClient } = require("./sync.service");
const { invalidateCache } = require("./metrics.service");
const { runListeningCollection } = require("./listening-collector.service");

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STARTUP_DELAY_MS = 30 * 1000;       // 30 s — let the server finish booting
const LISTENING_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const LISTENING_STARTUP_DELAY_MS = 90 * 1000;     // 90 s — depois do sync inicial

async function runDailySync() {
  const clients = await prisma.client.findMany({
    where: {
      connections: { some: { status: "CONNECTED" } },
    },
    select: { id: true, name: true },
  });

  if (clients.length === 0) return;

  console.log(`[scheduler] Starting daily sync for ${clients.length} client(s)…`);

  for (const client of clients) {
    try {
      const result = await syncClient(client.id);
      invalidateCache(client.id);
      console.log(`[scheduler] ${client.name} synced —`, JSON.stringify(result));
    } catch (err) {
      console.error(`[scheduler] ${client.name} sync failed:`, err.message);
    }
  }

  console.log("[scheduler] Daily sync complete.");
}

function startScheduler() {
  // First run shortly after boot
  setTimeout(() => {
    runDailySync().catch((err) => console.error("[scheduler] Startup sync error:", err.message));
  }, STARTUP_DELAY_MS);

  // Subsequent runs every 24h
  setInterval(() => {
    runDailySync().catch((err) => console.error("[scheduler] Periodic sync error:", err.message));
  }, INTERVAL_MS);

  // Social Listening: primeira coleta 90s após o boot, depois a cada 6h
  setTimeout(() => {
    runListeningCollection().catch((err) => console.error("[scheduler] Listening startup error:", err.message));
  }, LISTENING_STARTUP_DELAY_MS);

  setInterval(() => {
    runListeningCollection().catch((err) => console.error("[scheduler] Listening periodic error:", err.message));
  }, LISTENING_INTERVAL_MS);

  console.log("[scheduler] Daily auto-sync scheduled (first run in 30 s).");
  console.log("[scheduler] Social Listening collection scheduled (every 6 h, first run in 90 s).");
}

module.exports = { startScheduler, runDailySync };
