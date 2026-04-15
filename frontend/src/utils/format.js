export function fmt(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toString();
}

export function calcVar(arr, i) {
  if (i === 0 || arr[i] == null || arr[i - 1] == null) return null;
  return +(((arr[i] - arr[i - 1]) / arr[i - 1]) * 100).toFixed(1);
}

// Build Recharts-friendly timeseries from API metric array
export function buildTimeseries(metrics, fields) {
  return metrics.map((m) => {
    const point = { mes: m.monthLabel?.split("/")[0] ?? m.month, monthKey: m.month };
    fields.forEach((f) => { point[f] = m[f]; });
    return point;
  });
}
