-- Room database for the Cloudflare Worker. Matches server/room_server.py,
-- plus preview_roll so the 30s code refresh survives a new isolate.

CREATE TABLE IF NOT EXISTS member (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  created REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS room (
  code TEXT PRIMARY KEY,
  captain TEXT NOT NULL,
  route_mode TEXT NOT NULL DEFAULT 'captain',
  created REAL NOT NULL,
  open INTEGER NOT NULL DEFAULT 0,
  open_at REAL NOT NULL DEFAULT 0,
  recover TEXT,
  recover_at REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS membership (
  room TEXT NOT NULL,
  member TEXT NOT NULL,
  status TEXT NOT NULL,
  created REAL NOT NULL,
  touched REAL,
  PRIMARY KEY (room, member)
);
CREATE TABLE IF NOT EXISTS presence (
  room TEXT NOT NULL,
  member TEXT NOT NULL,
  location TEXT,
  system TEXT,
  code TEXT,
  seen REAL NOT NULL,
  ship TEXT,
  gear TEXT,
  host TEXT,
  travel TEXT,
  card TEXT,
  starfix_seen REAL,
  game_seen REAL,
  PRIMARY KEY (room, member)
);
CREATE TABLE IF NOT EXISTS route (
  id TEXT PRIMARY KEY,
  room TEXT NOT NULL,
  author TEXT NOT NULL,
  title TEXT,
  note TEXT,
  points TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1,
  created REAL NOT NULL,
  updated REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS comment (
  id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS broadcast (
  id TEXT PRIMARY KEY,
  room TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS rally (
  room TEXT PRIMARY KEY,
  id TEXT NOT NULL,
  place TEXT NOT NULL,
  name TEXT NOT NULL,
  system TEXT,
  at REAL NOT NULL,
  created REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS rally_rsvp (
  room TEXT NOT NULL,
  rally TEXT NOT NULL,
  member TEXT NOT NULL,
  going INTEGER NOT NULL,
  PRIMARY KEY (room, member)
);
CREATE TABLE IF NOT EXISTS lobby (
  member TEXT PRIMARY KEY,
  visible INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  system TEXT,
  code TEXT,
  ship TEXT,
  host TEXT,
  seen REAL,
  starfix_seen REAL,
  game_seen REAL
);
CREATE TABLE IF NOT EXISTS lobby_chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member TEXT NOT NULL,
  body TEXT NOT NULL,
  created REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS board (
  id TEXT PRIMARY KEY,
  member TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  ship TEXT,
  place TEXT,
  name TEXT,
  system TEXT,
  at REAL,
  seats TEXT,
  standing INTEGER NOT NULL DEFAULT 0,
  host TEXT,
  mission TEXT,
  speech TEXT,
  contact_kind TEXT,
  contact TEXT,
  created REAL NOT NULL,
  expires REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS board_rsvp (
  board TEXT NOT NULL,
  member TEXT NOT NULL,
  going INTEGER NOT NULL,
  note TEXT,
  PRIMARY KEY (board, member)
);
CREATE TABLE IF NOT EXISTS preview_roll (
  member TEXT PRIMARY KEY,
  stamp REAL NOT NULL
);
