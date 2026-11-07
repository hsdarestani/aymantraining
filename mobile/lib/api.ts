import {currentLocale, translate} from "./i18n/locale";
import {expireSession, getSession} from "./session";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) { super(message); }
}

export const API = "https://bedifferent.smarbiz.sbs";

export async function api<T = any>(path: string, init: RequestInit = {}) {
  const token = await getSession();
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("accept-language", currentLocale());
  headers.set("x-bd-client", "mobile");
  if (token && !headers.has("authorization")) headers.set("authorization", "Bearer " + token);
  if (typeof init.body === "string" && !headers.has("content-type")) headers.set("content-type", "application/json");

  const controller = new AbortController();
  const timeout = init.body instanceof FormData ? 90_000 :
    path.startsWith("/api/ai") || path.startsWith("/api/wearables/connections") ? 30_000 : 15_000;
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(API + path, {...init, headers, signal: controller.signal});
    const body = await response.text();
    let data;
    try { data = body ? JSON.parse(body) : {}; }
    catch {
      if (response.ok) throw new ApiError(translate("Der Server hat unerwartet geantwortet."), response.status);
      data = {};
    }
    if (!response.ok) {
      if (response.status === 401 && token && headers.get("authorization") === "Bearer " + token &&
        !["/api/auth/login", "/api/auth/register"].includes(path)) await expireSession(token);
      throw new ApiError(translate(data?.error || ("HTTP " + response.status)), response.status, data?.code);
    }
    return data as T;
  } catch (error) {
    if (controller.signal.aborted) throw new ApiError(translate("Die Anfrage dauert zu lange. Bitte versuche es erneut."), 408);
    throw error;
  } finally { clearTimeout(timer); }
}
