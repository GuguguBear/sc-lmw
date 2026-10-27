# Native window for the place watcher. No system title bar, no browser.

import sys
import tkinter as tk
from pathlib import Path
from tkinter import filedialog

THEMES = {
    "classic": {
        "bg": "#070a12", "panel": "#101829", "ink": "#eef2fb", "muted": "#94a2c2",
        "line": "#3d5a80", "accent": "#37e1ff", "err": "#ff6b8a", "on": "#04131b",
    },
    "compact": {
        "bg": "#0c0e12", "panel": "#161b22", "ink": "#e8eaef", "muted": "#b7c0ce",
        "line": "#5c6778", "accent": "#e8eaef", "err": "#e07a86", "on": "#0c0e12",
    },
    "practical": {
        "bg": "#0a0a09", "panel": "#121110", "ink": "#c8c4bc", "muted": "#8a8680",
        "line": "#8a8680", "accent": "#d8d4c8", "err": "#c87070", "on": "#0a0a09",
    },
    "chassis": {
        "bg": "#080604", "panel": "#100c06", "ink": "#ffb000", "muted": "#c48a20",
        "line": "#ffb000", "accent": "#ffb000", "err": "#ff5544", "on": "#080604",
    },
    "scifi": {
        "bg": "#000808", "panel": "#041210", "ink": "#00e5cc", "muted": "#14988c",
        "line": "#00e5cc", "accent": "#00e5cc", "err": "#ff6688", "on": "#000808",
    },
}
THEME_NAMES = (
    ("classic", "经典"),
    ("compact", "紧凑"),
    ("practical", "实用"),
    ("chassis", "机壳"),
    ("scifi", "科幻"),
)
FONT = ("Microsoft YaHei UI", 9)
FONT_PLACE = ("Microsoft YaHei UI", 9)
LANGS = (
    ("zh-Hans", "简体中文"),
    ("zh-Hant", "繁體中文"),
    ("en", "English"),
    ("de", "Deutsch"),
)
TEXT = {
    "zh-Hans": {
        "title": "Starfix",
        "lead": "读取 Game.log，换区后把地点发到房间。",
        "tos": "不进游戏进程，不读内存，不改游戏文件。",
        "terms_title": "使用条款",
        "terms_yes": "同意并继续",
        "terms_no": "不同意",
        "terms_body": "本软件是非官方粉丝工具。它与 Cloud Imperium Games（CIG）、Roberts Space Industries（RSI）及其关联方没有关系，未获其认可、赞助、授权或同意。\n\nCIG 与 RSI 从未以任何形式同意、授权或许可本软件读取游戏客户端日志文件。\n\n本软件按现状提供，没有任何保证。开发者、贡献者、分发者以及本软件本身，不保证它适合任何用途，不保证它安全、不中断、无错误，也不保证使用它不会影响你的游戏账号、电脑或数据。\n\n你自愿使用本软件，并自行承担由此产生的一切风险和后果。这些后果包括但不限于账号警告、限制、封禁、游戏进度或物品损失、数据丢失、设备故障，以及任何直接、间接、附带、特殊或后续的损失。\n\n对你使用、无法使用或停止使用本软件所造成的任何形式的后果，开发者、贡献者、分发者和本软件本身均不负责，也不承担任何赔偿或法律责任。你与 CIG、RSI 之间的协议、处罚、纠纷和争议，与本软件的开发者、贡献者和分发者无关。\n\n选择「同意并继续」，表示你已阅读、理解并接受以上全部内容。选择「不同意」或关闭本窗口，软件立即退出，不会继续运行。",
        "linked_off": "还没连上房间。在星图点「连到这台电脑」，回到这里点确认。",
        "linked_on": "已连上房间 {room}",
        "pair": "星图要连上房间 {room}。确认后，这台电脑会把地点发过去。",
        "pair_yes": "确认连接", "pair_no": "取消",
        "log": "GAME.LOG", "browse": "浏览",
        "api": "星图地址", "room": "房间码", "token": "房间令牌",
        "lang": "语言", "look": "外观",
        "theme.classic": "经典", "theme.compact": "紧凑", "theme.practical": "实用", "theme.chassis": "机壳", "theme.scifi": "科幻",
        "watch": "开始监视", "watch_stop": "停止监视", "scan": "读最近地点",
        "place_none": "还没有地点", "quit": "退出",
        "file_title": "选择 Game.log", "file_log": "日志", "file_all": "全部",
        "log_ok": "日志在", "log_missing": "找不到日志",
        "sent": "已发送 {code}", "seen": "日志里看到 {code}", "parsed": "解析到 {code}",
        "watching": "正在监视", "send_failed": "发送失败", "no_place": "最近日志里没有地点", "idle": "没有监视",
        "err_need_link": "先在星图里点「连到这台电脑」，再回到这里确认",
        "err_nolog": "找不到这份日志", "err_room": "房间码不对", "err_token": "令牌不对",
        "err_addr": "地址不对", "err_nopair": "没有待确认的连接", "err_http": "房间服务返回",
    },
    "zh-Hant": {
        "title": "Starfix",
        "lead": "讀取 Game.log，換區後把地點發到房間。",
        "tos": "不進遊戲行程，不讀記憶體，不改遊戲檔案。",
        "terms_title": "使用條款",
        "terms_yes": "同意並繼續",
        "terms_no": "不同意",
        "terms_body": "本軟體是非官方粉絲工具。它與 Cloud Imperium Games（CIG）、Roberts Space Industries（RSI）及其關聯方沒有關係，未獲其認可、贊助、授權或同意。\n\nCIG 與 RSI 從未以任何形式同意、授權或許可本軟體讀取遊戲客戶端日誌檔案。\n\n本軟體按現狀提供，沒有任何保證。開發者、貢獻者、散布者以及本軟體本身，不保證它適合任何用途，不保證它安全、不中斷、無錯誤，也不保證使用它不會影響你的遊戲帳號、電腦或資料。\n\n你自願使用本軟體，並自行承擔由此產生的一切風險和後果。這些後果包括但不限於帳號警告、限制、封鎖、遊戲進度或物品損失、資料遺失、裝置故障，以及任何直接、間接、附帶、特殊或後續的損失。\n\n對你使用、無法使用或停止使用本軟體所造成的任何形式的後果，開發者、貢獻者、散布者和本軟體本身均不負責，也不承擔任何賠償或法律責任。你與 CIG、RSI 之間的協議、處罰、糾紛和爭議，與本軟體的開發者、貢獻者和散布者無關。\n\n選擇「同意並繼續」，表示你已閱讀、理解並接受以上全部內容。選擇「不同意」或關閉本視窗，軟體立即退出，不會繼續執行。",
        "linked_off": "還沒連上房間。在星圖點「連到這台電腦」，回到這裡點確認。",
        "linked_on": "已連上房間 {room}",
        "pair": "星圖要連上房間 {room}。確認後，這台電腦會把地點發過去。",
        "pair_yes": "確認連接", "pair_no": "取消",
        "log": "GAME.LOG", "browse": "瀏覽",
        "api": "星圖地址", "room": "房間碼", "token": "房間令牌",
        "lang": "語言", "look": "外觀",
        "theme.classic": "經典", "theme.compact": "緊湊", "theme.practical": "實用", "theme.chassis": "機殼", "theme.scifi": "科幻",
        "watch": "開始監視", "watch_stop": "停止監視", "scan": "讀最近地點",
        "place_none": "還沒有地點", "quit": "退出",
        "file_title": "選擇 Game.log", "file_log": "日誌", "file_all": "全部",
        "log_ok": "日誌在", "log_missing": "找不到日誌",
        "sent": "已發送 {code}", "seen": "日誌裡看到 {code}", "parsed": "解析到 {code}",
        "watching": "正在監視", "send_failed": "發送失敗", "no_place": "最近日誌裡沒有地點", "idle": "沒有監視",
        "err_need_link": "先在星圖裡點「連到這台電腦」，再回到這裡確認",
        "err_nolog": "找不到這份日誌", "err_room": "房間碼不對", "err_token": "令牌不對",
        "err_addr": "地址不對", "err_nopair": "沒有待確認的連接", "err_http": "房間服務返回",
    },
    "en": {
        "title": "Starfix",
        "lead": "Reads Game.log and sends the place after a zone change.",
        "tos": "It does not enter the game, read memory, or change game files.",
        "terms_title": "Terms of use",
        "terms_yes": "Agree and continue",
        "terms_no": "Do not agree",
        "terms_body": "This software is an unofficial fan tool. It has no relationship with Cloud Imperium Games (CIG), Roberts Space Industries (RSI), or their affiliates. It is not approved, sponsored, authorized, or endorsed by them.\n\nCIG and RSI have never agreed to, authorized, or permitted this software to read the game client log file, in any form.\n\nThe software is provided as is, with no warranty of any kind. The developers, contributors, distributors, and the software itself do not warrant that it is fit for any purpose, that it is safe, uninterrupted, or error-free, or that using it will not affect your game account, computer, or data.\n\nYou use this software voluntarily and you accept every risk and consequence. That includes, without limitation, account warnings, limits, bans, loss of progress or items, loss of data, device failure, and any direct, indirect, incidental, special, or consequential loss.\n\nThe developers, contributors, distributors, and the software itself are not responsible for any consequence of using, being unable to use, or stopping this software, and they accept no damages or legal liability. Any agreement, penalty, dispute, or claim between you and CIG or RSI is not a matter for the developers, contributors, or distributors of this software.\n\nChoose “Agree and continue” only if you have read, understood, and accepted all of the above. Choose “Do not agree,” or close this window, and the software exits at once.",
        "linked_off": "Not connected. On the map, choose Connect this computer, then confirm here.",
        "linked_on": "Connected to {room}",
        "pair": "The map wants to connect room {room}. After you confirm, this computer sends places there.",
        "pair_yes": "Confirm", "pair_no": "Cancel",
        "log": "GAME.LOG", "browse": "Browse",
        "api": "Map address", "room": "Room code", "token": "Room token",
        "lang": "Language", "look": "Appearance",
        "theme.classic": "Classic", "theme.compact": "Compact", "theme.practical": "Practical", "theme.chassis": "Chassis", "theme.scifi": "Sci-fi",
        "watch": "Start watch", "watch_stop": "Stop watch", "scan": "Latest place",
        "place_none": "No place yet", "quit": "Quit",
        "file_title": "Choose Game.log", "file_log": "Log", "file_all": "All",
        "log_ok": "log found", "log_missing": "log missing",
        "sent": "Sent {code}", "seen": "Log shows {code}", "parsed": "Parsed {code}",
        "watching": "Watching", "send_failed": "Send failed", "no_place": "No place in the recent log", "idle": "Not watching",
        "err_need_link": "On the map, choose Connect this computer, then confirm here",
        "err_nolog": "Cannot find this log", "err_room": "Room code is not valid", "err_token": "Token is not valid",
        "err_addr": "Address is not valid", "err_nopair": "Nothing is waiting to confirm", "err_http": "Room service returned",
    },
    "de": {
        "title": "Starfix",
        "lead": "Liest Game.log und sendet den Ort nach einem Zonenwechsel.",
        "tos": "Kein Eingriff ins Spiel, kein Speicherlesen, keine Spieldateien ändern.",
        "terms_title": "Nutzungsbedingungen",
        "terms_yes": "Zustimmen und weiter",
        "terms_no": "Nicht zustimmen",
        "terms_body": "Diese Software ist ein inoffizielles Fan-Werkzeug. Sie steht in keiner Beziehung zu Cloud Imperium Games (CIG), Roberts Space Industries (RSI) oder deren verbundenen Unternehmen. Sie ist von ihnen nicht gebilligt, gesponsert, erlaubt oder unterstützt.\n\nCIG und RSI haben niemals in irgendeiner Form zugestimmt, genehmigt oder erlaubt, dass diese Software die Logdatei des Spielclients liest.\n\nDie Software wird ohne jede Gewähr bereitgestellt. Die Entwickler, Mitwirkenden, Verbreiter und die Software selbst garantieren nicht, dass sie für einen Zweck geeignet, sicher, ununterbrochen oder fehlerfrei ist, und auch nicht, dass ihre Nutzung dein Spielkonto, deinen Computer oder deine Daten unberührt lässt.\n\nDu nutzt die Software freiwillig und trägst jedes Risiko und jede Folge selbst. Dazu gehören unter anderem Kontowarnungen, Einschränkungen, Sperren, Verlust von Fortschritt oder Gegenständen, Datenverlust, Gerätefehler und jeder unmittelbare, mittelbare, begleitende, besondere oder Folgeschaden.\n\nDie Entwickler, Mitwirkenden, Verbreiter und die Software selbst haften nicht für irgendeine Folge daraus, dass du die Software nutzt, nicht nutzen kannst oder nicht mehr nutzt, und sie schulden keinen Schadenersatz. Verträge, Strafen, Streit und Ansprüche zwischen dir und CIG oder RSI gehen die Entwickler, Mitwirkenden und Verbreiter dieser Software nichts an.\n\n„Zustimmen und weiter“ heißt, dass du alles gelesen, verstanden und akzeptiert hast. „Nicht zustimmen“ oder das Fenster schließen beendet die Software sofort.",
        "linked_off": "Noch kein Raum. In der Karte „Diesen Computer verbinden“, dann hier bestätigen.",
        "linked_on": "Verbunden mit {room}",
        "pair": "Die Karte will Raum {room} verbinden. Danach sendet dieser Computer die Orte dorthin.",
        "pair_yes": "Bestätigen", "pair_no": "Abbrechen",
        "log": "GAME.LOG", "browse": "Suchen",
        "api": "Kartenadresse", "room": "Raumcode", "token": "Raumtoken",
        "lang": "Sprache", "look": "Aussehen",
        "theme.classic": "Klassisch", "theme.compact": "Kompakt", "theme.practical": "Praktisch", "theme.chassis": "Gehäuse", "theme.scifi": "Science-Fiction",
        "watch": "Überwachen", "watch_stop": "Stoppen", "scan": "Letzten Ort",
        "place_none": "Noch kein Ort", "quit": "Beenden",
        "file_title": "Game.log wählen", "file_log": "Log", "file_all": "Alle",
        "log_ok": "Log da", "log_missing": "Log fehlt",
        "sent": "Gesendet {code}", "seen": "Log zeigt {code}", "parsed": "Gelesen {code}",
        "watching": "Überwacht", "send_failed": "Senden fehlgeschlagen", "no_place": "Kein Ort im letzten Log", "idle": "Keine Überwachung",
        "err_need_link": "In der Karte „Diesen Computer verbinden“, dann hier bestätigen",
        "err_nolog": "Dieses Log wurde nicht gefunden", "err_room": "Raumcode ungültig", "err_token": "Token ungültig",
        "err_addr": "Adresse ungültig", "err_nopair": "Nichts wartet auf Bestätigung", "err_http": "Raumdienst antwortete",
    },
}
ERR_MAP = {
    "先在星图里点「连到这台电脑」，再回到这里确认": "err_need_link",
    "找不到这份日志": "err_nolog",
    "房间码不对": "err_room",
    "令牌不对": "err_token",
    "地址不对": "err_addr",
    "没有待确认的连接": "err_nopair",
}


def canon_lang(raw):
    if not raw:
        return None
    x = str(raw).strip().lower().replace("_", "-")
    if x in ("zh-hans", "zh-cn", "zh-sg") or x.startswith("zh-hans") or x.startswith("zh-cn"):
        return "zh-Hans"
    if x in ("zh-hant", "zh-tw", "zh-hk", "zh-mo") or x.startswith("zh-hant") or x.startswith("zh-tw") or x.startswith("zh-hk"):
        return "zh-Hant"
    if x == "zh" or x.startswith("zh-"):
        return "zh-Hans"
    if x == "de" or x.startswith("de-"):
        return "de"
    if x == "en" or x.startswith("en-"):
        return "en"
    return None


def windows_lang():
    try:
        import ctypes
        buf = ctypes.create_unicode_buffer(85)
        if ctypes.windll.kernel32.GetUserDefaultLocaleName(buf, 85):
            found = canon_lang(buf.value)
            if found:
                return found
    except (AttributeError, OSError):
        pass
    return "en"


def tr(lang, key, **vars):
    pack = TEXT.get(lang) or TEXT["en"]
    text = pack.get(key)
    if text is None:
        text = TEXT["en"].get(key, key)
    if vars:
        text = text.format(**vars)
    return text


def _asset(name):
    here = Path(__file__).resolve().parent
    frozen = Path(getattr(sys, "_MEIPASS", here))
    for base in (frozen, here):
        path = base / name
        if path.is_file():
            return path
    return None


def _dpi():
    try:
        import ctypes
        ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except (AttributeError, OSError):
        try:
            import ctypes
            ctypes.windll.user32.SetProcessDPIAware()
        except (AttributeError, OSError):
            pass


def _status_text(state, lang):
    raw = state.get("status") or ""
    log = tr(lang, "log_ok" if state.get("logExists") else "log_missing")
    if raw.startswith("sent "):
        head = tr(lang, "sent", code=raw[5:])
    elif raw.startswith("seen "):
        head = tr(lang, "seen", code=raw[5:])
    elif raw.startswith("parsed "):
        head = tr(lang, "parsed", code=raw[7:])
    elif raw == "send failed":
        head = tr(lang, "send_failed")
    elif raw == "no place in the recent log":
        head = tr(lang, "no_place")
    elif raw == "watching" or state.get("running"):
        head = tr(lang, "watching")
    else:
        head = tr(lang, "idle")
    return head + "  ·  " + log


class Desktop:
    def __init__(self, core):
        self.core = core
        saved = core.CFG.get("theme")
        self.theme = saved if saved in THEMES else "scifi"
        self.lang = canon_lang(core.CFG.get("lang")) or windows_lang()
        if core.CFG.get("lang") != self.lang:
            core.CFG["lang"] = self.lang
            core.save_config(core.CFG)
        self.buttons = []
        self.chrome = []
        self._drag = None
        self._geom = None
        self._zoomed = False
        self._ready = False
        self._phase = 0
        self._linked = False
        self._link_flash = 0
        self._icon_img = None
        _dpi()
        self.root = tk.Tk()
        self.root.title(tr(self.lang, "title"))
        ico = _asset("icon.ico")
        if ico:
            try:
                self.root.iconbitmap(str(ico))
            except tk.TclError:
                pass
        self.root.overrideredirect(True)
        self.root.configure(bg=THEMES[self.theme]["accent"])
        self.core.RAISE = lambda: self.root.after(0, self._raise)

        shell = tk.Frame(self.root, padx=1, pady=1)
        shell.pack(fill="both", expand=True)
        self.shell = shell

        bar = tk.Frame(shell, height=36)
        bar.pack(fill="x")
        bar.pack_propagate(False)
        self.titlebar = bar
        self.mark = tk.Label(bar, text="◆", font=FONT, padx=8)
        png = _asset("icon.png")
        if png:
            try:
                raw = tk.PhotoImage(file=str(png))
                dpi = 96
                try:
                    import ctypes
                    dpi = int(ctypes.windll.user32.GetDpiForSystem()) or 96
                except (AttributeError, OSError, ValueError):
                    dpi = 96
                target = max(16, int(round(16 * dpi / 96)))
                factor = max(1, int(raw.width() / target))
                self._icon_img = raw.subsample(factor, factor)
                self.mark.configure(image=self._icon_img, text="")
            except tk.TclError:
                pass
        self.mark.pack(side="left")
        self.bar_title = tk.Label(bar, text=tr(self.lang, "title"), font=FONT)
        self.bar_title.pack(side="left")
        self.bar_sub = tk.Label(bar, text="  SC LMW", font=FONT)
        self.bar_sub.pack(side="left")
        self.btn_close = self._chrome_btn(bar, "×", self.close, "close")
        self.btn_close.pack(side="right", fill="y")
        self.btn_max = self._chrome_btn(bar, "□", self._toggle_zoom, "max")
        self.btn_max.pack(side="right", fill="y")
        self.btn_min = self._chrome_btn(bar, "—", self._minimize, "min")
        self.btn_min.pack(side="right", fill="y")
        for widget in (bar, self.mark, self.bar_title, self.bar_sub):
            widget.bind("<ButtonPress-1>", self._drag_start)
            widget.bind("<B1-Motion>", self._drag_move)
            widget.bind("<Double-Button-1>", lambda _e: self._toggle_zoom())

        self.rule = tk.Canvas(shell, height=3, highlightthickness=0, bd=0)
        self.rule.pack(fill="x")

        card = tk.Frame(shell, padx=12, pady=8)
        card.pack(fill="both", expand=True)
        self.card = card

        self.lead = tk.Label(card, text="读取 Game.log，换区后把地点发到房间。", font=FONT, anchor="w")
        self.lead.pack(fill="x")
        self.tos = tk.Label(card, text="不进游戏进程，不读内存，不改游戏文件。", font=FONT, anchor="w")
        self.tos.pack(fill="x", pady=(2, 0))
        self.linked = tk.Label(card, text="", font=FONT, anchor="w", justify="left", wraplength=490)
        self.linked.pack(fill="x", pady=(8, 0))

        self.pair = tk.Frame(card, padx=8, pady=8, highlightthickness=1)
        self.pair_text = tk.Label(self.pair, text="", font=FONT, anchor="w", justify="left", wraplength=470)
        self.pair_text.pack(fill="x")
        pair_row = tk.Frame(self.pair)
        pair_row.pack(fill="x", pady=(6, 0))
        self.pair_row = pair_row
        self.pair_yes = self._button(pair_row, "确认连接", self._accept, primary=True)
        self.pair_yes.pack(side="left")
        self.pair_no = self._button(pair_row, "取消", self._decline)
        self.pair_no.pack(side="left", padx=(6, 0))

        self.log_label = tk.Label(card, text="GAME.LOG", font=FONT, anchor="w")
        self.log_label.pack(fill="x", pady=(8, 2))
        log_row = tk.Frame(card)
        log_row.pack(fill="x")
        self.log_row = log_row
        self.log = tk.Entry(log_row, font=FONT, relief="flat", highlightthickness=1, borderwidth=0)
        self.log.pack(side="left", fill="x", expand=True, ipady=4)
        self.browse = self._button(log_row, "浏览", self._browse)
        self.browse.pack(side="left", padx=(6, 0))

        self.manual = tk.Frame(card)
        self.api_label, self.api = self._field(self.manual, "星图地址")
        self.room_label, self.room = self._field(self.manual, "房间码")
        self.manual.pack(fill="x", pady=(8, 0))

        self.lang_label = tk.Label(card, text="", font=FONT, anchor="w")
        self.lang_label.pack(fill="x", pady=(8, 4))
        lang_row = tk.Frame(card)
        lang_row.pack(fill="x")
        self.lang_row = lang_row
        self.lang_buttons = {}
        for key, name in LANGS:
            btn = self._button(lang_row, name, lambda k=key: self._pick_lang(k))
            btn._lang = key
            btn.pack(side="left", padx=(0, 4))
            self.lang_buttons[key] = btn

        self.look = tk.Label(card, text="外观", font=FONT, anchor="w")
        self.look.pack(fill="x", pady=(8, 4))
        theme_row = tk.Frame(card)
        theme_row.pack(fill="x")
        self.theme_row = theme_row
        self.theme_buttons = {}
        for key, name in THEME_NAMES:
            btn = self._button(theme_row, name, lambda k=key: self._pick_theme(k))
            btn._theme = key
            btn.pack(side="left", padx=(0, 4))
            self.theme_buttons[key] = btn

        actions = tk.Frame(card)
        actions.pack(fill="x", pady=(8, 0))
        self.actions = actions
        self.watch = self._button(actions, "开始监视", self._toggle_watch, primary=True)
        self.watch.pack(side="left")
        self.scan = self._button(actions, "读最近地点", self._scan)
        self.scan.pack(side="left", padx=(6, 0))

        place_row = tk.Frame(card)
        place_row.pack(fill="x", pady=(10, 0))
        self.place_row = place_row
        self.place_pip = tk.Frame(place_row, width=3)
        self.place_pip.pack(side="left", fill="y", padx=(0, 8))
        self.place = tk.Label(place_row, text="还没有地点", font=FONT_PLACE, anchor="w")
        self.place.pack(side="left", fill="x", expand=True)
        self.err = tk.Label(card, text="", font=FONT, anchor="w", justify="left", wraplength=490)

        foot_rule = tk.Frame(shell, height=1)
        foot_rule.pack(fill="x")
        self.foot_rule = foot_rule
        foot = tk.Frame(shell, height=36)
        foot.pack(fill="x")
        foot.pack_propagate(False)
        self.foot = foot
        self.meta = tk.Label(foot, text="", font=FONT, anchor="w", padx=12)
        self.meta.pack(side="left", fill="y")
        self.quit = self._button(foot, "退出", self.close)
        self.quit.pack(side="right", padx=8, pady=4)

        self._apply_copy()
        self._paint()
        self._fill(core.public_state(), force=True)
        self.root.bind("<Map>", self._on_map)
        self.root.after(400, self._tick)
        self.root.after(90, self._animate)
        self.root.update_idletasks()
        width, height = 520, self.shell.winfo_reqheight() + 4
        if height < 560:
            height = 560
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        self._normal = "%dx%d+%d+%d" % (
            width, height,
            max(0, (screen_w - width) // 2),
            max(40, (screen_h - height) // 6),
        )
        self.root.geometry(self._normal)
        self.root.after(30, self._taskbar)
        self._ready = True

    def _hwnd(self):
        import ctypes
        self.root.update_idletasks()
        hwnd = ctypes.windll.user32.GetParent(self.root.winfo_id())
        return hwnd or self.root.winfo_id()

    def _taskbar(self):
        import ctypes
        GWL_EXSTYLE = -20
        WS_EX_APPWINDOW = 0x00040000
        WS_EX_TOOLWINDOW = 0x00000080
        hwnd = self._hwnd()
        style = ctypes.windll.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
        style = (style & ~WS_EX_TOOLWINDOW) | WS_EX_APPWINDOW
        ctypes.windll.user32.SetWindowLongW(hwnd, GWL_EXSTYLE, style)
        self.root.withdraw()
        self.root.after(20, self.root.deiconify)

    def _on_map(self, _event):
        if not self._ready:
            return
        if str(self.root.state()) == "normal" and not self.root.overrideredirect():
            self.root.overrideredirect(True)

    def _chrome_btn(self, parent, text, command, role):
        label = tk.Label(parent, text=text, font=FONT, padx=12, cursor="hand2")
        label._role = role
        label.bind("<Button-1>", lambda _event: command())
        label.bind("<Enter>", lambda _event, widget=label: self._chrome_hover(widget, True))
        label.bind("<Leave>", lambda _event, widget=label: self._chrome_hover(widget, False))
        self.chrome.append(label)
        return label

    def _chrome_hover(self, widget, on):
        c = self._colors()
        if not on:
            widget.configure(bg=c["panel"], fg=c["ink"])
            return
        if widget._role == "close":
            widget.configure(bg=c["err"], fg="#ffffff")
        else:
            widget.configure(bg=c["accent"], fg=c["on"])

    def _drag_start(self, event):
        self._drag = (event.x_root - self.root.winfo_x(), event.y_root - self.root.winfo_y())

    def _drag_move(self, event):
        if self._zoomed or not self._drag:
            return
        x = event.x_root - self._drag[0]
        y = event.y_root - self._drag[1]
        self.root.geometry("+%d+%d" % (x, y))

    def _minimize(self):
        self.root.overrideredirect(False)
        self.root.iconify()

    def _toggle_zoom(self):
        if self._zoomed:
            self.root.geometry(self._normal)
            self._zoomed = False
            self.btn_max.configure(text="□")
            return
        self._normal = self.root.geometry()
        self.root.geometry("%dx%d+0+0" % (self.root.winfo_screenwidth(), self.root.winfo_screenheight()))
        self._zoomed = True
        self.btn_max.configure(text="❐")

    def _button(self, parent, text, command, primary=False):
        label = tk.Label(parent, text=text, font=FONT, padx=10, pady=4, cursor="hand2")
        label._primary = primary
        label.bind("<Button-1>", lambda _event: command())
        self.buttons.append(label)
        return label

    def _field(self, parent, caption, secret=False):
        label = tk.Label(parent, text=caption, font=FONT, anchor="w")
        label.pack(fill="x", pady=(6, 2))
        entry = tk.Entry(parent, font=FONT, relief="flat", highlightthickness=1, borderwidth=0, show="*" if secret else "")
        entry.pack(fill="x", ipady=4)
        entry.bind("<FocusOut>", lambda _event: self._save())
        return label, entry

    def _colors(self):
        return THEMES.get(self.theme) or THEMES["scifi"]

    def _paint(self):
        c = self._colors()
        self.root.configure(bg=c["accent"])
        self.shell.configure(bg=c["accent"])
        self.titlebar.configure(bg=c["panel"])
        self.rule.configure(bg=c["panel"])
        self.card.configure(bg=c["panel"])
        self.foot.configure(bg=c["panel"])
        self.foot_rule.configure(bg=c["line"])
        self.mark.configure(bg=c["panel"], fg=c["accent"])
        self.bar_title.configure(bg=c["panel"], fg=c["ink"])
        self.bar_sub.configure(bg=c["panel"], fg=c["muted"])
        for widget in self.chrome:
            widget.configure(bg=c["panel"], fg=c["ink"])
        for widget in (self.lead, self.tos, self.linked, self.log_label, self.lang_label, self.look, self.place, self.meta, self.api_label, self.room_label):
            widget.configure(bg=c["panel"], fg=c["muted"])
        self.linked.configure(fg=c["ink"])
        self.place.configure(bg=c["panel"], fg=c["accent"])
        self.log_label.configure(fg=c["accent"])
        self.lang_label.configure(fg=c["accent"])
        self.look.configure(fg=c["accent"])
        self.err.configure(bg=c["panel"], fg=c["err"])
        self.pair.configure(bg=c["bg"], highlightbackground=c["accent"])
        self.pair_text.configure(bg=c["bg"], fg=c["ink"])
        self.pair_row.configure(bg=c["bg"])
        self.log_row.configure(bg=c["panel"])
        self.lang_row.configure(bg=c["panel"])
        self.theme_row.configure(bg=c["panel"])
        self.actions.configure(bg=c["panel"])
        self.manual.configure(bg=c["panel"])
        self.place_row.configure(bg=c["panel"])
        self.place_pip.configure(bg=c["accent"])
        for entry in (self.log, self.api, self.room):
            entry.configure(
                bg=c["bg"], fg=c["ink"], insertbackground=c["ink"],
                highlightbackground=c["line"], highlightcolor=c["accent"],
            )
        for label in self.buttons:
            active = bool(label._primary or getattr(label, "_theme", None) == self.theme or getattr(label, "_lang", None) == self.lang)
            if active:
                label.configure(bg=c["accent"], fg=c["on"])
            else:
                label.configure(bg=c["bg"], fg=c["ink"])

    def _set_entry(self, entry, value, force):
        value = value or ""
        if not force and entry.focus_get() is entry:
            return
        if entry.get() != value:
            entry.delete(0, "end")
            entry.insert(0, value)

    def _fill(self, state, force=False):
        self._set_entry(self.log, state.get("logPath"), force)
        self._set_entry(self.api, state.get("apiBase"), force)
        self._set_entry(self.room, state.get("room"), force)
        linked = bool(state.get("room") and state.get("tokenSet"))
        if linked and not self._linked:
            self._link_flash = 14
        self._linked = linked
        if linked:
            self.linked.configure(text=tr(self.lang, "linked_on", room=state["room"]))
        else:
            self.linked.configure(text=tr(self.lang, "linked_off"))
        pending = state.get("pendingRoom") or ""
        if pending:
            self.pair_text.configure(text=tr(self.lang, "pair", room=pending))
            if not self.pair.winfo_ismapped():
                self.pair.pack(fill="x", pady=(8, 0), before=self.log_label)
        elif self.pair.winfo_ismapped():
            self.pair.pack_forget()
        place = state.get("place") or {}
        if place.get("code"):
            text = place["code"]
            if place.get("system"):
                text += "  ·  " + place["system"]
            self.place.configure(text=text)
        else:
            self.place.configure(text=tr(self.lang, "place_none"))
        self.meta.configure(text=_status_text(state, self.lang))
        err = self._local_error(state.get("error") or "")
        self.err.configure(text=err)
        if err and not self.err.winfo_ismapped():
            self.err.pack(fill="x", pady=(4, 0), before=self.place_row)
        elif not err and self.err.winfo_ismapped():
            self.err.pack_forget()
        self.watch.configure(text=tr(self.lang, "watch_stop" if state.get("running") else "watch"))
        theme = state.get("theme") if state.get("theme") in THEMES else self.theme
        if theme != self.theme:
            self.theme = theme
            self._paint()

    def _gather(self):
        return {
            "apiBase": self.api.get().strip(),
            "room": self.room.get().strip(),
            "logPath": self.log.get().strip(),
            "theme": self.theme,
        }

    def _save(self):
        self.core.apply_settings(self._gather())

    def _pick_theme(self, key):
        self.theme = key
        self._save()
        self._paint()

    def _pick_lang(self, key):
        self.lang = key
        with self.core.LOCK:
            self.core.CFG["lang"] = key
            self.core.save_config(self.core.CFG)
        self._apply_copy()
        self._paint()
        self._fill(self.core.public_state())
        self._refit()

    def _apply_copy(self):
        title = tr(self.lang, "title")
        self.root.title(title)
        self.bar_title.configure(text=title)
        self.lead.configure(text=tr(self.lang, "lead"))
        self.tos.configure(text=tr(self.lang, "tos"))
        self.log_label.configure(text=tr(self.lang, "log"))
        self.browse.configure(text=tr(self.lang, "browse"))
        self.api_label.configure(text=tr(self.lang, "api"))
        self.room_label.configure(text=tr(self.lang, "room"))
        self.lang_label.configure(text=tr(self.lang, "lang"))
        self.look.configure(text=tr(self.lang, "look"))
        self.scan.configure(text=tr(self.lang, "scan"))
        self.quit.configure(text=tr(self.lang, "quit"))
        self.pair_yes.configure(text=tr(self.lang, "pair_yes"))
        self.pair_no.configure(text=tr(self.lang, "pair_no"))
        for key, btn in self.theme_buttons.items():
            btn.configure(text=tr(self.lang, "theme." + key))

    def _local_error(self, err):
        key = ERR_MAP.get(err)
        if key:
            return tr(self.lang, key)
        if err.startswith("房间服务返回"):
            return tr(self.lang, "err_http") + err[len("房间服务返回"):]
        return err

    def _refit(self):
        if self._zoomed:
            return
        self.root.update_idletasks()
        width = max(self.root.winfo_width(), 520)
        height = self.shell.winfo_reqheight() + 4
        if height < 560:
            height = 560
        self.root.geometry("%dx%d+%d+%d" % (width, height, self.root.winfo_x(), self.root.winfo_y()))
        self._normal = self.root.geometry()

    def _browse(self):
        path = filedialog.askopenfilename(
            parent=self.root,
            title=tr(self.lang, "file_title"),
            filetypes=((tr(self.lang, "file_log"), "*.log"), (tr(self.lang, "file_all"), "*.*")),
        )
        if not path:
            return
        self.log.delete(0, "end")
        self.log.insert(0, path)
        self._save()

    def _toggle_watch(self):
        self._save()
        state = self.core.public_state()
        self.core.set_running(not state.get("running"))
        self._fill(self.core.public_state())

    def _scan(self):
        self._save()
        self.core.scan_tail()
        self._fill(self.core.public_state())

    def _accept(self):
        try:
            self.core.accept_pair()
        except Exception as exc:
            self.err.configure(text=self._local_error(str(exc)[:180]))
            if not self.err.winfo_ismapped():
                self.err.pack(fill="x", pady=(4, 0))
            return
        self._fill(self.core.public_state(), force=True)

    def _decline(self):
        self.core.decline_pair()
        self._fill(self.core.public_state())

    def _tick(self):
        if not self.root.winfo_exists():
            return
        self._fill(self.core.public_state())
        self.root.after(400, self._tick)

    def _animate(self):
        if not self.root.winfo_exists():
            return
        self._phase = (self._phase + 1) % 60
        c = self._colors()
        width = max(self.rule.winfo_width(), 1)
        span = max(48, width // 4)
        x = int((self._phase / 60) * (width + span)) - span
        self.rule.delete("sweep")
        self.rule.configure(bg=c["panel"])
        self.rule.create_rectangle(0, 0, width, 3, fill=c["line"], width=0, tags="sweep")
        self.rule.create_rectangle(x, 0, x + span, 3, fill=c["accent"], width=0, tags="sweep")
        bright = "#ffffff" if c["accent"].lower() in ("#e8eaef", "#d8d4c8") else "#f4fffd"
        if self._link_flash > 0:
            on = (self._link_flash % 2) == 0
            self._link_flash -= 1
            edge = bright if on else c["accent"]
            self.linked.configure(fg=c["on"] if on else c["accent"], bg=c["accent"] if on else c["panel"])
            self.root.configure(bg=edge)
            self.shell.configure(bg=edge)
        elif not self._linked:
            on = (self._phase // 8) % 2 == 0
            self.linked.configure(fg=c["accent"] if on else c["panel"], bg=c["panel"])
            edge = c["accent"] if on else c["line"]
            self.root.configure(bg=edge)
            self.shell.configure(bg=edge)
        else:
            self.linked.configure(fg=c["on"], bg=c["accent"])
            self.root.configure(bg=c["accent"])
            self.shell.configure(bg=c["accent"])
        watching = False
        try:
            watching = bool(self.core.public_state().get("running"))
        except Exception:
            watching = False
        if watching:
            self.place_pip.configure(bg=c["accent"] if (self._phase // 6) % 2 == 0 else c["line"])
        else:
            self.place_pip.configure(bg=c["accent"] if self._linked else c["line"])
        self.root.after(90, self._animate)

    def _raise(self):
        self.root.deiconify()
        self.root.overrideredirect(True)
        self.root.lift()
        self.root.attributes("-topmost", True)
        self.root.after(250, lambda: self.root.attributes("-topmost", False))
        try:
            self.root.focus_force()
        except tk.TclError:
            pass

    def close(self):
        self.core.request_stop()
        self.root.destroy()

    def run(self):
        self.root.mainloop()


def accept_terms(lang, theme):
    colors = THEMES.get(theme) or THEMES["scifi"]
    _dpi()
    root = tk.Tk()
    root.title("Starfix")
    ico = _asset("icon.ico")
    if ico:
        try:
            root.iconbitmap(str(ico))
        except tk.TclError:
            pass
    root.configure(bg=colors["accent"])
    root.overrideredirect(True)
    root.attributes("-topmost", True)
    agreed = {"ok": False}
    drag = {"x": 0, "y": 0}
    live = {"ok": False}

    def accept():
        if not live["ok"]:
            return
        agreed["ok"] = True
        root.destroy()

    def decline():
        root.destroy()

    def drag_start(event):
        drag["x"] = event.x_root - root.winfo_x()
        drag["y"] = event.y_root - root.winfo_y()

    def drag_move(event):
        root.geometry("+%d+%d" % (event.x_root - drag["x"], event.y_root - drag["y"]))

    shell = tk.Frame(root, bg=colors["accent"], padx=1, pady=1)
    shell.pack(fill="both", expand=True)
    bar = tk.Frame(shell, bg=colors["panel"], height=28)
    bar.pack(fill="x")
    bar.pack_propagate(False)
    title = tk.Label(bar, text="Starfix", font=FONT, bg=colors["panel"], fg=colors["ink"])
    title.pack(side="left", padx=10)
    terms_heading = tk.Label(bar, text="  " + tr(lang, "terms_title"), font=FONT, bg=colors["panel"], fg=colors["muted"])
    close = tk.Label(bar, text="×", font=FONT, bg=colors["panel"], fg=colors["ink"], padx=12, cursor="hand2")
    close.pack(side="right", fill="y")
    close.bind("<Button-1>", lambda _event: decline())
    terms_heading.pack(side="left")
    for widget in (bar, title, terms_heading):
        widget.bind("<ButtonPress-1>", drag_start)
        widget.bind("<B1-Motion>", drag_move)
    body = tk.Frame(shell, bg=colors["panel"], padx=12, pady=10)
    body.pack(fill="both", expand=True)
    box = tk.Frame(body, bg=colors["line"])
    box.pack(fill="both", expand=True)
    text = tk.Text(
        box, font=FONT, wrap="word", width=42, height=16, relief="flat", bd=8,
        bg=colors["bg"], fg=colors["ink"], highlightthickness=0,
        padx=6, pady=6,
    )
    scroll = tk.Scrollbar(box, command=text.yview)
    text.configure(yscrollcommand=scroll.set)
    scroll.pack(side="right", fill="y")
    text.pack(side="left", fill="both", expand=True)
    text.insert("1.0", tr(lang, "terms_body"))
    text.configure(state="disabled")

    def wheel(event):
        text.yview_scroll(int(-event.delta / 120), "units")

    text.bind("<MouseWheel>", wheel)
    row = tk.Frame(body, bg=colors["panel"])
    row.pack(fill="x", pady=(10, 0))
    yes = tk.Button(
        row, text=tr(lang, "terms_yes"), font=FONT, command=accept,
        bg=colors["accent"], fg=colors["on"], activebackground=colors["accent"],
        activeforeground=colors["on"], relief="flat", bd=0, padx=12, pady=4,
        highlightthickness=0, cursor="hand2",
    )
    no = tk.Button(
        row, text=tr(lang, "terms_no"), font=FONT, command=decline,
        bg=colors["bg"], fg=colors["ink"], activebackground=colors["bg"],
        activeforeground=colors["ink"], relief="flat", bd=0, padx=12, pady=4,
        highlightthickness=0, cursor="hand2",
    )
    yes.pack(side="left")
    no.pack(side="left", padx=(8, 0))
    root.protocol("WM_DELETE_WINDOW", decline)
    root.after(800, lambda: live.__setitem__("ok", True))
    width, height = 520, 460
    root.geometry("%dx%d+%d+%d" % (
        width, height,
        max(0, (root.winfo_screenwidth() - width) // 2),
        max(40, (root.winfo_screenheight() - height) // 6),
    ))
    root.mainloop()
    return agreed["ok"]


def open_window(core):
    lang = canon_lang(core.CFG.get("lang")) or windows_lang()
    theme = core.CFG.get("theme") if core.CFG.get("theme") in THEMES else "scifi"
    if not accept_terms(lang, theme):
        return
    Desktop(core).run()
