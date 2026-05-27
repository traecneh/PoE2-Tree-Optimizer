const defaultBaseUrl = typeof import.meta.env?.BASE_URL === "string" ? import.meta.env.BASE_URL : "/";

export function publicAssetPath(assetPath: string, baseUrl = defaultBaseUrl): string {
  const normalizedAssetPath = assetPath.replace(/^\/+/, "");
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return `${normalizedBaseUrl}${normalizedAssetPath}`;
}

function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl || baseUrl === "/") return "/";
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}
