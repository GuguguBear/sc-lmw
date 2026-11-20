import {
  ALPH, CAPTAIN_GONE_S, GAME_S, KEEP_OPEN, KEEP_SECONDS, OPEN_S, POLL_LIVE_S, ROLL_S, STARFIX_S,
  db, iso, json, now, pairSig, pick, safeEqual, tokenHex,
} from "./http.js";

const WORD = "[\\p{L}\\p{N}_]";

function clipChars(value) {
  return [...String(value || "")].filter((ch) => ch >= " " && ch !== "\x7f").join("");
}

function cleanNick(raw) {
  const s = clipChars(raw).trim();
  if (!s || s.length > 32) return null;
  return s;
}

function cleanCast(raw) {
  const s = clipChars(String(raw || "").replace(/\r/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ")).trim();
  if (!s) return null;
  return s.slice(0, 120);
}

function cleanSeats(raw) {
  let text = String(raw || "").trim();
  text = text.replace(/－/g, "-").replace(/—/g, "-").replace(/–/g, "-").replace(/~/g, "-").replace(/～/g, "-");
  text = text.replace(/\s+/g, "");
  if (text === "" || text === "0") return "";
  const match = text.match(/^(\d{1,4})(?:-(\d{1,4}))?$/);
  if (!match) return null;
  const low = Number(match[1]);
  const high = Number(match[2] || low);
  if (low < 1 || high > 9999 || low > high) return null;
  if (low === high) return String(low);
  return low + "-" + high;
}

function cleanLabel(raw, limit) {
  const s = clipChars(String(raw || "").replace(/\r/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ")).trim();
  if (!s) return null;
  return s.slice(0, limit);
}

function cleanNote(raw, limit) {
  let s = String(raw || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = [...s].filter((ch) => ch === "\n" || (ch >= " " && ch !== "\x7f")).join("").trim();
  return s ? s.slice(0, limit) : "";
}

function contactUrl(raw) {
  const text = String(raw || "").trim();
  if (!/^https?:\/\//i.test(text) || /\s/.test(text)) return null;
  let url;
  try { url = new URL(text); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port) return null;
  return url;
}

function contactHost(url) {
  const host = url.hostname.toLowerCase();
  return host.startsWith("www.") ? host.slice(4) : host;
}

function contactPath(url) {
  return url.pathname.split("/").filter(Boolean);
}

function contactLink(kind, raw) {
  const text = String(raw || "").trim();
  if (kind === "heibox" && /^(?=.*[a-z])(?=.*\d)[a-z0-9]{6,10}$/.test(text)) {
    return "https://chat.xiaoheihe.cn/" + text;
  }
  const url = contactUrl(text);
  if (!url) return null;
  const host = contactHost(url);
  const seg = contactPath(url);
  if (kind === "heibox") {
    if (host === "chat.xiaoheihe.cn" && seg.length === 1 && /^[A-Za-z0-9]{4,16}$/.test(seg[0])) {
      return "https://chat.xiaoheihe.cn/" + seg[0];
    }
    return "";
  }
  if (kind === "kook") {
    if ((host === "kook.top" || host === "kook.vip") && seg.length === 1 && /^[A-Za-z0-9]{4,16}$/.test(seg[0])) {
      return "https://kook.top/" + seg[0];
    }
    if (host === "kookapp.cn" && seg.length >= 2 && seg[seg.length - 2] === "invite" && /^[A-Za-z0-9]{4,16}$/.test(seg[seg.length - 1])) {
      return "https://kook.top/" + seg[seg.length - 1];
    }
    return "";
  }
  if (kind === "discord") {
    let code = host === "discord.gg" && seg.length === 1 ? seg[0] : "";
    if ((host === "discord.com" || host === "discordapp.com") && seg.length === 2 && seg[0] === "invite") code = seg[1];
    if (/^(?=.*[A-Za-z0-9])[A-Za-z0-9-]{2,32}$/.test(code || "")) return "https://discord.gg/" + code;
    return "";
  }
  if (kind === "qq") {
    let code = host === "qm.qq.com" && seg[0] === "q" && seg.length >= 2 ? seg[1] : "";
    if (!code && (host === "qm.qq.com" || host === "jq.qq.com")) {
      code = url.searchParams.get("k") || "";
    }
    if (/^[A-Za-z0-9]{4,24}$/.test(code || "")) return "https://qm.qq.com/q/" + code;
    return "";
  }
  if (kind === "telegram") {
    if (host !== "t.me" && host !== "telegram.me") return "";
    if (seg.length === 1 && seg[0].startsWith("+") && /^[A-Za-z0-9_-]{8,32}$/.test(seg[0].slice(1))) {
      return "https://t.me/+" + seg[0].slice(1);
    }
    if (seg.length === 2 && seg[0] === "joinchat" && /^[A-Za-z0-9_-]{8,32}$/.test(seg[1])) {
      return "https://t.me/joinchat/" + seg[1];
    }
    if (seg.length === 1 && /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(seg[0])) return seg[0];
    return "";
  }
  if (kind === "whatsapp") {
    if (host === "chat.whatsapp.com" && seg.length === 1 && /^[A-Za-z0-9]{10,32}$/.test(seg[0])) {
      return "https://chat.whatsapp.com/" + seg[0];
    }
    if (host === "wa.me" && seg.length === 1) return [...seg[0]].filter((ch) => ch >= "0" && ch <= "9").join("");
    if (host === "api.whatsapp.com" && seg[0] === "send") {
      return [...(url.searchParams.get("phone") || "")].filter((ch) => ch >= "0" && ch <= "9").join("");
    }
    return "";
  }
  return null;
}

function cleanContact(kind, raw) {
  kind = (cleanLabel(kind, 16) || "").toLowerCase();
  let text = cleanLabel(raw, 240) || "";
  const kinds = ["spectrum", "qq", "wechat", "discord", "telegram", "kook", "heibox", "whatsapp", "mail"];
  if (!kinds.includes(kind) || !text) return null;
  const linked = contactLink(kind, text);
  if (linked === "") return null;
  if (linked && linked.startsWith("https://")) return [kind, linked];
  if (linked) text = linked;
  if ((kind === "telegram" || kind === "discord") && text.startsWith("@")) text = text.slice(1);
  if (kind === "qq") text = text.replace(/\s+/g, "");
  if (kind === "whatsapp" && !text.startsWith("https://")) {
    const lead = text.trim().startsWith("+") ? "+" : "";
    text = lead + [...text].filter((ch) => ch >= "0" && ch <= "9").join("");
  }
  if (kind === "heibox" && !text.startsWith("https://")) {
    const compact = text.replace(/\s+/g, "");
    if (/^\d+$/.test(compact)) text = compact;
  }
  if (kind === "mail") text = text.toLowerCase();
  const ok = {
    spectrum: new RegExp("^[\\p{L}\\p{N}_.\\- ]{2,40}$", "u").test(text) && new RegExp(WORD, "u").test(text),
    qq: /^[1-9]\d{4,10}$/.test(text),
    wechat: /^[A-Za-z][-_A-Za-z0-9]{5,19}$/.test(text),
    discord: /^[A-Za-z0-9._]{2,32}(?:#\d{4})?$/.test(text),
    telegram: /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(text),
    kook: /^(?:[A-Za-z0-9_]{2,32}(?:#\d{4})?|\d{5,12})$/.test(text),
    heibox: /^(?:\d{4,10}|(?=.*[A-Za-z\u4e00-\u9fff])[\p{L}\p{N}_\u4e00-\u9fff·]{2,32})$/u.test(text),
    whatsapp: /^\+?[1-9]\d{7,14}$/.test(text),
    mail: /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(text),
  };
  if (!ok[kind]) return null;
  return [kind, text];
}

function inviteCount(value) {
  if (typeof value === "boolean") return null;
  if (typeof value === "string" && /^\d+$/.test(value)) value = Number(value);
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10000000) return value;
  return null;
}

async function inviteJson(url, host) {
  const timer = AbortSignal.timeout(3000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "sc-lmw", Accept: "application/json" },
      redirect: "manual",
      signal: timer,
    });
    if (res.status >= 300 && res.status < 400) {
      await res.body?.cancel();
      return null;
    }
    let got;
    try { got = new URL(res.url); } catch { return null; }
    if (got.hostname !== host) {
      await res.body?.cancel();
      return null;
    }
    const buf = await res.arrayBuffer();
    const raw = new TextDecoder().decode(buf.byteLength > 65536 ? buf.slice(0, 65536) : buf);
    const data = JSON.parse(raw);
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function inviteFields(name, channel, online, members) {
  const out = {};
  name = cleanLabel(name, 40);
  channel = cleanLabel(channel, 40);
  if (name) out.name = name;
  if (channel && channel !== name) out.channel = channel;
  online = inviteCount(online);
  members = inviteCount(members);
  if (online !== null) out.online = online;
  if (members !== null) out.members = members;
  return out;
}

async function fetchInvite(kind, contact) {
  const code = contact.replace(/\/+$/, "").split("/").pop() || "";
  if (kind === "discord") {
    const data = await inviteJson("https://discord.com/api/v10/invites/" + encodeURIComponent(code) + "?with_counts=true", "discord.com");
    const guild = data && data.guild && typeof data.guild === "object" ? data.guild : null;
    if (!guild) return {};
    const channel = data.channel && typeof data.channel === "object" ? data.channel : {};
    return inviteFields(guild.name, channel.name, data.approximate_presence_count, data.approximate_member_count);
  }
  if (kind === "kook") {
    let data = await inviteJson("https://www.kookapp.cn/api/v3/invite/view?url_code=" + encodeURIComponent(code), "www.kookapp.cn");
    let payload = data && (data.code === 0 || data.code === "0") && data.data && typeof data.data === "object" ? data.data : null;
    if (!payload) {
      data = await inviteJson("https://www.kookapp.cn/api/v2/invites/" + encodeURIComponent(code), "www.kookapp.cn");
      payload = data && (data.code === 0 || data.code === "0") && data.data && typeof data.data === "object" ? data.data : null;
    }
    if (!payload || typeof payload !== "object") return {};
    const guild = payload.guild && typeof payload.guild === "object" ? payload.guild : payload;
    const channel = payload.channel && typeof payload.channel === "object" ? payload.channel : {};
    return inviteFields(guild.name, channel.name, guild.online_count ?? payload.online_count, guild.user_count ?? payload.user_count);
  }
  return {};
}

async function inviteCard(kind, contact) {
  const found = cleanContact(kind, contact);
  if (!found || !found[1].startsWith("https://") || (found[0] !== "discord" && found[0] !== "kook")) return {};
  const key = new Request("https://invite-cache.sclmw.internal/" + encodeURIComponent(found[0] + " " + found[1]));
  try {
    const hit = await caches.default.match(key);
    if (hit) return await hit.json();
  } catch { /* cache is optional */ }
  const card = await fetchInvite(found[0], found[1]);
  const ttl = card && Object.keys(card).length ? 120 : 45;
  try {
    await caches.default.put(key, new Response(JSON.stringify(card), {
      headers: { "Cache-Control": "public, max-age=" + ttl },
    }));
  } catch { /* ignore */ }
  return card;
}

function cleanWhen(raw) {
  let at = Number(raw);
  if (!Number.isFinite(at)) return null;
  if (at > 10000000000) at = at / 1000;
  const stamp = now();
  if (at < stamp - 3600 || at > stamp + 8 * 24 * 3600) return null;
  return at;
}

function rollLeft(stamp) {
  stamp = Number(stamp || 0);
  if (!Number.isFinite(stamp) || stamp <= 0) return 0;
  const left = Math.trunc(stamp + ROLL_S - now() + 0.999);
  return left > 0 ? left : 0;
}

function roomOpen(room) {
  return Number(room?.open || 0) === 1;
}

function openWait(room) {
  const at = Number(room?.open_at || 0);
  if (!Number.isFinite(at) || at <= 0) return 0;
  const left = Math.trunc(at + OPEN_S - now() + 0.999);
  return left > 0 ? left : 0;
}

function wantOpen(raw) {
  if (typeof raw === "boolean") return raw;
  if (raw === 0 || raw === 1) return Boolean(raw);
  if (typeof raw === "string" && ["1", "true", "public"].includes(raw.toLowerCase())) return true;
  if (typeof raw === "string" && ["0", "false", "private"].includes(raw.toLowerCase())) return false;
  return null;
}

function cleanCode(raw) {
  const chars = [...String(raw || "").toUpperCase()].filter((ch) => ALPH.includes(ch));
  if (chars.length !== 8) return "";
  const text = chars.join("");
  return text.slice(0, 4) + "-" + text.slice(4);
}

function cleanRecover(raw) {
  const chars = [...String(raw || "").toUpperCase()].filter((ch) => ALPH.includes(ch));
  if (chars.length !== 12) return "";
  const text = chars.join("");
  return text.slice(0, 4) + "-" + text.slice(4, 8) + "-" + text.slice(8);
}

function gearItems(raw) {
  if (!raw) return [];
  let data = raw;
  if (typeof raw === "string") {
    try { data = JSON.parse(raw); } catch { return []; }
  }
  if (!Array.isArray(data)) return [];
  const out = [];
  for (const item of data.slice(0, 12)) {
    if (!item || typeof item !== "object") continue;
    const port = String(item.port || "").slice(0, 40);
    const name = String(item.name || "").slice(0, 80);
    const cls = String(item.cls || "").slice(0, 80);
    if (port && name) {
      const row = { port, name };
      if (cls) row.cls = cls;
      out.push(row);
    }
  }
  return out;
}

function cleanGear(raw) {
  return JSON.stringify(gearItems(Array.isArray(raw) ? raw : []));
}

function cleanHost(raw) {
  return [...String(raw || "")].filter((ch) => /[A-Za-z0-9_-]/.test(ch)).join("").slice(0, 80);
}

function clip80(value) {
  return clipChars(value).trim().slice(0, 80);
}

function cleanTravel(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  if (raw.mode !== "aim" && raw.mode !== "jump") return "";
  const out = { mode: raw.mode, from: clip80(raw.from), to: clip80(raw.to), to_raw: clip80(raw.to_raw) };
  if (!out.to && !out.to_raw) return "";
  return JSON.stringify(out);
}

function cleanCard(raw) {
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { return ""; }
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  const out = {};
  if (typeof raw.arm === "boolean") out.arm = raw.arm;
  if (typeof raw.watch === "boolean") out.watch = raw.watch;
  const names = [];
  for (const item of raw.contracts || []) {
    const title = clip80(item);
    if (title && !names.includes(title)) names.push(title);
    if (names.length === 8) break;
  }
  if (names.length) out.contracts = names;
  const tracked = clip80(raw.track);
  if (tracked) out.track = tracked;
  if (typeof raw.board === "boolean") out.board = raw.board;
  if (typeof raw.crime === "number" && Number.isInteger(raw.crime) && raw.crime >= 0 && raw.crime <= 5) out.crime = raw.crime;
  if (typeof raw.fps === "number" && Number.isInteger(raw.fps) && raw.fps >= 1 && raw.fps <= 1000) out.fps = raw.fps;
  const crash = clip80(raw.crash);
  if (["gpu", "freeze", "ram", "vram", "fault"].includes(crash)) out.crash = crash;
  for (const key of ["kills", "wrecks"]) {
    const num = raw[key];
    if (typeof num === "number" && Number.isInteger(num) && num > 0 && num <= 9999) out[key] = num;
  }
  const down = clip80(raw.down);
  if (["down", "player", "npc"].includes(down)) out.down = down;
  if (!Object.keys(out).length) return "";
  return JSON.stringify(out);
}

function cardObj(raw) {
  const text = cleanCard(raw);
  return text ? JSON.parse(text) : null;
}

function travelObj(raw) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { return null; }
  }
  const text = cleanTravel(raw);
  return text ? JSON.parse(text) : null;
}

function presenceLights(starfixSeen, gameSeen, at) {
  at = at == null ? now() : at;
  const starfix = Boolean(starfixSeen && at - starfixSeen < STARFIX_S);
  const game = Boolean(starfix && gameSeen && at - gameSeen < GAME_S);
  return [starfix, game];
}

function cleanKeep(body) {
  let raw = body.keep;
  if (raw == null || raw === "") {
    const hours = Number(body.hours || 0);
    raw = Number.isFinite(hours) ? hours * 3600 : 0;
  }
  const keep = Number(raw);
  if (!KEEP_SECONDS.includes(keep)) return 21600;
  return keep;
}

function flag(value) {
  return value === true || value === 1 || value === "1";
}

async function bearerMember(con, request) {
  const header = request.headers.get("Authorization") || "";
  const token = header.slice(0, 7).toLowerCase() === "bearer " ? header.slice(7).trim() : "";
  if (!token) return null;
  return con.one("SELECT * FROM member WHERE token = ?", token);
}

async function newCode(con) {
  for (let i = 0; i < 20; i++) {
    let raw = "";
    for (let n = 0; n < 8; n++) raw += pick(ALPH);
    const code = raw.slice(0, 4) + "-" + raw.slice(4);
    if (!(await con.one("SELECT 1 AS ok FROM room WHERE code = ?", code))) return code;
  }
  throw new Error("code");
}

function newRecover() {
  let raw = "";
  for (let n = 0; n < 12; n++) raw += pick(ALPH);
  return raw.slice(0, 4) + "-" + raw.slice(4, 8) + "-" + raw.slice(8);
}

async function pairOk(env, code, recover, sig) {
  if (!code || !recover || !sig) return false;
  return safeEqual(pairSig(env.SIGN_KEY, code, recover), String(sig));
}

async function issuePair(con, env, code) {
  if (!code || await con.one("SELECT 1 AS ok FROM room WHERE code = ?", code)) code = await newCode(con);
  const recover = newRecover();
  return { code, recover, sig: pairSig(env.SIGN_KEY, code, recover) };
}

async function ensureRecover(con, room) {
  if (room.recover) return room.recover;
  const secret = newRecover();
  await con.run("UPDATE room SET recover = ? WHERE code = ?", secret, room.code);
  return secret;
}

async function touchMember(con, code, mid) {
  await con.run("UPDATE membership SET touched = ? WHERE room = ? AND member = ?", now(), code, mid);
}

async function earliestMember(con, code, skip) {
  return con.one(
    "SELECT member FROM membership WHERE room = ? AND status = 'member' AND member != ? ORDER BY created LIMIT 1",
    code, skip || "",
  );
}

async function wipeRoom(con, code) {
  const routes = await con.all("SELECT id FROM route WHERE room = ?", code);
  for (const rt of routes) await con.run("DELETE FROM comment WHERE route = ?", rt.id);
  await con.run("DELETE FROM route WHERE room = ?", code);
  await con.run("DELETE FROM presence WHERE room = ?", code);
  await con.run("DELETE FROM broadcast WHERE room = ?", code);
  await con.run("DELETE FROM rally_rsvp WHERE room = ?", code);
  await con.run("DELETE FROM rally WHERE room = ?", code);
  await con.run("DELETE FROM membership WHERE room = ?", code);
  await con.run("DELETE FROM room WHERE code = ?", code);
}

async function dropMember(con, code, mid) {
  await con.run("DELETE FROM presence WHERE room = ? AND member = ?", code, mid);
  await con.run("DELETE FROM rally_rsvp WHERE room = ? AND member = ?", code, mid);
  await con.run("DELETE FROM membership WHERE room = ? AND member = ?", code, mid);
  const left = await con.one("SELECT 1 AS ok FROM membership WHERE room = ? AND status = 'member'", code);
  if (left) return false;
  await wipeRoom(con, code);
  return true;
}

async function settleRoom(con, code) {
  const room = await con.one("SELECT * FROM room WHERE code = ?", code);
  if (!room) return false;
  const cap = await con.one(
    "SELECT touched, created FROM membership WHERE room = ? AND member = ? AND status = 'member'",
    code, room.captain,
  );
  if (!cap) {
    const other = await earliestMember(con, code, room.captain);
    if (other) {
      await con.run("UPDATE room SET captain = ? WHERE code = ?", other.member, code);
      return true;
    }
    await wipeRoom(con, code);
    return false;
  }
  const stamp = cap.touched != null ? cap.touched : cap.created;
  if (stamp == null || now() - Number(stamp) < CAPTAIN_GONE_S) return true;
  const other = await earliestMember(con, code, room.captain);
  if (other) {
    await con.run("UPDATE room SET captain = ? WHERE code = ?", other.member, code);
    return true;
  }
  await wipeRoom(con, code);
  return false;
}

async function rallyView(con, code, meId) {
  const row = await con.one("SELECT * FROM rally WHERE room = ?", code);
  if (!row) return null;
  const people = await con.all(
    `SELECT v.member, v.going, m.nickname FROM rally_rsvp v JOIN member m ON m.id = v.member
     WHERE v.room = ? AND v.rally = ? ORDER BY m.nickname`,
    code, row.id,
  );
  const replies = [];
  let mine = null;
  for (const person of people) {
    const going = Boolean(person.going);
    replies.push({ id: person.member, nickname: person.nickname || "", going });
    if (person.member === meId) mine = going;
  }
  return {
    id: row.id, place: row.place, name: row.name, system: row.system || "",
    at: Math.trunc(Number(row.at)), mine, replies,
  };
}

async function latestCast(con, code) {
  const row = await con.one(
    `SELECT b.id, b.body, b.created, m.nickname FROM broadcast b JOIN member m ON m.id = b.author
     WHERE b.room = ? ORDER BY b.created DESC LIMIT 1`,
    code,
  );
  if (!row) return null;
  return { id: row.id, body: row.body, name: row.nickname || "", at: row.created };
}

async function roomState(con, code, me) {
  const room = await con.one("SELECT * FROM room WHERE code = ?", code);
  if (!room) return null;
  const ship = await con.one("SELECT * FROM membership WHERE room = ? AND member = ?", code, me.id);
  if (!ship) return { error: "forbidden" };
  if (ship.status === "rejected") return { error: "rejected" };
  const role = room.captain === me.id ? "captain" : "member";
  const rows = await con.all(
    `SELECT m.id, m.nickname, s.status, p.location, p.system, p.code, p.seen, p.ship, p.gear, p.host, p.travel, p.card, p.starfix_seen, p.game_seen
     FROM membership s JOIN member m ON m.id = s.member
     LEFT JOIN presence p ON p.room = s.room AND p.member = s.member
     WHERE s.room = ? ORDER BY s.created`,
    code,
  );
  const members = [];
  for (const r of rows) {
    if (r.status !== "member" && role !== "captain") continue;
    if (r.status === "rejected") continue;
    const [starfixOn, gameOn] = presenceLights(r.starfix_seen, r.game_seen);
    members.push({
      id: r.id,
      nickname: r.nickname,
      status: r.status,
      location: r.location || "",
      system: r.system || "",
      code: r.code || "",
      seen: r.seen ? Math.trunc(Number(r.seen)) : null,
      ship: r.ship || "",
      gear: gearItems(r.gear),
      server: r.host || "",
      travel: travelObj(r.travel),
      card: cardObj(r.card),
      starfix: starfixOn,
      game: gameOn,
      online: gameOn,
    });
  }
  const routes = [];
  if (ship.status === "member") {
    const routeRows = await con.all("SELECT * FROM route WHERE room = ? AND published = 1 ORDER BY updated DESC", code);
    for (const rt of routeRows) {
      const comments = [];
      const commentRows = await con.all(
        `SELECT c.id, c.body, c.created, m.nickname FROM comment c JOIN member m ON m.id = c.author
         WHERE c.route = ? ORDER BY c.created`,
        rt.id,
      );
      for (const c of commentRows) comments.push({ id: c.id, authorName: c.nickname, body: c.body });
      const author = await con.one("SELECT nickname FROM member WHERE id = ?", rt.author);
      let points = [];
      try { points = JSON.parse(rt.points || "[]"); } catch { points = []; }
      routes.push({
        id: rt.id,
        author: rt.author,
        authorName: author ? author.nickname : "",
        title: rt.title || "",
        note: rt.note || "",
        points,
        comments,
      });
    }
  }
  const state = {
    code,
    role,
    captain: room.captain,
    status: ship.status,
    me: { id: me.id, nickname: me.nickname },
    routeMode: room.route_mode,
    open: roomOpen(room),
    openWait: openWait(room),
    recoverWait: rollLeft(room.recover_at),
    members,
    routes,
    cast: await latestCast(con, code),
    rally: ship.status === "member" ? await rallyView(con, code, me.id) : null,
  };
  if (role === "captain" && ship.status === "member") state.recover = await ensureRecover(con, room);
  return state;
}

async function setRoomOpen(con, room, want) {
  const wantI = want ? 1 : 0;
  if (wantI === (roomOpen(room) ? 1 : 0)) return null;
  const wait = openWait(room);
  if (wait > 0) return { error: "cooldown", wait };
  await con.run("UPDATE room SET open = ?, open_at = ? WHERE code = ?", wantI, now(), room.code);
  if (wantI) await con.run("UPDATE membership SET status = 'member' WHERE room = ? AND status = 'pending'", room.code);
  return null;
}

function joinStatus(room, me, existing) {
  if (room.captain === me.id || (existing && existing.status === "member") || roomOpen(room)) return "member";
  return "pending";
}

async function publicRooms(con) {
  const open = await con.all("SELECT code FROM room WHERE open = 1");
  for (const row of open) await settleRoom(con, row.code);
  const rows = await con.all(
    `SELECT r.code, (SELECT nickname FROM member WHERE id = r.captain) AS captain,
            (SELECT COUNT(*) AS n FROM membership s WHERE s.room = r.code AND s.status = 'member') AS members
     FROM room r WHERE r.open = 1 ORDER BY members DESC, r.created ASC LIMIT 100`,
  );
  return rows.map((r) => ({ code: r.code, captain: r.captain || "", members: Number(r.members) }));
}

async function roomBrief(con, code) {
  const empty = { code, exists: false, online: 0, members: 0 };
  if (!(await settleRoom(con, code))) return empty;
  const room = await con.one("SELECT code FROM room WHERE code = ?", code);
  if (!room) return empty;
  const members = await con.one("SELECT COUNT(*) AS n FROM membership WHERE room = ? AND status = 'member'", code);
  const online = await con.one(
    `SELECT COUNT(*) AS n FROM membership s JOIN presence p ON p.room = s.room AND p.member = s.member
     WHERE s.room = ? AND s.status = 'member' AND p.starfix_seen > ?`,
    code, now() - STARFIX_S,
  );
  return { code, exists: true, online: Number(online.n), members: Number(members.n) };
}

async function releaseOtherRooms(con, me, keep) {
  const rows = await con.all("SELECT room, status FROM membership WHERE member = ? AND status != 'rejected'", me.id);
  for (const row of rows) {
    const code = row.room;
    if (keep && code === keep) continue;
    const room = await con.one("SELECT captain FROM room WHERE code = ?", code);
    if (!room) {
      await dropMember(con, code, me.id);
      continue;
    }
    if (room.captain === me.id && row.status === "member") {
      const other = await con.one(
        "SELECT member FROM membership WHERE room = ? AND status = 'member' AND member != ? ORDER BY created LIMIT 1",
        code, me.id,
      );
      if (other) {
        await con.run("UPDATE room SET captain = ? WHERE code = ?", other.member, code);
        await dropMember(con, code, me.id);
      } else {
        await wipeRoom(con, code);
      }
    } else {
      await dropMember(con, code, me.id);
    }
  }
}

async function lobbyRow(con, member) {
  return con.one("SELECT * FROM lobby WHERE member = ?", member);
}

async function latestPresence(con, member) {
  return con.one(
    "SELECT location, system, code, ship, host, starfix_seen, game_seen FROM presence WHERE member = ? ORDER BY COALESCE(seen, 0) DESC LIMIT 1",
    member,
  );
}

async function mirrorLobby(con, member, loc, sys, code, ship, host, starfixSeen, gameSeen, seen) {
  const row = await lobbyRow(con, member);
  if (!row || !row.visible) return;
  await con.run(
    "UPDATE lobby SET location = ?, system = ?, code = ?, ship = ?, host = ?, starfix_seen = ?, game_seen = ?, seen = ? WHERE member = ?",
    loc || "", sys || "", code || "", ship || "", host || "", starfixSeen, gameSeen, seen || now(), member,
  );
}

async function setLobby(con, me, body) {
  const visible = flag(body.on) ? 1 : 0;
  const prev = await lobbyRow(con, me.id);
  const presence = await latestPresence(con, me.id);
  let loc = (prev && prev.location) || "";
  let sys = (prev && prev.system) || "";
  let code = (prev && prev.code) || "";
  let ship = (prev && prev.ship) || "";
  let host = (prev && prev.host) || "";
  let starfixSeen = prev ? prev.starfix_seen : null;
  let gameSeen = prev ? prev.game_seen : null;
  if (presence) {
    loc = presence.location || loc;
    sys = presence.system || sys;
    code = presence.code || code;
    ship = presence.ship || ship;
    host = presence.host || host;
    starfixSeen = presence.starfix_seen;
    gameSeen = presence.game_seen;
  }
  if (cleanLabel(body.code, 80)) {
    loc = cleanLabel(body.location, 80) || loc;
    sys = (cleanLabel(body.system, 24) || "").toLowerCase();
    if (!["", "stanton", "pyro", "nyx"].includes(sys)) sys = "";
    code = cleanLabel(body.code, 80) || code;
    const named = cleanLabel(body.ship, 40);
    if (named) ship = named;
  }
  await con.run(
    `INSERT INTO lobby (member, visible, location, system, code, ship, host, seen, starfix_seen, game_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(member) DO UPDATE SET
       visible = excluded.visible, location = excluded.location, system = excluded.system,
       code = excluded.code, ship = excluded.ship, host = excluded.host, seen = excluded.seen,
       starfix_seen = excluded.starfix_seen, game_seen = excluded.game_seen`,
    me.id, visible, loc, sys, code, ship, host, visible ? now() : (prev ? prev.seen : null), starfixSeen, gameSeen,
  );
}

async function chatLines(con, me, after, limit) {
  const rows = after > 0
    ? await con.all(
      `SELECT c.id, c.body, c.created, c.member, m.nickname FROM lobby_chat c JOIN member m ON m.id = c.member
       WHERE c.id > ? ORDER BY c.id ASC LIMIT ?`,
      after, limit,
    )
    : (await con.all(
      `SELECT c.id, c.body, c.created, c.member, m.nickname FROM lobby_chat c JOIN member m ON m.id = c.member
       ORDER BY c.id DESC LIMIT ?`,
      limit,
    )).reverse();
  return rows.map((row) => ({
    id: Number(row.id),
    nickname: row.nickname || "",
    body: row.body,
    at: Math.trunc(Number(row.created)),
    mine: row.member === me.id,
  }));
}

async function addChat(con, me, body) {
  const text = cleanLabel(body.body, 240);
  if (!text) return [null, "empty"];
  const stamp = now();
  const prev = await con.one("SELECT created FROM lobby_chat WHERE member = ? ORDER BY id DESC LIMIT 1", me.id);
  if (prev && stamp - Number(prev.created) < 1.2) return [null, "fast"];
  const cur = await con.run("INSERT INTO lobby_chat (member, body, created) VALUES (?, ?, ?)", me.id, text, stamp);
  const top = await con.one("SELECT MAX(id) AS n FROM lobby_chat");
  if (top && top.n && Number(top.n) > 400) await con.run("DELETE FROM lobby_chat WHERE id < ?", Number(top.n) - 400);
  return [{ id: Number(cur.lastrowid), nickname: me.nickname || "", body: text, at: Math.trunc(stamp), mine: true }, null];
}

async function sweepBoard(con) {
  const stamp = now();
  const gone = await con.all("SELECT id FROM board WHERE expires <= ?", stamp);
  for (const row of gone) await con.run("DELETE FROM board_rsvp WHERE board = ?", row.id);
  if (gone.length) await con.run("DELETE FROM board WHERE expires <= ?", stamp);
}

async function boardPosts(con, me) {
  await sweepBoard(con);
  const stamp = now();
  const rows = await con.all(
    `SELECT b.*, m.nickname FROM board b JOIN member m ON m.id = b.member
     WHERE b.expires > ? ORDER BY b.created DESC LIMIT 40`,
    stamp,
  );
  const posts = [];
  for (const row of rows) {
    const people = await con.all(
      `SELECT v.member, v.going, v.note, m.nickname FROM board_rsvp v JOIN member m ON m.id = v.member
       WHERE v.board = ? ORDER BY m.nickname`,
      row.id,
    );
    const replies = [];
    let mineGoing = null;
    for (const person of people) {
      const going = Boolean(person.going);
      replies.push({ nickname: person.nickname || "", going, note: person.note || "", mine: person.member === me.id });
      if (person.member === me.id) mineGoing = going;
    }
    posts.push({
      id: row.id,
      kind: row.kind,
      title: row.title,
      detail: row.detail || "",
      ship: row.ship || "",
      place: row.place || "",
      name: row.name || "",
      system: row.system || "",
      at: Math.trunc(Number(row.at || 0)),
      seats: cleanSeats(row.seats) || "",
      standing: Boolean(row.standing),
      server: row.host || "",
      mission: row.mission || "",
      speech: row.speech || "",
      contactKind: row.contact_kind || "",
      contact: row.contact || "",
      nickname: row.nickname || "",
      mine: row.member === me.id,
      expires: Math.trunc(Number(row.expires)),
      going: mineGoing,
      replies,
    });
  }
  return posts;
}

async function addBoard(con, me, body) {
  if (body.clear) {
    const bid = cleanLabel(body.id, 40);
    if (!bid) return "board";
    await con.run("DELETE FROM board_rsvp WHERE board = ?", bid);
    await con.run("DELETE FROM board WHERE id = ? AND member = ?", bid, me.id);
    return null;
  }
  if (!["ship", "job", "roam"].includes(body.kind)) return "board";
  const title = cleanLabel(body.title, 60);
  if (!title) return "title";
  const n = await con.one("SELECT COUNT(*) AS n FROM board WHERE member = ? AND expires > ?", me.id, now());
  if (Number(n.n) >= 9) return "limit";
  const standing = flag(body.standing) ? 1 : 0;
  await sweepBoard(con);
  const keep = cleanKeep(body);
  const seats = cleanSeats(body.seats);
  if (seats === null) return "seats";
  let at = 0;
  if (body.at != null && body.at !== "" && body.at !== 0) {
    const parsed = cleanWhen(body.at);
    if (parsed === null) return "time";
    at = parsed;
  }
  let system = (cleanLabel(body.system, 24) || "").toLowerCase();
  if (!["", "stanton", "pyro", "nyx"].includes(system)) system = "";
  let host = cleanLabel(body.server, 16) || "";
  if (!["", "asia", "us", "aus", "eu"].includes(host)) host = "";
  let speech = cleanLabel(body.speech, 16) || "";
  if (!["", "zh", "en", "other"].includes(speech)) speech = "";
  const found = cleanContact(body.contactKind, body.contact);
  if (!found) return "contact";
  const stamp = now();
  await con.run(
    `INSERT INTO board (id, member, kind, title, detail, ship, place, name, system, at, seats, standing, host, mission, speech, contact_kind, contact, created, expires)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    tokenHex(8), me.id, body.kind, title, cleanNote(body.detail, 400),
    cleanLabel(body.ship, 80) || "", cleanLabel(body.place, 80) || "", cleanLabel(body.name, 80) || "",
    system, at, seats, standing, host, cleanLabel(body.mission, 80) || "", speech, found[0], found[1],
    stamp, keep === 0 ? KEEP_OPEN : stamp + keep,
  );
  return null;
}

async function setBoardRsvp(con, me, body) {
  const bid = cleanLabel(body.id, 40);
  const going = body.going;
  if (!bid || ![true, false, 0, 1].includes(going)) return "board";
  const row = await con.one("SELECT id FROM board WHERE id = ? AND expires > ?", bid, now());
  if (!row) return "board";
  await con.run(
    `INSERT INTO board_rsvp (board, member, going, note) VALUES (?, ?, ?, ?)
     ON CONFLICT(board, member) DO UPDATE SET going = excluded.going, note = excluded.note`,
    bid, me.id, going ? 1 : 0, cleanLabel(body.note, 80) || "",
  );
  return null;
}

async function plazaView(con, me, after) {
  const row = await lobbyRow(con, me.id);
  const visible = Boolean(row && row.visible);
  if (visible) await con.run("UPDATE lobby SET seen = ? WHERE member = ?", now(), me.id);
  const fresh = now() - 15 * 60;
  const people = [];
  for (const person of await con.all(
    `SELECT l.*, m.nickname FROM lobby l JOIN member m ON m.id = l.member
     WHERE l.visible = 1 AND l.seen > ? ORDER BY m.nickname`,
    fresh,
  )) {
    const [starfix, game] = presenceLights(person.starfix_seen, person.game_seen);
    people.push({
      id: person.member,
      nickname: person.nickname || "",
      location: person.location || "",
      system: person.system || "",
      code: person.code || "",
      ship: person.ship || "",
      server: person.host || "",
      starfix, game,
      mine: person.member === me.id,
    });
  }
  return { on: visible, people, chat: await chatLines(con, me, after, 80), posts: await boardPosts(con, me) };
}

async function savePresence(con, room, member, body) {
  const old = await con.one(
    "SELECT location, system, code, seen, ship, gear, host, travel, card, starfix_seen, game_seen FROM presence WHERE room = ? AND member = ?",
    room, member,
  );
  if (Object.hasOwn(body, "starfix") && !body.starfix) {
    if (old) await con.run("UPDATE presence SET starfix_seen = NULL, game_seen = NULL WHERE room = ? AND member = ?", room, member);
    await con.run("UPDATE lobby SET starfix_seen = NULL, game_seen = NULL WHERE member = ?", member);
    return true;
  }
  const sentLoc = String(body.location || "").slice(0, 80);
  const sentCode = String(body.code || "").slice(0, 80);
  const sentPlace = Boolean(sentLoc || sentCode || Object.hasOwn(body, "card"));
  let loc = sentLoc;
  let sys = String(body.system || "").slice(0, 40);
  let codeLoc = sentCode;
  if (!loc && !codeLoc && old) {
    loc = old.location || "";
    sys = old.system || sys;
    codeLoc = old.code || "";
  }
  const shipName = Object.hasOwn(body, "ship") ? String(body.ship || "").slice(0, 80) : ((old && old.ship) || "");
  const worn = Object.hasOwn(body, "gear") ? cleanGear(body.gear) : ((old && old.gear) || "[]");
  const hostId = Object.hasOwn(body, "server") ? cleanHost(body.server) : ((old && old.host) || "");
  const travel = Object.hasOwn(body, "travel") ? (body.travel && typeof body.travel === "object" ? cleanTravel(body.travel) : "") : ((old && old.travel) || "");
  const card = Object.hasOwn(body, "card") ? cleanCard(body.card) : ((old && old.card) || "");
  const starfixOn = body.starfix === true;
  if (!sentPlace && !starfixOn) return false;
  const ts = now();
  const placeSeen = sentPlace ? ts : ((old && old.seen) || 0);
  const starfixSeen = starfixOn ? ts : (old ? old.starfix_seen : null);
  const gameSeen = body.game === true ? ts : (old ? old.game_seen : null);
  await con.run(
    `INSERT INTO presence (room, member, location, system, code, seen, ship, gear, host, travel, card, starfix_seen, game_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(room, member) DO UPDATE SET
       location = excluded.location, system = excluded.system, code = excluded.code, seen = excluded.seen,
       ship = excluded.ship, gear = excluded.gear, host = excluded.host, travel = excluded.travel,
       card = excluded.card, starfix_seen = excluded.starfix_seen, game_seen = excluded.game_seen`,
    room, member, loc, sys, codeLoc, placeSeen, shipName, worn, hostId, travel, card, starfixSeen, gameSeen,
  );
  await mirrorLobby(con, member, loc, sys, codeLoc, shipName, hostId, starfixSeen, gameSeen, placeSeen || ts);
  return true;
}

async function playersJson(con, code, me) {
  const st = await roomState(con, code, me);
  if (!st || st.error || st.status !== "member") return null;
  const out = [];
  for (const m of st.members) {
    if (m.status !== "member") continue;
    const seen = await con.one("SELECT seen FROM presence WHERE room = ? AND member = ?", code, m.id);
    if (!seen) continue;
    const stamp = seen.seen || null;
    out.push({
      id: m.id,
      name: m.nickname,
      online: m.game,
      starfix: m.starfix,
      game: m.game,
      last_seen: stamp ? iso(stamp) : "",
      when: stamp ? iso(stamp) : "",
      code: m.code,
      location: m.location,
      system: m.system,
      ship: m.ship || null,
      gear: m.gear || [],
      server: m.server || "",
      travel: m.travel,
      card: m.card,
    });
  }
  return { players: out };
}

async function canDraw(con, code, me) {
  const room = await con.one("SELECT * FROM room WHERE code = ?", code);
  const ship = await con.one("SELECT status FROM membership WHERE room = ? AND member = ?", code, me.id);
  if (!room || !ship || ship.status !== "member") return false;
  if (room.route_mode === "members") return true;
  return room.captain === me.id;
}

function cleanPoints(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const p of raw.slice(0, 40)) {
    if (!p || typeof p !== "object") continue;
    const id = String(p.id || "").slice(0, 80);
    const name = String(p.n || "").slice(0, 80);
    const sy = String(p.sy || "").slice(0, 40);
    if (id && name) out.push({ id, n: name, sy });
  }
  return out;
}

function partsOf(pathname) {
  try { pathname = decodeURIComponent(pathname); } catch { /* keep the raw path */ }
  return pathname.split("/").filter(Boolean);
}

async function readJson(request) {
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(declared) && declared > 200000) return {};
  const text = await request.text();
  if (!text || text.length > 200000) return {};
  try {
    const data = JSON.parse(text);
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

function plain(body) {
  return body && typeof body === "object" && !Array.isArray(body) ? body : {};
}

export async function handle(request, env, url) {
  if (request.method === "OPTIONS") return json(request, 204, null);
  const parts = partsOf(url.pathname);
  const con = db(env.DB);
  if (request.method === "GET") return getApi(request, env, url, con, parts);
  if (request.method === "POST") return postApi(request, env, con, parts);
  if (request.method === "DELETE") return deleteApi(request, con, parts);
  return json(request, 405, { error: "method" });
}

async function getApi(request, env, url, con, parts) {
  if (parts.join("/") === "api/health") return json(request, 200, { ok: true });
  if (parts.join("/") === "api/rooms/public") return json(request, 200, { rooms: await publicRooms(con) });
  if (parts.join("/") === "api/invite") {
    const me = await bearerMember(con, request);
    if (!me) return json(request, 401, { error: "auth" });
    return json(request, 200, await inviteCard(url.searchParams.get("kind") || "", url.searchParams.get("contact") || ""));
  }
  const me = await bearerMember(con, request);
  if (!me) return json(request, 401, { error: "auth" });
  if (parts.join("/") === "api/plaza") {
    let after = Number(url.searchParams.get("after") || 0);
    if (!Number.isFinite(after) || after < 0) after = 0;
    return json(request, 200, await plazaView(con, me, after));
  }
  if (parts.length === 3 && parts[0] === "api" && parts[1] === "rooms") {
    const code = parts[2].toUpperCase();
    await touchMember(con, code, me.id);
    if (!(await settleRoom(con, code))) return json(request, 404, { error: "room" });
    const st = await roomState(con, code, me);
    if (!st) return json(request, 404, { error: "room" });
    if (st.error) return json(request, 403, st);
    return json(request, 200, st);
  }
  if (parts.length === 4 && parts[3] === "players") {
    const data = await playersJson(con, parts[2].toUpperCase(), me);
    if (!data) return json(request, 403, { error: "forbidden" });
    return json(request, 200, data);
  }
  return json(request, 404, { error: "not found" });
}

async function postApi(request, env, con, parts) {
  const body = plain(await readJson(request));
  let me = await bearerMember(con, request);
  if (parts.join("/") === "api/session") {
    const nick = cleanNick(body.nickname);
    if (!nick) return json(request, 400, { error: "nickname" });
    let token;
    let mid;
    if (me) {
      await con.run("UPDATE member SET nickname = ? WHERE id = ?", nick, me.id);
      token = me.token;
      mid = me.id;
    } else {
      token = tokenHex(24);
      mid = tokenHex(8);
      await con.run("INSERT INTO member (id, token, nickname, created) VALUES (?, ?, ?, ?)", mid, token, nick, now());
    }
    return json(request, 200, { token, id: mid, nickname: nick });
  }
  if (!me) return json(request, 401, { error: "auth" });
  if (parts.join("/") === "api/lobby") {
    await setLobby(con, me, body);
    return json(request, 200, await plazaView(con, me, 0));
  }
  if (parts.join("/") === "api/lobby/chat") {
    const [line, err] = await addChat(con, me, body);
    if (err) return json(request, err === "empty" ? 400 : 429, { error: err });
    return json(request, 200, { line });
  }
  if (parts.join("/") === "api/board") {
    const err = await addBoard(con, me, body);
    if (err) return json(request, err === "limit" ? 409 : 400, { error: err });
    return json(request, 200, await plazaView(con, me, 0));
  }
  if (parts.join("/") === "api/board/rsvp") {
    const err = await setBoardRsvp(con, me, body);
    if (err) return json(request, 400, { error: err });
    return json(request, 200, await plazaView(con, me, 0));
  }
  if (parts.join("/") === "api/rooms/lookup") {
    const raw = Array.isArray(body.codes) ? body.codes : [];
    const codes = [];
    const seen = new Set();
    for (const item of raw.slice(0, 90)) {
      const code = [...String(item || "").toUpperCase()].filter((ch) => /[A-Z0-9-]/.test(ch)).join("").slice(0, 12);
      if (code && !seen.has(code)) {
        seen.add(code);
        codes.push(code);
      }
    }
    const rooms = [];
    for (const code of codes) rooms.push(await roomBrief(con, code));
    return json(request, 200, { rooms });
  }
  if (parts.join("/") === "api/rooms/preview") {
    let code = cleanCode(body.code);
    const recover = cleanRecover(body.recover);
    if (body.refresh) {
      if (!(await pairOk(env, code, recover, body.sig))) return json(request, 400, { error: "code" });
      const rolled = await con.one("SELECT stamp FROM preview_roll WHERE member = ?", me.id);
      const left = rollLeft(rolled && rolled.stamp);
      if (left) return json(request, 429, { error: "cooldown", wait: left, what: "recover" });
      await con.run(
        "INSERT INTO preview_roll (member, stamp) VALUES (?, ?) ON CONFLICT(member) DO UPDATE SET stamp = excluded.stamp",
        me.id, now(),
      );
      return json(request, 200, await issuePair(con, env, code));
    }
    return json(request, 200, await issuePair(con, env, ""));
  }
  if (parts.join("/") === "api/rooms") {
    await releaseOtherRooms(con, me);
    let code = cleanCode(body.code);
    let recover = cleanRecover(body.recover);
    if (!(await pairOk(env, code, recover, body.sig)) || await con.one("SELECT 1 AS ok FROM room WHERE code = ?", code)) {
      code = await newCode(con);
      recover = newRecover();
    }
    const stamp = now();
    const rolledRow = await con.one("SELECT stamp FROM preview_roll WHERE member = ?", me.id);
    let rolled = Number(rolledRow?.stamp || 0);
    if (rollLeft(rolled) <= 0) rolled = 0;
    await con.run(
      "INSERT INTO room (code, captain, route_mode, created, recover, recover_at) VALUES (?, ?, ?, ?, ?, ?)",
      code, me.id, "captain", stamp, recover, rolled,
    );
    await con.run(
      "INSERT INTO membership (room, member, status, created, touched) VALUES (?, ?, ?, ?, ?)",
      code, me.id, "member", stamp, stamp,
    );
    return json(request, 200, await roomState(con, code, me));
  }
  if (parts.length === 4 && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "join") {
    const code = parts[2].toUpperCase();
    if (!(await settleRoom(con, code))) return json(request, 404, { error: "room" });
    const room = await con.one("SELECT * FROM room WHERE code = ?", code);
    if (!room) return json(request, 404, { error: "room" });
    await releaseOtherRooms(con, me, code);
    const existing = await con.one("SELECT status FROM membership WHERE room = ? AND member = ?", code, me.id);
    const status = joinStatus(room, me, existing);
    const stamp = now();
    await con.run(
      `INSERT INTO membership (room, member, status, created, touched) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(room, member) DO UPDATE SET status = excluded.status, touched = excluded.touched`,
      code, me.id, status, stamp, stamp,
    );
    return json(request, 200, await roomState(con, code, me));
  }
  if (parts.length === 5 && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "recover" && parts[4] === "roll") {
    const code = parts[2].toUpperCase();
    if (!(await settleRoom(con, code))) return json(request, 404, { error: "room" });
    const room = await con.one("SELECT * FROM room WHERE code = ?", code);
    const ship = await con.one("SELECT status FROM membership WHERE room = ? AND member = ?", code, me.id);
    if (!room || !ship || ship.status !== "member" || room.captain !== me.id) return json(request, 403, { error: "forbidden" });
    const left = rollLeft(room.recover_at);
    if (left) return json(request, 429, { error: "cooldown", wait: left, what: "recover" });
    await con.run("UPDATE room SET recover = ?, recover_at = ? WHERE code = ?", newRecover(), now(), code);
    return json(request, 200, await roomState(con, code, me));
  }
  if (parts.length === 4 && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "recover") {
    const code = parts[2].toUpperCase();
    if (!(await settleRoom(con, code))) return json(request, 404, { error: "room" });
    const room = await con.one("SELECT * FROM room WHERE code = ?", code);
    if (!room) return json(request, 404, { error: "room" });
    const secret = cleanRecover(body.recover);
    const stored = room.recover || "";
    if (!secret || !stored || secret.length !== stored.length || !safeEqual(secret, stored)) {
      return json(request, 403, { error: "recover" });
    }
    if (room.captain !== me.id) {
      await releaseOtherRooms(con, me, code);
      const oldId = room.captain;
      const old = await con.one(
        "SELECT touched FROM membership WHERE room = ? AND member = ? AND status = 'member'",
        code, oldId,
      );
      const stamp = now();
      await con.run(
        `INSERT INTO membership (room, member, status, created, touched) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(room, member) DO UPDATE SET status = 'member', touched = excluded.touched`,
        code, me.id, "member", stamp, stamp,
      );
      await con.run("UPDATE room SET captain = ? WHERE code = ?", me.id, code);
      if (old && oldId !== me.id) {
        const idleFor = now() - Number(old.touched || 0);
        if (idleFor > POLL_LIVE_S) await dropMember(con, code, oldId);
      }
    }
    return json(request, 200, await roomState(con, code, me));
  }
  if (parts.length === 6 && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "members") {
    const code = parts[2].toUpperCase();
    const mid = parts[4];
    const action = parts[5];
    const room = await con.one("SELECT * FROM room WHERE code = ?", code);
    if (!room || room.captain !== me.id) return json(request, 403, { error: "captain" });
    if (action === "kick") {
      if (mid === me.id) return json(request, 400, { error: "member" });
      const row = await con.one("SELECT member FROM membership WHERE room = ? AND member = ? AND status = 'member'", code, mid);
      if (!row) return json(request, 404, { error: "member" });
      await dropMember(con, code, mid);
      return json(request, 200, await roomState(con, code, me));
    }
    if (action !== "approve" && action !== "reject") return json(request, 400, { error: "action" });
    const status = action === "approve" ? "member" : "rejected";
    const cur = await con.run(
      "UPDATE membership SET status = ? WHERE room = ? AND member = ? AND member != ?",
      status, code, mid, me.id,
    );
    if (cur.rowcount === 0) return json(request, 404, { error: "member" });
    return json(request, 200, await roomState(con, code, me));
  }
  if (parts.length === 4 && ["leave", "captain", "dissolve"].includes(parts[3])) {
    const code = parts[2].toUpperCase();
    const room = await con.one("SELECT * FROM room WHERE code = ?", code);
    const ship = await con.one("SELECT status FROM membership WHERE room = ? AND member = ?", code, me.id);
    if (!room || !ship || ship.status === "rejected") return json(request, 404, { error: "room" });
    const kind = parts[3];
    if (kind === "dissolve") {
      if (room.captain !== me.id) return json(request, 403, { error: "captain" });
      await wipeRoom(con, code);
      return json(request, 200, { dissolved: true });
    }
    if (kind === "captain") {
      if (room.captain !== me.id || ship.status !== "member") return json(request, 403, { error: "captain" });
      const target = String(body.member || "");
      const row = await con.one(
        "SELECT member FROM membership WHERE room = ? AND member = ? AND status = 'member' AND member != ?",
        code, target, me.id,
      );
      if (!row) return json(request, 404, { error: "member" });
      await con.run("UPDATE room SET captain = ? WHERE code = ?", target, code);
      return json(request, 200, await roomState(con, code, me));
    }
    if (ship.status !== "member") {
      await dropMember(con, code, me.id);
      return json(request, 200, { left: true });
    }
    if (room.captain !== me.id) {
      const gone = await dropMember(con, code, me.id);
      return json(request, 200, { left: true, dissolved: gone });
    }
    if (body.dissolve) {
      await wipeRoom(con, code);
      return json(request, 200, { dissolved: true });
    }
    const target = String(body.transfer || "");
    if (target) {
      const row = await con.one(
        "SELECT member FROM membership WHERE room = ? AND member = ? AND status = 'member' AND member != ?",
        code, target, me.id,
      );
      if (!row) return json(request, 404, { error: "member" });
      await con.run("UPDATE room SET captain = ? WHERE code = ?", target, code);
      await dropMember(con, code, me.id);
      return json(request, 200, { left: true });
    }
    const others = await con.one(
      "SELECT member FROM membership WHERE room = ? AND status = 'member' AND member != ?",
      code, me.id,
    );
    return json(request, 409, { error: others ? "handoff" : "solo" });
  }
  if (parts.length === 4 && parts[3] === "open") {
    const code = parts[2].toUpperCase();
    const room = await con.one("SELECT * FROM room WHERE code = ?", code);
    if (!room || room.captain !== me.id) return json(request, 403, { error: "captain" });
    const want = wantOpen(body.open);
    if (want === null) return json(request, 400, { error: "open" });
    const blocked = await setRoomOpen(con, room, want);
    if (blocked) return json(request, 429, blocked);
    return json(request, 200, await roomState(con, code, me));
  }
  if (parts.length === 4 && parts[3] === "settings") {
    const code = parts[2].toUpperCase();
    const room = await con.one("SELECT * FROM room WHERE code = ?", code);
    if (!room || room.captain !== me.id) return json(request, 403, { error: "captain" });
    if (body.routeMode !== "captain" && body.routeMode !== "members") return json(request, 400, { error: "mode" });
    await con.run("UPDATE room SET route_mode = ? WHERE code = ?", body.routeMode, code);
    return json(request, 200, await roomState(con, code, me));
  }
  if (parts.length === 4 && parts[3] === "broadcast") {
    const code = parts[2].toUpperCase();
    const room = await con.one("SELECT * FROM room WHERE code = ?", code);
    const ship = await con.one("SELECT status FROM membership WHERE room = ? AND member = ?", code, me.id);
    if (!room || !ship || ship.status !== "member" || room.captain !== me.id) return json(request, 403, { error: "captain" });
    const text = cleanCast(body.body);
    if (!text) return json(request, 400, { error: "empty" });
    const bid = tokenHex(8);
    await con.run("INSERT INTO broadcast (id, room, author, body, created) VALUES (?, ?, ?, ?, ?)", bid, code, me.id, text, now());
    await con.run("DELETE FROM broadcast WHERE room = ? AND id != ?", code, bid);
    return json(request, 200, await roomState(con, code, me));
  }
  if (parts.length === 4 && parts[3] === "rally") {
    const code = parts[2].toUpperCase();
    const room = await con.one("SELECT * FROM room WHERE code = ?", code);
    const ship = await con.one("SELECT status FROM membership WHERE room = ? AND member = ?", code, me.id);
    if (!room || !ship || ship.status !== "member" || room.captain !== me.id) return json(request, 403, { error: "captain" });
    if (body.clear) {
      await con.run("DELETE FROM rally_rsvp WHERE room = ?", code);
      await con.run("DELETE FROM rally WHERE room = ?", code);
      return json(request, 200, await roomState(con, code, me));
    }
    const place = cleanLabel(body.place, 80);
    const name = cleanLabel(body.name, 80);
    let system = cleanLabel(body.system, 24) || "";
    const at = cleanWhen(body.at);
    if (!place || !name || at === null) return json(request, 400, { error: "rally" });
    if (!["", "stanton", "pyro", "nyx"].includes(system.toLowerCase())) system = "";
    const rid = tokenHex(8);
    await con.run("DELETE FROM rally_rsvp WHERE room = ?", code);
    await con.run("DELETE FROM rally WHERE room = ?", code);
    await con.run(
      "INSERT INTO rally (room, id, place, name, system, at, created) VALUES (?, ?, ?, ?, ?, ?, ?)",
      code, rid, place, name, system.toLowerCase(), at, now(),
    );
    return json(request, 200, await roomState(con, code, me));
  }
  if (parts.length === 5 && parts[3] === "rally" && parts[4] === "rsvp") {
    const code = parts[2].toUpperCase();
    const room = await con.one("SELECT * FROM room WHERE code = ?", code);
    const ship = await con.one("SELECT status FROM membership WHERE room = ? AND member = ?", code, me.id);
    const row = await con.one("SELECT id FROM rally WHERE room = ?", code);
    if (!room || !ship || ship.status !== "member" || !row) return json(request, 403, { error: "forbidden" });
    if (![true, false, 0, 1].includes(body.going)) return json(request, 400, { error: "going" });
    await con.run(
      `INSERT INTO rally_rsvp (room, rally, member, going) VALUES (?, ?, ?, ?)
       ON CONFLICT(room, member) DO UPDATE SET rally = excluded.rally, going = excluded.going`,
      code, row.id, me.id, body.going ? 1 : 0,
    );
    return json(request, 200, await roomState(con, code, me));
  }
  if (parts.length === 4 && parts[3] === "presence") {
    const code = parts[2].toUpperCase();
    const st = await roomState(con, code, me);
    if (!st || st.error || st.status !== "member") return json(request, 403, { error: "forbidden" });
    if (!(await savePresence(con, code, me.id, body))) return json(request, 400, { error: "location" });
    return json(request, 200, { ok: true });
  }
  if (parts.length === 4 && parts[3] === "routes") {
    const code = parts[2].toUpperCase();
    if (!(await canDraw(con, code, me))) return json(request, 403, { error: "route" });
    const pts = cleanPoints(body.points);
    if (pts.length < 2) return json(request, 400, { error: "points" });
    const rid = tokenHex(8);
    const stamp = now();
    await con.run(
      "INSERT INTO route (id, room, author, title, note, points, published, created, updated) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)",
      rid, code, me.id, String(body.title || "").slice(0, 40), String(body.note || "").slice(0, 500), JSON.stringify(pts), stamp, stamp,
    );
    return json(request, 200, await roomState(con, code, me));
  }
  if (parts.length === 6 && parts[3] === "routes" && parts[5] === "comments") {
    const code = parts[2].toUpperCase();
    const rid = parts[4];
    const st = await roomState(con, code, me);
    if (!st || st.status !== "member") return json(request, 403, { error: "forbidden" });
    const text = [...String(body.body || "")].filter((ch) => ch >= " ").join("").trim();
    if (!text || text.length > 300) return json(request, 400, { error: "body" });
    const rt = await con.one("SELECT id FROM route WHERE id = ? AND room = ? AND published = 1", rid, code);
    if (!rt) return json(request, 404, { error: "route" });
    await con.run(
      "INSERT INTO comment (id, route, author, body, created) VALUES (?, ?, ?, ?, ?)",
      tokenHex(8), rid, me.id, text, now(),
    );
    return json(request, 200, await roomState(con, code, me));
  }
  return json(request, 404, { error: "not found" });
}

async function deleteApi(request, con, parts) {
  if (!(parts.length === 5 && parts[0] === "api" && parts[1] === "rooms" && parts[3] === "routes")) {
    return json(request, 404, { error: "not found" });
  }
  const code = parts[2].toUpperCase();
  const rid = parts[4];
  const me = await bearerMember(con, request);
  if (!me) return json(request, 401, { error: "auth" });
  const room = await con.one("SELECT * FROM room WHERE code = ?", code);
  const rt = await con.one("SELECT * FROM route WHERE id = ? AND room = ?", rid, code);
  if (!room || !rt) return json(request, 404, { error: "route" });
  if (rt.author !== me.id && room.captain !== me.id) return json(request, 403, { error: "forbidden" });
  await con.run("DELETE FROM comment WHERE route = ?", rid);
  await con.run("DELETE FROM route WHERE id = ?", rid);
  return json(request, 200, await roomState(con, code, me));
}
