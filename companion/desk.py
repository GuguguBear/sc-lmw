# Native window for the place watcher. The dark title bar is ours, and the
# window stays on the taskbar. It leaves the screen only when the user
# chooses 后台运行, and it comes back from the tray menu. It does not
# hide itself.

import sys
import time
import tkinter as tk
from pathlib import Path
from tkinter import filedialog

import names

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
MISSION_NOISE = ("已接受合约", "新任务", "新的任务", "任务完成", "合约完成", "合约失败", "任务撤销", "合约共享", "Contract Accepted", "Contract Complete", "Contract Failed", "Contract Shared", "New Objective", "Objective Complete", "Objective Withdrawn")
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
        "split": "分离", "dock": "收回", "pane.live": "状态",
        "theme.classic": "经典", "theme.compact": "紧凑", "theme.practical": "实用", "theme.chassis": "机壳", "theme.scifi": "科幻",
        "watch": "开始监视", "watch_stop": "停止监视", "scan": "读最近地点",
        "place_none": "还没有地点", "quit": "退出", "back": "后台运行",
        "tray_show": "打开窗口", "tray_tip": "Starfix 在后台。左键打开窗口，右键可以操作。",
        "file_title": "选择 Game.log", "file_log": "日志", "file_all": "全部",
        "log_ok": "日志状态：正常", "log_missing": "日志状态：故障", "log_empty": "日志状态：空内容",
        "sent": "已发送 {code}", "seen": "日志里看到 {code}", "parsed": "解析到 {code}",
        "watching": "正在监视", "send_failed": "发送失败", "no_place": "最近日志里没有地点", "idle": "没有监视",
        "err_need_link": "先在星图里点「连到这台电脑」，再回到这里确认",
        "err_nolog": "找不到这份日志", "err_room": "房间码不对", "err_token": "令牌不对",
        "err_addr": "地址不对", "err_nopair": "没有待确认的连接", "err_http": "房间服务返回",
        "trail_title": "过程",
        "trail_hint": "按日期分开。一次登录画成一条。记录只留在这台电脑上。",
        "trail_empty": "还没有能串起来的过程。开始监视之后，每次登录会画成一条。",
        "trail_span": "{start} – {end}",
        "trail_places": "{n} 处",
        "trail_contract": "合约 {n}",
        "trail_buy": "买 {n}",
        "trail_sell": "卖 {n}",
        "trail_mission": "任务 {n}",
        "trail_steps": "{n} 步",
        "kind.online": "上线",
        "kind.place": "进入 {code}",
        "kind.done": "合约完成",
        "kind.fail": "合约失败",
        "kind.abandon": "合约放弃",
        "kind.buy": "购买 {item} × {qty}",
        "kind.sell": "出售 {item} × {qty}",
        "kind.ship": "驾驶 {ship}",
        "kind.aim": "选定 {where}",
        "kind.jump": "从 {start} 前往 {where}",
        "kind.arrive": "到达 {where}",
        "kind.down.npc": "被击倒",
        "kind.down.player": "被另一名玩家击倒",
        "kind.wreck": "飞船被毁",
        "kind.strike": "击倒目标",
        "kind.clear": "犯罪等级清除",
        "kind.crime": "犯罪等级 {n}",
        "kind.crash.gpu": "显卡崩溃",
        "kind.crash.freeze": "游戏冻结",
        "kind.crash.ram": "内存不足",
        "kind.crash.vram": "显存不足",
        "kind.crash.fault": "游戏故障",
        "kind.universe": "进入持久宇宙",
        "kind.leave": "离开游戏",
        "kind.law": "进入{where}管辖",
        "kind.watch.in": "进入监管区域",
        "kind.watch.out": "离开监管区域",
        "kind.armistice.in": "进入禁火区",
        "kind.armistice.out": "离开禁火区",
        "kind.hangar.ask": "机库申请已通过",
        "kind.hangar.ready": "机库已就绪",
        "kind.hurt": "身体局部瘫痪",
        "kind.heal": "接受治疗",
        "kind.unseat": "离开驾驶位",
        "kind.pact.accept": "接取「{title}」",
        "kind.pact.done": "完成「{title}」",
        "kind.pact.fail": "未能完成「{title}」",
        "kind.pact.share": "收到共享「{title}」",
        "kind.travel": "从 {start} 前往 {where}",
        "kind.travel_done": "从 {start} 跃迁抵达 {where}",
        "kind.beacon": "任务信标",
        "kind.somewhere": "某处",
        "update_title": "正在更新", "update_lead": "正在把 {version} 装进程序",
        "update_bytes": "{done} / {total}", "update_swap": "正在换上新版本", "update_unknown": "正在下载",
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
        "split": "分離", "dock": "收回", "pane.live": "狀態",
        "theme.classic": "經典", "theme.compact": "緊湊", "theme.practical": "實用", "theme.chassis": "機殼", "theme.scifi": "科幻",
        "watch": "開始監視", "watch_stop": "停止監視", "scan": "讀最近地點",
        "place_none": "還沒有地點", "quit": "退出", "back": "背景執行",
        "tray_show": "打開視窗", "tray_tip": "Starfix 在背景。左鍵打開視窗，右鍵可以操作。",
        "file_title": "選擇 Game.log", "file_log": "日誌", "file_all": "全部",
        "log_ok": "日誌狀態：正常", "log_missing": "日誌狀態：故障", "log_empty": "日誌狀態：空內容",
        "sent": "已發送 {code}", "seen": "日誌裡看到 {code}", "parsed": "解析到 {code}",
        "watching": "正在監視", "send_failed": "發送失敗", "no_place": "最近日誌裡沒有地點", "idle": "沒有監視",
        "err_need_link": "先在星圖裡點「連到這台電腦」，再回到這裡確認",
        "err_nolog": "找不到這份日誌", "err_room": "房間碼不對", "err_token": "令牌不對",
        "err_addr": "地址不對", "err_nopair": "沒有待確認的連接", "err_http": "房間服務返回",
        "trail_title": "過程",
        "trail_hint": "按日期分開。一次登入畫成一條。記錄只留在這台電腦上。",
        "trail_empty": "還沒有能串起來的過程。開始監視之後，每次登入會畫成一條。",
        "trail_span": "{start} – {end}",
        "trail_places": "{n} 處",
        "trail_contract": "合約 {n}",
        "trail_buy": "買 {n}",
        "trail_sell": "賣 {n}",
        "trail_mission": "任務 {n}",
        "trail_steps": "{n} 步",
        "kind.online": "上線",
        "kind.place": "進入 {code}",
        "kind.done": "合約完成",
        "kind.fail": "合約失敗",
        "kind.abandon": "合約放棄",
        "kind.buy": "購買 {item} × {qty}",
        "kind.sell": "出售 {item} × {qty}",
        "kind.ship": "駕駛 {ship}",
        "kind.aim": "選定 {where}",
        "kind.jump": "從 {start} 前往 {where}",
        "kind.arrive": "到達 {where}",
        "kind.down.npc": "被擊倒",
        "kind.down.player": "被另一名玩家擊倒",
        "kind.wreck": "飛船被毀",
        "kind.strike": "擊倒目標",
        "kind.clear": "犯罪等級清除",
        "kind.crime": "犯罪等級 {n}",
        "kind.crash.gpu": "顯示卡當掉",
        "kind.crash.freeze": "遊戲凍結",
        "kind.crash.ram": "記憶體不足",
        "kind.crash.vram": "顯示記憶體不足",
        "kind.crash.fault": "遊戲故障",
        "kind.universe": "進入持久宇宙",
        "kind.leave": "離開遊戲",
        "kind.law": "進入{where}管轄",
        "kind.watch.in": "進入監管區域",
        "kind.watch.out": "離開監管區域",
        "kind.armistice.in": "進入禁火區",
        "kind.armistice.out": "離開禁火區",
        "kind.hangar.ask": "機庫申請已通過",
        "kind.hangar.ready": "機庫已就緒",
        "kind.hurt": "身體局部癱瘓",
        "kind.heal": "接受治療",
        "kind.unseat": "離開駕駛位",
        "kind.pact.accept": "接取「{title}」",
        "kind.pact.done": "完成「{title}」",
        "kind.pact.fail": "未能完成「{title}」",
        "kind.pact.share": "收到共享「{title}」",
        "kind.travel": "從 {start} 前往 {where}",
        "kind.travel_done": "從 {start} 躍遷抵達 {where}",
        "kind.beacon": "任務信標",
        "kind.somewhere": "某處",
        "update_title": "正在更新", "update_lead": "正在把 {version} 裝進程式",
        "update_bytes": "{done} / {total}", "update_swap": "正在換上新版本", "update_unknown": "正在下載",
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
        "split": "Split", "dock": "Dock", "pane.live": "Status",
        "theme.classic": "Classic", "theme.compact": "Compact", "theme.practical": "Practical", "theme.chassis": "Chassis", "theme.scifi": "Sci-fi",
        "watch": "Start watch", "watch_stop": "Stop watch", "scan": "Latest place",
        "place_none": "No place yet", "quit": "Quit", "back": "Background",
        "tray_show": "Show window", "tray_tip": "Starfix is in the background. Left click opens the window. Right click opens the menu.",
        "file_title": "Choose Game.log", "file_log": "Log", "file_all": "All",
        "log_ok": "Log status: ok", "log_missing": "Log status: missing", "log_empty": "Log status: empty",
        "sent": "Sent {code}", "seen": "Log shows {code}", "parsed": "Parsed {code}",
        "watching": "Watching", "send_failed": "Send failed", "no_place": "No place in the recent log", "idle": "Not watching",
        "err_need_link": "On the map, choose Connect this computer, then confirm here",
        "err_nolog": "Cannot find this log", "err_room": "Room code is not valid", "err_token": "Token is not valid",
        "err_addr": "Address is not valid", "err_nopair": "Nothing is waiting to confirm", "err_http": "Room service returned",
        "trail_title": "Sessions",
        "trail_hint": "Split by date. One login is one line. The record stays on this computer.",
        "trail_empty": "No session to draw yet. After watch starts, each login becomes one line.",
        "trail_span": "{start} – {end}",
        "trail_places": "{n} places",
        "trail_contract": "contracts {n}",
        "trail_buy": "bought {n}",
        "trail_sell": "sold {n}",
        "trail_mission": "tasks {n}",
        "trail_steps": "{n} steps",
        "kind.online": "Signed in",
        "kind.place": "Entered {code}",
        "kind.done": "Contract complete",
        "kind.fail": "Contract failed",
        "kind.abandon": "Contract abandoned",
        "kind.buy": "Bought {item} × {qty}",
        "kind.sell": "Sold {item} × {qty}",
        "kind.ship": "Flew {ship}",
        "kind.aim": "Selected {where}",
        "kind.jump": "From {start} to {where}",
        "kind.arrive": "Arrived {where}",
        "kind.down.npc": "Downed",
        "kind.down.player": "Downed by another player",
        "kind.wreck": "Ship destroyed",
        "kind.strike": "Downed a target",
        "kind.clear": "Crime rating cleared",
        "kind.crime": "Crime rating {n}",
        "kind.crash.gpu": "GPU crash",
        "kind.crash.freeze": "Game froze",
        "kind.crash.ram": "Out of memory",
        "kind.crash.vram": "Out of video memory",
        "kind.crash.fault": "Game fault",
        "kind.universe": "Entered the universe",
        "kind.leave": "Left the game",
        "kind.law": "Entered {where} jurisdiction",
        "kind.watch.in": "Entered monitored space",
        "kind.watch.out": "Left monitored space",
        "kind.armistice.in": "Entered an armistice zone",
        "kind.armistice.out": "Left the armistice zone",
        "kind.hangar.ask": "Hangar request accepted",
        "kind.hangar.ready": "Hangar ready",
        "kind.hurt": "Partially incapacitated",
        "kind.heal": "Treated",
        "kind.unseat": "Left the pilot seat",
        "kind.pact.accept": "Accepted “{title}”",
        "kind.pact.done": "Finished “{title}”",
        "kind.pact.fail": "Failed “{title}”",
        "kind.pact.share": "Received shared “{title}”",
        "kind.travel": "From {start} toward {where}",
        "kind.travel_done": "Jumped from {start} to {where}",
        "kind.beacon": "mission beacon",
        "kind.somewhere": "somewhere",
        "update_title": "Updating", "update_lead": "Loading {version} into the program",
        "update_bytes": "{done} / {total}", "update_swap": "Replacing this copy", "update_unknown": "Downloading",
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
        "split": "Trennen", "dock": "Zurück", "pane.live": "Status",
        "theme.classic": "Klassisch", "theme.compact": "Kompakt", "theme.practical": "Praktisch", "theme.chassis": "Gehäuse", "theme.scifi": "Science-Fiction",
        "watch": "Überwachen", "watch_stop": "Stoppen", "scan": "Letzten Ort",
        "place_none": "Noch kein Ort", "quit": "Beenden", "back": "Hintergrund",
        "tray_show": "Fenster öffnen", "tray_tip": "Starfix läuft im Hintergrund. Linksklick öffnet das Fenster. Rechtsklick öffnet das Menü.",
        "file_title": "Game.log wählen", "file_log": "Log", "file_all": "Alle",
        "log_ok": "Logstatus: in Ordnung", "log_missing": "Logstatus: fehlt", "log_empty": "Logstatus: leer",
        "sent": "Gesendet {code}", "seen": "Log zeigt {code}", "parsed": "Gelesen {code}",
        "watching": "Überwacht", "send_failed": "Senden fehlgeschlagen", "no_place": "Kein Ort im letzten Log", "idle": "Keine Überwachung",
        "err_need_link": "In der Karte „Diesen Computer verbinden“, dann hier bestätigen",
        "err_nolog": "Dieses Log wurde nicht gefunden", "err_room": "Raumcode ungültig", "err_token": "Token ungültig",
        "err_addr": "Adresse ungültig", "err_nopair": "Nichts wartet auf Bestätigung", "err_http": "Raumdienst antwortete",
        "trail_title": "Verlauf",
        "trail_hint": "Nach Datum getrennt. Eine Anmeldung ist eine Linie. Der Verlauf bleibt auf diesem Computer.",
        "trail_empty": "Noch kein Verlauf. Nach dem Start der Überwachung wird jede Anmeldung eine Linie.",
        "trail_span": "{start} – {end}",
        "trail_places": "{n} Orte",
        "trail_contract": "Aufträge {n}",
        "trail_buy": "gekauft {n}",
        "trail_sell": "verkauft {n}",
        "trail_mission": "Aufgaben {n}",
        "trail_steps": "{n} Schritte",
        "kind.online": "Angemeldet",
        "kind.place": "Zone {code}",
        "kind.done": "Auftrag abgeschlossen",
        "kind.fail": "Auftrag fehlgeschlagen",
        "kind.abandon": "Auftrag abgebrochen",
        "kind.buy": "Gekauft {item} × {qty}",
        "kind.sell": "Verkauft {item} × {qty}",
        "kind.ship": "Geflogen {ship}",
        "kind.aim": "Ziel {where}",
        "kind.jump": "Von {start} nach {where}",
        "kind.arrive": "Ankunft {where}",
        "kind.down.npc": "Kampfunfähig",
        "kind.down.player": "Von einem anderen Spieler kampfunfähig",
        "kind.wreck": "Schiff zerstört",
        "kind.strike": "Ziel ausgeschaltet",
        "kind.clear": "Verbrechensstufe gelöscht",
        "kind.crime": "Verbrechensstufe {n}",
        "kind.crash.gpu": "GPU-Absturz",
        "kind.crash.freeze": "Spiel eingefroren",
        "kind.crash.ram": "Arbeitsspeicher voll",
        "kind.crash.vram": "Videospeicher voll",
        "kind.crash.fault": "Spielfehler",
        "kind.universe": "Universum betreten",
        "kind.leave": "Spiel verlassen",
        "kind.law": "Zuständigkeit {where} betreten",
        "kind.watch.in": "Überwachtes Gebiet betreten",
        "kind.watch.out": "Überwachtes Gebiet verlassen",
        "kind.armistice.in": "Waffenruhe betreten",
        "kind.armistice.out": "Waffenruhe verlassen",
        "kind.hangar.ask": "Hangar-Anfrage angenommen",
        "kind.hangar.ready": "Hangar bereit",
        "kind.hurt": "Teilweise kampfunfähig",
        "kind.heal": "Behandelt",
        "kind.unseat": "Pilotensitz verlassen",
        "kind.pact.accept": "Angenommen „{title}“",
        "kind.pact.done": "Abgeschlossen „{title}“",
        "kind.pact.fail": "Gescheitert „{title}“",
        "kind.pact.share": "Geteilt erhalten „{title}“",
        "kind.travel": "Von {start} nach {where}",
        "kind.travel_done": "Sprung von {start} nach {where}",
        "kind.beacon": "Auftragsbake",
        "kind.somewhere": "irgendwo",
        "update_title": "Aktualisierung", "update_lead": "{version} wird ins Programm geladen",
        "update_bytes": "{done} / {total}", "update_swap": "Diese Datei wird ersetzt", "update_unknown": "Download",
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


def theme_scroll(parent, target, colors):
    bar = tk.Canvas(parent, width=12, highlightthickness=0, bd=0, bg=colors["bg"], cursor="hand2")
    bar._colors = colors

    def paint(_event=None):
        bar.delete("thumb")
        look = getattr(bar, "_colors", colors)
        bar.configure(bg=look["bg"])
        try:
            first, last = target.yview()
        except tk.TclError:
            return
        if last - first >= 0.995:
            return
        height = max(1, bar.winfo_height())
        top = int(first * height)
        bot = int(last * height)
        if bot - top < 28:
            mid = (top + bot) // 2
            top = max(0, mid - 14)
            bot = min(height, top + 28)
        bar.create_rectangle(3, top + 2, 9, max(top + 6, bot - 2), fill=look["accent"], width=0, tags="thumb")

    def jump(event):
        height = max(1, bar.winfo_height())
        first, last = target.yview()
        span = max(0.05, last - first)
        target.yview_moveto(min(1 - span, max(0, event.y / height - span / 2)))
        bar._origin = event.y
        bar._start = target.yview()[0]

    def drag(event):
        height = max(1, bar.winfo_height())
        span = max(0.05, target.yview()[1] - target.yview()[0])
        moved = (event.y - getattr(bar, "_origin", event.y)) / height
        target.yview_moveto(min(1 - span, max(0, getattr(bar, "_start", 0) + moved)))

    bar.bind("<Configure>", paint)
    bar.bind("<Button-1>", jump)
    bar.bind("<B1-Motion>", drag)
    target.configure(yscrollcommand=lambda *_args: paint())
    return bar


def _colorref(hex_color):
    text = str(hex_color or "").lstrip("#")
    if len(text) != 6:
        return 0x00121010
    red = int(text[0:2], 16)
    green = int(text[2:4], 16)
    blue = int(text[4:6], 16)
    return (blue << 16) | (green << 8) | red


def hide_window_border(widget, hex_color):
    # Windows 11 draws a white edge on a borderless window. Paint that edge
    # with the window color so it disappears.
    if sys.platform != "win32":
        return
    try:
        import ctypes
        from ctypes import wintypes
        widget.update_idletasks()
        user32 = ctypes.WinDLL("user32", use_last_error=True)
        user32.GetParent.argtypes = [wintypes.HWND]
        user32.GetParent.restype = wintypes.HWND
        hwnd = user32.GetParent(widget.winfo_id()) or widget.winfo_id()
        dwm = ctypes.WinDLL("dwmapi")
        color = ctypes.c_uint(_colorref(hex_color))
        dwm.DwmSetWindowAttribute.argtypes = [
            wintypes.HWND, ctypes.c_uint, ctypes.POINTER(ctypes.c_uint), ctypes.c_uint,
        ]
        dwm.DwmSetWindowAttribute.restype = ctypes.c_long
        dwm.DwmSetWindowAttribute(hwnd, 34, ctypes.byref(color), ctypes.sizeof(color))
    except (AttributeError, OSError, tk.TclError, ValueError):
        pass


def tray_click_kind(mouse_message):
    # The tray callback only records the click. It must not call into Tk.
    mouse = int(mouse_message) & 0xFFFF
    if mouse in (0x0202, 0x0203):
        return "show"
    if mouse in (0x0205, 0x007B):
        return "menu"
    return ""


def tray_menu_place(pointer_x, pointer_y, menu_h=140, gap=28):
    # Keep the pointer outside the menu. A right-click must not land on Quit.
    # When there is no room above the pointer, the menu opens below it and
    # Quit is the last row, away from that pointer.
    pointer_x = int(pointer_x)
    pointer_y = int(pointer_y)
    above = pointer_y - int(menu_h) - int(gap)
    if above >= 0:
        return pointer_x, above, False
    return pointer_x, pointer_y + int(gap), True


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


_front = None


def _bind_front(fn):
    global _front
    _front = fn


def request_front():
    fn = _front
    if not fn:
        return False
    try:
        fn()
    except tk.TclError:
        return False
    return True


def force_foreground(widget):
    # The second double-click owns the foreground right. Pulse topmost, then
    # ask Windows to hand that right to the window that is already open.
    try:
        widget.deiconify()
        widget.lift()
        widget.attributes("-topmost", True)
        widget.update_idletasks()
    except tk.TclError:
        return
    try:
        if sys.platform == "win32":
            import ctypes
            from ctypes import wintypes
            user32 = ctypes.WinDLL("user32", use_last_error=True)
            kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
            user32.GetParent.argtypes = [wintypes.HWND]
            user32.GetParent.restype = wintypes.HWND
            user32.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
            user32.ShowWindow.restype = wintypes.BOOL
            user32.GetForegroundWindow.restype = wintypes.HWND
            user32.GetWindowThreadProcessId.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.DWORD)]
            user32.GetWindowThreadProcessId.restype = wintypes.DWORD
            user32.AttachThreadInput.argtypes = [wintypes.DWORD, wintypes.DWORD, wintypes.BOOL]
            user32.AttachThreadInput.restype = wintypes.BOOL
            user32.BringWindowToTop.argtypes = [wintypes.HWND]
            user32.SetForegroundWindow.argtypes = [wintypes.HWND]
            user32.SetForegroundWindow.restype = wintypes.BOOL
            kernel32.GetCurrentThreadId.restype = wintypes.DWORD
            hwnd = user32.GetParent(widget.winfo_id()) or widget.winfo_id()
            user32.ShowWindow(hwnd, 9)
            fg = user32.GetForegroundWindow()
            fg_pid = wintypes.DWORD()
            fg_tid = user32.GetWindowThreadProcessId(fg, ctypes.byref(fg_pid)) if fg else 0
            our_tid = kernel32.GetCurrentThreadId()
            linked = bool(fg_tid and fg_tid != our_tid and user32.AttachThreadInput(our_tid, fg_tid, True))
            user32.BringWindowToTop(hwnd)
            user32.SetForegroundWindow(hwnd)
            if linked:
                user32.AttachThreadInput(our_tid, fg_tid, False)
    finally:
        try:
            widget.attributes("-topmost", False)
            widget.focus_force()
            hide_window_border(widget, str(widget.cget("bg")))
        except tk.TclError:
            pass


def _status_text(state, lang):
    raw = state.get("status") or ""
    kind = state.get("logKind") or ("ok" if state.get("logExists") else "missing")
    log = tr(lang, {"ok": "log_ok", "empty": "log_empty"}.get(kind, "log_missing"))
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
        self._snap = None
        self._drag_zone = ""
        self._ghost = None
        self._snap_menu = None
        self._snap_wait = None
        self._panes = []
        self._split_saved = None
        self._ready = False
        self._linked = False
        self._link_until = 0
        self._feed_sig = None
        self._feed_ids = None
        self._icon_img = None
        self._tray_on = False
        self._tray_hwnd = None
        self._tray_proc = None
        self._tray_class = None
        self._tray_hicon = None
        self._tray_taskbar_msg = 0
        self._tray_menu_at = 0
        self._tray_pending = ""
        self._tray_panel = None
        self._user_background = False
        self._placing = False
        self._guard_on = False
        self._resume_frame = False
        self._trail_days = []
        self._trail_sig = None
        self._trail_day = ""
        self._trail_seed = ""
        self._trail_picked = False
        self._trail_open = set()
        self._trail_hits = []
        self._trail_rail = None
        self._trail_width = 0
        _dpi()
        self.root = tk.Tk()
        self.root.after(50, self._tray_pump)
        self.root.overrideredirect(True)
        self.root.title(tr(self.lang, "title"))
        ico = _asset("icon.ico")
        if ico:
            try:
                self.root.iconbitmap(str(ico))
            except tk.TclError:
                pass
        self.root.configure(bg=THEMES[self.theme]["panel"])
        self.root.protocol("WM_DELETE_WINDOW", self.close)
        self.core.RAISE = lambda: self.root.after(0, self._raise)
        _bind_front(lambda: self.root.after(0, self._raise))

        shell = tk.Frame(self.root, bg=THEMES[self.theme]["panel"])
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
        ver = str(getattr(self.core, "VERSION", "") or "").strip()
        self.bar_sub = tk.Label(bar, text=("  " + ver) if ver else "  SC LMW", font=FONT)
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
        self.titlebar.bind("<B1-Motion>", self._drag_move)
        self.titlebar.bind("<ButtonRelease-1>", self._drag_end)
        self.btn_max.bind("<Enter>", self._snap_menu_arm, add="+")
        self.btn_max.bind("<Leave>", self._snap_menu_away, add="+")

        self.rule = tk.Canvas(shell, height=3, highlightthickness=0, bd=0)
        self.rule.pack(fill="x")

        card = tk.Frame(shell, padx=12, pady=8)
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

        design = tk.Frame(card)
        design.pack(side="bottom", fill="x", pady=(8, 0))
        self.design = design
        lang_row = tk.Frame(design)
        lang_row.pack(fill="x")
        self.lang_row = lang_row
        self.lang_label = tk.Label(lang_row, text="", font=FONT, anchor="w")
        self.lang_label.pack(side="left", padx=(0, 6))
        self.split_btn = self._button(lang_row, "分离", self._toggle_split, padx=8, pady=2)
        self.split_btn.pack(side="right")
        self.lang_buttons = {}
        for key, name in LANGS:
            btn = self._button(lang_row, name, lambda k=key: self._pick_lang(k), padx=8, pady=2)
            btn._lang = key
            btn.pack(side="left", padx=(0, 4))
            self.lang_buttons[key] = btn

        theme_row = tk.Frame(design)
        theme_row.pack(fill="x", pady=(4, 0))
        self.theme_row = theme_row
        self.actions = theme_row
        self.scan = self._button(theme_row, "读最近地点", self._scan, padx=8, pady=2)
        self.scan.pack(side="right")
        self.watch = self._button(theme_row, "开始监视", self._toggle_watch, primary=True, padx=8, pady=2)
        self.watch.pack(side="right", padx=(0, 6))
        self.look = tk.Label(theme_row, text="外观", font=FONT, anchor="w")
        self.look.pack(side="left", padx=(0, 6))
        self.theme_buttons = {}
        for key, name in THEME_NAMES:
            btn = self._button(theme_row, name, lambda k=key: self._pick_theme(k), padx=8, pady=2)
            btn._theme = key
            btn.pack(side="left", padx=(0, 4))
            self.theme_buttons[key] = btn

        self.trail_slot = tk.Frame(card)
        self.trail_slot.pack(fill="both", expand=True, pady=(10, 0))
        self.trail_pane = self._make_pane(self.trail_slot, "trail", "trail_title", (420, 360))
        trail_body = self.trail_pane._body
        self.trail_title = tk.Label(trail_body, text="过程", font=FONT, anchor="w")
        self.trail_title.pack(fill="x", pady=(0, 2))
        self.trail_hint = tk.Label(trail_body, text="", font=FONT, anchor="w", justify="left", wraplength=490)
        self.trail_hint.pack(fill="x")
        self.trail_box = tk.Frame(trail_body)
        self.trail_box.pack(fill="both", expand=True, pady=(6, 0))
        self.trail = tk.Canvas(self.trail_box, height=220, highlightthickness=0, bd=0)
        self.trail.pack(side="left", fill="both", expand=True)
        self.trail_scroll = theme_scroll(self.trail_box, self.trail, self._colors())
        self.trail_scroll.pack(side="right", fill="y")
        self.trail.bind("<MouseWheel>", self._trail_wheel)
        self.trail.bind("<Button-1>", self._trail_click)
        self.trail.bind("<Configure>", self._trail_sized)

        self.err = tk.Label(card, text="", font=FONT, anchor="w", justify="left", wraplength=490)
        self.live_slot = tk.Frame(shell)
        self.live_pane = self._make_pane(self.live_slot, "live", "pane.live", (360, 140))
        self.feed = tk.Canvas(self.live_pane._body, height=96, highlightthickness=0, bd=0)
        self._feed = {"place": "", "ship": "", "gear": "", "on": False}
        card.bind("<Configure>", self._fit_wrap)

        foot_rule = tk.Frame(shell, height=1)
        self.foot_rule = foot_rule
        foot = tk.Frame(shell, height=42)
        foot.pack_propagate(False)
        self.foot = foot
        self.meta = tk.Label(foot, text="", font=FONT, anchor="w", padx=12)
        self.meta.pack(side="left", fill="y")
        self.quit = self._button(foot, "退出", self.close)
        self.quit.pack(side="right", padx=8, pady=4)
        self.back = self._button(foot, "后台运行", self._background)
        self.back.pack(side="right", padx=(8, 0), pady=4)
        foot.pack(side="bottom", fill="x")
        foot_rule.pack(side="bottom", fill="x")
        self.feed.pack(fill="x")
        self.live_slot.pack(side="bottom", fill="x")
        card.pack(fill="both", expand=True)

        self._apply_copy()
        self._paint()
        self._fill(core.public_state(), force=True)
        self.root.after(400, self._tick)
        self.root.after(32, self._animate)
        self.root.update_idletasks()
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        width, height = 540, self.shell.winfo_reqheight() + 8
        if height < 760:
            height = 760
        if height > screen_h - 48:
            height = max(640, screen_h - 48)
        self._normal = "%dx%d+%d+%d" % (
            width, height,
            max(0, (screen_w - width) // 2),
            max(40, (screen_h - height) // 6),
        )
        self.root.minsize(420, 640)
        self.root.geometry(self._normal)
        self.root.bind("<Map>", self._on_map)
        self._mount_grips()
        self.root.after(30, self._seat_taskbar)
        self._ready = True

    def _hwnd(self):
        import ctypes
        self.root.update_idletasks()
        hwnd = ctypes.windll.user32.GetParent(self.root.winfo_id())
        return hwnd or self.root.winfo_id()

    def _taskbar_add(self):
        if sys.platform != "win32":
            return
        try:
            import ctypes
            from ctypes import wintypes
            if not getattr(self, "_taskbar_vtbl", None):
                class GUID(ctypes.Structure):
                    _fields_ = [
                        ("Data1", ctypes.c_ulong),
                        ("Data2", ctypes.c_ushort),
                        ("Data3", ctypes.c_ushort),
                        ("Data4", ctypes.c_ubyte * 8),
                    ]

                def guid(text):
                    flat = text.replace("-", "")
                    item = GUID()
                    item.Data1 = int(flat[0:8], 16)
                    item.Data2 = int(flat[8:12], 16)
                    item.Data3 = int(flat[12:16], 16)
                    raw = bytes.fromhex(flat[16:])
                    for index, value in enumerate(raw):
                        item.Data4[index] = value
                    return item

                ole32 = ctypes.WinDLL("ole32")
                ole32.CoInitialize.argtypes = [ctypes.c_void_p]
                ole32.CoInitialize.restype = ctypes.c_long
                ole32.CoInitialize(None)
                ole32.CoCreateInstance.argtypes = [
                    ctypes.POINTER(GUID), ctypes.c_void_p, ctypes.c_ulong,
                    ctypes.POINTER(GUID), ctypes.POINTER(ctypes.c_void_p),
                ]
                ole32.CoCreateInstance.restype = ctypes.c_long
                clsid = guid("56FDF344-FD6D-11d0-958A-006097C9A090")
                iid = guid("56FDF342-FD6D-11d0-958A-006097C9A090")
                ptr = ctypes.c_void_p()
                if ole32.CoCreateInstance(ctypes.byref(clsid), None, 1, ctypes.byref(iid), ctypes.byref(ptr)) < 0 or not ptr.value:
                    return
                vtbl = ctypes.cast(ptr, ctypes.POINTER(ctypes.POINTER(ctypes.c_void_p))).contents
                init = ctypes.WINFUNCTYPE(ctypes.c_long, ctypes.c_void_p)(vtbl[3])
                if init(ptr) < 0:
                    return
                self._taskbar_ptr = ptr
                self._taskbar_vtbl = vtbl
            add = ctypes.WINFUNCTYPE(ctypes.c_long, ctypes.c_void_p, wintypes.HWND)(self._taskbar_vtbl[4])
            add(self._taskbar_ptr, self._hwnd())
        except (AttributeError, OSError, tk.TclError, ValueError):
            return

    def _mark_appwindow(self):
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.WinDLL("user32", use_last_error=True)
        get_long = getattr(user32, "GetWindowLongPtrW", user32.GetWindowLongW)
        set_long = getattr(user32, "SetWindowLongPtrW", user32.SetWindowLongW)
        get_long.argtypes = [wintypes.HWND, ctypes.c_int]
        get_long.restype = ctypes.c_ssize_t
        set_long.argtypes = [wintypes.HWND, ctypes.c_int, ctypes.c_ssize_t]
        set_long.restype = ctypes.c_ssize_t
        user32.SetWindowPos.argtypes = [
            wintypes.HWND, wintypes.HWND, ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int, wintypes.UINT,
        ]
        user32.SetWindowPos.restype = wintypes.BOOL
        hwnd = self._hwnd()
        frame = get_long(hwnd, -16) | 0x00020000 | 0x00080000
        set_long(hwnd, -16, frame)
        extra = (get_long(hwnd, -20) & ~0x00000080) | 0x00040000
        set_long(hwnd, -20, extra)
        user32.SetWindowPos(hwnd, None, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0004 | 0x0010 | 0x0020)
        hide_window_border(self.root, self._colors()["panel"])
        self._apply_window_icon()
        self._taskbar_add()

    def _seat_taskbar(self):
        # withdraw() drops the frameless flag. Put it back before the window
        # is shown again, in this same step, so it neither stays hidden nor
        # grows a system title bar. The user did not ask to leave, so the
        # window is put back even if a step fails.
        self._placing = True
        try:
            self.root.withdraw()
            self.root.update()
            self.root.overrideredirect(True)
            self.root.deiconify()
            self.root.lift()
            self._mark_appwindow()
        except tk.TclError:
            try:
                self.root.overrideredirect(True)
                self.root.deiconify()
            except tk.TclError:
                pass
        finally:
            self._placing = False
            if not self._user_background:
                try:
                    if str(self.root.state()) == "withdrawn":
                        self.root.overrideredirect(True)
                        self.root.deiconify()
                        self.root.lift()
                except tk.TclError:
                    pass
            if not self._guard_on:
                self._guard_on = True
                self.root.after(3000, self._tray_guard)

    def _on_map(self, _event):
        if self._placing or self._user_background:
            return
        self._mark_appwindow()

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
        self._hide_snap_menu()
        if self._snap:
            self._restore_free()
            width = max(self.root.winfo_width(), 420)
            left = event.x_root - min(max(event.x, 24), width - 48)
            top = event.y_root - max(event.y, 0)
            self.root.geometry("+%d+%d" % (left, top))
        self._drag = (event.x_root - self.root.winfo_x(), event.y_root - self.root.winfo_y())
        self._drag_zone = ""
        try:
            self.titlebar.grab_set()
        except tk.TclError:
            pass

    def _drag_move(self, event):
        if not self._drag or self._zoomed:
            return
        self.root.geometry("+%d+%d" % (event.x_root - self._drag[0], event.y_root - self._drag[1]))
        area = self._work_at(event.x_root, event.y_root)
        kind = self._snap_kind(event.x_root, event.y_root, area)
        self._drag_zone = kind
        if kind:
            self._show_ghost(self._snap_box(kind, area))
        else:
            self._hide_ghost()

    def _drag_end(self, event):
        zone = self._drag_zone
        area = self._work_at(event.x_root, event.y_root)
        self._drag = None
        self._drag_zone = ""
        try:
            self.titlebar.grab_release()
        except tk.TclError:
            pass
        self._hide_ghost()
        if zone:
            self._apply_snap(zone, area)
        elif not self._snap:
            self._normal = self.root.geometry()

    def _work_at(self, x, y):
        if sys.platform == "win32":
            try:
                import ctypes
                from ctypes import wintypes

                class POINT(ctypes.Structure):
                    _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]

                class MONITORINFO(ctypes.Structure):
                    _fields_ = [
                        ("cbSize", wintypes.DWORD),
                        ("rcMonitor", wintypes.RECT),
                        ("rcWork", wintypes.RECT),
                        ("dwFlags", wintypes.DWORD),
                    ]

                user32 = ctypes.WinDLL("user32", use_last_error=True)
                user32.MonitorFromPoint.argtypes = [POINT, wintypes.DWORD]
                user32.MonitorFromPoint.restype = wintypes.HMONITOR
                user32.GetMonitorInfoW.argtypes = [wintypes.HMONITOR, ctypes.POINTER(MONITORINFO)]
                user32.GetMonitorInfoW.restype = wintypes.BOOL
                info = MONITORINFO()
                info.cbSize = ctypes.sizeof(info)
                mon = user32.MonitorFromPoint(POINT(int(x), int(y)), 2)
                if mon and user32.GetMonitorInfoW(mon, ctypes.byref(info)):
                    box = info.rcWork
                    return box.left, box.top, max(420, box.right - box.left), max(320, box.bottom - box.top)
            except (AttributeError, OSError, ValueError):
                pass
        return self._work_area()

    def _snap_kind(self, px, py, area):
        left, top, width, height = area
        right, bottom = left + width, top + height
        edge = 18
        corner = 72
        if px - left <= corner and py - top <= corner:
            return "tl"
        if right - px <= corner and py - top <= corner:
            return "tr"
        if px - left <= corner and bottom - py <= corner:
            return "bl"
        if right - px <= corner and bottom - py <= corner:
            return "br"
        if py - top <= edge:
            return "full"
        if px - left <= edge:
            return "left"
        if right - px <= edge:
            return "right"
        return ""

    def _snap_box(self, kind, area):
        left, top, width, height = area
        half_w, half_h = width // 2, height // 2
        boxes = {
            "full": (left, top, width, height),
            "left": (left, top, half_w, height),
            "right": (left + half_w, top, width - half_w, height),
            "tl": (left, top, half_w, half_h),
            "tr": (left + half_w, top, width - half_w, half_h),
            "bl": (left, top + half_h, half_w, height - half_h),
            "br": (left + half_w, top + half_h, width - half_w, height - half_h),
        }
        return boxes.get(kind)

    def _show_ghost(self, box):
        if not box:
            return
        x, y, w, h = box
        ghost = self._ghost
        if ghost is None or not ghost.winfo_exists():
            ghost = tk.Toplevel(self.root)
            ghost.overrideredirect(True)
            try:
                ghost.attributes("-topmost", True)
                ghost.attributes("-alpha", 0.28)
            except tk.TclError:
                pass
            self._ghost = ghost
        ghost.configure(bg=self._colors()["accent"])
        ghost.geometry("%dx%d+%d+%d" % (int(w), int(h), int(x), int(y)))
        ghost.deiconify()
        ghost.lift()

    def _hide_ghost(self):
        ghost = self._ghost
        if ghost is not None and ghost.winfo_exists():
            ghost.withdraw()

    def _apply_snap(self, kind, area=None):
        if not self._snap:
            self._normal = self.root.geometry()
        if area is None:
            area = self._work_at(self.root.winfo_pointerx(), self.root.winfo_pointery())
        box = self._snap_box(kind, area)
        if not box:
            return
        x, y, w, h = box
        self._hide_ghost()
        self._hide_snap_menu()
        self.root.geometry("%dx%d+%d+%d" % (int(w), int(h), int(x), int(y)))
        self._snap = kind
        self._zoomed = kind == "full"
        self.btn_max.configure(text="❐")
        self._grips_follow()

    def _restore_free(self):
        self.root.geometry(self._normal)
        self._snap = None
        self._zoomed = False
        self.btn_max.configure(text="□")
        self._grips_follow()

    def _pointer_in(self, widget):
        try:
            if widget is None or not widget.winfo_exists():
                return False
            px, py = self.root.winfo_pointerxy()
            x, y = widget.winfo_rootx(), widget.winfo_rooty()
            return x <= px < x + widget.winfo_width() and y <= py < y + widget.winfo_height()
        except tk.TclError:
            return False

    def _snap_menu_arm(self, _event):
        if self._snap_wait:
            self.root.after_cancel(self._snap_wait)
        self._snap_wait = self.root.after(280, self._show_snap_menu)

    def _snap_menu_away(self, _event):
        if self._snap_wait:
            self.root.after_cancel(self._snap_wait)
            self._snap_wait = None
        self.root.after(200, self._snap_menu_close_if_out)

    def _snap_menu_close_if_out(self):
        if self._pointer_in(self.btn_max) or self._pointer_in(self._snap_menu):
            return
        self._hide_snap_menu()

    def _hide_snap_menu(self):
        menu = self._snap_menu
        self._snap_menu = None
        if menu is not None:
            try:
                menu.destroy()
            except tk.TclError:
                pass

    def _show_snap_menu(self):
        self._snap_wait = None
        if not self._pointer_in(self.btn_max):
            return
        self._hide_snap_menu()
        colors = self._colors()
        menu = tk.Toplevel(self.root)
        menu.overrideredirect(True)
        try:
            menu.attributes("-topmost", True)
        except tk.TclError:
            pass
        menu.configure(bg=colors["line"])
        sheet = tk.Frame(menu, bg=colors["panel"], padx=8, pady=8)
        sheet.pack(padx=1, pady=1)
        order = (
            ("left", 0, 0), ("right", 0, 1), ("full", 0, 2),
            ("tl", 1, 0), ("tr", 1, 1), ("bl", 1, 2), ("br", 1, 3),
        )
        for kind, row, column in order:
            cell = tk.Canvas(sheet, width=52, height=36, highlightthickness=0, bd=0, bg=colors["bg"], cursor="hand2")
            cell.grid(row=row, column=column, padx=3, pady=3)
            self._draw_layout(cell, kind, colors)
            cell.bind("<Button-1>", lambda _event, name=kind: self._apply_snap(name))
            cell.bind("<Enter>", lambda _event, widget=cell: widget.configure(bg=colors["accent"]))
            cell.bind("<Leave>", lambda _event, widget=cell: widget.configure(bg=colors["bg"]))
        menu.bind("<Enter>", lambda _event: None)
        menu.bind("<Leave>", self._snap_menu_away)
        self._snap_menu = menu
        menu.update_idletasks()
        width = menu.winfo_reqwidth()
        height = menu.winfo_reqheight()
        x = self.btn_max.winfo_rootx() + self.btn_max.winfo_width() - width
        y = self.btn_max.winfo_rooty() + self.btn_max.winfo_height() + 6
        area = self._work_at(x, y)
        if x < area[0]:
            x = area[0]
        if x + width > area[0] + area[2]:
            x = area[0] + area[2] - width
        if y + height > area[1] + area[3]:
            y = self.btn_max.winfo_rooty() - height - 6
        menu.geometry("+%d+%d" % (int(x), int(y)))

    def _draw_layout(self, canvas, kind, colors):
        filled = {
            "left": {(0, 0), (0, 1)},
            "right": {(1, 0), (1, 1)},
            "tl": {(0, 0)},
            "tr": {(1, 0)},
            "bl": {(0, 1)},
            "br": {(1, 1)},
            "full": {(0, 0), (1, 0), (0, 1), (1, 1)},
        }[kind]
        pad, cols, rows = 5, 2, 2
        cell_w, cell_h = 20, 12
        for col in range(cols):
            for row in range(rows):
                x0 = pad + col * (cell_w + 2)
                y0 = pad + row * (cell_h + 2)
                on = (col, row) in filled
                canvas.create_rectangle(
                    x0, y0, x0 + cell_w, y0 + cell_h,
                    fill=colors["accent"] if on else colors["panel"],
                    outline=colors["line"],
                )

    def _toggle_zoom(self):
        self._hide_snap_menu()
        if self._snap:
            self._restore_free()
            return
        self._apply_snap("full")

    def _make_pane(self, slot, key, title_key, min_size):
        pane = tk.Frame(slot)
        pane.pack(fill="both", expand=True)
        pane._key = key
        pane._title_key = title_key
        pane._slot = slot
        pane._min = min_size
        pane._out = False
        pane._drag = None
        pane._zone = ""
        pane._snap = None
        pane._zoomed = False
        pane._normal = ""
        pane._geom = None
        pane._grips = []
        bar = tk.Frame(pane, height=36)
        bar.pack_propagate(False)
        pane._bar = bar
        title = tk.Label(bar, text="", font=FONT, anchor="w")
        title.pack(side="left", padx=8)
        pane._title = title
        dock = self._button(bar, "", lambda p=pane: self._dock_pane(p), padx=8, pady=2)
        dock.pack(side="right", padx=(0, 8), pady=4)
        pane._dock_btn = dock
        close = self._chrome_btn(bar, "×", lambda p=pane: self._dock_pane(p), "close")
        close.pack(side="right", fill="y")
        maxb = self._chrome_btn(bar, "□", lambda p=pane: self._pane_zoom(p), "max")
        maxb.pack(side="right", fill="y")
        pane._max = maxb
        body = tk.Frame(pane)
        body.pack(fill="both", expand=True)
        pane._body = body
        for widget in (bar, title):
            widget.bind("<ButtonPress-1>", lambda event, p=pane: self._pane_drag_start(event, p))
            widget.bind("<B1-Motion>", lambda event, p=pane: self._pane_drag_move(event, p))
            widget.bind("<ButtonRelease-1>", lambda event, p=pane: self._pane_drag_end(event, p))
            widget.bind("<Double-Button-1>", lambda _event, p=pane: self._pane_zoom(p))
        self._panes.append(pane)
        return pane

    def _pane_by(self, key):
        for pane in self._panes:
            if pane._key == key:
                return pane
        return None

    def _screens(self):
        found = []
        if sys.platform == "win32":
            try:
                import ctypes
                from ctypes import wintypes

                class MONITORINFO(ctypes.Structure):
                    _fields_ = [
                        ("cbSize", wintypes.DWORD),
                        ("rcMonitor", wintypes.RECT),
                        ("rcWork", wintypes.RECT),
                        ("dwFlags", wintypes.DWORD),
                    ]

                user32 = ctypes.WinDLL("user32", use_last_error=True)
                user32.GetMonitorInfoW.argtypes = [wintypes.HMONITOR, ctypes.POINTER(MONITORINFO)]
                user32.GetMonitorInfoW.restype = wintypes.BOOL

                @ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HMONITOR, wintypes.HDC, ctypes.POINTER(wintypes.RECT), wintypes.LPARAM)
                def each(monitor, _hdc, _rect, _data):
                    info = MONITORINFO()
                    info.cbSize = ctypes.sizeof(info)
                    if user32.GetMonitorInfoW(monitor, ctypes.byref(info)):
                        box = info.rcWork
                        found.append((box.left, box.top, max(420, box.right - box.left), max(320, box.bottom - box.top)))
                    return True

                user32.EnumDisplayMonitors(None, None, each, 0)
            except (AttributeError, OSError, ValueError):
                found = []
        return found or [self._work_area()]

    def _toggle_split(self):
        if any(pane._out for pane in self._panes):
            for pane in list(self._panes):
                self._dock_pane(pane)
            self._restore_console()
        else:
            self._split_open()
        self._split_label()

    def _split_open(self):
        areas = self._screens()
        here = self._work_at(self.root.winfo_rootx() + 20, self.root.winfo_rooty() + 20)
        target = here
        for area in areas:
            if area != here:
                target = area
                break
        left, top, width, height = target
        pane_w = min(640, max(420, width - 80))
        if target == here:
            x = self.root.winfo_x() + self.root.winfo_width() + 16
            y = max(top, self.root.winfo_y())
            if x + pane_w > left + width:
                x = left + 24
        else:
            x = left + 32
            y = top + 32
        live_h = 168
        gap = 12
        y_cursor = y
        short = [pane for pane in self._panes if pane._min[1] <= 180]
        tall = [pane for pane in self._panes if pane._min[1] > 180]
        for pane in short:
            self._detach(pane, pane_w, live_h, x, y_cursor)
            y_cursor += live_h + gap
        room = top + height - y_cursor - 16
        count = max(1, len(tall))
        each = max(360, min(720, room // count)) if tall else 0
        if tall and y_cursor + each * len(tall) > top + height:
            each = max(360, room // count)
        for pane in tall:
            self._detach(pane, pane_w, each, x, y_cursor)
            y_cursor += each + gap
        self._fit_console()

    def _detach(self, pane, width, height, x, y):
        if pane is None or pane._out:
            return
        pane._slot.pack_forget()
        pane._bar.pack(side="top", fill="x", before=pane._body)
        self.root.tk.call("wm", "manage", pane)
        self.root.tk.call("wm", "overrideredirect", pane, True)
        self.root.tk.call("wm", "title", pane, tr(self.lang, pane._title_key))
        self.root.tk.call("wm", "geometry", pane, "%dx%d+%d+%d" % (int(width), int(height), int(x), int(y)))
        pane._normal = "%dx%d+%d+%d" % (int(width), int(height), int(x), int(y))
        pane._out = True
        pane._snap = None
        pane._zoomed = False
        pane._max.configure(text="□")
        self._mount_pane_grips(pane)
        hide_window_border(pane, self._colors()["panel"])
        self._trail_sig = None

    def _dock_pane(self, pane):
        if pane is None or not pane._out:
            return
        self._hide_ghost()
        try:
            pane._bar.grab_release()
        except tk.TclError:
            pass
        for grip in pane._grips:
            grip.destroy()
        pane._grips = []
        pane._drag = None
        pane._geom = None
        self.root.tk.call("wm", "forget", pane)
        pane._bar.pack_forget()
        pane.pack(fill="both", expand=True)
        if pane._key == "trail":
            self.trail_slot.pack(fill="both", expand=True, pady=(10, 0))
        else:
            self.live_slot.pack(side="bottom", fill="x")
        pane._out = False
        pane._snap = None
        pane._zoomed = False
        pane._max.configure(text="□")
        self._trail_sig = None
        self._feed_sig = None

    def _fit_console(self):
        if self._split_saved is None and not self._snap:
            self._split_saved = self.root.geometry()
        if self._snap or self._zoomed:
            return
        self.root.update_idletasks()
        height = max(360, self.shell.winfo_reqheight() + 12)
        self.root.minsize(420, 360)
        self.root.geometry("%dx%d+%d+%d" % (
            self.root.winfo_width(), height, self.root.winfo_x(), self.root.winfo_y(),
        ))

    def _restore_console(self):
        self.root.minsize(420, 640)
        if self._split_saved and not self._snap and not self._zoomed:
            self.root.geometry(self._split_saved)
            self._normal = self._split_saved
        self._split_saved = None

    def _split_label(self):
        opened = any(pane._out for pane in self._panes)
        self.split_btn.configure(text=tr(self.lang, "dock" if opened else "split"))
        for pane in self._panes:
            pane._title.configure(text=tr(self.lang, pane._title_key))
            pane._dock_btn.configure(text=tr(self.lang, "dock"))
            if pane._out:
                try:
                    self.root.tk.call("wm", "title", pane, tr(self.lang, pane._title_key))
                except tk.TclError:
                    pass

    def _pane_drag_start(self, event, pane):
        if not pane._out:
            return
        if pane._snap:
            self._pane_restore(pane)
            width = max(pane.winfo_width(), pane._min[0])
            left = event.x_root - min(max(event.x, 24), width - 48)
            top = event.y_root - max(event.y, 0)
            self.root.tk.call("wm", "geometry", pane, "+%d+%d" % (left, top))
        pane._drag = (event.x_root - pane.winfo_x(), event.y_root - pane.winfo_y())
        pane._zone = ""
        try:
            pane._bar.grab_set()
        except tk.TclError:
            pass

    def _pane_drag_move(self, event, pane):
        if not pane._drag or pane._zoomed:
            return
        self.root.tk.call("wm", "geometry", pane, "+%d+%d" % (
            event.x_root - pane._drag[0], event.y_root - pane._drag[1],
        ))
        area = self._work_at(event.x_root, event.y_root)
        kind = self._snap_kind(event.x_root, event.y_root, area)
        pane._zone = kind
        if kind:
            self._show_ghost(self._snap_box(kind, area))
        else:
            self._hide_ghost()

    def _pane_drag_end(self, event, pane):
        zone = pane._zone
        area = self._work_at(event.x_root, event.y_root)
        pane._drag = None
        pane._zone = ""
        try:
            pane._bar.grab_release()
        except tk.TclError:
            pass
        self._hide_ghost()
        if zone:
            self._pane_apply(pane, zone, area)
        elif not pane._snap:
            pane._normal = pane.winfo_geometry()

    def _pane_apply(self, pane, kind, area=None):
        if not pane._snap:
            pane._normal = pane.winfo_geometry()
        if area is None:
            area = self._work_at(pane.winfo_pointerx(), pane.winfo_pointery())
        box = self._snap_box(kind, area)
        if not box:
            return
        x, y, w, h = box
        self._hide_ghost()
        self.root.tk.call("wm", "geometry", pane, "%dx%d+%d+%d" % (int(w), int(h), int(x), int(y)))
        pane._snap = kind
        pane._zoomed = kind == "full"
        pane._max.configure(text="❐")
        self._pane_grips_follow(pane)

    def _pane_restore(self, pane):
        if pane._normal:
            self.root.tk.call("wm", "geometry", pane, pane._normal)
        pane._snap = None
        pane._zoomed = False
        pane._max.configure(text="□")
        self._pane_grips_follow(pane)

    def _pane_zoom(self, pane):
        if not pane._out:
            return
        if pane._snap:
            self._pane_restore(pane)
            return
        self._pane_apply(pane, "full")

    def _mount_pane_grips(self, pane):
        cursors = {
            "n": "size_ns", "s": "size_ns", "e": "size_we", "w": "size_we",
            "nw": "size_nw_se", "se": "size_nw_se", "ne": "size_ne_sw", "sw": "size_ne_sw",
        }
        specs = (
            ("n", {"relx": 0, "rely": 0, "relwidth": 1, "height": 6, "anchor": "nw"}),
            ("s", {"relx": 0, "rely": 1, "relwidth": 1, "height": 6, "anchor": "sw"}),
            ("w", {"relx": 0, "rely": 0, "relheight": 1, "width": 6, "anchor": "nw"}),
            ("e", {"relx": 1, "rely": 0, "relheight": 1, "width": 6, "anchor": "ne"}),
            ("nw", {"relx": 0, "rely": 0, "width": 14, "height": 14, "anchor": "nw"}),
            ("ne", {"relx": 1, "rely": 0, "width": 14, "height": 14, "anchor": "ne"}),
            ("sw", {"relx": 0, "rely": 1, "width": 14, "height": 14, "anchor": "sw"}),
            ("se", {"relx": 1, "rely": 1, "width": 14, "height": 14, "anchor": "se"}),
        )
        pane._grips = []
        for edge, opts in specs:
            grip = tk.Frame(pane, cursor=cursors[edge], bg=self._colors()["panel"])
            grip._cursor = cursors[edge]
            grip.place(**opts)
            grip.bind("<ButtonPress-1>", lambda event, name=edge, p=pane: self._pane_resize_start(event, name, p))
            grip.bind("<B1-Motion>", lambda event, p=pane: self._pane_resize_move(event, p))
            grip.bind("<ButtonRelease-1>", lambda event, p=pane: self._pane_resize_end(event, p))
            pane._grips.append(grip)
        self._pane_grips_follow(pane)

    def _pane_grips_follow(self, pane):
        live = not pane._zoomed
        for grip in pane._grips:
            try:
                grip.configure(cursor=grip._cursor if live else "arrow")
            except tk.TclError:
                pass

    def _pane_resize_start(self, event, edge, pane):
        if pane._zoomed:
            return
        pane._geom = {
            "edge": edge,
            "x": event.x_root, "y": event.y_root,
            "w": pane.winfo_width(), "h": pane.winfo_height(),
            "px": pane.winfo_x(), "py": pane.winfo_y(),
        }

    def _pane_resize_move(self, event, pane):
        g = pane._geom
        if not g:
            return
        dx = event.x_root - g["x"]
        dy = event.y_root - g["y"]
        x, y, w, h = g["px"], g["py"], g["w"], g["h"]
        edge = g["edge"]
        if "e" in edge:
            w = g["w"] + dx
        if "s" in edge:
            h = g["h"] + dy
        if "w" in edge:
            w = g["w"] - dx
            x = g["px"] + dx
        if "n" in edge:
            h = g["h"] - dy
            y = g["py"] + dy
        min_w, min_h = pane._min
        if w < min_w:
            if "w" in edge:
                x -= min_w - w
            w = min_w
        if h < min_h:
            if "n" in edge:
                y -= min_h - h
            h = min_h
        self.root.tk.call("wm", "geometry", pane, "%dx%d+%d+%d" % (int(w), int(h), int(x), int(y)))

    def _pane_resize_end(self, _event, pane):
        if not pane._geom:
            return
        pane._geom = None
        if pane._snap and pane._snap != "full":
            pane._snap = None
            pane._max.configure(text="□")
        if not pane._zoomed:
            pane._normal = pane.winfo_geometry()

    def _minimize(self):
        # Leave the window borderless. Toggling the frame here makes Windows
        # rebuild the taskbar, so the bar vanishes and the button does not
        # come back. Minimize the same window instead.
        if sys.platform != "win32":
            try:
                self.root.iconify()
            except tk.TclError:
                pass
            return
        try:
            import ctypes
            from ctypes import wintypes
            user32 = ctypes.WinDLL("user32", use_last_error=True)
            user32.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
            user32.ShowWindow.restype = wintypes.BOOL
            self._mark_appwindow()
            user32.ShowWindow(self._hwnd(), 6)
        except (AttributeError, OSError, tk.TclError):
            try:
                self.root.iconify()
            except tk.TclError:
                pass

    def _work_area(self):
        if sys.platform == "win32":
            try:
                import ctypes
                from ctypes import wintypes
                rect = wintypes.RECT()
                if ctypes.windll.user32.SystemParametersInfoW(0x0030, 0, ctypes.byref(rect), 0):
                    return rect.left, rect.top, max(420, rect.right - rect.left), max(520, rect.bottom - rect.top)
            except (AttributeError, OSError):
                pass
        return 0, 0, self.root.winfo_screenwidth(), self.root.winfo_screenheight()

    def _apply_window_icon(self):
        # withdraw() drops the icon set before the window is shown, so the
        # taskbar falls back to the host program. Put the Starfix mark back
        # on this window after the frame is settled.
        path = _asset("icon.ico")
        if not path:
            return
        try:
            self.root.iconbitmap(default=str(path))
        except tk.TclError:
            try:
                self.root.iconbitmap(str(path))
            except tk.TclError:
                pass
        if sys.platform != "win32":
            return
        try:
            import ctypes
            from ctypes import wintypes
            user32 = ctypes.WinDLL("user32", use_last_error=True)
            big, small = self._window_icons(user32)
            if not big and not small:
                return
            user32.SendMessageW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
            user32.SendMessageW.restype = ctypes.c_ssize_t
            set_class = getattr(user32, "SetClassLongPtrW", user32.SetClassLongW)
            set_class.argtypes = [wintypes.HWND, ctypes.c_int, ctypes.c_ssize_t]
            set_class.restype = ctypes.c_ssize_t
            hwnd = self._hwnd()

            def handle(icon):
                return int(getattr(icon, "value", icon) or 0)

            if big:
                user32.SendMessageW(hwnd, 0x0080, 1, handle(big))
                set_class(hwnd, -14, handle(big))
            if small:
                user32.SendMessageW(hwnd, 0x0080, 0, handle(small))
                set_class(hwnd, -34, handle(small))
            self._window_identity(hwnd)
        except (AttributeError, OSError, tk.TclError, ValueError):
            return

    def _window_identity(self, hwnd):
        # Without its own identity, Windows paints this window with the
        # Python icon because that is the program that opened it.
        import ctypes
        from ctypes import wintypes

        class GUID(ctypes.Structure):
            _fields_ = [
                ("Data1", ctypes.c_ulong),
                ("Data2", ctypes.c_ushort),
                ("Data3", ctypes.c_ushort),
                ("Data4", ctypes.c_ubyte * 8),
            ]

        class PROPERTYKEY(ctypes.Structure):
            _fields_ = [("fmtid", GUID), ("pid", ctypes.c_ulong)]

        class PROPVARIANT(ctypes.Structure):
            _fields_ = [
                ("vt", ctypes.c_ushort),
                ("r1", ctypes.c_ushort),
                ("r2", ctypes.c_ushort),
                ("r3", ctypes.c_ushort),
                ("psz", wintypes.LPWSTR),
                ("pad", ctypes.c_ulonglong),
            ]

        def guid(text):
            flat = text.replace("-", "")
            item = GUID()
            item.Data1 = int(flat[0:8], 16)
            item.Data2 = int(flat[8:12], 16)
            item.Data3 = int(flat[12:16], 16)
            raw = bytes.fromhex(flat[16:])
            for index, value in enumerate(raw):
                item.Data4[index] = value
            return item

        shell32 = ctypes.WinDLL("shell32", use_last_error=True)
        shell32.SHGetPropertyStoreForWindow.argtypes = [
            wintypes.HWND, ctypes.POINTER(GUID), ctypes.POINTER(ctypes.c_void_p),
        ]
        shell32.SHGetPropertyStoreForWindow.restype = ctypes.c_long
        store = ctypes.c_void_p()
        if shell32.SHGetPropertyStoreForWindow(hwnd, ctypes.byref(guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99")), ctypes.byref(store)) < 0 or not store.value:
            return
        vtbl = ctypes.cast(store, ctypes.POINTER(ctypes.POINTER(ctypes.c_void_p))).contents
        set_value = ctypes.WINFUNCTYPE(
            ctypes.c_long, ctypes.c_void_p, ctypes.POINTER(PROPERTYKEY), ctypes.POINTER(PROPVARIANT),
        )(vtbl[6])
        commit = ctypes.WINFUNCTYPE(ctypes.c_long, ctypes.c_void_p)(vtbl[7])
        release = ctypes.WINFUNCTYPE(ctypes.c_ulong, ctypes.c_void_p)(vtbl[2])
        key = PROPERTYKEY()
        key.fmtid = guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3")
        key.pid = 5
        value = PROPVARIANT()
        value.vt = 31
        value.psz = "GuguguBear.Starfix"
        try:
            if set_value(store, ctypes.byref(key), ctypes.byref(value)) >= 0:
                commit(store)
        finally:
            release(store)

    def _window_icons(self, user32):
        cached = getattr(self, "_win_icons", None)
        if cached:
            return cached
        path = _asset("icon.ico")
        if not path:
            return (0, 0)
        import ctypes
        from ctypes import wintypes
        user32.LoadImageW.argtypes = [
            wintypes.HINSTANCE, wintypes.LPCWSTR, wintypes.UINT,
            ctypes.c_int, ctypes.c_int, wintypes.UINT,
        ]
        user32.LoadImageW.restype = wintypes.HICON
        user32.GetSystemMetrics.argtypes = [ctypes.c_int]
        user32.GetSystemMetrics.restype = ctypes.c_int
        wide = user32.GetSystemMetrics(11) or 32
        high = user32.GetSystemMetrics(12) or 32
        small_w = user32.GetSystemMetrics(49) or 16
        small_h = user32.GetSystemMetrics(50) or 16
        big = user32.LoadImageW(None, str(path), 1, wide, high, 0x10)
        small = user32.LoadImageW(None, str(path), 1, small_w, small_h, 0x10)
        self._win_icons = (big, small)
        return self._win_icons

    def _button(self, parent, text, command, primary=False, padx=10, pady=4):
        label = tk.Label(parent, text=text, font=FONT, padx=padx, pady=pady, cursor="hand2")
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
        self.root.configure(bg=c["panel"])
        self.shell.configure(bg=c["panel"])
        self.titlebar.configure(bg=c["panel"])
        self.rule.configure(bg=c["panel"])
        self.card.configure(bg=c["panel"])
        self.design.configure(bg=c["panel"])
        self.foot.configure(bg=c["panel"])
        self.foot_rule.configure(bg=c["line"])
        self.mark.configure(bg=c["panel"], fg=c["accent"])
        self.bar_title.configure(bg=c["panel"], fg=c["ink"])
        self.bar_sub.configure(bg=c["panel"], fg=c["muted"])
        for widget in self.chrome:
            widget.configure(bg=c["panel"], fg=c["ink"])
        for widget in (self.lead, self.tos, self.linked, self.log_label, self.lang_label, self.look, self.meta, self.api_label, self.room_label, self.trail_hint):
            widget.configure(bg=c["panel"], fg=c["muted"])
        self.trail_title.configure(bg=c["panel"], fg=c["accent"])
        self.trail_box.configure(bg=c["panel"])
        self.trail.configure(bg=c["bg"])
        self.trail_scroll._colors = c
        self.linked.configure(fg=c["ink"])
        self.feed.configure(bg=c["bg"])
        self.trail_slot.configure(bg=c["panel"])
        self.live_slot.configure(bg=c["panel"])
        for pane in self._panes:
            pane.configure(bg=c["panel"])
            pane._bar.configure(bg=c["panel"])
            pane._body.configure(bg=c["panel"])
            pane._title.configure(bg=c["panel"], fg=c["accent"])
            for grip in pane._grips:
                grip.configure(bg=c["panel"])
            if pane._out:
                hide_window_border(pane, c["panel"])
        for grip in getattr(self, "_grips", []):
            grip.configure(bg=c["panel"])
        hide_window_border(self.root, c["panel"])
        self._trail_sig = None
        self._trail_refresh()
        self.log_label.configure(fg=c["accent"])
        self.lang_label.configure(fg=c["accent"])
        self.look.configure(fg=c["accent"])
        self.trail_title.configure(fg=c["accent"])
        self.err.configure(bg=c["panel"], fg=c["err"])
        self.pair.configure(bg=c["bg"], highlightbackground=c["accent"])
        self.pair_text.configure(bg=c["bg"], fg=c["ink"])
        self.pair_row.configure(bg=c["bg"])
        self.log_row.configure(bg=c["panel"])
        self.lang_row.configure(bg=c["panel"])
        self.theme_row.configure(bg=c["panel"])
        self.actions.configure(bg=c["panel"])
        self.manual.configure(bg=c["panel"])
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
            self._link_until = time.monotonic() + 1.26
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
        else:
            text = tr(self.lang, "place_none")
        names = [item.get("name") for item in (place.get("gear") or []) if item.get("name")]
        self._feed = {
            "place": self._shown(text),
            "ship": self._shown(place.get("ship") or ""),
            "gear": "  ·  ".join(names[:8]),
            "on": bool(state.get("running")),
        }
        self.meta.configure(text=_status_text(state, self.lang))
        err = self._local_error(state.get("error") or "")
        self.err.configure(text=err)
        if err and not self.err.winfo_ismapped():
            self.err.pack(fill="x", pady=(4, 0))
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
        self.back.configure(text=tr(self.lang, "back"))
        self.pair_yes.configure(text=tr(self.lang, "pair_yes"))
        self.pair_no.configure(text=tr(self.lang, "pair_no"))
        self.trail_title.configure(text=tr(self.lang, "trail_title"))
        self.trail_hint.configure(text=tr(self.lang, "trail_hint"))
        self._split_label()
        self._trail_sig = None
        for key, btn in self.theme_buttons.items():
            btn.configure(text=tr(self.lang, "theme." + key))

    def _local_error(self, err):
        key = ERR_MAP.get(err)
        if key:
            return tr(self.lang, key)
        if err.startswith("房间服务返回"):
            return tr(self.lang, "err_http") + err[len("房间服务返回"):]
        return err

    def _fit_wrap(self, event=None):
        width = event.width if event is not None else self.card.winfo_width()
        wrap = max(180, width - 8)
        self.linked.configure(wraplength=wrap)
        self.pair_text.configure(wraplength=wrap)
        self.err.configure(wraplength=wrap)
        hint = self.trail_pane.winfo_width() if self.trail_pane._out else width
        self.trail_hint.configure(wraplength=max(180, hint - 24))

    def _refit(self):
        self._fit_wrap()

    def _mount_grips(self):
        cursors = {
            "n": "size_ns", "s": "size_ns", "e": "size_we", "w": "size_we",
            "nw": "size_nw_se", "se": "size_nw_se", "ne": "size_ne_sw", "sw": "size_ne_sw",
        }
        specs = (
            ("n", {"relx": 0, "rely": 0, "relwidth": 1, "height": 6, "anchor": "nw"}),
            ("s", {"relx": 0, "rely": 1, "relwidth": 1, "height": 6, "anchor": "sw"}),
            ("w", {"relx": 0, "rely": 0, "relheight": 1, "width": 6, "anchor": "nw"}),
            ("e", {"relx": 1, "rely": 0, "relheight": 1, "width": 6, "anchor": "ne"}),
            ("nw", {"relx": 0, "rely": 0, "width": 14, "height": 14, "anchor": "nw"}),
            ("ne", {"relx": 1, "rely": 0, "width": 14, "height": 14, "anchor": "ne"}),
            ("sw", {"relx": 0, "rely": 1, "width": 14, "height": 14, "anchor": "sw"}),
            ("se", {"relx": 1, "rely": 1, "width": 14, "height": 14, "anchor": "se"}),
        )
        self._grips = []
        for edge, opts in specs:
            grip = tk.Frame(self.root, cursor=cursors[edge], bg=self._colors()["panel"])
            grip._cursor = cursors[edge]
            grip.place(**opts)
            grip.bind("<ButtonPress-1>", lambda event, name=edge: self._resize_start(event, name))
            grip.bind("<B1-Motion>", self._resize_move)
            grip.bind("<ButtonRelease-1>", self._resize_end)
            self._grips.append(grip)
        self._grips_follow()

    def _grips_follow(self):
        live = not self._zoomed
        for grip in getattr(self, "_grips", []):
            grip.configure(cursor=grip._cursor if live else "arrow")
        self._size_border(live)

    def _size_border(self, allow):
        # A maximized window still carries the thick frame, so Windows keeps
        # offering a resize along every edge. Drop that frame until it is restored.
        if sys.platform != "win32":
            return
        try:
            import ctypes
            from ctypes import wintypes
            user32 = ctypes.WinDLL("user32", use_last_error=True)
            get_long = getattr(user32, "GetWindowLongPtrW", user32.GetWindowLongW)
            set_long = getattr(user32, "SetWindowLongPtrW", user32.SetWindowLongW)
            get_long.argtypes = [wintypes.HWND, ctypes.c_int]
            get_long.restype = ctypes.c_ssize_t
            set_long.argtypes = [wintypes.HWND, ctypes.c_int, ctypes.c_ssize_t]
            set_long.restype = ctypes.c_ssize_t
            user32.SetWindowPos.argtypes = [
                wintypes.HWND, wintypes.HWND, ctypes.c_int, ctypes.c_int,
                ctypes.c_int, ctypes.c_int, wintypes.UINT,
            ]
            user32.SetWindowPos.restype = wintypes.BOOL
            thick = 0x00040000
            hwnd = self._hwnd()
            style = get_long(hwnd, -16)
            if allow:
                if not getattr(self, "_had_thick", False):
                    return
                style |= thick
            else:
                self._had_thick = bool(style & thick)
                if not (style & thick):
                    return
                style &= ~thick
            set_long(hwnd, -16, style)
            user32.SetWindowPos(hwnd, None, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0004 | 0x0010 | 0x0020)
        except (AttributeError, OSError, tk.TclError, ValueError):
            return

    def _resize_start(self, event, edge):
        if self._zoomed:
            return
        self._geom = {
            "edge": edge,
            "x": event.x_root, "y": event.y_root,
            "w": self.root.winfo_width(), "h": self.root.winfo_height(),
            "px": self.root.winfo_x(), "py": self.root.winfo_y(),
        }

    def _resize_move(self, event):
        g = self._geom
        if not g:
            return
        dx = event.x_root - g["x"]
        dy = event.y_root - g["y"]
        x, y, w, h = g["px"], g["py"], g["w"], g["h"]
        edge = g["edge"]
        if "e" in edge:
            w = g["w"] + dx
        if "s" in edge:
            h = g["h"] + dy
        if "w" in edge:
            w = g["w"] - dx
            x = g["px"] + dx
        if "n" in edge:
            h = g["h"] - dy
            y = g["py"] + dy
        if w < 420:
            if "w" in edge:
                x -= 420 - w
            w = 420
        if h < 520:
            if "n" in edge:
                y -= 520 - h
            h = 520
        self.root.geometry("%dx%d+%d+%d" % (int(w), int(h), int(x), int(y)))

    def _resize_end(self, _event):
        if not self._geom:
            return
        self._geom = None
        if self._snap and self._snap != "full":
            self._snap = None
            self.btn_max.configure(text="□")
        if not self._zoomed:
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

    def _trail_wheel(self, event):
        step = int(-event.delta / 120) if event.delta else 0
        if step:
            self.trail.yview_scroll(step, "units")

    def _trail_sized(self, event):
        if abs(event.width - self._trail_width) < 8:
            return
        self._trail_width = event.width
        self._trail_sig = None
        self._trail_refresh()

    def _trail_clock(self, stamp):
        text = str(stamp or "")
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        try:
            from datetime import datetime
            return datetime.fromisoformat(text).astimezone().strftime("%H:%M")
        except ValueError:
            return text[11:16]

    def _trail_where(self, ev):
        if ev.get("destKind") == "beacon":
            return tr(self.lang, "kind.beacon")
        if ev.get("dest"):
            return ev["dest"]
        if ev.get("code"):
            return ev["code"]
        return tr(self.lang, "kind.somewhere")

    def _shown(self, text):
        if not text:
            return ""
        return names.speak(self.lang, text)

    def _trail_line(self, ev):
        kind = ev.get("kind") or ""
        if kind == "online":
            return tr(self.lang, "kind.online")
        if kind == "place":
            return tr(self.lang, "kind.place", code=ev.get("code") or "")
        if kind == "contract":
            result = ev.get("result") or "complete"
            key = {"fail": "kind.fail", "abandon": "kind.abandon"}.get(result, "kind.done")
            return tr(self.lang, key)
        if kind == "mission":
            say = ev.get("say") or ""
            if say.startswith(MISSION_NOISE) or say.startswith("新的任务") or say.startswith("新任務"):
                return ""
            return say[:72]
        if kind == "pact":
            phase = ev.get("phase") or "accept"
            if phase not in ("accept", "done", "fail", "share"):
                phase = "accept"
            return tr(self.lang, "kind.pact." + phase, title=ev.get("title") or "")
        if kind == "universe":
            return tr(self.lang, "kind.universe")
        if kind == "leave":
            return tr(self.lang, "kind.leave")
        if kind == "law":
            return tr(self.lang, "kind.law", where=ev.get("where") or "")
        if kind == "watch":
            return tr(self.lang, "kind.watch." + ("out" if ev.get("side") == "out" else "in"))
        if kind == "armistice":
            return tr(self.lang, "kind.armistice." + ("out" if ev.get("side") == "out" else "in"))
        if kind == "hangar":
            return tr(self.lang, "kind.hangar." + ("ready" if ev.get("step") == "ready" else "ask"))
        if kind == "hurt":
            return tr(self.lang, "kind.hurt")
        if kind == "heal":
            return tr(self.lang, "kind.heal")
        if kind == "unseat":
            return tr(self.lang, "kind.unseat")
        if kind in ("buy", "sell"):
            return tr(self.lang, "kind." + kind, item=ev.get("item") or "", qty=ev.get("qty") or 0)
        if kind == "ship":
            return tr(self.lang, "kind.ship", ship=ev.get("ship") or "")
        if kind == "aim":
            return tr(self.lang, "kind.aim", where=self._trail_where(ev))
        if kind == "jump":
            return tr(self.lang, "kind.jump", start=ev.get("start") or tr(self.lang, "kind.somewhere"), where=self._trail_where(ev))
        if kind == "arrive":
            return tr(self.lang, "kind.arrive", where=self._trail_where(ev))
        if kind == "down":
            return tr(self.lang, "kind.down.player" if ev.get("by") == "player" else "kind.down.npc")
        if kind == "wreck":
            return tr(self.lang, "kind.wreck")
        if kind == "strike":
            return tr(self.lang, "kind.strike")
        if kind == "crime":
            level = ev.get("level") or 0
            if not level:
                return tr(self.lang, "kind.clear")
            return tr(self.lang, "kind.crime", n=level)
        if kind == "crash":
            return tr(self.lang, "kind.crash." + (ev.get("how") or "fault"))
        return ""

    def _trail_tone(self, ev, colors):
        kind = ev.get("kind")
        if kind in ("crash", "wreck", "down", "strike", "hurt"):
            return colors["err"]
        if kind == "pact" and ev.get("phase") == "fail":
            return colors["err"]
        if kind == "crime":
            return colors["err"] if ev.get("level") else colors["accent"]
        if kind == "contract" and ev.get("result") in ("fail", "abandon"):
            return colors["err"]
        if kind in ("online", "jump", "arrive", "aim", "universe", "heal", "hangar"):
            return colors["accent"]
        return colors["ink"]

    def _titled_near(self, rows, index):
        result = rows[index].get("result") or "complete"
        phase = {"fail": "fail", "abandon": "abandon"}.get(result, "done")
        for ev in rows[max(0, index - 3):index + 4]:
            if ev.get("kind") == "pact" and ev.get("phase") == phase:
                return True
        return False

    def _story(self, events, colors):
        # Objective spam stays in the file. The panel tells the trip:
        # sign in, travel, take a contract, finish it, and what went wrong.
        rows = list(events or [])
        shown = []
        index = 0
        while index < len(rows):
            ev = rows[index]
            kind = ev.get("kind") or ""
            nxt = rows[index + 1] if index + 1 < len(rows) else None
            if kind == "contract" and not ev.get("title") and self._titled_near(rows, index):
                index += 1
                continue
            if kind == "online" and nxt and nxt.get("kind") == "universe":
                text = tr(self.lang, "kind.online") + "  ·  " + tr(self.lang, "kind.universe")
                shown.append((self._trail_clock(ev.get("t")), text, colors["accent"]))
                index += 2
                continue
            if kind == "aim" and nxt and nxt.get("kind") == "jump":
                jump = nxt
                landed = rows[index + 2] if index + 2 < len(rows) and rows[index + 2].get("kind") == "arrive" else None
                start = jump.get("start") or tr(self.lang, "kind.somewhere")
                where = self._trail_where(jump)
                key = "kind.travel_done" if landed else "kind.travel"
                shown.append((
                    self._trail_clock(jump.get("t")),
                    self._shown(tr(self.lang, key, start=start, where=where)),
                    colors["accent"],
                ))
                index += 3 if landed else 2
                continue
            if kind == "jump" and nxt and nxt.get("kind") == "arrive":
                shown.append((
                    self._trail_clock(ev.get("t")),
                    self._shown(tr(self.lang, "kind.travel_done", start=ev.get("start") or tr(self.lang, "kind.somewhere"), where=self._trail_where(ev))),
                    colors["accent"],
                ))
                index += 2
                continue
            text = self._shown(self._trail_line(ev))
            clock = self._trail_clock(ev.get("t"))
            if text and not any(prev[0] == clock and prev[1] == text for prev in shown[-8:]):
                shown.append((clock, text, self._trail_tone(ev, colors)))
            index += 1
        return shown

    def _trail_summary(self, sess):
        parts = []
        if sess["places"]:
            parts.append(tr(self.lang, "trail_places", n=len(sess["places"])))
        if sess["ships"]:
            parts.append(self._shown(sess["ships"][-1]))
        contracts = sess["contracts"]
        titled = 0
        failed = 0
        for ev in sess.get("events") or []:
            if ev.get("kind") != "pact":
                continue
            if ev.get("phase") == "done":
                titled += 1
            elif ev.get("phase") == "fail":
                failed += 1
        bare = contracts.get("complete", 0) + contracts.get("fail", 0) + contracts.get("abandon", 0)
        total = max(bare, titled + failed)
        if total:
            parts.append(tr(self.lang, "trail_contract", n=total))
        if sess["bought"]:
            parts.append(tr(self.lang, "trail_buy", n=sess["bought"]))
        if sess["sold"]:
            parts.append(tr(self.lang, "trail_sell", n=sess["sold"]))
        if not parts:
            parts.append(tr(self.lang, "trail_steps", n=sess["count"]))
        return "  ·  ".join(parts)

    def _trail_refresh(self):
        try:
            if not self.trail.winfo_exists():
                return
            rev = self.core.history.revision()
        except (AttributeError, tk.TclError):
            return
        try:
            days = self.core.history.days()
        except AttributeError:
            return
        known = {day["day"] for day in days}
        if days and (not self._trail_picked or self._trail_day not in known):
            self._trail_day = days[0]["day"]
        chosen = next((day for day in days if day["day"] == self._trail_day), None)
        if chosen and not any(sess["key"] in self._trail_open for sess in chosen["sessions"]):
            if self._trail_seed != self._trail_day:
                self._trail_open.add(chosen["sessions"][-1]["key"])
                self._trail_seed = self._trail_day
        width = max(self.trail.winfo_width(), 2)
        sig = (rev, self._trail_day, tuple(sorted(self._trail_open)), self.theme, self.lang, width)
        if sig == self._trail_sig:
            return
        self._trail_days = days
        self._trail_sig = sig
        self._trail_draw(days, width)

    def _trail_click(self, event):
        x = self.trail.canvasx(event.x)
        y = self.trail.canvasy(event.y)
        for hit in self._trail_hits:
            if hit["x0"] <= x <= hit["x1"] and hit["y0"] <= y <= hit["y1"]:
                if hit["kind"] == "day":
                    self._trail_picked = True
                    self._trail_day = hit["key"]
                    self._trail_open = set()
                    self._trail_seed = ""
                elif hit["key"] in self._trail_open:
                    self._trail_open.remove(hit["key"])
                else:
                    self._trail_open.add(hit["key"])
                self._trail_sig = None
                self._trail_refresh()
                return

    def _trail_draw(self, days, width):
        import tkinter.font as tkfont
        box = self.trail
        held = box.yview()[0] if days else 0
        box.delete("all")
        self._trail_hits = []
        self._trail_rail = None
        colors = self._colors()
        box.configure(bg=colors["bg"])
        if not days:
            box.create_text(
                16, 36, text=tr(self.lang, "trail_empty"), anchor="w", font=FONT,
                fill=colors["muted"], width=max(120, width - 32),
            )
            box.configure(scrollregion=(0, 0, width, max(80, box.winfo_height())))
            return
        known = {day["day"] for day in days}
        if self._trail_day not in known:
            self._trail_day = days[0]["day"]
            held = 0
        measure = tkfont.Font(font=FONT)
        x = 12
        y = 14
        limit = max(120, width - 16)
        for day in days[:18]:
            label = day["day"]
            chip = measure.measure(label) + 18
            if x + chip > limit and x > 12:
                x = 12
                y += 28
            selected = day["day"] == self._trail_day
            box.create_rectangle(
                x, y, x + chip, y + 22,
                fill=colors["accent"] if selected else colors["panel"],
                outline=colors["accent"], width=1,
            )
            box.create_text(
                x + 9, y + 11, text=label, anchor="w", font=FONT,
                fill=colors["on"] if selected else colors["muted"],
            )
            self._trail_hits.append({
                "x0": x, "y0": y, "x1": x + chip, "y1": y + 22,
                "kind": "day", "key": day["day"],
            })
            x += chip + 6
        chosen = next(day for day in days if day["day"] == self._trail_day)
        y += 36
        rail_x = 24
        blocks = []
        for sess in chosen["sessions"]:
            lines = []
            if sess["key"] in self._trail_open:
                for clock, text, tone in self._story(sess["events"], colors):
                    lines.append((clock, text, tone))
            block_h = 46 + ((len(lines) * 20 + 8) if lines else 0)
            blocks.append((sess, lines, y, block_h))
            y += block_h + 8
        if blocks:
            y0 = blocks[0][2] + 22
            last_sess, last_lines, last_y, _last_h = blocks[-1]
            y1 = last_y + 22
            if last_lines:
                y1 = last_y + 46 + (len(last_lines) - 1) * 20 + 8
            box.create_line(rail_x, y0, rail_x, max(y0, y1), fill=colors["line"], width=1)
            self._trail_rail = (rail_x, y0, max(y0 + 24, y1))
        room = max(80, width - 120)
        for sess, lines, top, _block_h in blocks:
            live = sess is chosen["sessions"][-1]
            bottom = top + 46 + ((len(lines) * 20 + 8) if lines else 0)
            box.create_rectangle(
                8, top, max(width - 10, 48), bottom,
                outline=colors["accent"] if live else colors["line"], width=1,
            )
            box.create_polygon(
                rail_x, top + 16, rail_x + 5, top + 22, rail_x, top + 28, rail_x - 5, top + 22,
                fill=colors["accent"], outline="",
            )
            start = self._trail_clock(sess["start"])
            end = self._trail_clock(sess["end"])
            span = tr(self.lang, "trail_span", start=start, end=end) if start and end and start != end else (start or end or "—")
            mark = "▾" if lines or sess["key"] in self._trail_open else "▸"
            box.create_text(40, top + 10, text=mark + "  " + span, anchor="w", font=FONT, fill=colors["ink"])
            box.create_text(40, top + 28, text=self._trail_summary(sess), anchor="w", font=FONT, fill=colors["muted"])
            self._trail_hits.append({
                "x0": 8, "y0": top, "x1": max(width - 10, 48), "y1": top + 46,
                "kind": "session", "key": sess["key"],
            })
            step_y = top + 46
            for clock, text, tone in lines:
                shown = text
                while shown and measure.measure(clock + "   " + shown) > room and len(shown) > 12:
                    shown = shown[:-2].rstrip() + "…"
                box.create_oval(rail_x - 3, step_y + 5, rail_x + 3, step_y + 11, fill=tone, outline="")
                box.create_text(40, step_y + 7, text=clock + "   " + shown, anchor="w", font=FONT, fill=colors["ink"])
                step_y += 20
        total = max(y + 16, box.winfo_height())
        box.configure(scrollregion=(0, 0, width, total))
        box.yview_moveto(held)

    def _trail_comet(self, now):
        box = self.trail
        try:
            if not box.winfo_exists():
                return
        except tk.TclError:
            return
        box.delete("comet")
        colors = self._colors()
        width = max(box.winfo_width(), 2)
        span = max(42, width // 5)
        sweep = int(((now % 4.8) / 4.8) * (width + span)) - span
        box.create_rectangle(sweep, 0, sweep + span, 2, fill=colors["accent"], width=0, tags="comet")
        rail = self._trail_rail
        if not rail:
            return
        x, y0, y1 = rail
        if y1 - y0 < 8:
            return
        length = max(22, int((y1 - y0) * 0.16))
        travel = max(0, y1 - y0 - length)
        head = y0 + travel * ((now % 3.2) / 3.2)
        box.create_line(x, head, x, head + length, fill=colors["accent"], width=3, tags="comet")

    def _tick(self):
        if not self.root.winfo_exists():
            return
        self._fill(self.core.public_state())
        self._trail_refresh()
        self.root.after(400, self._tick)

    def _animate(self):
        if not self.root.winfo_exists():
            return
        now = time.monotonic()
        c = self._colors()
        width = max(self.rule.winfo_width(), 1)
        span = max(48, width // 4)
        x = int(((now % 5.4) / 5.4) * (width + span)) - span
        self.rule.delete("sweep")
        self.rule.configure(bg=c["panel"])
        self.rule.create_rectangle(0, 0, width, 3, fill=c["line"], width=0, tags="sweep")
        self.rule.create_rectangle(x, 0, x + span, 3, fill=c["accent"], width=0, tags="sweep")
        if now < self._link_until:
            on = int(now / 0.09) % 2 == 0
            self.linked.configure(fg=c["on"] if on else c["accent"], bg=c["accent"] if on else c["panel"])
        elif not self._linked:
            on = int(now / 0.72) % 2 == 0
            self.linked.configure(fg=c["accent"] if on else c["panel"], bg=c["panel"])
        else:
            self.linked.configure(fg=c["on"], bg=c["accent"])
        self._draw_feed(now)
        self._trail_comet(now)
        self.root.after(32, self._animate)

    def _draw_feed(self, now):
        box = self.feed
        if not box.winfo_exists():
            return
        c = self._colors()
        width = max(box.winfo_width(), 2)
        height = max(box.winfo_height(), 2)
        feed = self._feed
        on = bool(feed.get("on"))
        place = feed.get("place") or ""
        ship = feed.get("ship") or ""
        gear = feed.get("gear") or ""
        sig = (place, ship, gear, on, width, height, self.theme)
        if sig != self._feed_sig or not self._feed_ids:
            self._feed_sig = sig
            self._build_feed(box, c, width, height, on, place, ship, gear)
        self._move_feed(box, c, width, height, on, ship, now)

    def _build_feed(self, box, c, width, height, on, place, ship, gear):
        box.delete("all")
        box.configure(bg=c["bg"])
        ids = {
            "live": box.create_text(14, 16, text="LIVE" if on else "IDLE", anchor="w", font=FONT, fill=c["accent"]),
            "meters": [],
            "place": box.create_text(14, 40, text=place, anchor="w", font=FONT, fill=c["ink"]),
            "ship": box.create_text(14, 60, text=ship or "—", anchor="w", font=FONT, fill=c["accent"] if ship else c["muted"]),
            "gear": [],
            "scroll": False,
        }
        box.create_rectangle(0, 0, 3, height, fill=c["accent"], width=0)
        if on:
            for i in range(6):
                ids["meters"].append(box.create_rectangle(
                    width - 16 - i * 7, 8, width - 12 - i * 7, 22, fill=c["line"], width=0
                ))
            ids["scan"] = box.create_rectangle(10, 6, width - 8, 8, fill=c["line"], width=0)
        if gear:
            import tkinter.font as tkfont
            measure = tkfont.Font(font=FONT).measure(gear)
            room = max(40, width - 28)
            if on and measure > room:
                period = measure + 48
                ids["scroll"] = True
                ids["period"] = period
                ids["gear"].append(box.create_text(14, 80, text=gear, anchor="w", font=FONT, fill=c["muted"]))
                ids["gear"].append(box.create_text(14 + period, 80, text=gear, anchor="w", font=FONT, fill=c["muted"]))
            else:
                ids["gear"].append(box.create_text(14, 80, text=gear, anchor="w", font=FONT, fill=c["muted"]))
        elif on:
            ids["gear"].append(box.create_text(14, 80, text="· · ·", anchor="w", font=FONT, fill=c["line"]))
        self._feed_ids = ids
        self._feed_pulse = None
        self._feed_step = None

    def _move_feed(self, box, c, width, height, on, ship, now):
        ids = self._feed_ids
        pulse = int(now / 0.54) % 2 == 0
        if pulse != self._feed_pulse:
            self._feed_pulse = pulse
            box.itemconfig(ids["live"], fill=c["accent"] if (on and pulse) or not on else c["line"])
            caret = " ▍" if on and pulse else ""
            box.itemconfig(ids["ship"], text=(ship or "—") + caret)
        if on and ids["meters"]:
            step = int(now / 0.18)
            if step != self._feed_step:
                self._feed_step = step
                for i, item in enumerate(ids["meters"]):
                    hot = (step + i) % 6 < 3
                    box.itemconfig(item, fill=c["accent"] if hot else c["line"])
            travel = max(1, height - 8)
            y = 6 + (now * 55) % travel
            box.coords(ids["scan"], 10, y, width - 8, y + 2)
        if ids["scroll"]:
            period = ids["period"]
            shift = (now * 34) % period
            box.coords(ids["gear"][0], 14 - shift, 80)
            box.coords(ids["gear"][1], 14 - shift + period, 80)

    def _tray_hwnd_ready(self):
        if self._tray_hwnd or sys.platform != "win32":
            return bool(self._tray_hwnd)
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32
        kernel32.GetModuleHandleW.restype = wintypes.HINSTANCE
        kernel32.GetModuleHandleW.argtypes = [wintypes.LPCWSTR]
        user32.DefWindowProcW.restype = ctypes.c_ssize_t
        user32.DefWindowProcW.argtypes = [wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM]
        proc_type = ctypes.WINFUNCTYPE(ctypes.c_ssize_t, wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)

        user32.RegisterWindowMessageW.argtypes = [wintypes.LPCWSTR]
        user32.RegisterWindowMessageW.restype = wintypes.UINT
        self._tray_taskbar_msg = int(user32.RegisterWindowMessageW("TaskbarCreated") or 0)

        def proc(hwnd, msg, wparam, lparam):
            try:
                message = int(msg)
                if self._tray_taskbar_msg and message == self._tray_taskbar_msg:
                    self._tray_pending = "restore"
                    return 0
                if message == 0x8000 and int(wparam) == 1:
                    kind = tray_click_kind(lparam)
                    if kind:
                        self._tray_pending = kind
                    return 0
            except Exception:
                return 0
            return user32.DefWindowProcW(hwnd, msg, wparam, lparam)

        class WndClass(ctypes.Structure):
            _fields_ = [
                ("style", wintypes.UINT),
                ("lpfnWndProc", proc_type),
                ("cbClsExtra", ctypes.c_int),
                ("cbWndExtra", ctypes.c_int),
                ("hInstance", wintypes.HINSTANCE),
                ("hIcon", wintypes.HICON),
                ("hCursor", wintypes.HANDLE),
                ("hbrBackground", wintypes.HBRUSH),
                ("lpszMenuName", wintypes.LPCWSTR),
                ("lpszClassName", wintypes.LPCWSTR),
            ]

        self._tray_proc = proc_type(proc)
        klass = WndClass()
        klass.lpfnWndProc = self._tray_proc
        klass.hInstance = kernel32.GetModuleHandleW(None)
        klass.lpszClassName = "StarfixTray"
        user32.RegisterClassW.argtypes = [ctypes.POINTER(WndClass)]
        user32.RegisterClassW.restype = wintypes.ATOM
        atom = user32.RegisterClassW(ctypes.byref(klass))
        if not atom and kernel32.GetLastError() not in (0, 1410):
            return False
        user32.CreateWindowExW.restype = wintypes.HWND
        user32.CreateWindowExW.argtypes = [
            wintypes.DWORD, wintypes.LPCWSTR, wintypes.LPCWSTR, wintypes.DWORD,
            ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int,
            ctypes.c_void_p, wintypes.HMENU, wintypes.HINSTANCE, wintypes.LPVOID,
        ]
        hwnd = user32.CreateWindowExW(
            0x80, "StarfixTray", "Starfix", 0x80000000,
            -32000, -32000, 1, 1,
            None, None, klass.hInstance, None,
        )
        if not hwnd:
            return False
        self._tray_hwnd = hwnd
        self._tray_class = atom
        return True

    def _tray_icon(self):
        if self._tray_hicon:
            return self._tray_hicon
        path = _asset("icon.ico")
        if not path:
            return None
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.windll.user32
        user32.LoadImageW.restype = wintypes.HICON
        user32.LoadImageW.argtypes = [wintypes.HINSTANCE, wintypes.LPCWSTR, wintypes.UINT, ctypes.c_int, ctypes.c_int, wintypes.UINT]
        icon = user32.LoadImageW(None, str(path), 1, 16, 16, 0x10)
        self._tray_hicon = icon or None
        return self._tray_hicon

    def _tray_data(self):
        import ctypes
        from ctypes import wintypes
        class Data(ctypes.Structure):
            _fields_ = [
                ("cbSize", wintypes.DWORD),
                ("hWnd", wintypes.HWND),
                ("uID", wintypes.UINT),
                ("uFlags", wintypes.UINT),
                ("uCallbackMessage", wintypes.UINT),
                ("hIcon", wintypes.HICON),
                ("szTip", wintypes.WCHAR * 128),
            ]
        data = Data()
        data.cbSize = ctypes.sizeof(data)
        data.hWnd = self._tray_hwnd
        data.uID = 1
        data.uFlags = 1 | 2 | 4
        data.uCallbackMessage = 0x8000
        data.hIcon = self._tray_icon()
        data.szTip = tr(self.lang, "tray_tip")[:127]
        return data

    def _tray_add(self):
        if self._tray_on:
            return True
        if not self._tray_hwnd_ready() or not self._tray_icon():
            return False
        import ctypes
        data = self._tray_data()
        ok = ctypes.windll.shell32.Shell_NotifyIconW(0, ctypes.byref(data))
        self._tray_on = bool(ok)
        return self._tray_on

    def _tray_remove(self):
        if not self._tray_on or not self._tray_hwnd:
            self._tray_on = False
            return
        import ctypes
        data = self._tray_data()
        ctypes.windll.shell32.Shell_NotifyIconW(2, ctypes.byref(data))
        self._tray_on = False

    def _tray_touch(self):
        if not self._tray_on or not self._tray_hwnd or not self._tray_icon():
            return False
        import ctypes
        data = self._tray_data()
        return bool(ctypes.windll.shell32.Shell_NotifyIconW(1, ctypes.byref(data)))

    def _tray_restore(self):
        if not self._user_background:
            return
        self._tray_on = False
        self._tray_add()

    def _tray_pump(self):
        # Runs from Tk's own timer. The tray callback only leaves a word here.
        kind = self._tray_pending
        self._tray_pending = ""
        try:
            if kind == "show":
                self._tray_panel_close()
                self._show()
            elif kind == "menu":
                self._tray_menu_open()
            elif kind == "restore":
                self._tray_restore()
        except Exception:
            pass
        try:
            self.root.after(50, self._tray_pump)
        except tk.TclError:
            pass

    def _tray_panel_close(self):
        panel = self._tray_panel
        self._tray_panel = None
        if panel is None:
            return
        try:
            panel.destroy()
        except tk.TclError:
            pass

    def _tray_menu_open(self):
        if not self._tray_on:
            return
        if self._tray_panel is not None:
            self._tray_panel_close()
            return
        now = time.time()
        if now - self._tray_menu_at < 0.4:
            return
        self._tray_menu_at = now
        try:
            px = self.root.winfo_pointerx()
            py = self.root.winfo_pointery()
        except tk.TclError:
            return
        running = False
        try:
            running = bool(self.core.public_state().get("running"))
        except Exception:
            running = False
        c = self._colors()
        try:
            panel = tk.Toplevel(self.root)
            panel.overrideredirect(True)
            panel.configure(bg=c["line"])
            try:
                panel.attributes("-topmost", True)
            except tk.TclError:
                pass
        except tk.TclError:
            return
        self._tray_panel = panel
        armed = {"ok": False}

        def arm():
            armed["ok"] = True

        def act(fn):
            # The click that opened this panel is already over. A later click
            # on a row is the only thing that can run, and Quit is one of those rows.
            if not armed["ok"] or self._tray_panel is not panel:
                return
            self._tray_panel_close()
            fn()

        inner = tk.Frame(panel, bg=c["panel"])
        inner.pack(fill="both", expand=True, padx=1, pady=1)
        rows = [
            (tr(self.lang, "tray_show"), self._show),
            (tr(self.lang, "watch_stop" if running else "watch"), self._toggle_watch),
            (tr(self.lang, "quit"), self.close),
        ]
        for label, fn in rows:
            line = tk.Label(
                inner, text=label, font=FONT, anchor="w", padx=14, pady=6,
                bg=c["panel"], fg=c["ink"], cursor="hand2",
            )
            line.pack(fill="x")

            def enter(_event, widget=line):
                widget.configure(bg=c["accent"], fg=c["on"])

            def leave(_event, widget=line):
                widget.configure(bg=c["panel"], fg=c["ink"])

            line.bind("<Enter>", enter)
            line.bind("<Leave>", leave)
            line.bind("<ButtonRelease-1>", lambda _event, fn=fn: act(fn))
        try:
            panel.update_idletasks()
            height = max(1, panel.winfo_reqheight())
            width = max(1, panel.winfo_reqwidth())
            x, y, _quit_last = tray_menu_place(px, py, height, 16)
            screen_w = panel.winfo_screenwidth()
            screen_h = panel.winfo_screenheight()
            x = min(max(0, x), max(0, screen_w - width))
            y = min(max(0, y), max(0, screen_h - height))
            panel.geometry("+%d+%d" % (x, y))
            panel.bind("<Escape>", lambda _event: self._tray_panel_close())
            panel.after(300, arm)
        except tk.TclError:
            self._tray_panel_close()

    def _tray_guard(self):
        try:
            if self._placing:
                pass
            elif self._user_background:
                if not self._tray_touch():
                    self._tray_on = False
                    if not self._tray_add():
                        self._user_background = False
                        self._show()
            else:
                try:
                    if str(self.root.state()) == "withdrawn":
                        self._show()
                except tk.TclError:
                    return
        except Exception:
            pass
        try:
            self.root.after(3000, self._tray_guard)
        except tk.TclError:
            pass

    def _background(self):
        if not self._tray_add():
            return
        self._user_background = True
        try:
            self.root.withdraw()
            for pane in self._panes:
                if pane._out:
                    self.root.tk.call("wm", "withdraw", pane)
        except tk.TclError:
            self._user_background = False
            self._tray_remove()

    def _show(self):
        self._tray_panel_close()
        self._user_background = False
        self._tray_remove()
        try:
            self.root.deiconify()
            self.root.lift()
            self.root.focus_force()
            self._mark_appwindow()
            for pane in self._panes:
                if pane._out:
                    self.root.tk.call("wm", "deiconify", pane)
        except tk.TclError:
            return
        force_foreground(self.root)
        self._taskbar_add()

    def _raise(self):
        self._show()

    def close(self):
        self._tray_remove()
        try:
            self.core.leave_room()
        except Exception:
            pass
        self.core.request_stop()
        for pane in list(self._panes):
            if pane._out:
                try:
                    self.root.tk.call("wm", "forget", pane)
                except tk.TclError:
                    pass
        self.root.destroy()

    def run(self):
        self.root.mainloop()


def accept_terms(lang, theme, version=""):
    colors = THEMES.get(theme) or THEMES["scifi"]
    _dpi()
    root = tk.Tk()
    root.overrideredirect(True)
    ver = str(version or "").strip()
    root.title("Starfix" + ((" " + ver) if ver else ""))
    ico = _asset("icon.ico")
    if ico:
        try:
            root.iconbitmap(str(ico))
        except tk.TclError:
            pass
    root.configure(bg=colors["panel"])
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

    shell = tk.Frame(root, bg=colors["panel"])
    shell.pack(fill="both", expand=True)
    bar = tk.Frame(shell, bg=colors["panel"], height=28)
    bar.pack(fill="x")
    bar.pack_propagate(False)
    title = tk.Label(bar, text="Starfix" + ((" " + ver) if ver else ""), font=FONT, bg=colors["panel"], fg=colors["ink"])
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
    row = tk.Frame(body, bg=colors["panel"])
    row.pack(side="bottom", fill="x", pady=(10, 0))
    box = tk.Frame(body, bg=colors["line"])
    box.pack(side="top", fill="both", expand=True)
    text = tk.Text(
        box, font=FONT, wrap="word", width=42, height=8, relief="flat", bd=8,
        bg=colors["bg"], fg=colors["ink"], highlightthickness=0,
        padx=6, pady=6,
    )
    scroll = theme_scroll(box, text, colors)
    scroll.pack(side="right", fill="y")
    text.pack(side="left", fill="both", expand=True)
    text.insert("1.0", tr(lang, "terms_body"))
    text.mark_set("insert", "1.0")
    text.configure(state="disabled")

    def wheel(event):
        text.yview_scroll(int(-event.delta / 120), "units")

    text.bind("<MouseWheel>", wheel)
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
    root.update_idletasks()
    screen_w = root.winfo_screenwidth()
    screen_h = root.winfo_screenheight()
    width = min(560, max(420, screen_w - 48))
    height = min(680, max(520, int(screen_h * 0.72)))
    height = min(height, max(420, screen_h - 80))
    root.geometry("%dx%d+%d+%d" % (
        width, height,
        max(0, (screen_w - width) // 2),
        max(24, (screen_h - height) // 6),
    ))
    hide_window_border(root, colors["panel"])

    def show_start():
        text.yview_moveto(0)

    def bring():
        try:
            root.deiconify()
            root.lift()
        except tk.TclError:
            return
        force_foreground(root)

    previous = _front
    _bind_front(lambda: root.after(0, bring))
    root.after_idle(show_start)
    root.after(50, show_start)
    try:
        root.mainloop()
    finally:
        _bind_front(previous)
    return agreed["ok"]


def _byte_text(n):
    n = max(0, int(n or 0))
    if n >= 1_000_000:
        return "%.1f MB" % (n / 1_000_000)
    if n >= 1000:
        return "%d KB" % (n // 1000)
    return "%d B" % n


class UpdateProgress:
    """Download window. Crates slide into a container as bytes arrive."""

    SLOTS = 8

    def __init__(self, theme, lang, version):
        self.colors = THEMES.get(theme) or THEMES["scifi"]
        self.lang = lang if lang in TEXT else "en"
        self.version = version
        self.frac = 0.0
        self.shown = 0.0
        self.done = 0
        self.total = 0
        self.phase = "load"
        self.tick = 0
        self.alive = True
        _dpi()
        c = self.colors
        root = tk.Tk()
        self.root = root
        root.overrideredirect(True)
        root.title("Starfix")
        root.configure(bg=c["panel"])
        root.attributes("-topmost", True)
        ico = _asset("icon.ico")
        if ico:
            try:
                root.iconbitmap(str(ico))
            except tk.TclError:
                pass
        drag = {"x": 0, "y": 0}

        def drag_start(event):
            drag["x"] = event.x_root - root.winfo_x()
            drag["y"] = event.y_root - root.winfo_y()

        def drag_move(event):
            root.geometry("+%d+%d" % (event.x_root - drag["x"], event.y_root - drag["y"]))

        shell = tk.Frame(root, bg=c["panel"])
        shell.pack(fill="both", expand=True)
        bar = tk.Frame(shell, bg=c["panel"], height=28)
        bar.pack(fill="x")
        bar.pack_propagate(False)
        self.lamp = tk.Canvas(bar, width=14, height=14, highlightthickness=0, bd=0, bg=c["panel"])
        self.lamp.pack(side="left", padx=(10, 0))
        title = tk.Label(bar, text=tr(self.lang, "update_title"), font=FONT, bg=c["panel"], fg=c["ink"])
        title.pack(side="left", padx=8)
        for widget in (bar, title, self.lamp):
            widget.bind("<ButtonPress-1>", drag_start)
            widget.bind("<B1-Motion>", drag_move)
        body = tk.Frame(shell, bg=c["panel"], padx=12, pady=8)
        body.pack(fill="both", expand=True)
        self.lead = tk.Label(body, text=tr(self.lang, "update_lead", version=version), font=FONT, bg=c["panel"], fg=c["ink"], anchor="w")
        self.lead.pack(fill="x")
        self.canvas = tk.Canvas(body, width=436, height=132, highlightthickness=0, bd=0, bg=c["bg"])
        self.canvas.pack(fill="x", pady=(8, 0))
        self.meta = tk.Label(body, text=tr(self.lang, "update_unknown"), font=FONT, bg=c["panel"], fg=c["muted"], anchor="w")
        self.meta.pack(fill="x", pady=(6, 0))
        root.update_idletasks()
        width, height = 460, 214
        screen_w = root.winfo_screenwidth()
        screen_h = root.winfo_screenheight()
        root.geometry("%dx%d+%d+%d" % (
            width, height,
            max(0, (screen_w - width) // 2),
            max(24, (screen_h - height) // 3),
        ))
        hide_window_border(root, c["panel"])
        self._paint()
        root.after(33, self._loop)
        try:
            root.update()
            force_foreground(root)
        except tk.TclError:
            self.alive = False

    def set_progress(self, done, total):
        self.done = max(0, int(done or 0))
        self.total = max(0, int(total or 0))
        if self.total > 0:
            self.frac = max(0.0, min(1.0, self.done / self.total))
        self._sync_text()

    def set_phase(self, phase):
        self.phase = phase
        if phase == "swap":
            self.frac = 1.0
        self._sync_text()

    def pump(self):
        if not self.alive:
            return
        try:
            self.root.update()
        except tk.TclError:
            self.alive = False

    def close(self):
        self.alive = False
        try:
            self.root.destroy()
        except tk.TclError:
            pass

    def _sync_text(self):
        if not self.alive:
            return
        try:
            if self.phase == "swap":
                self.lead.configure(text=tr(self.lang, "update_swap"))
                self.meta.configure(text=self.version)
            elif self.total > 0:
                self.lead.configure(text=tr(self.lang, "update_lead", version=self.version))
                self.meta.configure(text=tr(self.lang, "update_bytes", done=_byte_text(self.done), total=_byte_text(self.total)))
            else:
                self.lead.configure(text=tr(self.lang, "update_lead", version=self.version))
                self.meta.configure(text=tr(self.lang, "update_unknown") + "  " + _byte_text(self.done))
        except tk.TclError:
            self.alive = False

    def _loop(self):
        if not self.alive:
            return
        self.tick += 1
        target = self.SLOTS if self.phase == "swap" else self.frac * self.SLOTS
        if self.total <= 0 and self.phase != "swap":
            target = (self.tick % 48) / 48 * self.SLOTS
        self.shown += (target - self.shown) * 0.22
        if abs(target - self.shown) < 0.02:
            self.shown = target
        try:
            self._paint()
            self.root.after(33, self._loop)
        except tk.TclError:
            self.alive = False

    def _paint(self):
        c = self.colors
        cv = self.canvas
        cv.delete("all")
        left, top, right, bottom = 8, 18, 428, 118
        cv.create_rectangle(left, top, right, bottom, outline=c["accent"], width=2)
        for edge in ((left, top), (right, top), (left, bottom), (right, bottom)):
            ox = -7 if edge[0] == left else 7
            oy = -7 if edge[1] == top else 7
            cv.create_line(edge[0], edge[1], edge[0] + ox, edge[1], fill=c["accent"], width=2)
            cv.create_line(edge[0], edge[1], edge[0], edge[1] + oy, fill=c["accent"], width=2)
        rib = (self.tick // 2) % 10
        x = left + 10
        while x < right - 16:
            shade = c["accent"] if (x // 14) % 10 == rib else c["line"]
            cv.create_line(x, top + 4, x, bottom - 4, fill=shade)
            x += 14
        door = right - 18
        cv.create_rectangle(door, top + 4, right - 4, bottom - 4, outline=c["accent"], fill=c["panel"])
        cv.create_line(door + 7, top + 10, door + 7, bottom - 10, fill=c["accent"])
        bay_w, bay_h, gap = 36, 44, 6
        home0 = left + 12
        seats = self.shown
        whole = int(seats)
        part = seats - whole
        for i in range(self.SLOTS):
            hx = home0 + i * (bay_w + gap)
            hy = top + 28
            if i < whole:
                self._crate(hx, hy, bay_w, bay_h, 1)
            elif i == whole and part > 0.01 and i < self.SLOTS:
                start = door - bay_w - 4
                self._crate(start + (hx - start) * part, hy - (1 - part) * 10, bay_w, bay_h, part)
        sweep = left + ((self.tick * 6) % (right - left - 8))
        cv.create_line(sweep, top + 2, sweep, bottom - 2, fill=c["accent"])
        self.lamp.delete("all")
        lit = c["accent"] if (self.tick // 8) % 2 == 0 else c["line"]
        self.lamp.create_oval(2, 2, 12, 12, outline=lit, fill=lit)

    def _crate(self, x, y, w, h, alpha):
        c = self.colors
        cv = self.canvas
        cv.create_rectangle(x, y, x + w, y + h, outline=c["accent"], fill=c["panel"], width=2)
        cv.create_line(x + 4, y + h * 0.45, x + w - 4, y + h * 0.45, fill=c["accent"])
        cv.create_line(x + w * 0.5, y + 4, x + w * 0.5, y + h - 4, fill=c["line"])
        if alpha < 0.95:
            cv.create_rectangle(x, y - 6, x + w, y - 2, outline=c["accent"], fill=c["bg"])


def open_update_progress(theme, lang, version):
    return UpdateProgress(theme, lang, version)


def open_window(core):
    lang = canon_lang(core.CFG.get("lang")) or windows_lang()
    theme = core.CFG.get("theme") if core.CFG.get("theme") in THEMES else "scifi"
    if not accept_terms(lang, theme, getattr(core, "VERSION", "")):
        return
    Desktop(core).run()
