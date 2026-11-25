// Same-origin proxy from the Netlify site to the STRANDPATH Node API.
// Netlify cannot run the SQLite-backed server itself, so Render (or another
// container host) runs it and this edge function forwards /api/* requests.
// Set API_ORIGIN in Netlify to the public backend origin, e.g.
// https://strandpath.onrender.com (no trailing slash).

function configError(message) {
  return new Response(JSON.stringify({ error: "PROXY_NOT_CONFIGURED", message }), {
    status: 503,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function proxyError(message) {
  return new Response(JSON.stringify({ error: "UPSTREAM_UNAVAILABLE", message }), {
    status: 502,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function splitCookies(raw) {
  if (!raw) return [];
  return raw.split(/,(?=\s*[^;,]+=)/);
}

function readOrigin() {
  const fromNetlify = globalThis.Netlify?.env?.get?.("API_ORIGIN");
  if (fromNetlify) return fromNetlify;
  const fromNode = globalThis.process?.env?.API_ORIGIN;
  return fromNode || "";
}

export default async function handler(request, context) {
  const origin = readOrigin();
  if (!origin) {
    return configError("API_ORIGIN is not set for this Netlify site.");
  }

  let upstream;
  try {
    upstream = new URL(origin);
  } catch {
    return configError("API_ORIGIN must be a valid absolute URL.");
  }

  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, upstream);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", "https");
  if (context?.ip) headers.set("x-forwarded-for", context.ip);

  const init = {
    method: request.method,
    headers,
    redirect: "manual"
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let response;
  try {
    response = await fetch(target, init);
  } catch {
    return proxyError("The STRANDPATH API could not be reached.");
  }

  const out = new Headers();
  for (const [key, value] of response.headers) {
    const name = key.toLowerCase();
    if (name === "set-cookie" || name === "content-encoding" || name === "content-length") {
      continue;
    }
    out.append(key, value);
  }
  const cookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : splitCookies(response.headers.get("set-cookie"));
  for (const cookie of cookies) out.append("set-cookie", cookie);

  const body = response.status === 204 || response.status === 304 ? null : response.body;
  return new Response(body, { status: response.status, headers: out });
}

export const config = { path: "/api/*" };
