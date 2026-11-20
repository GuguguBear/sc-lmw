import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROLL_S = 30;
export const STARFIX_S = 90;
export const GAME_S = 180;
export const OPEN_S = 300;
export const CAPTAIN_GONE_S = 7 * 24 * 3600;
export const POLL_LIVE_S = 120;
export const KEEP_SECONDS = [0, 900, 1800, 3600, 10800, 21600, 32400, 43200, 86400, 172800, 345600, 604800];
export const KEEP_OPEN = 4102444800;

export function now() {
  return Date.now() / 1000;
}

export function iso(ts) {
  return new Date(ts * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function json(request, status, obj) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  const origin = request.headers.get("Origin");
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  }
  return new Response(status === 204 ? null : JSON.stringify(obj), { status, headers });
}

export function tokenHex(n) {
  return randomBytes(n).toString("hex");
}

export function pick(alph) {
  return alph[randomInt(alph.length)];
}

export function pairSig(secret, code, recover) {
  return createHmac("sha256", String(secret || "")).update(code + "\n" + recover).digest("hex");
}

export function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function bind(db, sql, args) {
  const stmt = db.prepare(sql);
  if (!args.length) return stmt;
  return stmt.bind(...args.map((value) => (value === undefined ? null : value)));
}

export function db(d1) {
  return {
    d1,
    one(sql, ...args) {
      return bind(d1, sql, args).first().then((row) => row || null);
    },
    all(sql, ...args) {
      return bind(d1, sql, args).all().then((res) => res.results || []);
    },
    async run(sql, ...args) {
      const res = await bind(d1, sql, args).run();
      return {
        lastrowid: res.meta?.last_row_id ?? 0,
        rowcount: res.meta?.changes ?? 0,
      };
    },
  };
}
