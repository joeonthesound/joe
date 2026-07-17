function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return undefined;
}

function uniqueEventId(prefix) {
  if (window.crypto && window.crypto.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function purchaseEventId(order) {
  if (order.event_id) return String(order.event_id);
  if (order.eventId) return String(order.eventId);
  if (order.orderId) return String(order.orderId);

  return uniqueEventId("purchase");
}

function leadEventId(leadData) {
  if (leadData.event_id) return String(leadData.event_id);
  if (leadData.eventId) return String(leadData.eventId);

  return uniqueEventId("lead");
}

export async function trackMetaPurchaseConversion(order) {
  const eventId = purchaseEventId(order);
  const value = Number(order.value);
  const currency = order.currency || "USD";
  const contentIds = order.contentIds || (order.productId ? [order.productId] : undefined);

  if (typeof window.fbq === "function") {
    window.fbq(
      "track",
      "Purchase",
      {
        value,
        currency,
        content_type: order.contentType || "product",
        content_ids: contentIds
      },
      { eventID: eventId }
    );
  }

  const response = await fetch("/api/facebook-capi/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_id: eventId,
      email: order.email,
      phone: order.phone,
      firstName: order.firstName,
      lastName: order.lastName,
      city: order.city,
      state: order.state,
      zip: order.zip,
      country: order.country,
      value,
      currency,
      orderId: order.orderId || eventId,
      pageUrl: window.location.href,
      fbp: getCookie("_fbp"),
      fbc: getCookie("_fbc"),
      contentType: order.contentType || "product",
      contentIds
    })
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || "Meta CAPI purchase request failed");
  }

  return response.json();
}

export async function trackMetaLeadConversion(leadData) {
  const eventId = leadEventId(leadData);
  const contentName = leadData.contentName || "Lead";

  if (typeof window.fbq === "function") {
    window.fbq(
      "track",
      "Lead",
      { content_name: contentName },
      { eventID: eventId }
    );
  }

  const response = await fetch("/api/facebook-capi/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_id: eventId,
      email: leadData.email,
      phone: leadData.phone,
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      contentName,
      pageUrl: window.location.href,
      fbp: getCookie("_fbp"),
      fbc: getCookie("_fbc")
    })
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || "Meta CAPI lead request failed");
  }

  return response.json();
}

window.trackMetaPurchaseConversion = trackMetaPurchaseConversion;
window.trackMetaLeadConversion = trackMetaLeadConversion;
