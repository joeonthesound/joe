const LANGUAGES = new Set([
  "es",
  "br",
  "en",
  "fr",
  "de",
  "ar",
  "zh",
  "ja"
]);

const STATIC_FILE_PATTERN =
  /\.(?:css|js|mjs|json|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|xml|txt|pdf|mp4|webm)$/i;

const DEFAULT_META_CAPI_VERSION = "v25.0";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}

function normalize(value, mode = "text") {
  if (value === undefined || value === null) return "";
  const text = String(value).trim().toLowerCase();
  if (!text) return "";
  if (mode === "phone" || mode === "zip") return text.replace(/[^0-9]/g, "");
  return text;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashField(value, mode) {
  const normalized = normalize(value, mode);
  if (!normalized) return undefined;
  return sha256(normalized);
}

function cleanString(value) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    undefined
  );
}

function assertMetaConfig(env) {
  if (!env.FB_ACCESS_TOKEN || !env.FB_PIXEL_ID) {
    return jsonResponse(
      { success: false, error: "Missing FB_ACCESS_TOKEN or FB_PIXEL_ID" },
      500
    );
  }
  return undefined;
}

function compactUserData(userData) {
  Object.keys(userData).forEach((key) => {
    if (Array.isArray(userData[key])) {
      userData[key] = userData[key].filter(Boolean);
      if (!userData[key].length) delete userData[key];
      return;
    }
    if (!userData[key]) delete userData[key];
  });
  return userData;
}

function withTestEventCode(payload, env) {
  if (env.NODE_ENV === "test" && cleanString(env.FB_TEST_CODE)) {
    payload.test_event_code = cleanString(env.FB_TEST_CODE);
  }
  return payload;
}

async function sendMetaEvent(payload, env) {
  const apiVersion = cleanString(env.FB_API_VERSION) || DEFAULT_META_CAPI_VERSION;
  const capiUrl = `https://graph.facebook.com/${apiVersion}/${env.FB_PIXEL_ID}/events?access_token=${env.FB_ACCESS_TOKEN}`;
  const response = await fetch(capiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withTestEventCode(payload, env))
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("CAPI error:", result);
    return jsonResponse(
      { success: false, error: result.error?.message || "Meta CAPI request failed" },
      502
    );
  }

  return jsonResponse({
    success: true,
    event: payload.data?.[0]?.event_name,
    eventsReceived: result.events_received,
    fbTraceId: result.fbtrace_id
  });
}

async function parseJsonBody(request) {
  try {
    return { body: await request.json() };
  } catch {
    return { error: jsonResponse({ success: false, error: "Invalid JSON body" }, 400) };
  }
}

async function baseUserData(body, request) {
  return compactUserData({
    em: [await hashField(body.email)],
    ph: [await hashField(body.phone, "phone")],
    fn: [await hashField(body.firstName)],
    ln: [await hashField(body.lastName)],
    client_ip_address: clientIp(request),
    client_user_agent: request.headers.get("user-agent") || undefined,
    fbp: cleanString(body.fbp),
    fbc: cleanString(body.fbc)
  });
}

function methodNotAllowed() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" }
  });
}

async function handlePurchaseCapi(request, env) {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  const configError = assertMetaConfig(env);
  if (configError) return configError;

  const parsed = await parseJsonBody(request);
  if (parsed.error) return parsed.error;
  const { body } = parsed;

  const eventId = cleanString(body.event_id || body.eventId || body.orderId);
  if (!eventId) {
    return jsonResponse({ success: false, error: "event_id is required" }, 400);
  }

  const value = Number(body.value);
  if (!Number.isFinite(value)) {
    return jsonResponse({ success: false, error: "value must be a number" }, 400);
  }

  const currency = cleanString(body.currency) || "USD";
  const pageUrl = cleanString(body.pageUrl);

  const userData = compactUserData({
    ...(await baseUserData(body, request)),
    ct: [await hashField(body.city)],
    st: [await hashField(body.state)],
    zp: [await hashField(body.zip, "zip")],
    country: [await hashField(body.country)]
  });

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: pageUrl,
        user_data: userData,
        custom_data: {
          value,
          currency,
          order_id: cleanString(body.orderId) || eventId,
          content_type: cleanString(body.contentType),
          content_ids: Array.isArray(body.contentIds) ? body.contentIds.map(String) : undefined
        }
      }
    ]
  };

  if (!payload.data[0].custom_data.content_type) {
    delete payload.data[0].custom_data.content_type;
  }
  if (!payload.data[0].custom_data.content_ids) {
    delete payload.data[0].custom_data.content_ids;
  }

  return sendMetaEvent(payload, env);
}

async function handleLeadCapi(request, env) {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  const configError = assertMetaConfig(env);
  if (configError) return configError;

  const parsed = await parseJsonBody(request);
  if (parsed.error) return parsed.error;
  const { body } = parsed;

  const eventId = cleanString(body.event_id || body.eventId);
  if (!eventId) {
    return jsonResponse({ success: false, error: "event_id is required" }, 400);
  }

  const customData = {
    content_name: cleanString(body.contentName)
  };

  if (!customData.content_name) {
    delete customData.content_name;
  }

  return sendMetaEvent(
    {
      data: [
        {
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          event_source_url: cleanString(body.pageUrl),
          user_data: await baseUserData(body, request),
          custom_data: customData
        }
      ]
    },
    env
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/facebook-capi/purchase") {
      return handlePurchaseCapi(request, env);
    }

    if (url.pathname === "/api/facebook-capi/lead") {
      return handleLeadCapi(request, env);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          Allow: "GET, HEAD"
        }
      });
    }

    /*
     * Intenta servir primero el recurso exacto.
     * Esto permite cargar CSS, JavaScript, JSON, imágenes, etc.
     */
    const assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    /*
     * Un recurso con extensión que no existe debe conservar el 404.
     * No debe recibir index.html.
     */
    if (STATIC_FILE_PATTERN.test(url.pathname)) {
      return assetResponse;
    }

    const segments = url.pathname
      .split("/")
      .filter(Boolean);

    const language = segments[0];

    /*
     * /de/projekte/  → /de/index.html
     * /es/proyectos/ → /es/index.html
     */
    if (LANGUAGES.has(language)) {
      const shellUrl = new URL(`/${language}/index.html`, url.origin);

      const shellRequest = new Request(shellUrl, {
        method: request.method,
        headers: request.headers
      });

      return env.ASSETS.fetch(shellRequest);
    }

    /*
     * La raíz utiliza /index.html.
     */
    if (url.pathname === "/") {
      const rootUrl = new URL("/index.html", url.origin);

      return env.ASSETS.fetch(
        new Request(rootUrl, {
          method: request.method,
          headers: request.headers
        })
      );
    }

    return new Response("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
};
