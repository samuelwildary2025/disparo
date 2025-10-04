import { Router } from "express";
import os from "os";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

healthRouter.get("/metrics", (_req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  const loadAvg = os.loadavg();

  const metrics = [
    `process_uptime_seconds ${uptime}`,
    `process_rss_bytes ${memory.rss}`,
    `process_heap_used_bytes ${memory.heapUsed}`,
    `process_heap_total_bytes ${memory.heapTotal}`,
    `system_load1 ${loadAvg[0]}`,
    `system_load5 ${loadAvg[1]}`,
    `system_load15 ${loadAvg[2]}`
  ];

  res.setHeader("Content-Type", "text/plain; version=0.0.4");
  res.send(metrics.join("\n"));
});
