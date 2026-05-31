export function formatMapPrice(price: string): string {
  const normalized = price.trim().replace(/\s+/g, " ");
  const withoutType = normalized.replace(/^(월세|전세|매매)\s*/, "");

  const jeonseMatch = withoutType.match(/^(\d+)\s*억(?:\s*(\d+))?$/);
  if (jeonseMatch) {
    const eok = Number(jeonseMatch[1]);
    const manwon = Number(jeonseMatch[2] ?? "0");
    return String(eok * 10000 + manwon);
  }

  return withoutType || "문의";
}
