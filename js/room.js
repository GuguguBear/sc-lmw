/* Rooms: a team shares one code. The site does not read the game folder.
   "I am here" is a click on a place. Routes are Shift+click, then publish. */
(function(){
  var SC = window.SCLMW = window.SCLMW || {};
  var TOKEN = 'sclmw_room_token';
  var CODE = 'sclmw_room_code';
  var NICK = 'sclmw_room_nick';
  var HIST = 'sclmw_room_hist';
  var FRAME = 'sclmw_room_frame';
  var CREW = 'sclmw_crew_frame';
  var PLAZA = 'sclmw_plaza_frame';
  var DICT = {
    'zh-Hans': {
      title:'团队房间', lead:'这个网页不读取游戏目录。在星图上右键，选「我在这里」，队友就能看到。',
      s1:'填写昵称。建议用游戏里的名字，方便队长认出你。',
      s2:'队长建立房间，把房间码发给队员。',
      s3:'队员申请加入，队长确认后，大家只看得到这个房间。',
      nick:'昵称', nickPh:'游戏里的名字', create:'建立房间', join:'加入房间', code:'房间码',
      recover:'恢复码', recoverLead:'这组码只给你。换浏览器或清掉网站数据后，用房间码和它接管队长。请另外抄下来。', recoverCopy:'复制恢复码', recoverRoll:'刷新恢复码', recoverGo:'接管队长', recoverPh:'ABCD-EFGH-JKLM', errRecover:'恢复码不对。',
      wait:'已提交申请，等待队长确认。', copy:'复制房间码', copied:'已复制',
      enter:'进入星图', leave:'离开房间', pending:'待确认', approve:'通过', reject:'拒绝', alertLater:'稍后',
      here:'我在这里', hereNeed:'右键要落在一个地点上。',
      route:'标记路线', routeOn:'结束标记', routeHint:'按住 Shift，依次点地点。',
      note:'路线备注', publish:'发布给房间', clear:'清空', comment:'评论', send:'发送', del:'删除',
      mode:'谁可以画路线', modeCaptain:'仅队长', modeMembers:'队员也可以',
      members:'房间成员', online:'在线', offline:'离线', server:'服务器', fold:'收起', unfold:'展开', you:'你', captainTag:'队长',
      sfxOn:'Starfix 在线', sfxOff:'Starfix 离线', gameOn:'游戏在线', gameOff:'游戏离线',
      find:'搜索昵称或地点', none:'没有匹配的人',
      give:'设为队长', giveShort:'队长', giveLeave:'交给他并离开', dissolve:'解散房间', dissolveLeave:'解散并离开', cancel:'取消',
      kick:'踢出', kickYes:'确定', kicked:'你已被移出这个房间。', denied:'队长拒绝了这次申请。',
      cast:'广播', castLead:'发给这个房间里的所有人。', castPh:'写一句给小队的话', castSend:'发送', castFrom:'来自', castClose:'知道了', castSound:'广播音效', castOn:'开', castOff:'关', castEmpty:'先写一点内容。',
      horn:'集合号角', hornLead:'指定一个地点和时间。队员会反复看到这声号角，直到选择参加或不参加。', hornPlace:'地点', hornNeed:'先在星图上点一个地点。', hornTime:'集合时间', hornSend:'吹响', hornClear:'取消号角', hornJoin:'参加', hornSkip:'不参加', hornLook:'查看地点', hornLater:'稍后', hornGoing:'参加', hornGone:'不参加', hornPin:'集合',
      plaza:'鬼市酒吧', plazaPage:'独立页面', plazaBack:'返回星图', plazaLead:'大厅里只显示昵称，聊天室可以说话。招募和你的小队房间是分开的。', plazaOn:'出现在大厅', plazaOff:'离开大厅', plazaHere:'用当前地点', plazaNeed:'先在星图上点一个地点，或打开 Starfix。', plazaEmpty:'还没有人出现在大厅。',
      chatPh:'说一句', chatSend:'发送', chatEmpty:'先写一点内容。', chatFast:'说得太快了。',
      hallTab:'大厅', shipTab:'载具招募', jobTab:'任务招募', roamTab:'闲游招募',
      shipLead:'给自己的载具找队员。可以是散人队伍，也可以是固定队伍。', jobLead:'发布一项任务或一场活动，把需求写清楚。', roamLead:'找人一起闲逛。可以是散人队伍，也可以是固定队伍。',
      postTitle:'标题', postDetail:'需求', postShip:'载具', postMission:'任务', postSeats:'人数', postSeatsPh:'1-9999', postSeatsBad:'人数写成 1，或 1-9999 这样的范围。', postCrew:'队伍', postStanding:'固定队伍', postTemp:'散人队伍', postServer:'服务器', srvAsia:'亚服', srvUs:'美服', srvAus:'澳服', srvEu:'欧服', postHours:'持续招募', keep15:'15分钟', keep30:'30分钟', keep1:'1小时', keep3:'3小时', keep6:'6小时', keep9:'9小时', keep12:'12小时', keep24:'24小时', keep48:'48小时', keep96:'96小时', keep168:'168小时', keepOpen:'不限', postSend:'发布', postClear:'撤下', postNone:'还没有人发布。', postLimit:'每人最多同时挂九条。', postNeed:'先写标题。', postPlace:'地点', postAt:'时间', postBy:'来自', postLeft:'剩余 {t}', postLeftSoon:'剩余不到1分钟', postDay:'{d}天', postDayHour:'{d}天{h}小时', postHour:'{h}小时', postHourMin:'{h}小时{m}分', postMin:'{m}分钟', postBringPh:'我带的船或岗位', postLink:'链接', postSpeech:'语言', speechZh:'中文', speechEn:'英文', speechOther:'其他', speechAny:'不限', postContact:'联系方式', contactNeed:'先选择联系方式，并填写有效账号。', contactSpectrum:'光谱（推荐）', contactQq:'QQ', contactWechat:'微信', contactDiscord:'Discord', contactTelegram:'Telegram', contactKook:'KOOK', contactHeibox:'黑盒语音', contactWhatsapp:'WhatsApp', contactMail:'邮箱', contactPhSpectrum:'光谱用户名', contactPhQq:'QQ号或群邀请链接', contactPhWechat:'微信号', contactPhDiscord:'邀请链接或用户名', contactPhTelegram:'用户名或 t.me 链接', contactPhKook:'邀请链接、用户名或编号', contactPhHeibox:'邀请链接、编号或昵称', contactPhWhatsapp:'号码或群邀请链接', contactPhMail:'邮箱地址', contactOnline:'{n} 在线', contactMembers:'{n} 人', postCopy:'复制', roleFreight:'货运', roleAssault:'突击', roleMulti:'多用途', roleData:'数据运输', roleMerchant:'商船', roleMine:'布雷', roleBattle:'战列巡洋舰', roleTank:'坦克', roleMedical:'医疗', roleCrew:'{n}人',
      handTitle:'离开前先交接', handLead:'把队长交给一位队员，或解散房间。', handSolo:'房间里只有你。离开会解散这个房间。',
      errNick:'请填写 1 到 32 个字的昵称。', errRoom:'没有这个房间。',
      agoNow:'刚刚', agoSec:'{n} 秒前', agoMin:'{n} 分钟前', agoHour:'{n} 小时前', agoDay:'{n} 天前',
      noPlace:'星图上对不上这个地点。',
      errNet:'房间服务没连上。请在项目目录运行 python server/room_server.py，然后打开 http://127.0.0.1:8770/ 。', published:'已发布的路线', by:'来自',
      yours:'你的房间', switchRoom:'建立或加入别的房间',
      hist:'最近的房间', histWait:'正在查看', histAlive:'还在', histGone:'已不在', histOnline:'{n} 人', histEmpty:'还没有去过的房间', histBack:'返回这个房间',
      visTitle:'对外', visPublic:'公开', visPrivate:'私人', visLead:'公开后，这个房间会出现在首页，别人可以直接进入。',
      visCool:'{n}后可再改', visSec:'{n} 秒', visMin:'{n} 分钟',
      pubTitle:'公开房间', pubEmpty:'现在没有公开房间', pubPeople:'{n} 人',
      resumed:'上次留下的房间', resumedLead:'刷新后仍是这个房间。房间码没有变，可以直接进入星图。',
      freshCreate:'刚建立的房间', freshCreateLead:'把房间码发给队员。恢复码只留给自己，换浏览器时用来接管队长。',
      freshJoin:'刚加入的房间', freshJoinLead:'可以直接进入星图。',
      resumedWait:'上次提交的申请还在等队长确认。',
      link:'连到这台电脑', linkSent:'已经发给本机的 Starfix。回到那个窗口，点确认。',
      linkWait:'请在 Starfix 窗口点确认。',
      linkOn:'已连上房间',
      linkOff:'本机的 Starfix 没开。先双击 Starfix，等窗口出现后再点一次。',
      linkToast:'本机链路', linkRetry:'再试一次',
      locGuide:'你可以手动标位置，也可以用附带程序试着自动读日志。手动：在星图上右键，选「我在这里」。自动：项目自带 Starfix，源码都在 companion/，可以先读完再运行。它只读本机 Game.log，不进游戏、不读内存、不改游戏文件。打开后点「连到这台电脑」，回窗口确认。网页本身不读游戏目录。RSI 条款没有书面允许读日志，开不开由你决定。'
    },
    'zh-Hant': {
      title:'團隊房間', lead:'這個網頁不讀取遊戲資料夾。在星圖上右鍵，選「我在這裡」，隊友就能看到。',
      s1:'填寫暱稱。建議用遊戲裡的名字，方便隊長認出你。',
      s2:'隊長建立房間，把房間碼發給隊員。',
      s3:'隊員申請加入，隊長確認後，大家只看得到這個房間。',
      nick:'暱稱', nickPh:'遊戲裡的名字', create:'建立房間', join:'加入房間', code:'房間碼',
      recover:'恢復碼', recoverLead:'這組碼只給你。換瀏覽器或清掉網站資料後，用房間碼和它接管隊長。請另外抄下來。', recoverCopy:'複製恢復碼', recoverRoll:'刷新恢復碼', recoverGo:'接管隊長', recoverPh:'ABCD-EFGH-JKLM', errRecover:'恢復碼不對。',
      wait:'已送出申請，等待隊長確認。', copy:'複製房間碼', copied:'已複製',
      enter:'進入星圖', leave:'離開房間', pending:'待確認', approve:'通過', reject:'拒絕', alertLater:'稍後',
      here:'我在這裡', hereNeed:'右鍵要落在一個地點上。',
      route:'標記路線', routeOn:'結束標記', routeHint:'按住 Shift，依序點地點。',
      note:'路線備註', publish:'發布給房間', clear:'清空', comment:'評論', send:'送出', del:'刪除',
      mode:'誰可以畫路線', modeCaptain:'僅隊長', modeMembers:'隊員也可以',
      members:'房間成員', online:'在線', offline:'離線', server:'伺服器', fold:'收起', unfold:'展開', you:'你', captainTag:'隊長',
      sfxOn:'Starfix 在線', sfxOff:'Starfix 離線', gameOn:'遊戲在線', gameOff:'遊戲離線',
      find:'搜尋暱稱或地點', none:'沒有符合的人',
      give:'設為隊長', giveShort:'隊長', giveLeave:'交給他並離開', dissolve:'解散房間', dissolveLeave:'解散並離開', cancel:'取消',
      kick:'踢出', kickYes:'確定', kicked:'你已被移出這個房間。', denied:'隊長拒絕了這次申請。',
      cast:'廣播', castLead:'發給這個房間裡的所有人。', castPh:'寫一句給小隊的話', castSend:'發送', castFrom:'來自', castClose:'知道了', castSound:'廣播音效', castOn:'開', castOff:'關', castEmpty:'先寫一點內容。',
      horn:'集合號角', hornLead:'指定一個地點和時間。隊員會反覆看到這聲號角，直到選擇參加或不參加。', hornPlace:'地點', hornNeed:'先在星圖上點一個地點。', hornTime:'集合時間', hornSend:'吹響', hornClear:'取消號角', hornJoin:'參加', hornSkip:'不參加', hornLook:'查看地點', hornLater:'稍後', hornGoing:'參加', hornGone:'不參加', hornPin:'集合',
      plaza:'鬼市酒吧', plazaPage:'獨立頁面', plazaBack:'返回星圖', plazaLead:'大廳裡只顯示暱稱，聊天室可以說話。招募和你的小隊房間是分開的。', plazaOn:'出現在大廳', plazaOff:'離開大廳', plazaHere:'用目前地點', plazaNeed:'先在星圖上點一個地點，或打開 Starfix。', plazaEmpty:'還沒有人出現在大廳。',
      chatPh:'說一句', chatSend:'發送', chatEmpty:'先寫一點內容。', chatFast:'說得太快了。',
      hallTab:'大廳', shipTab:'載具招募', jobTab:'任務招募', roamTab:'閒遊招募',
      shipLead:'給自己的載具找隊員。可以是散人隊伍，也可以是固定隊伍。', jobLead:'發布一項任務或一場活動，把需求寫清楚。', roamLead:'找人一起閒逛。可以是散人隊伍，也可以是固定隊伍。',
      postTitle:'標題', postDetail:'需求', postShip:'載具', postMission:'任務', postSeats:'人數', postSeatsPh:'1-9999', postSeatsBad:'人數寫成 1，或 1-9999 這樣的範圍。', postCrew:'隊伍', postStanding:'固定隊伍', postTemp:'散人隊伍', postServer:'伺服器', srvAsia:'亞服', srvUs:'美服', srvAus:'澳服', srvEu:'歐服', postHours:'持續招募', keep15:'15分鐘', keep30:'30分鐘', keep1:'1小時', keep3:'3小時', keep6:'6小時', keep9:'9小時', keep12:'12小時', keep24:'24小時', keep48:'48小時', keep96:'96小時', keep168:'168小時', keepOpen:'不限', postSend:'發布', postClear:'撤下', postNone:'還沒有人發布。', postLimit:'每人最多同時掛九條。', postNeed:'先寫標題。', postPlace:'地點', postAt:'時間', postBy:'來自', postLeft:'剩餘 {t}', postLeftSoon:'剩餘不到1分鐘', postDay:'{d}天', postDayHour:'{d}天{h}小時', postHour:'{h}小時', postHourMin:'{h}小時{m}分', postMin:'{m}分鐘', postBringPh:'我帶的船或崗位', postLink:'連結', postSpeech:'語言', speechZh:'中文', speechEn:'英文', speechOther:'其他', speechAny:'不限', postContact:'聯繫方式', contactNeed:'先選擇聯繫方式，並填寫有效帳號。', contactSpectrum:'光譜（推薦）', contactQq:'QQ', contactWechat:'微信', contactDiscord:'Discord', contactTelegram:'Telegram', contactKook:'KOOK', contactHeibox:'黑盒語音', contactWhatsapp:'WhatsApp', contactMail:'郵箱', contactPhSpectrum:'光譜用戶名', contactPhQq:'QQ號或群邀請連結', contactPhWechat:'微信號', contactPhDiscord:'邀請連結或用戶名', contactPhTelegram:'用戶名或 t.me 連結', contactPhKook:'邀請連結、用戶名或編號', contactPhHeibox:'邀請連結、編號或暱稱', contactPhWhatsapp:'號碼或群邀請連結', contactPhMail:'郵箱地址', contactOnline:'{n} 在線', contactMembers:'{n} 人', postCopy:'複製', roleFreight:'貨運', roleAssault:'突擊', roleMulti:'多用途', roleData:'數據運輸', roleMerchant:'商船', roleMine:'佈雷', roleBattle:'戰列巡洋艦', roleTank:'坦克', roleMedical:'醫療', roleCrew:'{n}人',
      handTitle:'離開前先交接', handLead:'把隊長交給一位隊員，或解散房間。', handSolo:'房間裡只有你。離開會解散這個房間。',
      errNick:'請填寫 1 到 32 個字的暱稱。', errRoom:'沒有這個房間。',
      agoNow:'剛剛', agoSec:'{n} 秒前', agoMin:'{n} 分鐘前', agoHour:'{n} 小時前', agoDay:'{n} 天前',
      noPlace:'星圖上對不上這個地點。',
      errNet:'房間服務沒連上。請在專案目錄執行 python server/room_server.py，然後打開 http://127.0.0.1:8770/ 。', published:'已發布的路線', by:'來自',
      yours:'你的房間', switchRoom:'建立或加入別的房間',
      hist:'最近的房間', histWait:'正在查看', histAlive:'還在', histGone:'已不在', histOnline:'{n} 人', histEmpty:'還沒有去過的房間', histBack:'返回這個房間',
      visTitle:'對外', visPublic:'公開', visPrivate:'私人', visLead:'公開後，這個房間會出現在首頁，別人可以直接進入。',
      visCool:'{n}後可再改', visSec:'{n} 秒', visMin:'{n} 分鐘',
      pubTitle:'公開房間', pubEmpty:'現在沒有公開房間', pubPeople:'{n} 人',
      resumed:'上次留下的房間', resumedLead:'重新整理後仍是這個房間。房間碼沒有變，可以直接進入星圖。',
      freshCreate:'剛建立的房間', freshCreateLead:'把房間碼發給隊員。恢復碼只留給自己，換瀏覽器時用來接管隊長。',
      freshJoin:'剛加入的房間', freshJoinLead:'可以直接進入星圖。',
      resumedWait:'上次送出的申請還在等隊長確認。',
      link:'連到這台電腦', linkSent:'已經發給本機的 Starfix。回到那個視窗，點確認。',
      linkWait:'請在 Starfix 視窗點確認。',
      linkOn:'已連上房間',
      linkOff:'本機的 Starfix 沒開。先雙擊 Starfix，等視窗出現後再點一次。',
      linkToast:'本機鏈路', linkRetry:'再試一次',
      locGuide:'你可以手動標位置，也可以用附帶程式試著自動讀日誌。手動：在星圖上右鍵，選「我在這裡」。自動：專案自帶 Starfix，源碼都在 companion/，可以先讀完再執行。它只讀本機 Game.log，不進遊戲、不讀記憶體、不改遊戲檔案。打開後點「連到這台電腦」，回視窗確認。網頁本身不讀遊戲資料夾。RSI 條款沒有書面允許讀日誌，開不開由你決定。'
    },
    en: {
      title:'Team room', lead:'This page does not read the game folder. Right-click the map and choose “I am here”.',
      s1:'Pick a nickname. Your in-game name makes you easy to recognize.',
      s2:'The captain creates a room and shares the code.',
      s3:'Members apply. After the captain accepts, only this room can see each other.',
      nick:'Nickname', nickPh:'In-game name', create:'Create room', join:'Join room', code:'Room code',
      recover:'Recovery code', recoverLead:'This code is only for you. After a new browser or cleared site data, use it with the room code to take the captain role. Copy it somewhere else.', recoverCopy:'Copy recovery code', recoverRoll:'New recovery code', recoverGo:'Take captain', recoverPh:'ABCD-EFGH-JKLM', errRecover:'That recovery code does not match.',
      wait:'Request sent. Waiting for the captain.', copy:'Copy code', copied:'Copied',
      enter:'Enter map', leave:'Leave room', pending:'Waiting', approve:'Accept', reject:'Decline', alertLater:'Later',
      here:'I am here', hereNeed:'Right-click a place on the map.',
      route:'Mark route', routeOn:'Stop marking', routeHint:'Hold Shift and click places in order.',
      note:'Route note', publish:'Publish to room', clear:'Clear', comment:'Comment', send:'Send', del:'Delete',
      mode:'Who can draw routes', modeCaptain:'Captain only', modeMembers:'Members too',
      members:'Room members', online:'Online', offline:'Offline', server:'Server', fold:'Minimize', unfold:'Expand', you:'you', captainTag:'Captain',
      sfxOn:'Starfix online', sfxOff:'Starfix offline', gameOn:'Game online', gameOff:'Game offline',
      find:'Search name or place', none:'No match',
      give:'Make captain', giveShort:'Lead', giveLeave:'Give and leave', dissolve:'Close room', dissolveLeave:'Close and leave', cancel:'Cancel',
      kick:'Remove', kickYes:'Confirm', kicked:'You were removed from this room.', denied:'The captain declined this request.',
      cast:'Broadcast', castLead:'Send this to everyone in the room.', castPh:'A note for the squad', castSend:'Send', castFrom:'From', castClose:'Got it', castSound:'Broadcast sound', castOn:'On', castOff:'Off', castEmpty:'Write something first.',
      horn:'Rally', hornLead:'Pick a place and a time. The site keeps reminding the team until each member joins or declines.', hornPlace:'Place', hornNeed:'Click a place on the map first.', hornTime:'Time', hornSend:'Sound it', hornClear:'Cancel rally', hornJoin:'Join', hornSkip:'Decline', hornLook:'Show place', hornLater:'Later', hornGoing:'Going', hornGone:'Not going', hornPin:'Rally',
      plaza:'Ghost Market Bar', plazaPage:'Own page', plazaBack:'Back to map', plazaLead:'The lobby lists nicknames, and the chat stays open beside the list. Recruitment is separate from your crew room.', plazaOn:'Appear in the lobby', plazaOff:'Leave the lobby', plazaHere:'Use the selected place', plazaNeed:'Click a place on the map first, or run Starfix.', plazaEmpty:'Nobody is in the lobby yet.',
      chatPh:'Say something', chatSend:'Send', chatEmpty:'Write something first.', chatFast:'Too fast.',
      hallTab:'Lobby', shipTab:'Vehicle crew', jobTab:'Missions', roamTab:'Roaming',
      shipLead:'Find crew for your vehicle. It can be a one-off or a standing crew.', jobLead:'Post a mission or an event and write what you need.', roamLead:'Find people to roam with. One-off or a standing group.',
      postTitle:'Title', postDetail:'Details', postShip:'Vehicle', postMission:'Mission', postSeats:'Seats', postSeatsPh:'1-9999', postSeatsBad:'Use a number or a range, such as 1 or 1-9999.', postCrew:'Crew', postStanding:'Standing crew', postTemp:'Pickup crew', postServer:'Server', srvAsia:'Asia', srvUs:'US', srvAus:'Australia', srvEu:'Europe', postHours:'Duration', keep15:'15 minutes', keep30:'30 minutes', keep1:'1 hour', keep3:'3 hours', keep6:'6 hours', keep9:'9 hours', keep12:'12 hours', keep24:'24 hours', keep48:'48 hours', keep96:'96 hours', keep168:'168 hours', keepOpen:'Unlimited', postSend:'Post', postClear:'Remove', postNone:'Nothing posted yet.', postLimit:'Nine posts at a time.', postNeed:'Write a title first.', postPlace:'Place', postAt:'Time', postBy:'From', postLeft:'{t} left', postLeftSoon:'under 1 min left', postDay:'{d}d', postDayHour:'{d}d {h}h', postHour:'{h}h', postHourMin:'{h}h {m}m', postMin:'{m}m', postBringPh:'Ship or seat', postLink:'Link', postSpeech:'Language', speechZh:'Chinese', speechEn:'English', speechOther:'Other', speechAny:'Any', postContact:'Contact', contactNeed:'Choose a contact method and enter a valid account.', contactSpectrum:'Spectrum (recommended)', contactQq:'QQ', contactWechat:'WeChat', contactDiscord:'Discord', contactTelegram:'Telegram', contactKook:'KOOK', contactHeibox:'HeyBox', contactWhatsapp:'WhatsApp', contactMail:'Email', contactPhSpectrum:'Spectrum name', contactPhQq:'QQ number or group invite', contactPhWechat:'WeChat ID', contactPhDiscord:'Invite link or username', contactPhTelegram:'Username or t.me link', contactPhKook:'Invite link, name, or ID', contactPhHeibox:'Invite link, ID, or name', contactPhWhatsapp:'Number or group invite', contactPhMail:'Email address', contactOnline:'{n} online', contactMembers:'{n} members', postCopy:'Copy', roleFreight:'Freight', roleAssault:'Assault', roleMulti:'Multi', roleData:'Data running', roleMerchant:'Merchant', roleMine:'Minelayer', roleBattle:'Battlecruiser', roleTank:'Tank', roleMedical:'Medical', roleCrew:'{n} crew',
      handTitle:'Hand off before leaving', handLead:'Give the captain role to a member, or close the room.', handSolo:'You are the only person here. Leaving closes the room.',
      errNick:'Use a nickname of 1 to 32 characters.', errRoom:'No room with that code.',
      agoNow:'Just now', agoSec:'{n}s ago', agoMin:'{n} min ago', agoHour:'{n} h ago', agoDay:'{n} d ago',
      noPlace:'This place is not on the map.',
      errNet:'Room service is not reachable. Run python server/room_server.py and open http://127.0.0.1:8770/ .', published:'Published routes', by:'by',
      yours:'Your room', switchRoom:'Create or join a different room',
      hist:'Recent rooms', histWait:'Checking', histAlive:'Open', histGone:'Gone', histOnline:'{n} people', histEmpty:'No rooms yet', histBack:'Back to this room',
      visTitle:'Access', visPublic:'Public', visPrivate:'Private', visLead:'A public room is listed on the home page. People can enter directly.',
      visCool:'Change again in {n}', visSec:'{n}s', visMin:'{n} min',
      pubTitle:'Public rooms', pubEmpty:'No public rooms right now', pubPeople:'{n} people',
      resumed:'Room from last time', resumedLead:'Refreshing kept this room. The code is unchanged. You can enter the map.',
      freshCreate:'Room just created', freshCreateLead:'Send the room code to your team. Keep the recovery code. It takes the captain role on a new browser.',
      freshJoin:'Room just joined', freshJoinLead:'You can enter the map.',
      resumedWait:'Your earlier request is still waiting for the captain.',
      link:'Connect this computer', linkSent:'Sent to Starfix on this computer. Go back to that window and confirm.',
      linkWait:'Confirm in the Starfix window.',
      linkOn:'Connected to',
      linkOff:'Starfix is not running. Double-click Starfix, wait for its window, then click again.',
      linkToast:'Local link', linkRetry:'Try again',
      locGuide:'You can mark your place by hand, or try the bundled program to read the game log. By hand: right-click the map and choose “I am here.” Automatic: this project includes Starfix. All of its source is in companion/. Read it before you run it. It only reads Game.log on this computer. It does not enter the game, read memory, or change game files. Open it, choose “Connect this computer,” then confirm in its window. This page does not read the game folder. The RSI terms do not permit reading the log in writing. You decide.'
    },
    de: {
      title:'Teamraum', lead:'Diese Seite liest keinen Spielordner. Rechtsklick auf der Karte, dann „Ich bin hier“.',
      s1:'Nickname eintragen. Der Name aus dem Spiel hilft dem Captain.',
      s2:'Der Captain legt einen Raum an und gibt den Code weiter.',
      s3:'Mitglieder fragen an. Nach dem Ja sieht nur dieser Raum einander.',
      nick:'Nickname', nickPh:'Name im Spiel', create:'Raum anlegen', join:'Raum beitreten', code:'Raumcode',
      recover:'Wiederherstellungscode', recoverLead:'Dieser Code ist nur für dich. Nach einem neuen Browser oder gelöschten Websitedaten übernimmst du damit zusammen mit dem Raumcode den Captain. Kopiere ihn extra.', recoverCopy:'Code kopieren', recoverRoll:'Code erneuern', recoverGo:'Captain übernehmen', recoverPh:'ABCD-EFGH-JKLM', errRecover:'Der Wiederherstellungscode stimmt nicht.',
      wait:'Anfrage ist raus. Der Captain muss zustimmen.', copy:'Code kopieren', copied:'Kopiert',
      enter:'Zur Karte', leave:'Raum verlassen', pending:'Offen', approve:'Annehmen', reject:'Ablehnen', alertLater:'Später',
      here:'Ich bin hier', hereNeed:'Der Rechtsklick muss auf einem Ort liegen.',
      route:'Route markieren', routeOn:'Markieren beenden', routeHint:'Shift halten und Orte der Reihe nach anklicken.',
      note:'Notiz zur Route', publish:'Für den Raum veröffentlichen', clear:'Leeren', comment:'Kommentar', send:'Senden', del:'Löschen',
      mode:'Wer Routen zeichnen darf', modeCaptain:'Nur der Captain', modeMembers:'Auch Mitglieder',
      members:'Im Raum', online:'Online', offline:'Offline', server:'Server', fold:'Einklappen', unfold:'Ausklappen', you:'du', captainTag:'Captain',
      sfxOn:'Starfix online', sfxOff:'Starfix offline', gameOn:'Spiel online', gameOff:'Spiel offline',
      find:'Name oder Ort', none:'Niemand passt',
      give:'Zum Captain machen', giveShort:'Capt.', giveLeave:'Geben und gehen', dissolve:'Raum schließen', dissolveLeave:'Schließen und gehen', cancel:'Abbrechen',
      kick:'Entfernen', kickYes:'Wirklich', kicked:'Du wurdest aus diesem Raum entfernt.', denied:'Der Captain hat diese Anfrage abgelehnt.',
      cast:'Durchsage', castLead:'Das geht an alle in diesem Raum.', castPh:'Ein Satz für die Gruppe', castSend:'Senden', castFrom:'Von', castClose:'Verstanden', castSound:'Durchsage-Ton', castOn:'An', castOff:'Aus', castEmpty:'Erst etwas schreiben.',
      horn:'Sammelruf', hornLead:'Ort und Zeit festlegen. Die Seite erinnert, bis jede Person zusagt oder absagt.', hornPlace:'Ort', hornNeed:'Zuerst einen Ort auf der Karte antippen.', hornTime:'Zeit', hornSend:'Blasen', hornClear:'Ruf aufheben', hornJoin:'Dabei', hornSkip:'Nicht dabei', hornLook:'Ort zeigen', hornLater:'Später', hornGoing:'Dabei', hornGone:'Nicht dabei', hornPin:'Ruf',
      plaza:'Geistermarkt-Bar', plazaPage:'Eigene Seite', plazaBack:'Zur Karte', plazaLead:'Die Halle zeigt nur Namen. Der Chat bleibt daneben offen. Anwerbung bleibt getrennt vom Gruppenraum.', plazaOn:'In der Halle erscheinen', plazaOff:'Halle verlassen', plazaHere:'Gewählten Ort nehmen', plazaNeed:'Zuerst einen Ort auf der Karte antippen, oder Starfix laufen lassen.', plazaEmpty:'Noch niemand in der Halle.',
      chatPh:'Etwas sagen', chatSend:'Senden', chatEmpty:'Erst etwas schreiben.', chatFast:'Zu schnell.',
      hallTab:'Halle', shipTab:'Fahrzeugcrew', jobTab:'Aufträge', roamTab:'Streifzug',
      shipLead:'Besatzung für ein Fahrzeug suchen. Einmalig oder fest.', jobLead:'Einen Auftrag oder ein Treffen ausschreiben und den Bedarf dazu.', roamLead:'Leute zum Herumziehen suchen. Einmalig oder fest.',
      postTitle:'Titel', postDetail:'Bedarf', postShip:'Fahrzeug', postMission:'Auftrag', postSeats:'Plätze', postSeatsPh:'1-9999', postSeatsBad:'Eine Zahl oder einen Bereich angeben, zum Beispiel 1 oder 1-9999.', postCrew:'Gruppe', postStanding:'Feste Gruppe', postTemp:'Offene Gruppe', postServer:'Server', srvAsia:'Asien', srvUs:'USA', srvAus:'Australien', srvEu:'Europa', postHours:'Dauer', keep15:'15 Minuten', keep30:'30 Minuten', keep1:'1 Stunde', keep3:'3 Stunden', keep6:'6 Stunden', keep9:'9 Stunden', keep12:'12 Stunden', keep24:'24 Stunden', keep48:'48 Stunden', keep96:'96 Stunden', keep168:'168 Stunden', keepOpen:'Unbegrenzt', postSend:'Veröffentlichen', postClear:'Zurückziehen', postNone:'Noch nichts ausgeschrieben.', postLimit:'Höchstens neun gleichzeitig.', postNeed:'Zuerst einen Titel schreiben.', postPlace:'Ort', postAt:'Zeit', postBy:'Von', postLeft:'noch {t}', postLeftSoon:'unter 1 Min', postDay:'{d} T', postDayHour:'{d} T {h} Std', postHour:'{h} Std', postHourMin:'{h} Std {m} Min', postMin:'{m} Min', postBringPh:'Schiff oder Platz', postLink:'Link', postSpeech:'Sprache', speechZh:'Chinesisch', speechEn:'Englisch', speechOther:'Andere', speechAny:'Beliebig', postContact:'Kontakt', contactNeed:'Wähle einen Kontaktweg und gib ein gültiges Konto ein.', contactSpectrum:'Spectrum (empfohlen)', contactQq:'QQ', contactWechat:'WeChat', contactDiscord:'Discord', contactTelegram:'Telegram', contactKook:'KOOK', contactHeibox:'HeyBox', contactWhatsapp:'WhatsApp', contactMail:'E-Mail', contactPhSpectrum:'Spectrum-Name', contactPhQq:'QQ-Nummer oder Gruppeneinladung', contactPhWechat:'WeChat-ID', contactPhDiscord:'Einladungslink oder Name', contactPhTelegram:'Name oder t.me-Link', contactPhKook:'Einladungslink, Name oder ID', contactPhHeibox:'Einladungslink, ID oder Name', contactPhWhatsapp:'Nummer oder Gruppeneinladung', contactPhMail:'E-Mail-Adresse', contactOnline:'{n} online', contactMembers:'{n} Mitglieder', postCopy:'Kopieren', roleFreight:'Fracht', roleAssault:'Sturm', roleMulti:'Mehrzweck', roleData:'Datenlauf', roleMerchant:'Händler', roleMine:'Minenleger', roleBattle:'Schlachtkreuzer', roleTank:'Panzer', roleMedical:'Medizin', roleCrew:'{n} Pers.',
      handTitle:'Vor dem Gehen übergeben', handLead:'Captain an ein Mitglied geben, oder den Raum schließen.', handSolo:'Du bist allein. Gehen schließt den Raum.',
      errNick:'Nickname mit 1 bis 32 Zeichen.', errRoom:'Diesen Raum gibt es nicht.',
      agoNow:'Gerade', agoSec:'vor {n} s', agoMin:'vor {n} min', agoHour:'vor {n} h', agoDay:'vor {n} d',
      noPlace:'Dieser Ort ist nicht auf der Karte.',
      errNet:'Der Raumdienst ist nicht erreichbar. python server/room_server.py starten und http://127.0.0.1:8770/ öffnen.', published:'Veröffentlichte Routen', by:'von',
      yours:'Dein Raum', switchRoom:'Anderen Raum anlegen oder beitreten',
      hist:'Letzte Räume', histWait:'Prüfung', histAlive:'Offen', histGone:'Weg', histOnline:'{n} Personen', histEmpty:'Noch keine Räume', histBack:'Zurück zu diesem Raum',
      visTitle:'Zugang', visPublic:'Öffentlich', visPrivate:'Privat', visLead:'Ein öffentlicher Raum steht auf der Startseite. Man kann direkt eintreten.',
      visCool:'Wieder änderbar in {n}', visSec:'{n} s', visMin:'{n} min',
      pubTitle:'Öffentliche Räume', pubEmpty:'Gerade keine öffentlichen Räume', pubPeople:'{n} Personen',
      resumed:'Raum von zuletzt', resumedLead:'Nach dem Neuladen ist es derselbe Raum. Der Code ist unverändert. Du kannst die Karte öffnen.',
      freshCreate:'Gerade angelegt', freshCreateLead:'Gib den Raumcode an das Team. Den Wiederherstellungscode behältst du. Damit übernimmst du den Captain in einem neuen Browser.',
      freshJoin:'Gerade beigetreten', freshJoinLead:'Du kannst die Karte öffnen.',
      resumedWait:'Deine frühere Anfrage wartet noch auf den Captain.',
      link:'Diesen Computer verbinden', linkSent:'An Starfix auf diesem Computer gesendet. Dort bestätigen.',
      linkWait:'Im Starfix-Fenster bestätigen.',
      linkOn:'Verbunden mit',
      linkOff:'Starfix läuft nicht. Starfix doppelklicken, auf das Fenster warten und erneut klicken.',
      linkToast:'Lokale Verbindung', linkRetry:'Nochmal',
      locGuide:'Du kannst den Ort von Hand setzen oder das mitgelieferte Programm das Spiellog lesen lassen. Von Hand: Rechtsklick auf der Karte, dann „Ich bin hier“. Automatisch: das Projekt enthält Starfix. Der ganze Quelltext liegt in companion/. Lies ihn, bevor du ihn startest. Es liest nur die Game.log auf diesem Computer. Es betritt das Spiel nicht, liest keinen Speicher und ändert keine Spieldateien. Öffne es, wähle „Diesen Computer verbinden“ und bestätige im Fenster. Diese Seite liest keinen Spielordner. Die RSI-Bedingungen erlauben das Lesen des Logs nicht schriftlich. Du entscheidest.'
    }
  };
  function lang(){ return (SC.i18n && SC.i18n.lang) || 'en'; }
  function t(k){ var d = DICT[lang()] || DICT.en; return d[k] || DICT.en[k] || k; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function token(){ try{ return localStorage.getItem(TOKEN)||''; }catch(e){ return ''; } }
  function savedCode(){ try{ return localStorage.getItem(CODE)||''; }catch(e){ return ''; } }
  var state = null, draft = [], marking = false, note = '', statusMsg = '', selected = '', API = '', entered = false, roomKind = '', linkState = '', linkMiss = 0, linkToast = '', linkToastHold = false, linkTimer = 0, leaving = false, crewQ = '', picking = false, histInfo = {}, histKey = '', pubRooms = null, pubSig = null, pubAt = 0, alertHold = false, alertSeen = {}, alertFlash = null, alertTimer = 0, kickAsk = '', alertDeny = null, castCompose = false, castDraft = '', castErr = '', castIncoming = null, castAudio = null, ctxAt = null, ctxSig = '', recoverDraft = '', recoverFocus = '', newPair = null, previewWait = false, previewUntil = 0, homePane = 'join';
  var hornCompose = false, hornErr = '', hornWhen = '', hornOpen = false, hornSheet = false, hornId = '', hornNag = 0, hornTimer = 0;
  var plazaOn = false, plazaTab = 'hall', plazaMineOn = false, plazaPeople = [], plazaPosts = [], plazaErr = '', plazaFault = '', chatLast = 0, chatLines = [], plazaPulling = false;
  var pendingPost = '', linkedPost = '', linkedOnce = false, plazaPage = false;
  try{
    var plazaQuery = new URLSearchParams(location.search);
    pendingPost = String(plazaQuery.get('post')||'').slice(0, 40);
    plazaPage = plazaQuery.get('view')==='plaza' || !!pendingPost;
    if(pendingPost && plazaQuery.get('view')!=='plaza'){
      plazaQuery.set('view', 'plaza');
      history.replaceState(null, '', location.pathname+'?'+plazaQuery.toString());
    }
  }catch(e){}

  function api(path, opt){
    opt = opt || {};
    var headers = {'Content-Type':'application/json'};
    if(token()) headers.Authorization = 'Bearer '+token();
    return fetch(API+path, {
      method: opt.method || 'GET',
      headers: headers,
      body: opt.body ? JSON.stringify(opt.body) : undefined,
      cache: 'no-store'
    }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(j){
        if(!r.ok){ var err = new Error((j&&j.error)||('http '+r.status)); err.status=r.status; err.body=j; throw err; }
        return j;
      });
    });
  }

  function root(){ return document.querySelector('.sc-lmw') || document.body; }

  function ensure(){
    var g = document.getElementById('stGate');
    if(!g){
      g = document.createElement('div');
      g.id = 'stGate';
      g.className = 'st-gate';
      g.hidden = true;
      root().appendChild(g);
    }
    var dock = document.getElementById('stRoom');
    var dockIco = document.getElementById('stRoomIco');
    if(!dock){
      dock = document.createElement('div');
      dock.id = 'stRoom';
      dock.className = 'st-room st-dock';
      dock.hidden = true;
      root().appendChild(dock);
      bindFrame(dock, {key:FRAME, minW:280, minH:220});
    }
    if(!dockIco){
      dockIco = document.createElement('button');
      dockIco.type = 'button';
      dockIco.id = 'stRoomIco';
      dockIco.className = 'st-float-ico st-room-ico';
      dockIco.hidden = true;
      root().appendChild(dockIco);
      bindIcon(dockIco, FRAME, function(){ patchFrame(FRAME, {mini:0}); paint(); });
    }
    var crew = document.getElementById('stCrew');
    var crewIco = document.getElementById('stCrewIco');
    if(!crew){
      crew = document.createElement('div');
      crew.id = 'stCrew';
      crew.className = 'st-room st-crew st-dock';
      crew.hidden = true;
      root().appendChild(crew);
      crewIco = document.createElement('button');
      crewIco.type = 'button';
      crewIco.id = 'stCrewIco';
      crewIco.className = 'st-float-ico st-crew-ico';
      crewIco.hidden = true;
      root().appendChild(crewIco);
      bindFrame(crew, {key:CREW, minW:220, minH:160});
      bindIcon(crewIco, CREW, function(){ patchFrame(CREW, {mini:0}); paint(); });
    }
    return {gate:g, dock:dock, dockIco:dockIco, crew:crew, crewIco:crewIco};
  }

  function readRaw(key){
    try{ var s = JSON.parse(localStorage.getItem(key)||'null'); if(s && typeof s==='object') return s; }catch(e){}
    return null;
  }
  function patchFrame(key, part){
    var s = readRaw(key) || {};
    Object.keys(part).forEach(function(k){ s[k] = part[k]; });
    try{ localStorage.setItem(key, JSON.stringify(s)); }catch(e){}
    return s;
  }
  function touchShell(){
    var s = document.documentElement.getAttribute('data-sclmw-shell');
    return s==='hand' || s==='slab';
  }
  function sheetLayout(){
    if(touchShell()) return true;
    var host = root();
    var w = host.clientWidth||999, h = host.clientHeight||999;
    return w<=700 || (w<=900 && h<=500);
  }
  function clearFrame(dock){
    if(!dock) return;
    dock.style.left = '';
    dock.style.top = '';
    dock.style.right = '';
    dock.style.bottom = '';
    dock.style.width = '';
    dock.style.height = '';
  }
  function applyFrame(dock, key, minW, minH){
    if(sheetLayout()){ clearFrame(dock); return; }
    var s = readRaw(key || FRAME);
    if(!s || !dock || typeof s.l!=='number' || !(s.w>0) || !(s.h>0)) return;
    minW = minW || 280; minH = minH || 220;
    var host = root();
    var W = host.clientWidth||1, H = host.clientHeight||1;
    var w = Math.max(minW, Math.min(s.w, W));
    var h = Math.max(minH, Math.min(s.h, H));
    var l = Math.max(0, Math.min(s.l, Math.max(0, W-w)));
    var t = Math.max(0, Math.min(s.t, Math.max(0, H-h)));
    dock.style.left = l+'px';
    dock.style.top = t+'px';
    dock.style.right = 'auto';
    dock.style.bottom = 'auto';
    dock.style.width = w+'px';
    dock.style.height = h+'px';
  }
  function saveFrame(dock, key){
    if(touchShell() || !dock || dock.hidden || dock.offsetWidth<40) return;
    var host = root().getBoundingClientRect();
    var box = dock.getBoundingClientRect();
    patchFrame(key || FRAME, {
      l: Math.round(box.left-host.left),
      t: Math.round(box.top-host.top),
      w: Math.round(box.width),
      h: Math.round(box.height)
    });
  }
  function placeIcon(ico, l, t){
    var host = root();
    var W = host.clientWidth||1, H = host.clientHeight||1;
    var w = ico.offsetWidth||48, h = ico.offsetHeight||48;
    l = Math.max(8, Math.min(l, W-w-8));
    t = Math.max(8, Math.min(t, H-h-8));
    ico.style.left = l+'px';
    ico.style.top = t+'px';
  }
  function bindFrame(dock, opt){
    opt = opt || {};
    var key = opt.key || FRAME, minW = opt.minW || 280, minH = opt.minH || 220, drag = null;
    function place(l, t, w, h){
      var host = root();
      var W = host.clientWidth||1, H = host.clientHeight||1;
      w = Math.max(minW, Math.min(w, W));
      h = Math.max(minH, Math.min(h, H));
      l = Math.max(0, Math.min(l, Math.max(0, W-w)));
      t = Math.max(0, Math.min(t, Math.max(0, H-h)));
      dock.style.left = l+'px';
      dock.style.top = t+'px';
      dock.style.right = 'auto';
      dock.style.bottom = 'auto';
      dock.style.width = w+'px';
      dock.style.height = h+'px';
    }
    dock.addEventListener('pointerdown', function(e){
      if(e.button!==0) return;
      if(touchShell()) return;
      if(plazaPage && dock.id==='stPlaza') return;
      if(opt.sheet && sheetLayout()) return;
      var edge = e.target.closest && e.target.closest('[data-resize]');
      var bar = e.target.closest && e.target.closest(opt.bar || '.st-room-h');
      if(!edge && !(bar && !(e.target.closest && e.target.closest('button,input,.st-font')))) return;
      var host = root().getBoundingClientRect();
      var box = dock.getBoundingClientRect();
      drag = {
        mode: edge ? edge.getAttribute('data-resize') : 'move',
        x: e.clientX, y: e.clientY,
        l: box.left-host.left, t: box.top-host.top,
        w: box.width, h: box.height
      };
      dock.__frameDrag = true;
      dock.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    dock.addEventListener('pointermove', function(e){
      if(!drag) return;
      var dx = e.clientX-drag.x, dy = e.clientY-drag.y;
      var l = drag.l, t = drag.t, w = drag.w, h = drag.h, m = drag.mode;
      if(m==='move'){ l += dx; t += dy; }
      else {
        var east = m==='e'||m==='ne'||m==='se';
        var west = m==='w'||m==='nw'||m==='sw';
        var south = m==='s'||m==='se'||m==='sw';
        var north = m==='n'||m==='ne'||m==='nw';
        if(east) w = drag.w+dx;
        if(south) h = drag.h+dy;
        if(west){ w = drag.w-dx; l = drag.l+dx; }
        if(north){ h = drag.h-dy; t = drag.t+dy; }
        if(w<minW){ if(west) l -= minW-w; w = minW; }
        if(h<minH){ if(north) t -= minH-h; h = minH; }
      }
      place(l, t, w, h);
    });
    function end(e){
      if(!drag) return;
      drag = null;
      dock.__frameDrag = false;
      saveFrame(dock, key);
      try{ dock.releasePointerCapture(e.pointerId); }catch(err){}
    }
    dock.addEventListener('pointerup', end);
    dock.addEventListener('pointercancel', end);
    if(window.ResizeObserver){
      new ResizeObserver(function(){ if(!drag) applyFrame(dock, key, minW, minH); }).observe(root());
    } else {
      window.addEventListener('resize', function(){ if(!drag) applyFrame(dock, key, minW, minH); });
    }
  }
  function bindIcon(ico, key, onOpen){
    var drag = null, moved = false;
    ico.addEventListener('pointerdown', function(e){
      if(e.button!==0) return;
      if(touchShell()) return;
      var host = root().getBoundingClientRect();
      var box = ico.getBoundingClientRect();
      drag = {x:e.clientX, y:e.clientY, l:box.left-host.left, t:box.top-host.top};
      moved = false;
      ico.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    ico.addEventListener('pointermove', function(e){
      if(!drag) return;
      var dx = e.clientX-drag.x, dy = e.clientY-drag.y;
      if(Math.abs(dx)>4 || Math.abs(dy)>4) moved = true;
      placeIcon(ico, drag.l+dx, drag.t+dy);
    });
    function end(e){
      if(!drag) return;
      var dx = e.clientX-drag.x, dy = e.clientY-drag.y;
      placeIcon(ico, drag.l+dx, drag.t+dy);
      patchFrame(key, {ix:parseFloat(ico.style.left), iy:parseFloat(ico.style.top)});
      drag = null;
      try{ ico.releasePointerCapture(e.pointerId); }catch(err){}
      if(!moved) onOpen();
    }
    ico.addEventListener('pointerup', end);
    ico.addEventListener('pointercancel', end);
    ico.addEventListener('click', function(){ if(touchShell()) onOpen(); });
  }
  function edgeHtml(){
    return '<i class="st-room-edge n" data-resize="n"></i><i class="st-room-edge s" data-resize="s"></i>'+
      '<i class="st-room-edge e" data-resize="e"></i><i class="st-room-edge w" data-resize="w"></i>'+
      '<i class="st-room-edge nw" data-resize="nw"></i><i class="st-room-edge ne" data-resize="ne"></i>'+
      '<i class="st-room-edge sw" data-resize="sw"></i><i class="st-room-edge se" data-resize="se"></i>';
  }

  function bindPlayers(){
    if(!state || state.status!=='member') return;
    var cfg = window.LIVEMAP_CONFIG = window.LIVEMAP_CONFIG || {};
    cfg.PLAYERS_URL = API+'/api/rooms/'+encodeURIComponent(state.code)+'/players';
    cfg.PLAYERS_HEADERS = {Authorization:'Bearer '+token()};
    if(typeof window.__stReloadPlayers==='function') window.__stReloadPlayers();
  }

  function drawSelected(){
    var ctl = window.__stCtl;
    if(!ctl || !ctl.showRoute) return;
    var rt = (state&&state.routes||[]).filter(function(r){ return r.id===selected; })[0];
    var ids = rt ? rt.points.map(function(p){ return p.id; }) : (marking ? draft.map(function(p){ return p.id; }) : []);
    ctl.showRoute(ids);
  }

  function canDraw(){
    if(!state || state.status!=='member') return false;
    return state.routeMode==='members' || state.role==='captain';
  }

  function noteRecoverFocus(){
    var ids = ['stRoomRecover', 'stGateRecoverIn', 'stDockRecoverIn'];
    for(var i = 0; i < ids.length; i++){
      var el = document.getElementById(ids[i]);
      if(!el) continue;
      if(document.activeElement === el){
        recoverDraft = el.value;
        recoverFocus = ids[i];
        return;
      }
      if(el.value) recoverDraft = el.value;
    }
    recoverFocus = '';
  }
  function paint(){
    noteRecoverFocus();
    var ui = ensure();
    var onMap = !!(entered && state && state.status==='member');
    var dockMini = !!(readRaw(FRAME) && readRaw(FRAME).mini);
    var crewMini = !!(readRaw(CREW) && readRaw(CREW).mini);
    ui.gate.hidden = onMap || (plazaPage && state && state.status==='member');
    ui.dock.hidden = !onMap || dockMini;
    ui.dockIco.hidden = !onMap || !dockMini;
    ui.dockIco.textContent = state && state.code ? state.code : '';
    ui.dockIco.title = t('title');
    ui.dockIco.setAttribute('aria-label', t('title'));
    ui.crew.hidden = !onMap || crewMini;
    ui.crewIco.hidden = !onMap || !crewMini;
    if(!onMap) paintGate(ui.gate);
    if(onMap){
      paintDock(ui.dock);
      paintCrew(ui.crew, ui.crewIco);
      if(!ui.dock.__frameDrag) applyFrame(ui.dock, FRAME, 280, 220);
      if(!ui.crew.__frameDrag) applyFrame(ui.crew, CREW, 220, 160);
      var roomSaved = readRaw(FRAME);
      if(roomSaved && typeof roomSaved.ix==='number') placeIcon(ui.dockIco, roomSaved.ix, roomSaved.iy);
      var saved = readRaw(CREW);
      if(saved && typeof saved.ix==='number') placeIcon(ui.crewIco, saved.ix, saved.iy);
    }
    mountDockBar();
    paintLinkToast();
    window.__stRouteOn = !!(state && state.status==='member' && marking && canDraw());
    window.__stRouteAdd = function(o){
      if(!window.__stRouteOn || !o) return;
      if(draft.length && draft[draft.length-1].id===o.id) return;
      draft.push({id:o.id, n:o.n, sy:o.sy||''});
      if(draft.length>40) draft.shift();
      paint();
    };
    drawSelected();
    syncRallyPin();
    paintAlert();
    armRally();
    syncCtx();
    syncPlazaBtn();
    if(state && state.status==='member' && !onMap && window.SCLMW && window.SCLMW.armScene) window.SCLMW.armScene();
    if(recoverFocus){
      var again = document.getElementById(recoverFocus);
      if(again) again.focus();
    }
  }

  function ti(k){
    if(SC.i18n && typeof SC.i18n.t==='function') return SC.i18n.t(k);
    return k;
  }
  function starfixFactsHtml(){
    return '<h2>'+esc(ti('home.need_h'))+'</h2>'+
      '<ul><li>'+esc(ti('home.gain_1'))+'</li><li>'+esc(ti('home.gain_2'))+'</li><li>'+esc(ti('home.gain_3'))+'</li></ul>'+
      '<p>'+esc(ti('home.need_no'))+'</p>'+
      '<h2>'+esc(ti('home.know_h'))+'</h2>'+
      '<ul><li>'+esc(ti('home.know_1'))+'</li><li>'+esc(ti('home.know_2'))+'</li><li>'+esc(ti('home.know_3'))+'</li></ul>'+
      '<p class="st-home-links">'+
        '<a href="https://github.com/GuguguBear/sc-lmw/blob/master/companion/README.md" target="_blank" rel="noopener">'+esc(ti('starfix.src_read'))+'</a>'+
        '<a href="https://github.com/GuguguBear/sc-lmw/releases/tag/starfix-1.0.14" target="_blank" rel="noopener">'+esc(ti('starfix.src_rel'))+'</a>'+
        '<a href="https://github.com/GuguguBear/sc-lmw/blob/master/companion/app.py" target="_blank" rel="noopener">'+esc(ti('starfix.src_app'))+'</a>'+
      '</p>';
  }
  function openStarfix(){
    var onMap = !!(entered && state && state.status==='member');
    if(!onMap){
      var sec = document.getElementById('stHomeStarfix');
      if(sec && sec.scrollIntoView) sec.scrollIntoView({block:'start'});
      return;
    }
    var box = document.getElementById('stSfx');
    if(!box){
      box = document.createElement('div');
      box.id = 'stSfx';
      box.className = 'st-sfx st-dock';
      root().appendChild(box);
    }
    box.hidden = false;
    box.innerHTML = '<div class="st-sfx-h"><b>'+esc(ti('starfix.title'))+'</b><button type="button" id="stSfxX">✕</button></div><div class="st-sfx-b">'+starfixFactsHtml()+'</div>';
    var x = box.querySelector('#stSfxX');
    if(x) x.onclick = function(){ box.hidden = true; };
  }
  function readHist(){
    try{
      var list = JSON.parse(localStorage.getItem(HIST)||'[]');
      if(!Array.isArray(list)) return [];
      return list.filter(function(x){ return x && x.code; }).slice(0, 90);
    }catch(e){ return []; }
  }
  function rememberHist(code){
    code = String(code||'').toUpperCase();
    if(!code) return;
    var list = readHist().filter(function(x){ return x.code!==code; });
    list.unshift({code:code, at:Date.now()});
    try{ localStorage.setItem(HIST, JSON.stringify(list.slice(0, 90))); }catch(e){}
    histKey = '';
  }
  function histLine(code){
    var info = histInfo[code];
    if(!info) return t('histWait');
    if(!info.exists) return t('histGone');
    return t('histAlive')+' · '+t('histOnline').replace('{n}', String(info.members||0));
  }
  function histHtml(){
    var list = readHist();
    var rows = list.map(function(x){
      var cur = state && state.code===x.code ? ' is-cur' : '';
      return '<button type="button" class="st-past'+cur+'" data-hist="'+esc(x.code)+'"><b>'+esc(x.code)+'</b><span>'+esc(histLine(x.code))+'</span></button>';
    }).join('');
    return '<div class="st-home-hist">'+
      (rows ? '<div class="st-home-hist-list">'+rows+'</div>' : '<p class="st-flash is-quiet">'+esc(t('histEmpty'))+'</p>')+
      '</div>';
  }
  function pullHist(){
    var list = readHist();
    var key = list.map(function(x){ return x.code; }).join(',');
    if(!key || !token()) return;
    if(key===histKey) return;
    histKey = key;
    api('/api/rooms/lookup', {method:'POST', body:{codes:list.map(function(x){ return x.code; })}}).then(function(d){
      histInfo = {};
      (d && d.rooms || []).forEach(function(r){ if(r && r.code) histInfo[r.code] = r; });
      if(document.getElementById('stGate') && !document.getElementById('stGate').hidden) paint();
    }).catch(function(){});
  }
  function bindHist(el){
    el.querySelectorAll('[data-hist]').forEach(function(b){
      b.onclick = function(){ enterCode(b.getAttribute('data-hist')); };
    });
    pullHist();
  }
  function coolLeft(){
    if(!state || !state.openUntil) return 0;
    return Math.max(0, Math.ceil((state.openUntil-Date.now())/1000));
  }
  function coolLabel(sec){
    sec = Math.max(0, sec|0);
    if(sec>=60) return t('visMin').replace('{n}', String(Math.ceil(sec/60)));
    return t('visSec').replace('{n}', String(sec));
  }
  function visHtml(){
    if(!state || state.role!=='captain' || state.status!=='member') return '';
    var open = !!state.open;
    var left = coolLeft();
    var disPub = (!open && left>0) ? ' disabled' : '';
    var disPriv = (open && left>0) ? ' disabled' : '';
    return '<div class="st-vis"><span>'+esc(t('visTitle'))+'</span>'+
      '<button type="button" data-open="1"'+(open?' class="on"':'')+disPub+'>'+esc(t('visPublic'))+'</button>'+
      '<button type="button" data-open="0"'+(!open?' class="on"':'')+disPriv+'>'+esc(t('visPrivate'))+'</button>'+
      (left ? '<em data-cool="'+state.openUntil+'">'+esc(t('visCool').replace('{n}', coolLabel(left)))+'</em>' : '')+
      '</div><p class="st-room-dim">'+esc(t('visLead'))+'</p>';
  }
  function bindOpen(el){
    el.querySelectorAll('[data-open]').forEach(function(b){
      b.onclick = function(){
        var want = b.getAttribute('data-open')==='1';
        if(!state || !!state.open===want) return;
        setOpen(want);
      };
    });
  }
  function setOpen(open){
    if(!state || state.role!=='captain' || !state.code) return;
    api('/api/rooms/'+encodeURIComponent(state.code)+'/open', {method:'POST', body:{open:!!open}}).then(function(st){
      pubAt = 0;
      take(st);
    }).catch(fail);
  }
  function pubHtml(){
    if(!pubRooms) return '';
    var rows = pubRooms.map(function(r){
      var meta = (r.captain ? esc(r.captain)+' · ' : '')+esc(t('pubPeople').replace('{n}', String(r.members||0)));
      return '<button type="button" class="st-past" data-pub="'+esc(r.code)+'"><b>'+esc(r.code)+'</b><span>'+meta+'</span></button>';
    }).join('');
    return '<section class="st-home-card st-home-pub"><h2>'+esc(t('pubTitle'))+'</h2>'+
      (rows ? '<div class="st-home-hist-list">'+rows+'</div>' : '<p class="st-flash is-quiet">'+esc(t('pubEmpty'))+'</p>')+
      '</section>';
  }
  function pullPublic(force){
    var nowMs = Date.now();
    if(!force && nowMs-pubAt<4000) return;
    pubAt = nowMs;
    fetch((API||'')+'/api/rooms/public', {cache:'no-store'}).then(function(r){
      if(!r.ok) throw new Error('public');
      return r.json();
    }).then(function(d){
      var next = (d && d.rooms) || [];
      var sig = next.map(function(r){ return r.code+':'+r.members+':'+(r.captain||''); }).join(',');
      if(sig===pubSig) return;
      pubRooms = next;
      pubSig = sig;
      var gate = document.getElementById('stGate');
      if(gate && !gate.hidden) paint();
    }).catch(function(){});
  }
  function bindPub(el){
    el.querySelectorAll('[data-pub]').forEach(function(b){
      b.onclick = function(){ enterCode(b.getAttribute('data-pub')); };
    });
    pullPublic(false);
  }
  function useHtml(){
    var steps = [
      ['home.use_room_h','home.use_room'],
      ['home.use_map_h','home.use_map'],
      ['home.use_fix_h','home.use_fix'],
      ['home.use_log_h','home.use_log'],
      ['home.use_plaza_h','home.use_plaza'],
      ['home.use_horn_h','home.use_horn'],
      ['home.use_route_h','home.use_route'],
      ['home.use_cast_h','home.use_cast']
    ];
    return '<div class="st-home-use"><dl>'+
      steps.map(function(pair){
        return '<div><dt>'+esc(ti(pair[0]))+'</dt><dd>'+esc(ti(pair[1]))+'</dd></div>';
      }).join('')+'</dl></div>';
  }
  function rsiHtml(){
    var lang = (SC.i18n && SC.i18n.getLang) ? SC.i18n.getLang() : 'en';
    var local = lang==='en' ? '' : '<p>'+esc(ti('home.rsi_local'))+'</p>';
    return '<section class="st-home-card st-home-rsi">'+
      '<img class="st-rsi-mark" src="./icons/made-by-the-community.png" alt="Made by the Community" width="168" height="168">'+
      '<h2>'+esc(ti('home.rsi_h'))+'</h2>'+
      '<p class="st-rsi-en">This is an unofficial Star Citizen fan site, not affiliated with the Cloud Imperium group of companies. All content on this site not authored by its host or users are property of their respective owners.</p>'+
      local+
      '<p class="st-rsi-markline"><b>'+esc(ti('home.rsi_tm'))+'</b> Star Citizen®, Squadron 42®, Roberts Space Industries®, and Cloud Imperium® are registered trademarks of Cloud Imperium Rights LLC and Cloud Imperium Rights Ltd. All rights reserved.</p>'+
      '<p class="st-home-links">'+
        '<a href="https://robertsspaceindustries.com/" target="_blank" rel="noopener">'+esc(ti('home.rsi_official'))+'</a>'+
        '<a href="https://www.robertsspaceindustries.com/enlist?referral=STAR-SYHL-2MV5" target="_blank" rel="noopener">'+esc(ti('home.rsi_invite'))+'</a>'+
        '<a href="https://support.robertsspaceindustries.com/hc/en-us/articles/360006895793-Star-Citizen-Fankit-and-Fandom-FAQ" target="_blank" rel="noopener">'+esc(ti('home.rsi_policy'))+'</a>'+
      '</p></section>';
  }

  function childByClass(el, cls){
    for(var i = 0; i < el.children.length; i++){
      if(el.children[i].classList.contains(cls)) return el.children[i];
    }
    return null;
  }
  function ensureHomeField(el){
    var field = childByClass(el, 'st-home-field');
    if(field) return field;
    field = document.createElement('div');
    field.className = 'st-home-field';
    field.setAttribute('aria-hidden', 'true');
    field.innerHTML = '<div class="st-home-floor"><div class="st-home-grid"></div></div>';
    el.insertBefore(field, el.firstChild);
    return field;
  }
  function mountHome(el, narrow){
    ensureHomeField(el);
    var home = childByClass(el, 'st-home');
    if(!home){
      home = document.createElement('div');
      el.appendChild(home);
    }
    home.className = narrow ? 'st-home st-home-narrow' : 'st-home';
    return home;
  }
  function paintGate(el){
    if(leaving && state && state.role==='captain' && state.status==='member'){
      var hand = mountHome(el, true);
      hand.innerHTML = '<header class="st-home-hero"><div class="st-home-kicker">SC LMW</div><h1>'+esc(t('title'))+'</h1>'+(SC.fontControlHtml?SC.fontControlHtml():'')+'</header><section class="st-home-card">'+handoffHtml()+'</section>';
      bindHandoff(el);
      return;
    }
    var nick = '';
    try{ nick = localStorage.getItem(NICK)||''; }catch(e){}
    var pre = '';
    try{ pre = new URLSearchParams(location.search).get('room')||''; }catch(e){}
    if(state && state.code && !picking) pre = state.code;
    var wait = state && state.status==='pending' && !picking;
    var member = state && state.status==='member' && !picking;
    var kind = roomKind==='create' ? 'create' : roomKind==='join' ? 'join' : 'saved';
    var kindLabel = kind==='create' ? t('freshCreate') : kind==='join' ? t('freshJoin') : t('resumed');
    var kindLead = kind==='create' ? t('freshCreateLead') : kind==='join' ? t('freshJoinLead') : t('resumedLead');
    var roomBody = member ? (
          '<p class="st-room-kind">'+esc(kindLabel)+'</p>'+
          '<p>'+esc(kindLead)+'</p>'+
          '<p class="st-room-code">'+esc(state.code)+'</p>'+
          recoverHtml('stGateRecover')+
          visHtml()+
          '<div class="row"><button type="button" class="act" id="stEnter">'+esc(t('enter'))+'</button>'+
          '<button type="button" id="stGateCopy">'+esc(t('copy'))+'</button></div>'+
          '<button type="button" id="stSwitch" class="st-room-link">'+esc(t('switchRoom'))+'</button>'
        ) : wait ? (
          '<p class="st-room-kind">'+esc(kind==='join' ? t('wait') : t('resumedWait'))+'</p>'+
          '<p class="st-room-code">'+esc(state.code)+'</p>'+
          recoverHtml('stGateRecover')
        ) : (
          '<label>'+esc(t('nick'))+'<input id="stRoomNick" maxlength="32" value="'+esc(nick)+'" placeholder="'+esc(t('nickPh'))+'"></label>'+
          '<p class="st-room-dim">'+esc(t('s1'))+'</p>'+
          '<div class="st-issued"><span>'+esc(t('code'))+'</span><b>'+esc(newPair?newPair.code:'—')+'</b></div>'+
          '<div class="st-issued"><span>'+esc(t('recover'))+'</span><b>'+esc(newPair?newPair.recover:'—')+'</b>'+
          '<button type="button" id="stRecoverRoll"'+(previewLeft()?' disabled':'')+'>'+esc(t('recoverRoll'))+'</button>'+
          (previewLeft() ? '<em data-cool="'+(previewUntil)+'">'+esc(t('visCool').replace('{n}', coolLabel(previewLeft())))+'</em>' : '')+
          '</div>'+
          '<div class="row"><button type="button" class="act" id="stRoomCreate">'+esc(t('create'))+'</button></div>'+
          '<label>'+esc(t('code'))+'<input id="stRoomCode" maxlength="9" value="'+esc(pre)+'" placeholder="K7MQ-4R2P"></label>'+
          '<div class="row"><button type="button" id="stRoomJoin">'+esc(t('join'))+'</button></div>'+
          '<label>'+esc(t('recover'))+'<input id="stRoomRecover" maxlength="14" value="'+esc(recoverDraft)+'" placeholder="'+esc(t('recoverPh'))+'" autocomplete="off"></label>'+
          '<div class="row"><button type="button" id="stRoomRecoverGo">'+esc(t('recoverGo'))+'</button></div>'+
          (state && state.status==='member' ? '<button type="button" id="stHistBack" class="st-room-link">'+esc(t('histBack'))+'</button>' : '')
        )+
        (statusMsg ? '<p class="st-flash'+(statusMsg===t('copied')?' is-quiet':'')+'">'+esc(statusMsg)+'</p>' : '');
    var home = mountHome(el, false);
    home.innerHTML =
        '<header class="st-home-hero"><div class="st-home-kicker">SC LMW · '+esc(ti('home.kicker'))+'</div>'+
          '<h1>'+esc(t('title'))+'</h1><p>'+esc(ti('home.lead'))+'</p>'+(SC.fontControlHtml?SC.fontControlHtml():'')+'</header>'+
        rsiHtml()+
        '<section class="st-home-card" id="stHomeStarfix">'+starfixFactsHtml()+'</section>'+
        '<section class="st-home-card st-home-join">'+
        '<p><button type="button" id="stPlazaHome" class="st-plaza-entry">'+esc(t('plaza'))+'</button></p>'+
        '<div class="st-home-tabs">'+
          '<button type="button" data-home="join"'+(homePane==='join'?' class="on"':'')+'>'+esc(ti('home.join_h'))+'</button>'+
          '<button type="button" data-home="hist"'+(homePane==='hist'?' class="on"':'')+'>'+esc(t('hist'))+'</button>'+
          '<button type="button" data-home="use"'+(homePane==='use'?' class="on"':'')+'>'+esc(ti('home.use_h'))+'</button>'+
        '</div>'+
        '<div'+(homePane==='join'?'':' hidden')+'>'+roomBody+'</div>'+
        '<div'+(homePane==='hist'?'':' hidden')+'>'+histHtml()+'</div>'+
        '<div'+(homePane==='use'?'':' hidden')+'>'+useHtml()+'</div></section>'+
        pubHtml();
    var c = el.querySelector('#stRoomCreate'), j = el.querySelector('#stRoomJoin');
    if(c) c.onclick = function(){ act('create'); };
    var roll = el.querySelector('#stRecoverRoll');
    if(roll) roll.onclick = rollPreview;
    ensurePreview();
    if(j) j.onclick = function(){ act('join'); };
    var recIn = el.querySelector('#stRoomRecover');
    if(recIn) recIn.oninput = function(){ recoverDraft = recIn.value; };
    var recGo = el.querySelector('#stRoomRecoverGo');
    if(recGo) recGo.onclick = function(){
      reclaimFrom(nickValue() || savedNick(), codeValue(), recIn ? recIn.value : recoverDraft);
    };
    bindRecover(el, 'stGateRecover');
    var enter = el.querySelector('#stEnter');
    if(enter){ enter.onclick = enterMap; markEnterWait(); }
    var copy = el.querySelector('#stGateCopy');
    if(copy) copy.onclick = function(){
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(state.code);
      statusMsg = t('copied'); paint();
      setTimeout(function(){ if(statusMsg===t('copied')){ statusMsg=''; paint(); } }, 1200);
    };
    var sw = el.querySelector('#stSwitch');
    if(sw) sw.onclick = function(){ picking = true; statusMsg = ''; paint(); };
    var back = el.querySelector('#stHistBack');
    if(back) back.onclick = function(){ picking = false; statusMsg = ''; paint(); };
    bindHist(el);
    el.querySelectorAll('[data-home]').forEach(function(b){
      b.onclick = function(){
        var next = b.getAttribute('data-home');
        homePane = next==='hist' || next==='use' ? next : 'join';
        paint();
      };
    });
    bindOpen(el);
    bindPub(el);
    var plazaHome = el.querySelector('#stPlazaHome');
    if(plazaHome) plazaHome.onclick = openPlaza;
  }

  function roomOps(){
    var cap = state && state.role==='captain' && state.status==='member';
    var open = !!(state && state.open);
    var left = coolLeft();
    var disPub = (!open && left>0) ? ' disabled' : '';
    var disPriv = (open && left>0) ? ' disabled' : '';
    var vis = cap ? (
      '<span class="st-seg"'+(left?' data-cool="'+state.openUntil+'"':'')+' title="'+esc(t('visTitle')+' · '+t('visLead')+(left?(' · '+t('visCool').replace('{n}', coolLabel(left))):''))+'">'+
        '<button type="button" data-open="1"'+(open?' class="on"':'')+disPub+'>'+esc(t('visPublic'))+'</button>'+
        '<button type="button" data-open="0"'+(!open?' class="on"':'')+disPriv+'>'+esc(t('visPrivate'))+'</button>'+
      '</span>'+
      '<button type="button" id="stCast">'+esc(t('cast'))+'</button>'+
      '<button type="button" id="stHorn">'+esc(t('horn'))+'</button>'
    ) : '';
    return '<button type="button" id="stLinkPc">'+esc(t('link'))+'</button>'+vis;
  }
  function mountDockBar(){
    var slot = document.getElementById('sclmw-stDockSlot');
    if(!slot) return;
    slot.hidden = true;
    slot.innerHTML = '';
  }
  window.__stDockMount = mountDockBar;

  function paintDock(el){
    var mine = canDraw();
    el.innerHTML =
      '<div class="st-room-h" id="stRoomBar" role="group" aria-label="'+esc(state.code)+'"><b>'+esc(state.code)+'</b>'+
        '<div class="st-room-acts">'+
        '<button type="button" id="stRoomCopy">'+esc(t('copy'))+'</button>'+
        '<button type="button" id="stRoomLeave">'+esc(t('leave'))+'</button>'+
        (state.role==='captain' ? '<button type="button" id="stDissolve">'+esc(t('dissolve'))+'</button>' : '')+
        '<button type="button" id="stRoomMin">'+esc(sheetLayout() && !el.classList.contains('st-sheet-open') ? t('unfold') : t('fold'))+'</button>'+
        '</div>'+
        '<div class="st-room-ops">'+roomOps()+'</div></div>'+
      '<div class="st-room-body">'+
      recoverHtml('stDockRecover')+
      (leaving && state.role==='captain' ? handoffHtml() : '')+
      '<p class="st-room-dim">'+esc(t('locGuide'))+'</p>'+
      linkNote()+
      (marking && mine ? (
        '<p class="st-room-dim">'+esc(t('routeHint'))+'</p>'+
        '<ol class="st-room-pts">'+draft.map(function(p,i){
          return '<li><span>'+esc(p.n)+'</span><button type="button" data-rm="'+i+'">'+esc(t('del'))+'</button></li>';
        }).join('')+'</ol>'+
        '<textarea id="stRouteNote" maxlength="500" placeholder="'+esc(t('note'))+'">'+esc(note)+'</textarea>'+
        '<div class="row"><button type="button" id="stPublish">'+esc(t('publish'))+'</button>'+
          '<button type="button" id="stDraftClear">'+esc(t('clear'))+'</button></div>'
      ) : '')+
      '<div class="st-room-sec"><span>'+esc(t('published'))+'</span>'+
        ((state.routes||[]).map(function(r){
          return '<div class="st-room-route'+(r.id===selected?' on':'')+'" data-rt="'+esc(r.id)+'">'+
            '<b>'+esc(r.title||r.points.map(function(p){return p.n;}).join(' → '))+'</b>'+
            '<small>'+esc(t('by'))+' '+esc(r.authorName)+'</small>'+
            (r.note?'<p>'+esc(r.note)+'</p>':'')+
            (r.comments||[]).map(function(c){ return '<div class="st-room-c"><b>'+esc(c.authorName)+'</b> '+esc(c.body)+'</div>'; }).join('')+
            '<div class="row"><input data-cmt="'+esc(r.id)+'" maxlength="300" placeholder="'+esc(t('comment'))+'">'+
              '<button type="button" data-send="'+esc(r.id)+'">'+esc(t('send'))+'</button>'+
              (r.author===state.me.id || state.role==='captain' ? '<button type="button" data-del="'+esc(r.id)+'">'+esc(t('del'))+'</button>' : '')+
            '</div></div>';
        }).join('') || '<div class="st-room-dim">—</div>')+
      '</div>'+
      (statusMsg ? '<p class="st-flash'+(statusMsg===t('copied')?' is-quiet':'')+'">'+esc(statusMsg)+'</p>' : '')+
      '</div>'+
      edgeHtml();
    bindRecover(el, 'stDockRecover');
    el.querySelector('#stRoomCopy').onclick = function(){
      var text = state.code;
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
      statusMsg = t('copied'); paint();
      setTimeout(function(){ if(statusMsg===t('copied')){ statusMsg=''; paint(); } }, 1200);
    };
    el.querySelector('#stRoomLeave').onclick = askLeave;
    el.querySelector('#stRoomMin').onclick = function(ev){
      ev.stopPropagation();
      if(sheetLayout()){
        el.classList.toggle('st-sheet-open');
        paint();
        return;
      }
      var box = el.getBoundingClientRect();
      var host = root().getBoundingClientRect();
      var prev = readRaw(FRAME) || {};
      var ix = typeof prev.ix==='number' ? prev.ix : Math.round(box.left-host.left);
      var iy = typeof prev.iy==='number' ? prev.iy : Math.round(box.top-host.top);
      patchFrame(FRAME, {mini:1, ix:ix, iy:iy});
      paint();
    };
    bindHandoff(el);
    var dissolve = el.querySelector('#stDissolve');
    if(dissolve) dissolve.onclick = function(){ exitRoom({dissolve:true}); };
    var link = el.querySelector('#stLinkPc');
    if(link) link.onclick = linkPc;
    var castBtn = el.querySelector('#stCast');
    if(castBtn) castBtn.onclick = function(){ castCompose = true; castErr = ''; paint(); };
    var hornBtn = el.querySelector('#stHorn');
    if(hornBtn) hornBtn.onclick = function(){ hornCompose = true; hornErr = ''; if(!hornWhen) hornWhen = hornDefaultWhen(); paint(); };
    var mark = el.querySelector('#stMark');
    if(mark) mark.onclick = function(){ marking=!marking; if(!marking) window.__stRouteOn=false; selected=''; paint(); };
    el.querySelectorAll('[data-rm]').forEach(function(b){ b.onclick=function(){ draft.splice(+b.getAttribute('data-rm'),1); paint(); }; });
    var box = el.querySelector('#stRouteNote');
    if(box) box.oninput = function(){ note = box.value; };
    var pub = el.querySelector('#stPublish');
    if(pub) pub.onclick = publish;
    var clr = el.querySelector('#stDraftClear');
    if(clr) clr.onclick = function(){ draft=[]; note=''; paint(); };
    el.querySelectorAll('[data-rt]').forEach(function(b){ b.onclick=function(ev){
      if(ev.target.closest('input,button')) return;
      var id = b.getAttribute('data-rt');
      if(selected===id){ selected=''; paint(); return; }
      selected = id; marking=false;
      paint();
    }; });
    el.querySelectorAll('[data-send]').forEach(function(b){ b.onclick=function(){ sendComment(b.getAttribute('data-send')); }; });
    el.querySelectorAll('[data-del]').forEach(function(b){ b.onclick=function(){ delRoute(b.getAttribute('data-del')); }; });
    bindOpen(el);
  }

  function liveMembers(){
    return (state.members||[]).filter(function(m){ return m.status==='member'; });
  }
  function memberRank(m){
    if(state.me && m.id===state.me.id) return 0;
    if(state.captain && m.id===state.captain) return 1;
    return 2;
  }
  function paintCrew(el, ico){
    var live = liveMembers();
    var boxWas = document.activeElement && document.activeElement.id==='stCrewQ' ? document.activeElement : null;
    var caret = boxWas ? boxWas.selectionStart : null;
    var caretEnd = boxWas ? boxWas.selectionEnd : null;
    var listWas = el.querySelector('#stCrewList');
    var scroll = listWas ? listWas.scrollTop : 0;
    el.innerHTML =
      '<div class="st-room-h"><b>'+esc(t('members'))+'</b>'+
        '<em class="st-crew-n" id="stCrewN"></em>'+
        '<button type="button" id="stCrewMin">'+esc(t('fold'))+'</button></div>'+
      '<input id="stCrewQ" class="st-crew-q" type="search" autocomplete="off" placeholder="'+esc(t('find'))+'" value="'+esc(crewQ)+'">'+
      '<div class="st-room-body" id="stCrewList"></div>'+edgeHtml();
    el.querySelector('#stCrewMin').onclick = function(ev){
      ev.stopPropagation();
      var box = el.getBoundingClientRect();
      var host = root().getBoundingClientRect();
      var prev = readRaw(CREW) || {};
      var ix = typeof prev.ix==='number' ? prev.ix : Math.round(box.left-host.left);
      var iy = typeof prev.iy==='number' ? prev.iy : Math.round(box.top-host.top);
      patchFrame(CREW, {mini:1, ix:ix, iy:iy});
      paint();
    };
    var q = el.querySelector('#stCrewQ');
    function onQ(){ crewQ = q.value; fillCrew(el); }
    q.addEventListener('input', onQ);
    q.addEventListener('search', onQ);
    fillCrew(el);
    var listNow = el.querySelector('#stCrewList');
    if(listNow) listNow.scrollTop = scroll;
    if(boxWas){
      q.focus();
      if(caret!=null) q.setSelectionRange(caret, caretEnd);
    }
    ico.textContent = String(live.length);
    ico.title = t('members');
    ico.setAttribute('aria-label', t('members'));
  }
  function fillCrew(el){
    var live = liveMembers();
    var q = crewQ.trim().toLowerCase();
    var shown = live.filter(function(m){
      if(!q) return true;
      return ((m.nickname||'')+' '+(m.location||'')+' '+placeLabel(m)+' '+(m.server||'')).toLowerCase().indexOf(q)!==-1;
    }).sort(function(a,b){
      var d = memberRank(a)-memberRank(b);
      return d || ((b.seen||0)-(a.seen||0));
    });
    var n = el.querySelector('#stCrewN');
    if(n) n.textContent = q ? (shown.length+'/'+live.length) : String(live.length);
    var list = el.querySelector('#stCrewList');
    if(!list) return;
    var on = shown.filter(starfixOn), off = shown.filter(function(m){ return !starfixOn(m); });
    var split = serverSplit(on);
    var html = '';
    if(on.length) html += '<div class="st-crew-sec">'+esc(t('sfxOn'))+' '+on.length+(split.mixed?' · '+esc(t('server'))+' '+split.kinds:'')+'</div>'+on.map(function(m){ return memberRow(m, split); }).join('');
    if(off.length) html += '<div class="st-crew-sec">'+esc(t('sfxOff'))+' '+off.length+'</div>'+off.map(function(m){ return memberRow(m, split); }).join('');
    list.innerHTML = html || (q ? '<p class="st-flash is-quiet">'+esc(t('none'))+'</p>' : '<div class="st-room-dim">—</div>');
    rollCrew(list);
    list.querySelectorAll('[data-mate]').forEach(function(b){ b.onclick=function(){ jumpMember(b.getAttribute('data-mate')); }; });
    list.querySelectorAll('[data-cap]').forEach(function(b){ b.onclick=function(){
      kickAsk = '';
      api('/api/rooms/'+encodeURIComponent(state.code)+'/captain', {method:'POST', body:{member:b.getAttribute('data-cap')}}).then(take).catch(fail);
    }; });
    list.querySelectorAll('[data-kick]').forEach(function(b){ b.onclick=function(){ kickAsk = b.getAttribute('data-kick'); paint(); }; });
    list.querySelectorAll('[data-kick-yes]').forEach(function(b){ b.onclick=function(){
      var id = b.getAttribute('data-kick-yes');
      kickAsk = '';
      api('/api/rooms/'+encodeURIComponent(state.code)+'/members/'+encodeURIComponent(id)+'/kick', {method:'POST', body:{}}).then(take).catch(fail);
    }; });
  }

  function rollCrew(list){
    if(!list) return;
    if(!list.__roll && window.ResizeObserver){
      list.__roll = true;
      new ResizeObserver(function(){ rollCrew(list); }).observe(list);
    }
    list.querySelectorAll('.st-mate-roll').forEach(function(box){
      var inner = box.firstElementChild;
      if(!inner) return;
      inner.style.animation = 'none';
      var extra = inner.scrollWidth - box.clientWidth;
      if(extra <= 4){
        inner.style.animation = '';
        inner.style.removeProperty('--st-roll');
        return;
      }
      var sec = Math.max(4, extra / 24);
      inner.style.setProperty('--st-roll', (-extra)+'px');
      inner.style.animation = 'st-roll '+sec.toFixed(2)+'s ease-in-out infinite alternate';
    });
  }
  function ageText(seen){
    if(typeof seen!=='number' || !isFinite(seen)) return '';
    var s = Math.max(0, Math.round(Date.now()/1000 - seen));
    if(s<5) return t('agoNow');
    if(s<60) return t('agoSec').replace('{n}', String(s));
    var m = Math.floor(s/60);
    if(m<60) return t('agoMin').replace('{n}', String(m));
    var h = Math.floor(m/60);
    if(h<48) return t('agoHour').replace('{n}', String(h));
    return t('agoDay').replace('{n}', String(Math.floor(h/24)));
  }
  function tickAges(){
    document.querySelectorAll('.st-post-due[data-exp]').forEach(function(n){
      var exp = +n.getAttribute('data-exp');
      var next = dueText(exp);
      if(n.textContent!==next) n.textContent = next;
      n.classList.toggle('is-short', dueShort(exp));
    });
    document.querySelectorAll('.st-mate time[data-seen]').forEach(function(n){
      var next = ageText(+n.getAttribute('data-seen'));
      if(n.textContent!==next) n.textContent = next;
    });
    document.querySelectorAll('[data-cool]').forEach(function(n){
      var left = Math.max(0, Math.ceil((+n.getAttribute('data-cool')-Date.now())/1000));
      var next = left ? t('visCool').replace('{n}', coolLabel(left)) : '';
      if(n.classList.contains('st-seg')){
        var title = t('visTitle')+' · '+t('visLead')+(next?(' · '+next):'');
        if(n.title!==title) n.title = title;
      } else if(n.textContent!==next) n.textContent = next;
      if(!left && n.getAttribute('data-cool-done')!=='1'){
        n.setAttribute('data-cool-done', '1');
        paint();
      }
    });
  }
  function starfixOn(m){
    if(!m) return false;
    if(typeof m.starfix==='boolean') return m.starfix;
    if(typeof m.online==='boolean') return m.online;
    return typeof m.seen==='number' && (Date.now()/1000-m.seen)<600;
  }
  function gameOn(m){
    return !!(m && m.game===true && starfixOn(m));
  }
  function isOnline(m){ return starfixOn(m); }
  function placeLabel(m){
    var raw = m.location || '';
    if(SC.loc && SC.loc.text) return SC.loc.text(raw) || raw;
    return raw;
  }
  function shipLabel(raw){
    if(!raw) return '';
    if(SC.loc && SC.loc.text) return SC.loc.text(raw) || raw;
    return raw;
  }
  function memberAsPlayer(m){
    var when = typeof m.seen==='number' ? new Date(m.seen*1000).toISOString() : '';
    return {id:m.id, name:m.nickname||'', online:gameOn(m), starfix:starfixOn(m), game:gameOn(m), last_seen:when, when:when,
      code:m.code||'', location:m.location||'', system:m.system||'', ship:m.ship||'',
      gear:Array.isArray(m.gear)?m.gear:[], server:m.server||'', travel:m.travel||null,
      card:m.card&&typeof m.card==='object'?m.card:null};
  }
  function serverSplit(list){
    var counts = {};
    (list||[]).forEach(function(m){
      if(!m.server) return;
      var k = String(m.server);
      counts[k] = (counts[k]||0)+1;
    });
    var keys = Object.keys(counts);
    if(!keys.length) return {top:'', mixed:false, kinds:0};
    var ref = '';
    (list||[]).forEach(function(m){
      if(ref || !m.server) return;
      if(state.captain && m.id===state.captain) ref = String(m.server);
    });
    if(!ref){
      (list||[]).forEach(function(m){
        if(ref || !m.server) return;
        if(state.me && m.id===state.me.id) ref = String(m.server);
      });
    }
    var top = ref && counts[ref] ? ref : keys[0];
    var n = counts[top]||0;
    keys.forEach(function(k){ if(counts[k]>n){ top=k; n=counts[k]; } });
    return {top:top, mixed:keys.length>1, kinds:keys.length};
  }
  function hostShort(id){
    var s = String(id);
    return s.length>8 ? '…'+s.slice(-7) : s;
  }
  function memberRow(m, split){
    var tags = '';
    if(state.me && m.id===state.me.id) tags += '<em>'+esc(t('you'))+'</em>';
    var isCap = state.captain ? m.id===state.captain : !!(state.role==='captain' && state.me && m.id===state.me.id);
    if(isCap) tags += '<em class="is-cap">'+esc(t('captainTag'))+'</em>';
    var own = state.role==='captain' && state.me && m.id!==state.me.id;
    var give = own ? '<button type="button" data-cap="'+esc(m.id)+'" title="'+esc(t('give'))+'">'+esc(t('giveShort'))+'</button>' : '';
    var kick = own ? (kickAsk===m.id
      ? '<button type="button" class="on" data-kick-yes="'+esc(m.id)+'" title="'+esc(t('kick'))+'">'+esc(t('kickYes'))+'</button>'
      : '<button type="button" data-kick="'+esc(m.id)+'" title="'+esc(t('kick'))+'">'+esc(t('kick'))+'</button>') : '';
    var sfx = starfixOn(m), playing = gameOn(m);
    var when = (typeof m.seen==='number' && m.seen>0) ? '<time data-seen="'+m.seen+'">'+esc(ageText(m.seen))+'</time>' : '';
    var place = m.location ? esc(placeLabel(m)) : '';
    var ship = m.ship ? esc(shipLabel(m.ship)) : '';
    var lights = esc(t(sfx?'sfxOn':'sfxOff'))+' · '+esc(t(playing?'gameOn':'gameOff'));
    var bits = [place, ship, lights].filter(Boolean).join(' · ');
    var host = '<span class="st-mate-host" title="'+esc(t('server'))+'">—</span>';
    if(m.server){
      var same = split && split.top && String(m.server)===split.top;
      var tone = split && split.mixed ? (same?' is-same':' is-other') : (split && split.top ? ' is-same' : '');
      host = '<span class="st-mate-host'+tone+'" title="'+esc(t('server'))+' '+esc(String(m.server))+'">'+esc(hostShort(m.server))+'</span>';
    }
    var pip = playing ? ' on' : (sfx ? ' sfx' : '');
    var inner = '<i class="st-crew-pip'+pip+'"></i>'+
      '<span class="st-mate-roll"><span><b>'+esc(m.nickname)+'</b>'+tags+
      (bits?'<span class="st-mate-last">'+bits+'</span>':'')+'</span></span>'+host+when;
    return '<div class="st-mate-row'+(kickAsk===m.id?' st-kick-ask':'')+'"><button type="button" class="st-mate'+(m.location?' has-place':'')+(sfx?'':' is-off')+'" data-mate="'+esc(m.id)+'">'+inner+'</button>'+kick+give+'</div>';
  }
  function handoffHtml(){
    var rest = (state.members||[]).filter(function(m){ return m.status==='member' && state.me && m.id!==state.me.id; });
    if(!rest.length){
      return '<div class="st-room-sec st-hand"><span>'+esc(t('handTitle'))+'</span><p class="st-room-dim">'+esc(t('handSolo'))+'</p>'+
        '<div class="row"><button type="button" id="stDissolveLeave">'+esc(t('dissolveLeave'))+'</button>'+
        '<button type="button" id="stHandCancel">'+esc(t('cancel'))+'</button></div></div>';
    }
    return '<div class="st-room-sec st-hand"><span>'+esc(t('handTitle'))+'</span><p class="st-room-dim">'+esc(t('handLead'))+'</p>'+
      rest.map(function(m){
        return '<div class="st-room-row"><span>'+esc(m.nickname)+'</span><button type="button" data-hand="'+esc(m.id)+'">'+esc(t('giveLeave'))+'</button></div>';
      }).join('')+
      '<div class="row"><button type="button" id="stDissolveLeave">'+esc(t('dissolve'))+'</button>'+
      '<button type="button" id="stHandCancel">'+esc(t('cancel'))+'</button></div></div>';
  }
  function bindHandoff(el){
    var go = el.querySelector('#stDissolveLeave');
    if(go) go.onclick = function(){ exitRoom({dissolve:true}); };
    var cancel = el.querySelector('#stHandCancel');
    if(cancel) cancel.onclick = function(){ leaving = false; paint(); };
    el.querySelectorAll('[data-hand]').forEach(function(b){
      b.onclick = function(){ exitRoom({transfer:b.getAttribute('data-hand')}); };
    });
  }
  function jumpMember(id){
    var m = (state.members||[]).filter(function(x){ return x.id===id; })[0];
    if(!m) return;
    if(typeof window.stOpenPlayer==='function') window.stOpenPlayer(memberAsPlayer(m));
    var o = SC.playerLoc ? SC.playerLoc({code:m.code||'', location:m.location||'', system:m.system||''}) : null;
    var ctl = window.__stCtl;
    if(o && ctl && ctl.flyTo) ctl.flyTo(o);
  }
  function nickValue(){
    var el = document.getElementById('stRoomNick');
    return el ? el.value.trim() : '';
  }
  function codeValue(){
    var el = document.getElementById('stRoomCode');
    return (el ? el.value : '').toUpperCase().replace(/[^A-Z0-9-]/g,'');
  }
  function rememberNick(n){ try{ localStorage.setItem(NICK, n); }catch(e){} }
  function recoverHtml(where){
    if(state && state.role==='captain' && state.status==='member' && state.recover){
      return '<div class="st-recover"><span>'+esc(t('recoverLead'))+'</span><b>'+esc(state.recover)+'</b><button type="button" id="'+where+'Copy">'+esc(t('recoverCopy'))+'</button><button type="button" id="'+where+'Roll"'+(recoverLeft()?' disabled':'')+'>'+esc(t('recoverRoll'))+'</button>'+(recoverLeft()?'<em data-cool="'+state.recoverUntil+'">'+esc(t('visCool').replace('{n}', coolLabel(recoverLeft())))+'</em>':'')+'</div>';
    }
    if(!state || state.role==='captain') return '';
    return '<div class="st-recover"><span>'+esc(t('recover'))+'</span><input id="'+where+'In" maxlength="14" value="'+esc(recoverDraft)+'" placeholder="'+esc(t('recoverPh'))+'" autocomplete="off"><button type="button" id="'+where+'Go">'+esc(t('recoverGo'))+'</button></div>';
  }
  function bindRecover(rootEl, where){
    var copy = rootEl.querySelector('#'+where+'Copy');
    if(copy) copy.onclick = function(){
      var text = state && state.recover || '';
      if(text && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
      statusMsg = t('copied');
      paint();
      setTimeout(function(){ if(statusMsg===t('copied')){ statusMsg=''; paint(); } }, 1200);
    };
    var input = rootEl.querySelector('#'+where+'In');
    if(input) input.oninput = function(){ recoverDraft = input.value; };
    var go = rootEl.querySelector('#'+where+'Go');
    if(go) go.onclick = function(){
      var nick = savedNick() || (state && state.me && state.me.nickname) || '';
      var code = (state && state.code) || '';
      reclaimFrom(nick, code, input ? input.value : recoverDraft);
    };
    var roll = rootEl.querySelector('#'+where+'Roll');
    if(roll) roll.onclick = rollRecover;
  }
  function reclaimFrom(nick, code, secret){
    nick = String(nick || '').trim();
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
    secret = String(secret || '').trim();
    if(!nick || nick.length>32){ statusMsg = t('errNick'); paint(); return; }
    if(!code){ statusMsg = t('errRoom'); paint(); return; }
    if(!secret){ statusMsg = t('errRecover'); paint(); return; }
    rememberNick(nick);
    roomKind = 'join';
    api('/api/session', {method:'POST', body:{nickname:nick}}).then(function(s){
      try{ localStorage.setItem(TOKEN, s.token); }catch(e){}
      return api('/api/rooms/'+encodeURIComponent(code)+'/recover', {method:'POST', body:{recover:secret}});
    }).then(function(st){
      if(!st) return;
      recoverDraft = '';
      picking = false;
      take(st);
    }).catch(fail);
  }

  function savedNick(){
    var typed = nickValue();
    if(typed) return typed;
    try{ return localStorage.getItem(NICK)||''; }catch(e){ return ''; }
  }
  function enterCode(code){
    code = String(code||'').toUpperCase();
    if(!code) return;
    if(state && state.code===code && state.status==='member'){
      picking = false;
      enterMap();
      return;
    }
    var nick = savedNick();
    if(!nick || nick.length>32){
      picking = true;
      statusMsg = t('errNick');
      paint();
      var box = document.getElementById('stRoomCode');
      if(box) box.value = code;
      return;
    }
    statusMsg = '';
    roomKind = 'join';
    rememberNick(nick);
    api('/api/session', {method:'POST', body:{nickname:nick}}).then(function(s){
      try{ localStorage.setItem(TOKEN, s.token); }catch(e){}
      return api('/api/rooms/'+encodeURIComponent(code)+'/join', {method:'POST', body:{}});
    }).then(function(st){ if(st){ picking = false; take(st); } }).catch(fail);
  }
  function previewLeft(){
    return Math.max(0, Math.ceil((previewUntil - Date.now()) / 1000));
  }
  function recoverLeft(){
    if(!state || !state.recoverUntil) return 0;
    return Math.max(0, Math.ceil((state.recoverUntil - Date.now()) / 1000));
  }
  function ensurePreview(){
    if(newPair || previewWait) return;
    var nick = nickValue() || savedNick();
    if(!nick) return;
    previewWait = true;
    var start = token() ? Promise.resolve() : api('/api/session', {method:'POST', body:{nickname:nick}}).then(function(s){
      try{ localStorage.setItem(TOKEN, s.token); }catch(e){}
    });
    start.then(function(){
      return api('/api/rooms/preview', {method:'POST', body:{}});
    }).then(function(d){
      previewWait = false;
      if(d && d.code && d.recover && d.sig){ newPair = d; paint(); }
    }).catch(function(){ previewWait = false; });
  }
  function rollPreview(){
    if(!newPair || previewLeft()>0) return;
    api('/api/rooms/preview', {method:'POST', body:{refresh:true, code:newPair.code, recover:newPair.recover, sig:newPair.sig}}).then(function(d){
      if(d && d.code && d.recover && d.sig){
        newPair = d;
        previewUntil = Date.now()+30000;
        paint();
      }
    }).catch(function(e){
      var wait = e && e.body && e.body.wait || 30;
      if(e && e.body && e.body.error==='cooldown') previewUntil = Date.now()+wait*1000;
      paint();
    });
  }
  function rollRecover(){
    if(!state || state.role!=='captain' || !state.code || recoverLeft()>0) return;
    api('/api/rooms/'+encodeURIComponent(state.code)+'/recover/roll', {method:'POST', body:{}}).then(take).catch(fail);
  }
  function act(kind){
    var nick = nickValue();
    if(!nick || nick.length>32){ statusMsg=t('errNick'); paint(); return; }
    statusMsg = '';
    roomKind = kind==='create' ? 'create' : 'join';
    rememberNick(nick);
    api('/api/session', {method:'POST', body:{nickname:nick}}).then(function(s){
      try{ localStorage.setItem(TOKEN, s.token); }catch(e){}
      if(kind==='create') return api('/api/rooms', {method:'POST', body: newPair ? {code:newPair.code, recover:newPair.recover, sig:newPair.sig} : {}});
      var code = codeValue();
      if(!code){ statusMsg=t('errRoom'); paint(); return null; }
      return api('/api/rooms/'+encodeURIComponent(code)+'/join', {method:'POST', body:{}});
    }).then(function(st){ if(st){ if(kind==='create') newPair = null; picking = false; take(st); } }).catch(fail);
  }

  var mapArming = false;
  function markEnterWait(){
    var btn = document.getElementById('stEnter');
    if(!btn || !mapArming) return;
    btn.disabled = true;
    if(window.SCLMW && window.SCLMW.i18n) btn.textContent = window.SCLMW.i18n.t('page.loading');
  }
  function enterMap(){
    if(!state || state.status!=='member') return;
    if(mapArming) return;
    var arm = window.SCLMW && window.SCLMW.armScene;
    var go = function(){
      mapArming = false;
      try{ if(window.SCLMW && window.SCLMW.revealMap) window.SCLMW.revealMap(); }catch(e){}
      entered = true;
      bindPlayers();
      paint();
      pullLink();
    };
    if(arm && !(window.__stCtl && window.__stCtl.mapReady)){
      mapArming = true;
      markEnterWait();
      Promise.resolve(arm()).then(go).catch(function(){
        mapArming = false;
        paint();
      });
      return;
    }
    go();
  }
  function take(st){
    var prevCode = state && state.code;
    if(st && typeof st.openWait==='number') st.openUntil = Date.now()+st.openWait*1000;
    if(st && typeof st.recoverWait==='number') st.recoverUntil = Date.now()+st.recoverWait*1000;
    state = st;
    statusMsg = '';
    if(st && st.code && st.code!==prevCode) rememberHist(st.code);
    try{ localStorage.setItem(CODE, st.code); }catch(e){}
    if(st.status!=='member') entered = false;
    if(st.status==='member' && entered) bindPlayers();
    noteCast(st);
    noteRally(st);
    paint();
    enterPlazaPage();
  }
  function fail(e){
    if(e && e.body && e.body.error==='room') statusMsg = t('errRoom');
    else if(e && e.body && e.body.error==='cooldown'){
      var wait = e.body.wait||0;
      if(e.body.what==='recover'){
        if(state) state.recoverUntil = Date.now()+wait*1000;
      } else if(state) state.openUntil = Date.now()+wait*1000;
      statusMsg = t('visCool').replace('{n}', coolLabel(wait));
    }
    else if(e && e.body && e.body.error==='recover') statusMsg = t('errRecover');
    else if(e && e.status===0) statusMsg = t('errNet');
    else statusMsg = t('errNet');
    paint();
  }
  function zhDict(){ return DICT[lang()==='zh-Hant'?'zh-Hant':'zh-Hans'] || DICT['zh-Hans']; }
  function pair(k){ return {zh:(zhDict()[k]||''), en:(DICT.en[k]||'')}; }
  function bi(k){ var p = pair(k); return '<b>'+esc(p.zh)+'</b><em>'+esc(p.en)+'</em>'; }
  function pendingList(){ return (state&&state.members||[]).filter(function(m){ return m.status==='pending'; }); }
  function syncAlert(list){
    var ids = {}, fresh = false;
    list.forEach(function(m){ ids[m.id] = 1; if(!alertSeen[m.id]) fresh = true; });
    alertSeen = ids;
    if(fresh) alertHold = false;
  }
  function armAlert(){
    clearTimeout(alertTimer);
    if(!alertFlash) return;
    alertTimer = setTimeout(function(){ if(alertFlash && alertFlash.until<=Date.now()){ alertFlash = null; paint(); } }, Math.max(40, alertFlash.until-Date.now()));
  }
  function alertSkin(){ return '<i class="st-alert-haze"></i><i class="st-alert-grain"></i>'; }
  function alertPlate(tone, titleKey, subKey, body, acts){
    var title = pair(titleKey), sub = subKey ? pair(subKey) : null;
    return '<div class="st-alert-plate" role="dialog" aria-label="'+esc(title.zh+' '+title.en)+'">'+
      alertSkin()+
      '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>'+
      '<div class="st-alert-bar"></div>'+
      '<div class="st-alert-kicker">'+esc(title.zh)+'</div>'+
      '<div class="st-alert-en">'+esc(title.en)+'</div>'+
      (sub ? '<p class="st-alert-sub"><span>'+esc(sub.zh)+'</span><span>'+esc(sub.en)+'</span></p>' : '')+
      body+acts+'</div>';
  }
  function grabCastDraft(){
    var area = document.getElementById('stCastBody');
    if(area) castDraft = area.value;
  }
  function castSoundOn(){ return SC.castSound ? !!SC.castSound() : true; }
  function setCastSound(on){ if(SC.castSound) SC.castSound(!!on); }
  function castSoundHtml(){
    var on = castSoundOn();
    var a = pair('castSound'), b = pair(on?'castOn':'castOff');
    return '<button type="button" id="stCastSound" class="'+(on?'on':'')+'"><b>'+esc(a.zh+' · '+b.zh)+'</b><em>'+esc(a.en+' · '+b.en)+'</em></button>';
  }
  function bindCastSound(box){
    var b = box.querySelector('#stCastSound');
    if(!b) return;
    b.onclick = function(){ grabCastDraft(); setCastSound(!castSoundOn()); paint(); };
  }
  function castSeenId(){
    try{
      var m = JSON.parse(localStorage.getItem('sclmw_cast_seen')||'{}');
      return state && state.code ? (m[state.code]||'') : '';
    }catch(e){ return ''; }
  }
  function castMarkSeen(id){
    try{
      var m = JSON.parse(localStorage.getItem('sclmw_cast_seen')||'{}');
      if(state && state.code) m[state.code] = id;
      localStorage.setItem('sclmw_cast_seen', JSON.stringify(m));
    }catch(e){}
  }
  function castPlayed(id){
    try{ return !!JSON.parse(sessionStorage.getItem('sclmw_cast_played')||'{}')[id]; }catch(e){ return false; }
  }
  function castMarkPlayed(id){
    try{
      var m = JSON.parse(sessionStorage.getItem('sclmw_cast_played')||'{}');
      m[id] = 1;
      sessionStorage.setItem('sclmw_cast_played', JSON.stringify(m));
    }catch(e){}
  }
  function armCastAudio(){
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return null;
    if(!castAudio){ try{ castAudio = new Ctx(); }catch(e){ return null; } }
    if(castAudio.state==='suspended') castAudio.resume();
    return castAudio;
  }
  function playCastChime(){
    if(!castSoundOn()) return;
    var ctx = armCastAudio();
    if(!ctx) return;
    var t0 = ctx.currentTime;
    function tone(freq, start, dur, peak){
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t0+start);
      g.gain.setValueAtTime(0.0001, t0+start);
      g.gain.exponentialRampToValueAtTime(peak, t0+start+0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+start+dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0+start); o.stop(t0+start+dur+0.02);
    }
    tone(494, 0, 0.22, 0.05);
    tone(740, 0.12, 0.28, 0.04);
    tone(988, 0.24, 0.36, 0.03);
  }
  function noteCast(st){
    var c = st && st.cast;
    if(!st || st.status!=='member' || !c || !c.id || c.id===castSeenId()){
      if(!c || !c.id || (st && c && c.id===castSeenId())) castIncoming = null;
      return;
    }
    var fresh = !castIncoming || castIncoming.id!==c.id;
    castIncoming = {id:c.id, body:c.body||'', name:c.name||''};
    if(fresh && !castPlayed(c.id)){ castMarkPlayed(c.id); playCastChime(); }
  }
  function sendCast(){
    grabCastDraft();
    var body = castDraft.trim();
    if(!body){ castErr = t('castEmpty'); paint(); return; }
    castErr = '';
    api('/api/rooms/'+encodeURIComponent(state.code)+'/broadcast', {method:'POST', body:{body:body}}).then(function(st){
      castCompose = false; castDraft = '';
      take(st);
    }).catch(fail);
  }
  function hornDefaultWhen(){
    var d = new Date(Date.now()+15*60*1000);
    d.setSeconds(0,0);
    function z(n){ return (n<10?'0':'')+n; }
    return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'T'+z(d.getHours())+':'+z(d.getMinutes());
  }
  function rallyPlace(){
    var o = window.__stPlace;
    if(!o || !o.id || o.k==='player' || o.grp) return null;
    return {id:String(o.id), name:String(o.n||o.id), system:o.sy||''};
  }
  var placeWarm = false;
  function placeFace(name){
    var loc = window.SCLMW && SCLMW.loc;
    if(loc && typeof loc.text==='function'){
      var hit = loc.text(name);
      if(hit && hit!==name) return hit;
      if(!placeWarm && hit===name && typeof loc.index==='function'){
        placeWarm = true;
        loc.index().then(function(){ paint(); }).catch(function(){});
      }
      if(hit) return hit;
    }
    return name||'';
  }
  function rallyWhenLabel(sec){
    var d = new Date((+sec||0)*1000);
    if(isNaN(d.getTime())) return '';
    try{ return d.toLocaleString(); }catch(e){ return ''; }
  }
  function rallyReplyLine(r){
    var yes = [], no = [];
    (r.replies||[]).forEach(function(p){ (p.going?yes:no).push(p.nickname||''); });
    return t('hornGoing')+' '+yes.length+(yes.length?' · '+yes.join(', '):'')+' · '+t('hornGone')+' '+no.length+(no.length?' · '+no.join(', '):'');
  }
  function playHorn(){
    if(!castSoundOn()) return;
    var ctx = armCastAudio();
    if(!ctx) return;
    var t0 = ctx.currentTime;
    function tone(freq, start, dur, peak){
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(freq, t0+start);
      g.gain.setValueAtTime(0.0001, t0+start);
      g.gain.exponentialRampToValueAtTime(peak, t0+start+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0+start+dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0+start); o.stop(t0+start+dur+0.02);
    }
    tone(196, 0, 0.28, 0.04);
    tone(247, 0.16, 0.34, 0.035);
    tone(294, 0.32, 0.42, 0.03);
  }
  function noteRally(st){
    var r = st && st.rally;
    var id = r && r.id || '';
    if(!id){ hornId = ''; hornOpen = false; hornSheet = false; return; }
    if(id===hornId) return;
    hornId = id;
    hornNag = Date.now();
    hornCompose = false;
    if(st.role!=='captain' && st.status==='member' && r.mine!==true && r.mine!==false){
      hornOpen = true;
      playHorn();
    } else hornOpen = false;
  }
  function rallyUnanswered(){
    var r = state && state.rally;
    return !!(r && state.status==='member' && state.role!=='captain' && r.mine!==true && r.mine!==false);
  }
  function armRally(){
    clearTimeout(hornTimer);
    if(!rallyUnanswered() || hornOpen || hornSheet || hornCompose) return;
    var wait = Math.max(800, 40000-(Date.now()-hornNag));
    hornTimer = setTimeout(function(){
      if(!rallyUnanswered()) return;
      hornOpen = true;
      hornNag = Date.now();
      playHorn();
      paint();
    }, wait);
  }
  function syncRallyPin(){
    var r = entered && state && state.status==='member' ? state.rally : null;
    window.__stRally = r && r.place ? {place:r.place, label:t('hornPin')} : null;
    window.__stHornOffer = function(){ return !!(entered && state && state.role==='captain' && state.status==='member'); };
    window.__stHornLabel = function(){ return t('horn'); };
    window.__stHornAt = function(o){
      if(o && o.id && o.k!=='player') window.__stPlace = o;
      hornCompose = true;
      hornErr = '';
      if(!hornWhen) hornWhen = hornDefaultWhen();
      paint();
    };
    window.__stRallyOpen = function(){
      if(!state || !state.rally) return;
      hornSheet = true;
      hornOpen = false;
      paint();
    };
  }
  function sendHorn(){
    var place = rallyPlace();
    var input = document.getElementById('stHornTime');
    if(input) hornWhen = input.value;
    if(!place){ hornErr = t('hornNeed'); paint(); return; }
    var at = Date.parse(hornWhen);
    if(!hornWhen || isNaN(at)){ hornErr = t('hornTime'); paint(); return; }
    hornErr = '';
    api('/api/rooms/'+encodeURIComponent(state.code)+'/rally', {method:'POST', body:{place:place.id, name:place.name, system:place.system, at:Math.round(at/1000)}}).then(function(st){
      hornCompose = false;
      take(st);
    }).catch(function(e){
      if(e && e.body && e.body.error==='rally') hornErr = t('hornTime');
      fail(e);
    });
  }
  function clearHorn(){
    api('/api/rooms/'+encodeURIComponent(state.code)+'/rally', {method:'POST', body:{clear:true}}).then(function(st){
      hornCompose = false;
      hornSheet = false;
      hornOpen = false;
      take(st);
    }).catch(fail);
  }
  function sendRsvp(going){
    api('/api/rooms/'+encodeURIComponent(state.code)+'/rally/rsvp', {method:'POST', body:{going:!!going}}).then(function(st){
      hornOpen = false;
      hornSheet = false;
      take(st);
    }).catch(fail);
  }
  function showRallyPlace(){
    var r = state && state.rally;
    hornOpen = false;
    hornNag = Date.now();
    if(r && window.__stCtl && window.__stCtl.focusId) window.__stCtl.focusId(r.place);
    paint();
  }
  function hornBody(r){
    return '<p class="st-alert-msg">'+esc(placeFace(r.name))+'</p>'+
      '<p class="st-alert-from"><b>'+esc(t('hornTime')+' '+rallyWhenLabel(r.at))+'</b><em>'+esc(rallyReplyLine(r))+'</em></p>';
  }
  function paintAlert(){
    var host = root();
    var box = document.getElementById('stAlert');
    if(!box){
      box = document.createElement('div');
      box.id = 'stAlert';
      box.className = 'st-alert';
      box.hidden = true;
      host.appendChild(box);
    }
    if(alertFlash && alertFlash.until<=Date.now()) alertFlash = null;
    var list = pendingList();
    var captain = !!(state && state.role==='captain' && state.status==='member');
    if(captain) syncAlert(list); else alertSeen = {};
    var waiting = !!(state && state.status==='pending' && !picking);
    var flash = alertFlash;
    var review = captain && list.length;
    if(alertDeny && !flash && !waiting && !review){
      box.hidden = false;
      box.className = 'st-alert tone-deny';
      var codeHtml = alertDeny.code ? '<p class="st-alert-code">'+esc(alertDeny.code)+'</p>' : '';
      box.innerHTML = alertPlate('deny', 'reject', 'denied', codeHtml, '<div class="st-alert-acts"><button type="button" id="stAlertDeny">'+bi('switchRoom')+'</button></div>');
      var denyBtn = box.querySelector('#stAlertDeny');
      if(denyBtn) denyBtn.onclick = function(){ alertDeny = null; paint(); };
      return;
    }
    grabCastDraft();
    if(castCompose && state && state.role==='captain' && state.status==='member'){
      var area0 = document.getElementById('stCastBody');
      if(area0 && document.activeElement===area0 && box.classList.contains('tone-cast') && !castErr){
        box.hidden = false;
        return;
      }
      box.hidden = false;
      box.className = 'st-alert tone-cast';
      var field = '<textarea id="stCastBody" maxlength="120" placeholder="'+esc(t('castPh'))+'">'+esc(castDraft)+'</textarea>'+
        (castErr ? '<p class="st-flash">'+esc(castErr)+'</p>' : '');
      var acts = '<div class="st-alert-acts"><button type="button" id="stCastSend">'+bi('castSend')+'</button><button type="button" id="stCastCancel">'+bi('cancel')+'</button>'+castSoundHtml()+'</div>';
      box.innerHTML = alertPlate('cast', 'cast', 'castLead', field, acts);
      var area = box.querySelector('#stCastBody');
      if(area) area.oninput = function(){ castDraft = area.value; castErr = ''; };
      box.querySelector('#stCastSend').onclick = sendCast;
      box.querySelector('#stCastCancel').onclick = function(){ castCompose = false; castErr = ''; paint(); };
      bindCastSound(box);
      return;
    }
    if(castIncoming && state && state.status==='member' && castIncoming.id!==castSeenId()){
      box.hidden = false;
      box.className = 'st-alert tone-cast';
      var who = '<p class="st-alert-from"><b>'+esc(pair('castFrom').zh+' '+castIncoming.name)+'</b><em>'+esc(pair('castFrom').en+' '+castIncoming.name)+'</em></p>'+
        '<p class="st-alert-msg">'+esc(castIncoming.body)+'</p>';
      box.innerHTML = alertPlate('cast', 'cast', '', who, '<div class="st-alert-acts"><button type="button" id="stCastClose">'+bi('castClose')+'</button>'+castSoundHtml()+'</div>');
      box.querySelector('#stCastClose').onclick = function(){ castMarkSeen(castIncoming.id); castIncoming = null; paint(); };
      bindCastSound(box);
      return;
    }
    if(hornCompose && state && state.role==='captain' && state.status==='member'){
      var time0 = document.getElementById('stHornTime');
      if(time0 && document.activeElement===time0 && box.classList.contains('tone-horn') && !hornErr){
        box.hidden = false;
        return;
      }
      if(!hornWhen) hornWhen = hornDefaultWhen();
      var picked = rallyPlace();
      box.hidden = false;
      box.className = 'st-alert tone-horn';
      var placeLine = '<p class="st-alert-msg">'+esc(picked ? placeFace(picked.name) : t('hornNeed'))+'</p>'+
        '<input id="stHornTime" type="datetime-local" value="'+esc(hornWhen)+'">'+
        (hornErr ? '<p class="st-flash">'+esc(hornErr)+'</p>' : '');
      var hornActs = '<div class="st-alert-acts"><button type="button" id="stHornSend">'+bi('hornSend')+'</button>'+
        (state.rally ? '<button type="button" id="stHornClear">'+bi('hornClear')+'</button>' : '')+
        '<button type="button" id="stHornCancel">'+bi('cancel')+'</button>'+castSoundHtml()+'</div>';
      box.innerHTML = alertPlate('horn', 'horn', 'hornLead', placeLine, hornActs);
      var time = box.querySelector('#stHornTime');
      if(time) time.oninput = function(){ hornWhen = time.value; hornErr = ''; };
      box.querySelector('#stHornSend').onclick = sendHorn;
      var clearBtn = box.querySelector('#stHornClear');
      if(clearBtn) clearBtn.onclick = clearHorn;
      box.querySelector('#stHornCancel').onclick = function(){ hornCompose = false; hornErr = ''; paint(); };
      bindCastSound(box);
      return;
    }
    if((hornOpen || hornSheet) && state && state.rally && state.status==='member'){
      if(hornOpen && !rallyUnanswered()) hornOpen = false;
      if(hornOpen || hornSheet){
        var rally = state.rally;
        box.hidden = false;
        box.className = 'st-alert tone-horn';
        var choice = '<div class="st-alert-acts"><button type="button" id="stHornJoin">'+bi('hornJoin')+'</button><button type="button" id="stHornSkip">'+bi('hornSkip')+'</button><button type="button" id="stHornLook">'+bi('hornLook')+'</button>'+
          (state.role==='captain' ? '<button type="button" id="stHornClear2">'+bi('hornClear')+'</button>' : '')+
          (rallyUnanswered() ? '<button type="button" id="stHornLater">'+bi('hornLater')+'</button>' : '<button type="button" id="stHornLater">'+bi('castClose')+'</button>')+
          castSoundHtml()+'</div>';
        box.innerHTML = alertPlate('horn', 'horn', '', hornBody(rally), choice);
        box.querySelector('#stHornJoin').onclick = function(){ sendRsvp(true); };
        box.querySelector('#stHornSkip').onclick = function(){ sendRsvp(false); };
        box.querySelector('#stHornLook').onclick = showRallyPlace;
        var clear2 = box.querySelector('#stHornClear2');
        if(clear2) clear2.onclick = clearHorn;
        box.querySelector('#stHornLater').onclick = function(){ hornOpen = false; hornSheet = false; hornNag = Date.now(); paint(); };
        bindCastSound(box);
        return;
      }
    }
    if(!flash && !waiting && !review){ box.hidden = true; box.innerHTML = ''; return; }
    if(!flash && review && alertHold){
      box.hidden = false;
      box.className = 'st-alert hold tone-review';
      var badge = pair('pending');
      box.innerHTML = '<button type="button" class="st-alert-badge">'+alertSkin()+'<b>'+esc(badge.zh)+'</b><em>'+esc(badge.en)+'</em><span>'+list.length+'</span></button>';
      box.querySelector('button').onclick = function(){ alertHold = false; paint(); };
      return;
    }
    var tone = flash ? flash.tone : (waiting ? 'wait' : 'review');
    var titleKey = flash ? (flash.tone==='ok'?'approve':'reject') : 'pending';
    var subKey = flash ? '' : (waiting ? (roomKind==='join' ? 'wait' : 'resumedWait') : 's3');
    var body = '';
    if(flash) body = '<p class="st-alert-who">'+esc(flash.name||'')+'</p>';
    else if(waiting) body = '<p class="st-alert-code">'+esc(state.code||'')+'</p>';
    else body = list.map(function(m){
      return '<div class="st-alert-row"><span>'+esc(m.nickname)+'</span>'+
        '<button type="button" class="ok" data-ok="'+esc(m.id)+'">'+bi('approve')+'</button>'+
        '<button type="button" class="no" data-no="'+esc(m.id)+'">'+bi('reject')+'</button></div>';
    }).join('');
    var acts = '';
    if(waiting) acts = '<div class="st-alert-acts"><button type="button" id="stAlertSwitch">'+bi('switchRoom')+'</button></div>';
    else if(!flash && review) acts = '<div class="st-alert-acts"><button type="button" id="stAlertLater">'+bi('alertLater')+'</button></div>';
    box.hidden = false;
    box.className = 'st-alert tone-'+tone;
    box.innerHTML = alertPlate(tone, titleKey, subKey, body, acts);
    box.querySelectorAll('[data-ok]').forEach(function(b){ b.onclick=function(){ decide(b.getAttribute('data-ok'),'approve'); }; });
    box.querySelectorAll('[data-no]').forEach(function(b){ b.onclick=function(){ decide(b.getAttribute('data-no'),'reject'); }; });
    var later = box.querySelector('#stAlertLater');
    if(later) later.onclick = function(){ alertHold = true; paint(); };
    var sw = box.querySelector('#stAlertSwitch');
    if(sw) sw.onclick = function(){ picking = true; statusMsg = ''; paint(); };
    armAlert();
  }
  function decide(id, action){
    var name = '';
    (state&&state.members||[]).forEach(function(m){ if(m.id===id) name = m.nickname||''; });
    api('/api/rooms/'+encodeURIComponent(state.code)+'/members/'+encodeURIComponent(id)+'/'+action, {method:'POST', body:{}}).then(function(st){
      alertFlash = {tone:action==='approve'?'ok':'no', name:name, until:Date.now()+2200};
      alertHold = false;
      take(st);
    }).catch(fail);
  }
  function linkNote(){
    if(!state) return '';
    if(linkState==='on') return '<p class="st-link on">'+esc(t('linkOn'))+' '+esc(state.code)+'</p>';
    if(linkState==='wait') return '<p class="st-link wait">'+esc(t('linkWait'))+'</p>';
    if(linkState==='off') return '<p class="st-link off">'+esc(t('linkOff'))+'</p>';
    return '';
  }
  function setLink(next){
    if(next===linkState) return;
    linkState = next;
    if(entered) paint();
  }
  function scheduleLink(ms){
    clearTimeout(linkTimer);
    linkTimer = setTimeout(pullLink, ms);
  }
  function pullLink(){
    clearTimeout(linkTimer);
    if(!entered || !state || state.status!=='member'){ scheduleLink(2000); return; }
    fetch('http://127.0.0.1:8780/api/status', {cache:'no-store'})
      .then(function(r){ if(!r.ok) throw new Error('status'); return r.json(); })
      .then(function(d){
        var room = String(d && d.room || '').toUpperCase();
        var pending = String(d && d.pendingRoom || '').toUpperCase();
        linkMiss = 0;
        if(d && d.tokenSet && room===state.code){
          setLink('on');
          if(linkToast==='off'){
            linkToast = 'on';
            linkToastHold = false;
            paintLinkToast();
            setTimeout(function(){ if(linkToast==='on'){ linkToast = ''; paintLinkToast(); } }, 2200);
          }
        }
        else if(pending===state.code) setLink('wait');
        else if(linkState==='on') setLink('');
        scheduleLink(2000);
      })
      .catch(function(){
        linkMiss += 1;
        if(linkMiss>=3 && linkState==='on') setLink('');
        if(linkState!=='wait' && !linkToastHold && linkToast!=='on'){
          linkToast = 'off';
          paintLinkToast();
        }
      });
  }
  function armLinkWatch(){
    linkMiss = 0;
    pullLink();
  }
  function paintLinkToast(){
    var host = root();
    if(!host) return;
    var box = document.getElementById('stLinkToast');
    if(!box){
      box = document.createElement('div');
      box.id = 'stLinkToast';
      host.appendChild(box);
    }
    var mode = (entered && linkToast && !linkToastHold) ? linkToast : '';
    if(box.getAttribute('data-mode')===mode) return;
    box.setAttribute('data-mode', mode);
    if(!mode){ box.hidden = true; box.className = 'st-linktoast st-alert'; box.innerHTML = ''; return; }
    box.hidden = false;
    box.className = 'st-linktoast st-alert tone-'+(mode==='on' ? 'ok' : 'wait');
    if(mode==='on'){
      box.innerHTML = alertPlate('ok', 'linkOn', '', '', '');
      return;
    }
    box.innerHTML = alertPlate('wait', 'linkToast', '', '<p class="st-alert-msg">'+esc(t('linkOff'))+'</p>',
      '<div class="st-alert-acts"><button type="button" id="stLinkRetry">'+bi('linkRetry')+'</button><button type="button" id="stLinkLater">'+bi('castClose')+'</button></div>');
    var retry = box.querySelector('#stLinkRetry');
    if(retry) retry.onclick = function(){ linkToastHold = false; armLinkWatch(); };
    var later = box.querySelector('#stLinkLater');
    if(later) later.onclick = function(){ linkToastHold = true; paintLinkToast(); };
  }
  function linkPc(){
    var tok = token();
    if(!tok || !state || !state.code){ setLink('off'); return; }
    var payload = JSON.stringify({apiBase: API || location.origin, room: state.code, token: tok});
    fetch('http://127.0.0.1:8780/api/pair', {method:'POST', headers:{'Content-Type':'application/json'}, body: payload})
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(d){ if(d && d.error) throw new Error(d.error); setLink('wait'); pullLink(); })
      .catch(function(){ setLink('off'); linkToast = 'off'; linkToastHold = false; paintLinkToast(); });
  }
  function mapTarget(node){
    if(!node || !node.closest) return false;
    return !node.closest('.st-loc-card,.st-zoom,.stx,.st-side,.st-crumb,.st-top,.st-room,.st-crew,.st-float-ico,.st-gate,.st-call,.st-sfx,.st-ctrldlg,.st-locdlg,.st-alert,.st-linktoast,.st-ctx,.st-rally,.st-plaza,.st-lobby-pin');
  }
  function closeCtx(){
    ctxAt = null;
    ctxSig = '';
    var menu = document.getElementById('stCtx');
    if(menu) menu.hidden = true;
  }
  function syncCtx(){
    var menu = document.getElementById('stCtx');
    if(!menu) return;
    if(!ctxAt || !entered || !state || state.status!=='member'){ menu.hidden = true; ctxSig = ''; return; }
    var mine = canDraw();
    var cap = state.role==='captain';
    var members = state.routeMode==='members';
    var sig = [mine?1:0, cap?1:0, members?1:0, marking?1:0, t('here'), t('route'), t('routeOn'), t('mode'), t('modeCaptain'), t('modeMembers'), t('horn')].join('|');
    if(sig === ctxSig && !menu.hidden && menu.childElementCount) return;
    var keepOpen = !!menu.querySelector('.st-ctx-sub.st-open');
    ctxSig = sig;
    menu.innerHTML =
      '<button type="button" class="st-ctx-btn" data-ctx="here">'+esc(t('here'))+'</button>'+
      (cap ? '<button type="button" class="st-ctx-btn" data-ctx="horn">'+esc(t('horn'))+'</button>' : '')+
      (mine ? '<button type="button" class="st-ctx-btn'+(marking?' on':'')+'" data-ctx="mark">'+esc(marking?t('routeOn'):t('route'))+'</button>' : '')+
      (cap ? '<div class="st-ctx-sub">'+
        '<button type="button" class="st-ctx-btn" data-ctx="mode" aria-haspopup="menu" title="'+esc(members?t('modeMembers'):t('modeCaptain'))+'">'+esc(t('mode'))+'<i class="st-ctx-caret"></i></button>'+
        '<div class="st-ctx-pop" role="menu">'+
          '<button type="button" class="st-ctx-btn'+(!members?' on':'')+'" data-ctx-mode="captain">'+esc(t('modeCaptain'))+'</button>'+
          '<button type="button" class="st-ctx-btn'+(members?' on':'')+'" data-ctx-mode="members">'+esc(t('modeMembers'))+'</button>'+
        '</div></div>' : '');
    menu.hidden = false;
    if(keepOpen){
      var sub = menu.querySelector('.st-ctx-sub');
      if(sub) sub.classList.add('st-open');
    }
    var host = root().getBoundingClientRect();
    var x = ctxAt.x-host.left, y = ctxAt.y-host.top;
    menu.style.left = '0px';
    menu.style.top = '0px';
    var w = menu.offsetWidth, h = menu.offsetHeight;
    var maxX = Math.max(8, host.width-w-8);
    var maxY = Math.max(8, host.height-h-36);
    menu.style.left = Math.max(8, Math.min(x, maxX))+'px';
    menu.style.top = Math.max(8, Math.min(y, maxY))+'px';
    placeCtxPop();
  }
  function placeCtxPop(){
    var pop = document.querySelector('#stCtx .st-ctx-pop');
    var sub = pop && pop.parentNode;
    if(!pop || !sub) return;
    pop.classList.remove('st-flip');
    pop.classList.remove('st-drop');
    pop.style.display = 'block';
    pop.style.visibility = 'hidden';
    var host = root().getBoundingClientRect();
    var edge = sub.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    pop.style.display = '';
    pop.style.visibility = '';
    var roomR = host.right-edge.right, roomL = edge.left-host.left;
    if(roomR<pw+8 && roomL>=pw+8) pop.classList.add('st-flip');
    else if(roomR<pw+8 && roomL<pw+8) pop.classList.add('st-drop');
    if(edge.top+ph>host.bottom-8 && !pop.classList.contains('st-drop')){
      pop.style.top = 'auto';
      pop.style.bottom = '0px';
    }
  }
  function openCtx(x, y){
    if(!entered || !state || state.status!=='member') return;
    ctxAt = {x:x, y:y};
    syncCtx();
  }
  function onCtxClick(e){
    var b = e.target.closest('button');
    if(!b) return;
    e.stopPropagation();
    var act = b.getAttribute('data-ctx');
    var mode = b.getAttribute('data-ctx-mode');
    var at = ctxAt;
    if(act==='here'){
      closeCtx();
      var hit = at && window.__stCtl && window.__stCtl.hitAt && window.__stCtl.hitAt(at.x, at.y);
      if(hit) window.__stPlace = hit;
      here();
      return;
    }
    if(act==='horn' && state && state.role==='captain'){
      var where = at && window.__stCtl && window.__stCtl.hitAt && window.__stCtl.hitAt(at.x, at.y);
      closeCtx();
      if(where) window.__stPlace = where;
      hornCompose = true;
      hornErr = '';
      if(!hornWhen) hornWhen = hornDefaultWhen();
      paint();
      return;
    }
    if(act==='mark'){
      if(!canDraw()) return;
      marking = !marking;
      if(!marking) window.__stRouteOn = false;
      selected = '';
      closeCtx();
      paint();
      return;
    }
    if(act==='mode'){
      var sub = b.closest('.st-ctx-sub');
      if(sub) sub.classList.toggle('st-open');
      return;
    }
    if(mode && state && state.role==='captain'){
      closeCtx();
      api('/api/rooms/'+encodeURIComponent(state.code)+'/settings', {method:'POST', body:{routeMode:mode}}).then(take).catch(fail);
    }
  }
  function bindCtx(){
    if(window.__stCtxBound) return;
    window.__stCtxBound = true;
    var menu = document.createElement('div');
    menu.id = 'stCtx';
    menu.className = 'st-ctx';
    menu.hidden = true;
    menu.setAttribute('role', 'menu');
    root().appendChild(menu);
    menu.addEventListener('click', onCtxClick);
    menu.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    var arm = {x:0, y:0, moved:false, btn:-1};
    var hold = 0;
    var host = root();
    host.addEventListener('pointerdown', function(e){
      arm.x = e.clientX; arm.y = e.clientY; arm.moved = false; arm.btn = e.button;
      if(ctxAt && !(e.target && e.target.closest && e.target.closest('.st-ctx'))) closeCtx();
    }, true);
    host.addEventListener('pointermove', function(e){
      if(Math.abs(e.clientX-arm.x)+Math.abs(e.clientY-arm.y)>=6) arm.moved = true;
    }, true);
    host.addEventListener('contextmenu', function(e){
      if(!entered || !state || state.status!=='member' || !mapTarget(e.target)) return;
      if(arm.moved && arm.btn===2) return;
      e.preventDefault();
      openCtx(e.clientX, e.clientY);
    });
    host.addEventListener('touchstart', function(e){
      if(!entered || e.touches.length!==1 || !mapTarget(e.target)) return;
      var t = e.touches[0];
      var x = t.clientX, y = t.clientY;
      clearTimeout(hold);
      hold = setTimeout(function(){ arm.moved = true; openCtx(x, y); }, 560);
    }, {passive:true});
    host.addEventListener('touchmove', function(e){
      var t = e.touches && e.touches[0];
      if(t && Math.abs(t.clientX-arm.x)+Math.abs(t.clientY-arm.y)>=8) clearTimeout(hold);
    }, {passive:true});
    host.addEventListener('touchend', function(){ clearTimeout(hold); }, {passive:true});
    host.addEventListener('touchcancel', function(){ clearTimeout(hold); }, {passive:true});
    window.addEventListener('keydown', function(e){
      if(e.key==='Escape' && ctxAt) closeCtx();
    });
  }
  function here(){
    var ctl = window.__stCtl;
    var o = window.__stPlace;
    var lv = ctl && ctl.level && ctl.level();
    if(!o && lv) o = lv.o;
    if(!o || !o.n){ statusMsg = t('hereNeed'); paint(); return; }
    api('/api/rooms/'+encodeURIComponent(state.code)+'/presence', {
      method:'POST', body:{location:o.n, system:o.sy||'', code:o.tag||''}
    }).then(function(){ statusMsg=''; return refresh(); }).catch(fail);
  }
  function publish(){
    if(draft.length<2) return;
    var title = draft.map(function(p){ return p.n; }).join(' → ').slice(0,40);
    api('/api/rooms/'+encodeURIComponent(state.code)+'/routes', {
      method:'POST', body:{title:title, note:note, points:draft}
    }).then(function(st){ draft=[]; note=''; marking=false; take(st); }).catch(fail);
  }
  function sendComment(id){
    var input = document.querySelector('[data-cmt="'+id+'"]');
    var body = input ? input.value.trim() : '';
    if(!body) return;
    api('/api/rooms/'+encodeURIComponent(state.code)+'/routes/'+encodeURIComponent(id)+'/comments', {method:'POST', body:{body:body}}).then(take).catch(fail);
  }
  function delRoute(id){
    api('/api/rooms/'+encodeURIComponent(state.code)+'/routes/'+encodeURIComponent(id), {method:'DELETE'}).then(function(st){ if(selected===id) selected=''; take(st); }).catch(fail);
  }
  function localLeave(){
    leaving = false;
    state = null; draft = []; marking = false; note = ''; selected = ''; statusMsg = ''; entered = false; roomKind = ''; linkState = ''; linkMiss = 0; linkToast = ''; linkToastHold = false;
    castCompose = false; castDraft = ''; castErr = ''; castIncoming = null; ctxAt = null;
    try{ localStorage.removeItem(CODE); }catch(e){}
    window.__stRouteOn = false;
    var cfg = window.LIVEMAP_CONFIG || {};
    cfg.PLAYERS_URL = './players.example.json';
    cfg.PLAYERS_HEADERS = {};
    if(window.__stCtl && window.__stCtl.showRoute) window.__stCtl.showRoute([]);
    if(typeof window.__stReloadPlayers==='function') window.__stReloadPlayers();
    paint();
  }
  function askLeave(){
    if(state && state.role==='captain' && state.status==='member'){ leaving = true; paint(); return; }
    exitRoom({});
  }
  function exitRoom(body){
    if(!state || !state.code){ localLeave(); return; }
    api('/api/rooms/'+encodeURIComponent(state.code)+'/leave', {method:'POST', body:body||{}}).then(function(){
      localLeave();
    }).catch(function(e){
      if(e && e.body && (e.body.error==='handoff' || e.body.error==='solo')){ leaving = true; paint(); return; }
      fail(e);
    });
  }
  function noteDenied(code){
    alertDeny = {code: code || (state && state.code) || ''};
    localLeave();
  }
  function refresh(){
    if(!state || !token()) return Promise.resolve();
    return api('/api/rooms/'+encodeURIComponent(state.code)).then(function(st){
      var keep = statusMsg;
      take(st);
      statusMsg = keep;
      if(keep) paint();
    }).catch(function(e){
      if(e && e.status===403 && e.body && e.body.error==='rejected'){ noteDenied(); return; }
      if(e && (e.status===403 || e.status===404)){
        var removed = e.status===403 && e.body && e.body.error==='forbidden';
        localLeave();
        if(removed){ statusMsg = t('kicked'); paint(); }
      }
    });
  }

  function probe(base){
    return fetch(base+'/api/health', {cache:'no-store'}).then(function(r){ return r.ok ? r.json() : null; }).then(function(h){ return !!(h&&h.ok); }).catch(function(){ return false; });
  }
  function detect(){
    return probe('').then(function(ok){
      if(ok){ API=''; return true; }
      if(location.hostname==='127.0.0.1' && location.port==='8770') return false;
      return probe('http://127.0.0.1:8770').then(function(ok2){ if(ok2){ API='http://127.0.0.1:8770'; return true; } return false; });
    });
  }
  function lobbyPlaceBody(){
    var o = window.__stPlace;
    if(!o || !o.id || o.k==='player' || o.grp) return {};
    return {location:String(o.n||''), system:o.sy||'', code:String(o.id)};
  }
  function mergeChat(lines){
    (lines||[]).forEach(function(line){
      if(!line || line.id==null) return;
      if(chatLines.some(function(x){ return x.id===line.id; })) return;
      chatLines.push(line);
      if(line.id>chatLast) chatLast = line.id;
    });
    chatLines.sort(function(a,b){ return a.id-b.id; });
    if(chatLines.length>400) chatLines = chatLines.slice(chatLines.length-400);
  }
  function takePlaza(d){
    if(!d) return;
    if(Object.prototype.hasOwnProperty.call(d, 'on')) plazaMineOn = !!d.on;
    if(d.people) plazaPeople = d.people;
    if(d.posts){
      plazaPosts = d.posts;
      if(pendingPost){
        var linked = null;
        plazaPosts.forEach(function(p){ if(p.id===pendingPost) linked = p; });
        pendingPost = '';
        if(linked){
          linkedPost = linked.id;
          linkedOnce = false;
          plazaTab = linked.kind==='job' || linked.kind==='roam' || linked.kind==='ship' ? linked.kind : plazaTab;
          plazaOn = true;
        }
      }
    }
    if(d.chat) mergeChat(d.chat);
    if(d.line) mergeChat([d.line]);
    window.__stLobbyPeople = [];
    if(plazaOn) paintPlaza();
  }
  function pullPlaza(){
    if(!token() || plazaPulling) return;
    plazaPulling = true;
    api('/api/plaza?after='+chatLast).then(function(d){
      plazaPulling = false;
      takePlaza(d);
    }).catch(function(){ plazaPulling = false; });
  }
  function enterPlazaPage(){
    if(!plazaPage || !state || state.status!=='member') return;
    var host = root();
    if(host) host.classList.add('is-plaza-page');
    openPlaza();
  }
  function openPlaza(){
    function show(){ plazaOn = true; ensurePlaza(); paintPlaza(); pullPlaza(); }
    if(token()){ show(); return; }
    var nick = nickValue() || savedNick();
    if(!nick){ statusMsg = t('errNick'); paint(); return; }
    api('/api/session', {method:'POST', body:{nickname:nick}}).then(function(s){
      try{ localStorage.setItem(TOKEN, s.token); }catch(e){}
      rememberNick(nick);
      show();
    }).catch(fail);
  }
  var shipCat = null, shipWait = null;
  function shipFold(s){
    return String(s||'').toLowerCase().replace(/&apos;/g,"'").replace(/[\s\u3000._\-'’"“”()（）]/g,'');
  }
  function shipShown(en){
    var loc = window.SCLMW && SCLMW.loc;
    if(loc && loc.text){
      var hit = loc.text(en);
      if(hit && hit!==en) return hit;
    }
    var row = (shipCat||[]).filter(function(s){ return s.en===en; })[0];
    if(!row) return en||'';
    if(lang()==='zh-Hant') return row.hant||row.hans||row.en;
    if(lang()==='zh-Hans') return row.hans||row.hant||row.en;
    return row.en;
  }
  function shipFace(name){
    if(!name) return '';
    var loc = window.SCLMW && SCLMW.loc;
    if(loc && loc.text){
      var shown = loc.text(name);
      if(shown && shown!==name) return shown;
      var en = loc.english ? loc.english(name) : '';
      if(en){
        var back = loc.text(en);
        if(back) return back;
      }
    }
    return shipShown(name);
  }
  function shipCatalog(){
    if(shipCat) return Promise.resolve(shipCat);
    if(shipWait) return shipWait;
    var base = (window.SCLMW && SCLMW.basePath) ? SCLMW.basePath() : './';
    var locp = (window.SCLMW && SCLMW.loc && SCLMW.loc.index) ? SCLMW.loc.index() : Promise.resolve(null);
    shipWait = Promise.all([
      fetch(base+'data/vehicles.json', {cache:'no-store'}).then(function(r){ return r.json(); }).catch(function(){ return {ships:[]}; }),
      locp.catch(function(){ return null; })
    ]).then(function(pair){
      var pack = pair[1]||{};
      var hans = pack.hans||{}, hant = pack.hant||{};
      var seen = {};
      shipCat = [];
      (pair[0].ships||[]).forEach(function(s){
        if(!s||!s.n) return;
        var en = String(s.n).replace(/&apos;/g,"'");
        if(seen[en]) return;
        seen[en] = 1;
        shipCat.push({en:en, hans:hans[en]||'', hant:hant[en]||'', co:String(s.co||'').replace(/&apos;/g,"'")});
      });
      return shipCat;
    });
    return shipWait;
  }
  function shipScore(q, ship){
    var raw = String(q||'').trim();
    if(!raw) return 0;
    var tokens = raw.toLowerCase().split(/[\s\u3000]+/).filter(Boolean);
    var nq = shipFold(raw);
    var fields = [ship.en, ship.hans, ship.hant, ship.co];
    var best = 0;
    fields.forEach(function(f){
      var n = shipFold(f);
      if(!n) return;
      if(n===nq) best = Math.max(best, 100);
      else if(n.indexOf(nq)===0) best = Math.max(best, 80);
      else if(n.indexOf(nq)>=0) best = Math.max(best, 60);
    });
    if(best || tokens.length<2) return best;
    var loose = fields.some(function(f){
      var n = shipFold(f);
      return n && tokens.every(function(tok){ return n.indexOf(shipFold(tok))>=0; });
    });
    return loose ? 50 : 0;
  }
  var MAKER_KEY = {
    'Musashi Industrial and Starflight Concern':'Musashi Industrial & Starflight Concern',
    "Grey&apos;s Market":"Grey's Market",
    "Grey's Market":"Grey's Market",
    'Esperia Incorporation':'Esperia',
    'Banu Souli':'Banu',
    'Vanduul Clans':'Vanduul'
  };
  function makerFace(co){
    var raw = String(co||'').replace(/&apos;/g, "'").trim();
    if(!raw) return '';
    var loc = window.SCLMW && SCLMW.loc;
    function hit(s){
      if(!s || !loc || !loc.text) return '';
      var z = locPlain(loc.text(s));
      return z && z!==s ? z : '';
    }
    return hit(raw) || hit(MAKER_KEY[String(co||'')] || MAKER_KEY[raw] || '') || raw;
  }
  function findRow(btn, title, sub){
    var roll = document.createElement('span');
    roll.className = 'st-find-roll';
    var inner = document.createElement('span');
    var name = document.createElement('b');
    name.textContent = title;
    inner.appendChild(name);
    if(sub){
      var em = document.createElement('em');
      em.textContent = sub;
      inner.appendChild(em);
    }
    roll.appendChild(inner);
    btn.appendChild(roll);
  }
  function rollFind(list){
    if(!list) return;
    if(!list.__roll && window.ResizeObserver){
      list.__roll = true;
      new ResizeObserver(function(){ rollFind(list); }).observe(list);
    }
    list.querySelectorAll('.st-find-roll').forEach(function(box){
      var inner = box.firstElementChild;
      if(!inner) return;
      inner.style.animation = 'none';
      var extra = inner.scrollWidth - box.clientWidth;
      if(extra<=4){
        inner.style.animation = '';
        inner.style.removeProperty('--st-roll');
        return;
      }
      inner.style.setProperty('--st-roll', (-extra)+'px');
      inner.style.animation = 'st-roll '+Math.max(4, extra/24).toFixed(2)+'s ease-in-out infinite alternate';
    });
  }
  function paintShipList(input){
    if(!input) return;
    var list = input.parentElement.querySelector('.st-dd-list');
    var q = input.value.trim();
    if(!list) return;
    if(!q){ list.hidden = true; list.innerHTML = ''; return; }
    if(!shipCat){
      list.hidden = true;
      shipCatalog().then(function(){ if(input.value.trim()===q) paintShipList(input); });
      return;
    }
    var hits = [];
    shipCat.forEach(function(s){ var n = shipScore(q, s); if(n) hits.push({s:s, n:n}); });
    hits.sort(function(a,b){ return b.n-a.n || shipShown(a.s.en).localeCompare(shipShown(b.s.en), 'zh'); });
    hits = hits.slice(0, 8);
    list.innerHTML = '';
    if(!hits.length){ list.hidden = true; return; }
    var form = input.closest ? input.closest('form') : null;
    if(form) form.querySelectorAll('.st-dd-list').forEach(function(n){ if(n!==list) n.hidden = true; });
    hits.forEach(function(x){
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-ship', x.s.en);
      findRow(b, shipShown(x.s.en), makerFace(x.s.co));
      list.appendChild(b);
    });
    list.hidden = false;
    requestAnimationFrame(function(){ rollFind(list); });
  }
  function chooseShip(input, en){
    if(!input || !en) return;
    input.value = shipShown(en);
    input.setAttribute('data-canon', en);
    var list = input.parentElement.querySelector('.st-dd-list');
    if(list) list.hidden = true;
    paintShipFit(input);
  }
  var shipFacts = {}, shipFactsWait = {}, inviteCards = {};
  var ROLE_KEY = {Medical:'roleMedical', Freight:'roleFreight', Assault:'roleAssault', Multi:'roleMulti', 'Data Running':'roleData', Merchant:'roleMerchant', Minelayer:'roleMine', Battlecruiser:'roleBattle', Tank:'roleTank'};
  function roleFace(en){
    if(!en) return '';
    if(ROLE_KEY[en]) return t(ROLE_KEY[en]);
    var alias = en==='Refuelling' ? 'Refueling' : en;
    var loc = window.SCLMW && SCLMW.loc;
    if(loc && loc.text){
      var hit = loc.text(alias);
      if(hit && hit!==alias) return hit;
    }
    return en;
  }
  function fyHref(slug){
    var s = String(slug||'').toLowerCase();
    if(!/^[a-z0-9-]{1,80}$/.test(s)) return 'https://fleetyards.net/ships';
    return 'https://fleetyards.net/ships/'+s;
  }
  function fitBits(f){
    if(!f || f.miss) return [];
    var bits = [];
    if(f.role) bits.push(roleFace(f.role));
    if(f.crew) bits.push(t('roleCrew').replace('{n}', f.crew));
    if(f.cargo) bits.push(f.cargo);
    return bits.filter(Boolean);
  }
  function loadFacts(en){
    if(!en) return Promise.resolve(null);
    if(shipFacts[en]) return Promise.resolve(shipFacts[en]);
    if(shipFactsWait[en]) return shipFactsWait[en];
    shipFactsWait[en] = fetch('https://api.fleetyards.net/v1/models?perPage=5&q[nameEq]='+encodeURIComponent(en)).then(function(r){
      return r.ok ? r.json() : null;
    }).then(function(d){
      var items = d && d.items || [];
      var it = null;
      items.forEach(function(x){ if(!it && x && x.name===en) it = x; });
      var fact = {miss:1};
      if(it){
        var metrics = it.metrics||{};
        fact = {
          role:(it.fociLabels && it.fociLabels[0]) || it.classificationLabel || '',
          crew:it.crew && it.crew.label || '',
          cargo:metrics.cargoLabel || '',
          slug:it.slug||''
        };
      }
      shipFacts[en] = fact;
      delete shipFactsWait[en];
      return fact;
    }).catch(function(){
      shipFacts[en] = {miss:1};
      delete shipFactsWait[en];
      return shipFacts[en];
    });
    return shipFactsWait[en];
  }
  function shipFactHtml(en){
    var f = shipFacts[en];
    var bits = fitBits(f);
    if(!bits.length) return '';
    return '<div class="st-post-fit"><span class="st-find-roll"><span><b>'+esc(bits.join(' · '))+'</b><em><a href="'+fyHref(f.slug)+'" target="_blank" rel="noreferrer">FleetYards</a></em></span></span></div>';
  }
  function paintShipFit(input){
    var box = input && input.parentElement;
    if(!box) return;
    var line = box.parentElement && box.parentElement.querySelector('.st-ship-fit');
    if(!line) return;
    var en = input.getAttribute('data-canon')||'';
    if(!en || shipShown(en)!==input.value){ line.hidden = true; line.innerHTML = ''; return; }
    var f = shipFacts[en];
    if(!f){
      line.hidden = true;
      loadFacts(en).then(function(){ if(input.getAttribute('data-canon')===en) paintShipFit(input); if(plazaOn) fillPosts(); });
      return;
    }
    var bits = fitBits(f);
    if(!bits.length){ line.hidden = true; line.innerHTML = ''; return; }
    line.hidden = false;
    line.innerHTML = '<span class="st-find-roll"><span><b>'+esc(bits.join(' · '))+'</b><em><a href="'+fyHref(f.slug)+'" target="_blank" rel="noreferrer">FleetYards</a></em></span></span>';
    requestAnimationFrame(function(){ rollFind(line); });
  }
  function bringCanon(raw){
    var text = String(raw||'').trim().slice(0, 80);
    if(!text || !shipCat) return text;
    var exact = '';
    shipCat.forEach(function(s){
      if(exact) return;
      if(s.en.toLowerCase()===text.toLowerCase() || shipShown(s.en)===text) exact = s.en;
    });
    return exact || text;
  }
  function shipSend(form){
    var input = form.querySelector('[name="ship"]');
    if(!input) return '';
    var typed = String(input.value||'').trim();
    var canon = input.getAttribute('data-canon')||'';
    if(canon && shipShown(canon)===typed) return canon;
    var loc = window.SCLMW && SCLMW.loc;
    if(loc && loc.english){
      var en = loc.english(typed);
      if(en) return en;
    }
    return typed;
  }
  var missionCat = null, missionWait = null, missionPlaces = {};
  function locPlain(s){ return String(s||'').replace(/<\/?EM\d+>/gi,'').replace(/\s+/g,' ').trim(); }
  function missionShown(en){
    var loc = window.SCLMW && SCLMW.loc;
    if(loc && loc.text){
      var hit = locPlain(loc.text(en));
      if(hit && hit!==en) return hit;
    }
    var row = (missionCat||[]).filter(function(s){ return s.en===en; })[0];
    if(!row) return en||'';
    if(lang()==='zh-Hant') return row.hant||row.hans||row.en;
    if(lang()==='zh-Hans') return row.hans||row.hant||row.en;
    return row.en;
  }
  function missionFace(name){
    if(!name) return '';
    var loc = window.SCLMW && SCLMW.loc;
    if(loc && loc.text){
      var shown = locPlain(loc.text(name));
      if(shown && shown!==name) return shown;
      var en = loc.english ? loc.english(name) : '';
      if(en){
        var back = locPlain(loc.text(en));
        if(back) return back;
      }
    }
    return missionShown(name);
  }
  function missionCatalog(){
    if(missionCat) return Promise.resolve(missionCat);
    if(missionWait) return missionWait;
    var base = (window.SCLMW && SCLMW.basePath) ? SCLMW.basePath() : './';
    var locp = (window.SCLMW && SCLMW.loc && SCLMW.loc.index) ? SCLMW.loc.index() : Promise.resolve(null);
    missionWait = Promise.all([
      fetch(base+'data/missions.json', {cache:'no-store'}).then(function(r){ return r.json(); }).catch(function(){ return {groups:[]}; }),
      locp.catch(function(){ return null; })
    ]).then(function(pair){
      var pack = pair[1]||{};
      var hans = pack.hans||{}, hant = pack.hant||{};
      var seen = {};
      missionCat = [];
      missionPlaces = {};
      (pair[0].groups||[]).forEach(function(g){
        (g.t||[]).forEach(function(title){
          var en = String(title||'').trim();
          if(!en) return;
          var bag = missionPlaces[en] || (missionPlaces[en] = []);
          var have = {};
          bag.forEach(function(id){ have[id] = 1; });
          (g.locs||[]).forEach(function(id){ if(id && !have[id]){ have[id] = 1; bag.push(id); } });
          if(seen[en]) return;
          seen[en] = 1;
          missionCat.push({en:en, hans:locPlain(hans[en]||''), hant:locPlain(hant[en]||''), co:String(g.ty||'')});
        });
      });
      return missionCat;
    });
    return missionWait;
  }
  function paintMissionList(input){
    if(!input) return;
    var list = input.parentElement.querySelector('.st-dd-list');
    var q = input.value.trim();
    if(!list) return;
    if(!q){ list.hidden = true; list.innerHTML = ''; return; }
    if(!missionCat){
      list.hidden = true;
      missionCatalog().then(function(){ if(input.value.trim()===q) paintMissionList(input); });
      return;
    }
    var hits = [];
    missionCat.forEach(function(s){ var n = shipScore(q, s); if(n) hits.push({s:s, n:n}); });
    hits.sort(function(a,b){ return b.n-a.n || missionShown(a.s.en).localeCompare(missionShown(b.s.en), 'zh'); });
    hits = hits.slice(0, 8);
    list.innerHTML = '';
    if(!hits.length){ list.hidden = true; return; }
    var form = input.closest ? input.closest('form') : null;
    if(form) form.querySelectorAll('.st-dd-list').forEach(function(n){ if(n!==list) n.hidden = true; });
    hits.forEach(function(x){
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-mission', x.s.en);
      var kind = x.s.co ? missionShown(x.s.co) : '';
      findRow(b, missionShown(x.s.en), kind && kind!==x.s.co ? kind : (x.s.co||''));
      list.appendChild(b);
    });
    list.hidden = false;
    requestAnimationFrame(function(){ rollFind(list); });
  }
  function chooseMission(input, en){
    if(!input || !en) return;
    input.value = missionShown(en);
    input.setAttribute('data-canon', en);
    var list = input.parentElement.querySelector('.st-dd-list');
    if(list) list.hidden = true;
    flyMission(en);
  }
  function flyMission(en){
    var ids = missionPlaces[en] || [];
    if(!ids.length || ids.length>8) return;
    var ctl = window.__stCtl;
    if(!ctl || !ctl.place || !ctl.focusId) return;
    var known = [];
    ids.forEach(function(id){ var o = ctl.place(id); if(o) known.push(o); });
    if(!known.length) return;
    var pool = known.filter(function(o){ return o.k && o.k!=='star'; });
    if(!pool.length) pool = known;
    var here = '';
    try{ here = lobbyPlaceBody().system || ''; }catch(e){}
    var near = here ? pool.filter(function(o){ return o.sy===here; })[0] : null;
    var pick = near || pool[0];
    if(ctl.highlight) ctl.highlight(known.map(function(o){ return o.id; }));
    ctl.focusId(pick.id);
  }
  function missionSend(form){
    var input = form.querySelector('[name="mission"]');
    if(!input) return '';
    var typed = String(input.value||'').trim();
    var canon = input.getAttribute('data-canon')||'';
    if(canon && missionShown(canon)===typed) return canon;
    var loc = window.SCLMW && SCLMW.loc;
    if(loc && loc.english){
      var en = loc.english(typed);
      if(en) return en;
    }
    return typed;
  }
  function plazaField(name, key, kind, extra){
    var cap = '<span data-k="'+key+'"></span>';
    if(kind==='area') return '<label>'+cap+'<textarea name="'+name+'" maxlength="400"></textarea></label>';
    if(kind==='seats') return '<label>'+cap+'<input name="'+name+'" type="text" maxlength="9" data-ph="postSeatsPh" autocomplete="off" spellcheck="false"></label>';
    if(kind==='mission') return '<label>'+cap+'<div class="st-dd st-plaza-dd st-ship-find" data-find="mission"><input name="'+name+'" maxlength="80" autocomplete="off" spellcheck="false"><div class="st-dd-list st-ship-list" hidden></div></div></label>';
    if(kind==='ship') return '<label>'+cap+'<div class="st-dd st-plaza-dd st-ship-find" data-find="ship"><input name="'+name+'" maxlength="80" autocomplete="off" spellcheck="false"><div class="st-dd-list st-ship-list" hidden></div></div><p class="st-ship-fit" hidden></p></label>';
    if(kind==='contact') return '<label class="st-plaza-contact">'+cap+'<div class="st-dd st-plaza-dd"><button type="button" class="st-dd-btn"><span data-dd-face></span></button><div class="st-dd-list" hidden><button type="button" data-pick="spectrum" data-k="contactSpectrum"></button><button type="button" data-pick="qq" data-k="contactQq"></button><button type="button" data-pick="wechat" data-k="contactWechat"></button><button type="button" data-pick="discord" data-k="contactDiscord"></button><button type="button" data-pick="telegram" data-k="contactTelegram"></button><button type="button" data-pick="kook" data-k="contactKook"></button><button type="button" data-pick="heibox" data-k="contactHeibox"></button><button type="button" data-pick="whatsapp" data-k="contactWhatsapp"></button><button type="button" data-pick="mail" data-k="contactMail"></button></div><input type="hidden" name="contactKind" value="spectrum" data-default="spectrum"></div><input name="contact" maxlength="180" data-ph="contactPhSpectrum" autocomplete="off" spellcheck="false"></label>';
    if(kind==='region' || kind==='crew' || kind==='keep' || kind==='speech'){
      var preset = '';
      var opts = kind==='crew'
        ? '<button type="button" data-pick="" data-k="postTemp"></button><button type="button" data-pick="1" data-k="postStanding"></button>'
        : kind==='speech'
        ? '<button type="button" data-pick="zh" data-k="speechZh"></button><button type="button" data-pick="en" data-k="speechEn"></button><button type="button" data-pick="other" data-k="speechOther"></button><button type="button" data-pick="" data-k="speechAny"></button>'
        : kind==='keep'
        ? '<button type="button" data-pick="900" data-k="keep15"></button><button type="button" data-pick="1800" data-k="keep30"></button><button type="button" data-pick="3600" data-k="keep1"></button><button type="button" data-pick="10800" data-k="keep3"></button><button type="button" data-pick="21600" data-k="keep6"></button><button type="button" data-pick="32400" data-k="keep9"></button><button type="button" data-pick="43200" data-k="keep12"></button><button type="button" data-pick="86400" data-k="keep24"></button><button type="button" data-pick="172800" data-k="keep48"></button><button type="button" data-pick="345600" data-k="keep96"></button>'+(extra==='week'?'<button type="button" data-pick="604800" data-k="keep168"></button>':'')+'<button type="button" data-pick="0" data-k="keepOpen"></button>'
        : '<button type="button" data-pick="asia" data-k="srvAsia"></button><button type="button" data-pick="us" data-k="srvUs"></button><button type="button" data-pick="aus" data-k="srvAus"></button><button type="button" data-pick="eu" data-k="srvEu"></button>';
      if(kind==='keep') preset = '21600';
      return '<label class="st-plaza-srv">'+cap+'<div class="st-dd st-plaza-dd"><button type="button" class="st-dd-btn"><span data-dd-face></span></button><div class="st-dd-list" hidden>'+opts+'</div><input type="hidden" name="'+name+'" value="'+preset+'" data-default="'+preset+'"></div></label>';
    }
    var type = kind==='num' ? 'number' : (kind==='time' ? 'datetime-local' : 'text');
    var max = kind==='num' ? ' max="168" min="1"' : ' maxlength="60"';
    return '<label>'+cap+'<input name="'+name+'" type="'+type+'"'+max+'></label>';
  }
  function plazaHtml(){
    return edgeHtml()+'<header class="st-plaza-head"><h2 data-k="plaza"></h2>'+
      '<div class="st-plaza-tabs">'+
        '<button type="button" data-plaza="hall" data-k="hallTab"></button>'+
        '<button type="button" data-plaza="ship" data-k="shipTab"></button>'+
        '<button type="button" data-plaza="job" data-k="jobTab"></button>'+
        '<button type="button" data-plaza="roam" data-k="roamTab"></button>'+
      '</div>'+(SC.fontControlHtml?SC.fontControlHtml():'')+'<button type="button" class="st-plaza-page" data-act="page" data-k="plazaPage"></button><button type="button" class="st-plaza-x" aria-label="close">×</button></header>'+
      '<p class="st-plaza-lead" data-k="plazaLead"></p>'+
      '<p class="st-flash st-plaza-err" hidden></p>'+
      '<div class="st-plaza-body">'+
        '<section data-pane="hall" class="st-plaza-hall">'+
          '<aside class="st-plaza-people"><div class="st-plaza-acts">'+
            '<button type="button" id="stLobbyOn"></button>'+
            '<button type="button" id="stLobbyHere" data-k="plazaHere"></button></div>'+
            '<div id="stLobbyList"></div></aside>'+
          '<section class="st-plaza-chat"><div class="st-chat-log" id="stChatLog"></div>'+
            '<form class="st-chat-form" id="stChatForm"><input id="stChatInput" maxlength="240" data-ph="chatPh" autocomplete="off"><button type="submit" data-k="chatSend"></button></form></section>'+
        '</section>'+
        '<section data-pane="ship" class="st-plaza-board" hidden>'+
          '<form class="st-post-form" data-kind="ship">'+plazaField('title','postTitle')+plazaField('ship','postShip','ship')+plazaField('seats','postSeats','seats')+plazaField('server','postServer','region')+plazaField('keep','postHours','keep','week')+plazaField('standing','postCrew','crew')+plazaField('speech','postSpeech','speech')+plazaField('contact','postContact','contact')+plazaField('detail','postDetail','area')+'<button type="submit" data-k="postSend"></button></form><div class="st-post-list" data-list="ship"></div></section>'+
        '<section data-pane="job" class="st-plaza-board" hidden>'+
          '<form class="st-post-form" data-kind="job">'+plazaField('title','postTitle')+plazaField('mission','postMission','mission')+plazaField('seats','postSeats','seats')+plazaField('server','postServer','region')+plazaField('keep','postHours','keep')+plazaField('standing','postCrew','crew')+plazaField('speech','postSpeech','speech')+plazaField('contact','postContact','contact')+plazaField('detail','postDetail','area')+'<button type="submit" data-k="postSend"></button></form><div class="st-post-list" data-list="job"></div></section>'+
        '<section data-pane="roam" class="st-plaza-board" hidden>'+
          '<form class="st-post-form" data-kind="roam">'+plazaField('title','postTitle')+plazaField('seats','postSeats','seats')+plazaField('server','postServer','region')+plazaField('keep','postHours','keep')+plazaField('standing','postCrew','crew')+plazaField('speech','postSpeech','speech')+plazaField('contact','postContact','contact')+plazaField('detail','postDetail','area')+'<button type="submit" data-k="postSend"></button></form><div class="st-post-list" data-list="roam"></div></section>'+
      '</div>';
  }
  function labelPlaza(el){
    var pageBtn = el.querySelector('.st-plaza-page');
    if(pageBtn) pageBtn.setAttribute('data-k', plazaPage ? 'plazaBack' : 'plazaPage');
    var fontLabel = el.querySelector('.st-font span');
    if(fontLabel && SC.i18n) fontLabel.textContent = SC.i18n.t('font.title');
    el.querySelectorAll('[data-k]').forEach(function(node){ node.textContent = t(node.getAttribute('data-k')); });
    el.querySelectorAll('[data-ph]').forEach(function(node){ node.placeholder = t(node.getAttribute('data-ph')); });
    var on = el.querySelector('#stLobbyOn');
    if(on) on.textContent = plazaMineOn ? t('plazaOff') : t('plazaOn');
    var here = el.querySelector('#stLobbyHere');
    if(here) here.hidden = true;
    el.querySelectorAll('.st-plaza-dd').forEach(function(dd){
      var input = dd.querySelector('input');
      var val = input ? input.value : '';
      var face = dd.querySelector('[data-dd-face]');
      var hit = null;
      dd.querySelectorAll('[data-pick]').forEach(function(b){
        var on = b.getAttribute('data-pick')===val;
        b.classList.toggle('on', on);
        if(on) hit = b;
      });
      if(face) face.textContent = hit ? hit.textContent : '';
    });
  }
  function fillPeople(){
    var box = document.getElementById('stLobbyList');
    if(!box) return;
    if(!plazaPeople.length){ box.innerHTML = '<p class="st-flash is-quiet">'+esc(t('plazaEmpty'))+'</p>'; return; }
    box.innerHTML = plazaPeople.map(function(p){
      return '<div class="st-lobby-row'+(p.mine?' mine':'')+'"><b>'+esc(p.nickname||'')+(p.mine?' · '+esc(t('you')):'')+'</b></div>';
    }).join('');
  }
  function fillChat(){
    var log = document.getElementById('stChatLog');
    if(!log) return;
    var have = {};
    log.querySelectorAll('[data-id]').forEach(function(n){ have[n.getAttribute('data-id')] = 1; });
    var stick = log.scrollHeight-log.scrollTop-log.clientHeight < 60;
    chatLines.forEach(function(line){
      var id = String(line.id);
      if(have[id]) return;
      var row = document.createElement('div');
      row.className = 'st-chat-line'+(line.mine?' mine':'');
      row.setAttribute('data-id', id);
      var when = '';
      try{ when = new Date((line.at||0)*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }catch(e){}
      row.innerHTML = '<b>'+esc(line.nickname||'')+'</b><time>'+esc(when)+'</time><p>'+esc(line.body||'')+'</p>';
      log.appendChild(row);
    });
    if(stick) log.scrollTop = log.scrollHeight;
  }
  function dueOpen(exp){ return (+exp||0) - Date.now()/1000 > 20*365*86400; }
  function dueText(exp){
    if(dueOpen(exp)) return t('keepOpen');
    var left = Math.max(0, Math.floor((+exp||0) - Date.now()/1000));
    if(left<60) return t('postLeftSoon');
    var d = Math.floor(left/86400);
    var h = Math.floor((left%86400)/3600);
    var m = Math.floor((left%3600)/60);
    var bit = d && h ? t('postDayHour').replace('{d}', d).replace('{h}', h)
      : d ? t('postDay').replace('{d}', d)
      : h && m ? t('postHourMin').replace('{h}', h).replace('{m}', m)
      : h ? t('postHour').replace('{h}', h)
      : t('postMin').replace('{m}', m);
    return t('postLeft').replace('{t}', bit);
  }
  function dueShort(exp){ return !dueOpen(exp) && Math.max(0, (+exp||0) - Date.now()/1000) < 15*60; }
  function postMeta(label, value){
    if(value==null || value==='') return '';
    return '<div><span>'+esc(label)+'</span><b>'+esc(String(value))+'</b></div>';
  }
  function postCard(p){
    var exp = p.expires||0;
    return '<article class="st-post'+(p.id && p.id===linkedPost?' is-link':'')+'">'+
      '<time class="st-post-due'+(dueShort(exp)?' is-short':'')+'" data-exp="'+esc(String(exp))+'">'+esc(dueText(exp))+'</time>'+
      '<h3>'+esc(p.title||'')+'</h3>'+
      '<em>'+esc(p.standing ? t('postStanding') : t('postTemp'))+'</em>'+
      '<em>'+esc(speechFace(p.speech||''))+'</em>'+
      contactHtml(p)+
      '<div class="st-post-spec">'+
        postMeta(t('postBy'), p.nickname||'')+
        postMeta(t('postMission'), missionFace(p.mission||''))+
        postMeta(t('postShip'), shipFace(p.ship||''))+
        shipFactHtml(p.ship||'')+
        postMeta(t('postPlace'), p.name ? placeFace(p.name) : '')+
        postMeta(t('postAt'), p.at ? rallyWhenLabel(p.at) : '')+
        postMeta(t('postSeats'), p.seats ? String(p.seats) : '')+
        postMeta(t('postServer'), serverFace(p.server||''))+
      '</div>'+
      '<div class="st-plaza-acts">'+
        (p.place ? '<button type="button" data-act="fly" data-place="'+esc(p.place)+'" data-k="hornLook"></button>' : '')+
        '<button type="button" data-act="link" data-id="'+esc(p.id)+'" data-k="postLink"></button>'+
        (p.mine ? '<button type="button" data-act="clear" data-id="'+esc(p.id)+'" data-k="postClear"></button>' : '')+
      '</div>'+(p.detail ? '<p>'+esc(p.detail)+'</p>' : '')+'</article>';
  }
  function postById(id){
    if(!/^[0-9a-f]+$/i.test(id||'')) return null;
    return document.querySelector('.st-post [data-id="'+id+'"]');
  }
  function fillPosts(){
    ['ship','job','roam'].forEach(function(kind){
      var box = document.querySelector('.st-post-list[data-list="'+kind+'"]');
      if(!box) return;
      var rows = plazaPosts.filter(function(p){ return p.kind===kind; });
      box.innerHTML = rows.length ? rows.map(postCard).join('') : '<p class="st-flash is-quiet">'+esc(t('postNone'))+'</p>';
      box.querySelectorAll('[data-k]').forEach(function(node){ node.textContent = t(node.getAttribute('data-k')); });
      box.querySelectorAll('[data-ph]').forEach(function(node){ node.placeholder = t(node.getAttribute('data-ph')); });
    });
    if(linkedPost && !linkedOnce){
      var hit = postById(linkedPost);
      var article = hit && hit.closest('.st-post');
      if(article && article.scrollIntoView){ article.scrollIntoView({block:'nearest'}); linkedOnce = true; }
    }
    var asked = {};
    plazaPosts.forEach(function(p){
      if(!p.ship || shipFacts[p.ship] || asked[p.ship]) return;
      asked[p.ship] = 1;
      loadFacts(p.ship).then(function(){ if(plazaOn) fillPosts(); });
    });
    fillInvites();
  }
  function paintInvite(node, card){
    var bits = [];
    if(card && card.name) bits.push(card.name);
    if(card && card.channel) bits.push(card.channel);
    if(card && typeof card.online==='number') bits.push(t('contactOnline').replace('{n}', String(card.online)));
    if(card && typeof card.members==='number') bits.push(t('contactMembers').replace('{n}', String(card.members)));
    if(!bits.length){ node.hidden = true; node.textContent = ''; return; }
    node.hidden = false;
    node.textContent = bits.join(' · ');
  }
  function fillInvites(){
    document.querySelectorAll('.st-invite-meta[data-invite]').forEach(function(node){
      var kind = node.getAttribute('data-kind')||'';
      var contact = node.getAttribute('data-invite')||'';
      var key = kind+' '+contact;
      if(Object.prototype.hasOwnProperty.call(inviteCards, key)){
        if(inviteCards[key]) paintInvite(node, inviteCards[key]);
        return;
      }
      inviteCards[key] = null;
      api('/api/invite?kind='+encodeURIComponent(kind)+'&contact='+encodeURIComponent(contact)).then(function(d){
        inviteCards[key] = d || {};
        document.querySelectorAll('.st-invite-meta').forEach(function(n){
          if((n.getAttribute('data-kind')||'')===kind && (n.getAttribute('data-invite')||'')===contact) paintInvite(n, inviteCards[key]);
        });
      }).catch(function(){ inviteCards[key] = {}; });
    });
  }
  function paintFault(el){
    var err = el.querySelector('.st-plaza-err');
    var box = null;
    if(plazaFault==='chat') box = document.getElementById('stChatInput');
    else if(plazaFault){
      var form = el.querySelector('.st-post-form[data-kind="'+plazaTab+'"]');
      box = form && form.elements[plazaFault];
    }
    el.querySelectorAll('.is-need').forEach(function(host){
      var same = box && host=== (box.closest('label') || box.parentElement);
      if(same) return;
      host.classList.remove('is-need');
      host.removeAttribute('data-fault');
      var old = host.querySelector(':scope > .st-need');
      if(old) old.remove();
      host.querySelectorAll('input,textarea').forEach(function(input){ input.style.minHeight = ''; });
    });
    if(!box || !plazaErr || !box.offsetParent){
      if(err){
        err.hidden = !plazaErr;
        err.textContent = plazaErr || '';
      }
      return;
    }
    var host = box.closest('label') || box.parentElement;
    var fresh = !host.classList.contains('is-need');
    host.classList.add('is-need');
    host.setAttribute('data-fault', plazaFault);
    var mark = host.querySelector(':scope > .st-need');
    if(!mark){
      mark = document.createElement('b');
      mark.className = 'st-need';
      host.appendChild(mark);
    }
    if(mark.textContent!==plazaErr) mark.textContent = plazaErr;
    mark.style.left = box.offsetLeft+'px';
    mark.style.width = box.offsetWidth+'px';
    mark.style.height = 'auto';
    mark.style.top = box.offsetTop+'px';
    var h = Math.max(box.offsetHeight, mark.scrollHeight);
    box.style.minHeight = h > box.offsetHeight+1 ? h+'px' : '';
    mark.style.top = box.offsetTop+'px';
    mark.style.height = box.offsetHeight+'px';
    if(fresh && host.scrollIntoView) host.scrollIntoView({block:'nearest'});
    if(err){ err.hidden = true; err.textContent = ''; }
  }
  function paintPlaza(){
    var el = ensurePlaza();
    el.hidden = !plazaOn;
    var host = root();
    if(host) host.classList.toggle('is-plaza-page', !!plazaPage && plazaOn);
    el.classList.toggle('is-sheet', !plazaPage && sheetLayout());
    if(plazaPage) clearFrame(el);
    else if(!el.__frameDrag) applyFrame(el, PLAZA, 480, 280);
    if(!plazaOn) return;
    labelPlaza(el);
    var lead = el.querySelector('.st-plaza-lead');
    if(lead) lead.textContent = t({ship:'shipLead', job:'jobLead', roam:'roamLead'}[plazaTab] || 'plazaLead');
    el.querySelectorAll('[data-plaza]').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-plaza')===plazaTab); });
    el.querySelectorAll('[data-pane]').forEach(function(pane){ pane.hidden = pane.getAttribute('data-pane')!==plazaTab; });
    paintFault(el);
    fillPeople();
    fillChat();
    fillPosts();
  }
  function ensurePlaza(){
    var el = document.getElementById('stPlaza');
    if(el) return el;
    el = document.createElement('section');
    el.id = 'stPlaza';
    el.className = 'st-plaza st-dock';
    el.hidden = true;
    el.innerHTML = plazaHtml();
    root().appendChild(el);
    bindFrame(el, {key:PLAZA, minW:480, minH:280, bar:'.st-plaza-head', sheet:true});
    el.addEventListener('input', function(ev){
      var node = ev.target;
      if(!plazaFault || !node) return;
      if(node.name!==plazaFault && !(plazaFault==='chat' && node.id==='stChatInput')) return;
      plazaFault = '';
      plazaErr = '';
      paintPlaza();
    });
    el.addEventListener('click', function(ev){
      var node = ev.target && ev.target.nodeType===1 ? ev.target : (ev.target && ev.target.parentElement);
      if(!node || !node.closest) return;
      var missionPick = node.closest('[data-mission]');
      if(missionPick && el.contains(missionPick)){
        var missionBox = missionPick.closest('.st-ship-find');
        if(missionBox) chooseMission(missionBox.querySelector('input'), missionPick.getAttribute('data-mission'));
        return;
      }
      var chosen = node.closest('[data-ship]');
      if(chosen && el.contains(chosen)){
        var shipBox = chosen.closest('.st-ship-find');
        if(shipBox) chooseShip(shipBox.querySelector('input'), chosen.getAttribute('data-ship'));
        return;
      }
      var pick = node.closest('[data-pick]');
      if(pick && el.contains(pick)){
        var dd = pick.closest('.st-plaza-dd');
        var input = dd.querySelector('input');
        if(input) input.value = pick.getAttribute('data-pick')||'';
        if(input && input.name==='contactKind'){
          var typed = input.closest('label') && input.closest('label').querySelector('[name="contact"]');
          if(typed) typed.setAttribute('data-ph', contactPh(input.value));
        }
        var list = dd.querySelector('.st-dd-list');
        if(list) list.hidden = true;
        labelPlaza(el);
        return;
      }
      var opener = node.closest('.st-dd-btn');
      if(opener && el.contains(opener)){
        var menu = opener.parentElement.querySelector('.st-dd-list');
        var was = menu && menu.hidden;
        el.querySelectorAll('.st-dd-list').forEach(function(n){ n.hidden = true; });
        if(menu && was) menu.hidden = false;
        return;
      }
      var tab = node.closest('[data-plaza]');
      if(tab && el.contains(tab)){ plazaTab = tab.getAttribute('data-plaza'); plazaErr=''; plazaFault=''; paintPlaza(); return; }
      if(node.closest('.st-plaza-x')){
        if(plazaPage){ location.href = location.origin+location.pathname; return; }
        plazaOn = false; el.hidden = true; return;
      }
      var fly = node.closest('[data-fly]');
      if(fly && fly.getAttribute('data-fly') && window.__stCtl && window.__stCtl.focusId) window.__stCtl.focusId(fly.getAttribute('data-fly'));
      var act = node.closest('[data-act]');
      if(!act || !el.contains(act)) return;
      var name = act.getAttribute('data-act');
      if(name==='fly' && window.__stCtl && window.__stCtl.focusId) window.__stCtl.focusId(act.getAttribute('data-place'));
      if(name==='page'){
        var pageUrl = location.origin+location.pathname+(plazaPage ? '' : '?view=plaza'+(linkedPost ? '&post='+linkedPost : (pendingPost ? '&post='+pendingPost : '')));
        if(plazaPage){ location.href = pageUrl; return; }
        var opened = window.open(pageUrl, '_blank', 'noopener');
        if(!opened) location.href = pageUrl;
        return;
      }
      if(name==='copy') copyContact(act.getAttribute('data-copy')||'', act);
      if(name==='link') copyPostLink(act.getAttribute('data-id'), act);
      if(name==='clear') clearBoard(act.getAttribute('data-id'));
    });
    el.querySelectorAll('[data-plaza]').forEach(function(b){
      b.onclick = function(ev){ ev.preventDefault(); plazaTab = b.getAttribute('data-plaza'); plazaErr=''; plazaFault=''; paintPlaza(); };
    });
    el.querySelector('#stLobbyOn').onclick = function(){ setLobby(!plazaMineOn); };
    el.querySelector('#stLobbyHere').onclick = function(){
      var place = lobbyPlaceBody();
      if(!place.code){ plazaErr = t('plazaNeed'); plazaFault = ''; paintPlaza(); return; }
      setLobby(true, place);
    };
    el.querySelector('#stChatForm').onsubmit = function(ev){ ev.preventDefault(); sendChat(); };
    el.querySelectorAll('.st-post-form').forEach(function(form){
      form.onsubmit = function(ev){ ev.preventDefault(); sendBoard(form); };
    });
    el.querySelectorAll('.st-ship-list').forEach(function(list){
      list.addEventListener('mousedown', function(ev){ ev.preventDefault(); });
    });
    el.querySelectorAll('.st-ship-find input').forEach(function(input){
      var mission = input.parentElement.getAttribute('data-find')==='mission';
      var shown = mission ? missionShown : shipShown;
      var paint = mission ? paintMissionList : paintShipList;
      var choose = mission ? chooseMission : chooseShip;
      var attr = mission ? 'data-mission' : 'data-ship';
      input.addEventListener('input', function(){
        var canon = input.getAttribute('data-canon')||'';
        if(canon && shown(canon)!==input.value) input.removeAttribute('data-canon');
        paint(input);
        if(!mission) paintShipFit(input);
      });
      input.addEventListener('focus', function(){ paint(input); });
      input.addEventListener('keydown', function(ev){
        var list = input.parentElement.querySelector('.st-dd-list');
        var items = list ? Array.prototype.slice.call(list.querySelectorAll('button')) : [];
        if(ev.key==='Escape'){ if(list) list.hidden = true; return; }
        if(!list || list.hidden || !items.length) return;
        var cur = -1;
        items.forEach(function(b,i){ if(b.classList.contains('on')) cur = i; });
        if(ev.key==='ArrowDown' || ev.key==='ArrowUp'){
          ev.preventDefault();
          var next = ev.key==='ArrowDown' ? (cur+1)%items.length : (cur<=0 ? items.length-1 : cur-1);
          items.forEach(function(b,i){ b.classList.toggle('on', i===next); });
          if(items[next].scrollIntoView) items[next].scrollIntoView({block:'nearest'});
        }
        if(ev.key==='Enter'){
          ev.preventDefault();
          choose(input, items[cur>=0?cur:0].getAttribute(attr));
        }
      });
    });
    return el;
  }
  function setLobby(on, place){
    var body = place || (on ? lobbyPlaceBody() : {});
    body.on = !!on;
    plazaErr = '';
    plazaFault = '';
    api('/api/lobby', {method:'POST', body:body}).then(takePlaza).catch(fail);
  }
  function sendChat(){
    var input = document.getElementById('stChatInput');
    var text = input ? input.value.trim() : '';
    if(!text){ plazaErr = t('chatEmpty'); plazaFault = 'chat'; paintPlaza(); return; }
    plazaErr = '';
    plazaFault = '';
    api('/api/lobby/chat', {method:'POST', body:{body:text}}).then(function(d){
      if(input) input.value = '';
      takePlaza(d);
    }).catch(function(e){
      plazaErr = e && e.body && e.body.error==='fast' ? t('chatFast') : (e && e.body && e.body.error==='empty' ? t('chatEmpty') : t('errNet'));
      plazaFault = e && e.body && e.body.error==='empty' ? 'chat' : '';
      paintPlaza();
    });
  }
  function formValue(form, name){
    var node = form.elements[name];
    if(!node) return '';
    if(node.type==='checkbox') return !!node.checked;
    return node.value;
  }
  function speechFace(id){
    var key = {zh:'speechZh', en:'speechEn', other:'speechOther'}[id];
    return t(key || 'speechAny');
  }
  function contactFace(kind){
    var key = {spectrum:'contactSpectrum', qq:'contactQq', wechat:'contactWechat', discord:'contactDiscord', telegram:'contactTelegram', kook:'contactKook', heibox:'contactHeibox', whatsapp:'contactWhatsapp', mail:'contactMail'}[kind];
    return key ? t(key) : '';
  }
  function contactPh(kind){
    return {spectrum:'contactPhSpectrum', qq:'contactPhQq', wechat:'contactPhWechat', discord:'contactPhDiscord', telegram:'contactPhTelegram', kook:'contactPhKook', heibox:'contactPhHeibox', whatsapp:'contactPhWhatsapp', mail:'contactPhMail'}[kind] || 'contactPhSpectrum';
  }
  function contactUrl(raw){
    var text = String(raw||'').trim();
    if(!/^https?:\/\//i.test(text) || /\s/.test(text)) return null;
    try{
      var url = new URL(text);
      if(url.username || url.password || url.port) return null;
      if(url.protocol!=='http:' && url.protocol!=='https:') return null;
      url.host = url.hostname.toLowerCase().replace(/^www\./, '');
      return url;
    }catch(e){ return null; }
  }
  function contactPath(url){
    return url.pathname.split('/').filter(Boolean);
  }
  function contactCode(text){
    return /^[A-Za-z0-9]{4,24}$/.test(text) ? text : '';
  }
  function contactLink(kind, raw){
    var text = String(raw||'').trim();
    if(kind==='heibox' && /^(?=.*[a-z])(?=.*\d)[a-z0-9]{6,10}$/.test(text)) return 'https://chat.xiaoheihe.cn/'+text;
    var url = contactUrl(text);
    if(!url) return null;
    var host = url.hostname.toLowerCase().replace(/^www\./, '');
    var seg = contactPath(url);
    if(kind==='heibox'){
      if(host==='chat.xiaoheihe.cn' && seg.length===1 && /^[A-Za-z0-9]{4,16}$/.test(seg[0])) return 'https://chat.xiaoheihe.cn/'+seg[0];
      return '';
    }
    if(kind==='kook'){
      if((host==='kook.top' || host==='kook.vip') && seg.length===1 && /^[A-Za-z0-9]{4,16}$/.test(seg[0])) return 'https://kook.top/'+seg[0];
      if(host==='kookapp.cn' && seg.length>=2 && seg[seg.length-2]==='invite' && /^[A-Za-z0-9]{4,16}$/.test(seg[seg.length-1])) return 'https://kook.top/'+seg[seg.length-1];
      return '';
    }
    if(kind==='discord'){
      var code = host==='discord.gg' && seg.length===1 ? seg[0] : ((host==='discord.com' || host==='discordapp.com') && seg.length===2 && seg[0]==='invite' ? seg[1] : '');
      if(/^(?=.*[A-Za-z0-9])[A-Za-z0-9-]{2,32}$/.test(code)) return 'https://discord.gg/'+code;
      return '';
    }
    if(kind==='qq'){
      var q = host==='qm.qq.com' && seg[0]==='q' ? seg[1] : '';
      if(!q && (host==='qm.qq.com' || host==='jq.qq.com')) q = url.searchParams.get('k')||'';
      return contactCode(q) ? 'https://qm.qq.com/q/'+q : '';
    }
    if(kind==='telegram'){
      if(host!=='t.me' && host!=='telegram.me') return '';
      if(seg.length===1 && seg[0].charAt(0)==='+'){
        var plus = seg[0].slice(1);
        return /^[A-Za-z0-9_-]{8,32}$/.test(plus) ? 'https://t.me/+'+plus : '';
      }
      if(seg.length===2 && seg[0]==='joinchat' && /^[A-Za-z0-9_-]{8,32}$/.test(seg[1])) return 'https://t.me/joinchat/'+seg[1];
      if(seg.length===1 && /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(seg[0])) return seg[0];
      return '';
    }
    if(kind==='whatsapp'){
      if(host==='chat.whatsapp.com' && seg.length===1 && /^[A-Za-z0-9]{10,32}$/.test(seg[0])) return 'https://chat.whatsapp.com/'+seg[0];
      if(host==='wa.me' && seg.length===1) return seg[0].replace(/\D/g, '');
      if(host==='api.whatsapp.com' && seg[0]==='send') return String(url.searchParams.get('phone')||'').replace(/\D/g, '');
      return '';
    }
    return null;
  }
  function contactNorm(kind, raw){
    var text = String(raw||'').trim().replace(/\s+/g, ' ');
    var linked = contactLink(kind, text);
    if(linked==='') return '';
    if(linked && linked.indexOf('https://')===0) return linked;
    if(linked) text = linked;
    if(kind==='telegram' || kind==='discord') text = text.replace(/^@+/, '');
    if(kind==='qq') text = text.replace(/\s+/g, '');
    if(kind==='whatsapp' && text.indexOf('https://')!==0){
      var lead = text.trim().charAt(0)==='+' ? '+' : '';
      text = lead + text.replace(/\D/g, '');
    }
    if(kind==='mail') text = text.toLowerCase();
    if(kind==='spectrum') return /^[\w.\- \u4e00-\u9fff]{2,40}$/.test(text) && /[\w\u4e00-\u9fff]/.test(text) ? text : '';
    if(kind==='qq') return /^[1-9]\d{4,10}$/.test(text) ? text : '';
    if(kind==='wechat') return /^[A-Za-z][-_A-Za-z0-9]{5,19}$/.test(text) ? text : '';
    if(kind==='discord') return /^[A-Za-z0-9._]{2,32}(?:#\d{4})?$/.test(text) ? text : '';
    if(kind==='telegram') return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(text) ? text : '';
    if(kind==='kook') return /^(?:[A-Za-z0-9_]{2,32}(?:#\d{4})?|\d{5,12})$/.test(text) ? text : '';
    if(kind==='heibox'){
      var boxed = text.replace(/\s+/g, '');
      if(/^\d+$/.test(boxed)) text = boxed;
      return /^(?:\d{4,10}|(?=.*[A-Za-z\u4e00-\u9fff])[\w\u4e00-\u9fff·]{2,32})$/.test(text) ? text : '';
    }
    if(kind==='whatsapp') return /^\+?[1-9]\d{7,14}$/.test(text) ? text : '';
    if(kind==='mail') return /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(text) ? text : '';
    return '';
  }
  function contactHref(kind, value){
    if(/^https:\/\/(?:chat\.xiaoheihe\.cn|kook\.top|discord\.gg|qm\.qq\.com|t\.me|chat\.whatsapp\.com)\//.test(value)) return value;
    if(kind==='telegram') return 'https://t.me/'+value;
    if(kind==='mail') return 'mailto:'+value;
    if(kind==='whatsapp') return 'https://wa.me/'+String(value).replace(/^\+/, '');
    return '';
  }
  function contactShown(value){
    var m = String(value||'').match(/^https:\/\/[^/]+\/(.+)$/);
    if(!m) return value;
    try{ return decodeURIComponent(m[1]); }catch(e){ return m[1]; }
  }
  function contactHtml(p){
    if(!p || !p.contact || !contactFace(p.contactKind)) return '';
    var href = contactHref(p.contactKind, p.contact);
    var shown = contactShown(p.contact);
    var value = href ? '<a href="'+esc(href)+'" target="_blank" rel="noreferrer">'+esc(shown)+'</a>' : '<b>'+esc(shown)+'</b>';
    var meta = href && (p.contactKind==='discord' || p.contactKind==='kook') ? '<em class="st-invite-meta" hidden data-kind="'+esc(p.contactKind)+'" data-invite="'+esc(p.contact)+'"></em>' : '';
    return '<div class="st-post-contact"><span>'+esc(contactFace(p.contactKind))+'</span>'+value+'<button type="button" data-act="copy" data-copy="'+esc(p.contact)+'" data-k="postCopy"></button>'+meta+'</div>';
  }
  function serverFace(id){
    var key = {asia:'srvAsia', us:'srvUs', aus:'srvAus', eu:'srvEu'}[id];
    return key ? t(key) : (id||'');
  }
  function seatText(raw){
    var text = String(raw||'').trim().replace(/[－—–~～]/g,'-').replace(/\s+/g,'');
    if(!text) return '';
    var m = text.match(/^(\d{1,4})(?:-(\d{1,4}))?$/);
    if(!m) return null;
    var a = parseInt(m[1],10), b = m[2] ? parseInt(m[2],10) : a;
    if(a<1 || b>9999 || a>b) return null;
    return a===b ? String(a) : (a+'-'+b);
  }
  function sendBoard(form){
    var kind = form.getAttribute('data-kind');
    var mission = missionSend(form);
    var title = String(formValue(form, 'title')||'').trim();
    if(!title && mission) title = missionShown(mission) || mission;
    if(!title){ plazaErr = t('postNeed'); plazaFault = 'title'; paintPlaza(); return; }
    var place = lobbyPlaceBody();
    var seats = seatText(formValue(form, 'seats'));
    if(seats===null){ plazaErr = t('postSeatsBad'); plazaFault = 'seats'; paintPlaza(); return; }
    var contactKind = formValue(form, 'contactKind') || 'spectrum';
    var contact = contactNorm(contactKind, formValue(form, 'contact'));
    if(!contact){ plazaErr = t('contactNeed'); plazaFault = 'contact'; paintPlaza(); return; }
    plazaErr = '';
    plazaFault = '';
    api('/api/board', {method:'POST', body:{
      kind:kind, title:title, detail:formValue(form, 'detail')||'',
      seats:seats, server:formValue(form, 'server')||'', ship:shipSend(form), mission:mission,
      keep:parseInt(formValue(form, 'keep'),10)||0, standing:!!formValue(form, 'standing'),
      speech:formValue(form, 'speech')||'', contactKind:contactKind, contact:contact,
      place:place.code||'', name:place.location||'', system:place.system||'',
      at: 0
    }}).then(function(d){
      form.reset();
      form.querySelectorAll('[data-canon]').forEach(function(input){ input.removeAttribute('data-canon'); });
      form.querySelectorAll('.st-plaza-dd input').forEach(function(input){
        var back = input.getAttribute('data-default') || '';
        input.defaultValue = back;
        input.value = back;
      });
      form.querySelectorAll('[name="contact"]').forEach(function(input){
        input.setAttribute('data-ph', 'contactPhSpectrum');
      });
      var shipInput = form.querySelector('[name="ship"]');
      if(shipInput) paintShipFit(shipInput);
      takePlaza(d);
    }).catch(function(e){
      var err = e && e.body && e.body.error;
      plazaErr = err==='limit' ? t('postLimit') : err==='title' ? t('postNeed') : err==='seats' ? t('postSeatsBad') : err==='contact' ? t('contactNeed') : t('errNet');
      plazaFault = err==='title' ? 'title' : err==='seats' ? 'seats' : err==='contact' ? 'contact' : '';
      paintPlaza();
    });
  }
  function bringRaw(act){
    var card = act && act.closest ? act.closest('.st-post') : null;
    var input = card && card.querySelector('.st-bring');
    return input ? input.value : '';
  }
  function copyContact(text, btn){
    if(!text) return;
    var done = function(){ if(btn) btn.textContent = t('postCopy'); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
  }
  function shareLine(label, value){
    value = String(value==null ? '' : value).trim();
    if(!value) return '';
    var zh = lang()==='zh-Hans' || lang()==='zh-Hant';
    return label+(zh ? '：' : ': ')+value;
  }
  function contactShare(p){
    if(!p || !p.contact || !contactFace(p.contactKind)) return '';
    var href = contactHref(p.contactKind, p.contact);
    return contactFace(p.contactKind)+' '+(href || p.contact);
  }
  function postShare(p){
    var kind = {ship:'shipTab', job:'jobTab', roam:'roamTab'}[p.kind];
    var lines = [t('plaza')+' · '+t(kind || 'plaza')];
    if(p.title) lines.push(p.title);
    if(p.detail && p.detail!==p.title) lines.push('', p.detail);
    var facts = [
      shareLine(t('postBy'), p.nickname||''),
      shareLine(t('postMission'), missionFace(p.mission||'')),
      shareLine(t('postShip'), shipFace(p.ship||'')),
      shareLine(t('postPlace'), p.name ? placeFace(p.name) : ''),
      shareLine(t('postAt'), p.at ? rallyWhenLabel(p.at) : ''),
      shareLine(t('postSeats'), p.seats ? String(p.seats) : ''),
      shareLine(t('postServer'), serverFace(p.server||'')),
      shareLine(t('postSpeech'), speechFace(p.speech||'')),
      shareLine(t('postCrew'), p.standing ? t('postStanding') : t('postTemp')),
      shareLine(t('postContact'), contactShare(p)),
      p.expires ? dueText(p.expires) : ''
    ].filter(Boolean);
    if(facts.length) lines.push('', facts.join('\n'));
    lines.push('', location.origin+location.pathname+'?view=plaza&post='+p.id);
    return lines.join('\n');
  }
  function copyPostLink(id, btn){
    if(!/^[0-9a-f]+$/i.test(id||'')) return;
    var post = null;
    plazaPosts.forEach(function(p){ if(p && p.id===id) post = p; });
    var text = post ? postShare(post) : (location.origin+location.pathname+'?view=plaza&post='+id);
    var done = function(){
      if(!btn) return;
      btn.textContent = t('copied');
      setTimeout(function(){ if(btn.textContent===t('copied')) btn.textContent = t('postLink'); }, 1200);
    };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
  }
  function sendBoardRsvp(id, going, raw){
    var send = function(){
      api('/api/board/rsvp', {method:'POST', body:{id:id, going:!!going, note:going ? bringCanon(raw) : ''}}).then(takePlaza).catch(fail);
    };
    if(going && raw && !shipCat) shipCatalog().then(send).catch(send);
    else send();
  }
  function clearBoard(id){
    api('/api/board', {method:'POST', body:{clear:true, id:id}}).then(takePlaza).catch(fail);
  }
  function syncPlazaBtn(){
    var b = document.getElementById('sclmw-stPlaza');
    if(b){
      b.textContent = t('plaza');
      if(!b.__plaza){ b.__plaza = 1; b.onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); openPlaza(); }; }
    }
    if(plazaOn) paintPlaza();
  }
  window.__stLobbyOpen = function(p){
    if(p && p.place && window.__stCtl && window.__stCtl.focusId) window.__stCtl.focusId(p.place);
    openPlaza();
  };
  function start(){
    ensure();
    paint();
    if(pendingPost && !plazaPage) openPlaza();
    if(!window.__stRoomFit){
      window.__stRoomFit=function(){
        var host = root();
        if(host){
          var nodes = host.querySelectorAll('.st-sys,.st-cats,.st-tabs,.st-sbox');
          var origin = host.getBoundingClientRect().top, bottom = 0;
          for(var i=0;i<nodes.length;i++){
            var st = getComputedStyle(nodes[i]);
            if(st.display==='none' || st.visibility==='hidden') continue;
            var r = nodes[i].getBoundingClientRect();
            if(r.height>1 && r.width>1 && r.bottom>bottom) bottom = r.bottom;
          }
          if(bottom>origin) host.style.setProperty('--st-chrome', Math.ceil(bottom-origin)+'px');
        }
        var ui = ensure();
        if(ui.dock && !ui.dock.hidden) applyFrame(ui.dock, FRAME, 280, 220);
        if(ui.crew && !ui.crew.hidden) applyFrame(ui.crew, CREW, 220, 160);
        var plaza = document.getElementById('stPlaza');
        if(plaza && !plaza.hidden){
          plaza.classList.toggle('is-sheet', !plazaPage && sheetLayout());
          if(plazaPage) clearFrame(plaza);
          else if(!plaza.__frameDrag) applyFrame(plaza, PLAZA, 480, 280);
        }
      };
      window.addEventListener('resize', window.__stRoomFit);
      document.addEventListener('sclmw-shell', window.__stRoomFit);
      if(window.ResizeObserver) new ResizeObserver(window.__stRoomFit).observe(root());
      requestAnimationFrame(window.__stRoomFit);
    }
    bindCtx();
    if(!window.__stCastArm){
      window.__stCastArm = true;
      window.addEventListener('pointerdown', function(){ armCastAudio(); }, true);
    }
    if(!window.__stRoomLang){
      window.__stRoomLang=function(){
        if(document.getElementById('stGate')) paint();
        var box = document.getElementById('stSfx');
        if(box && !box.hidden) openStarfix();
      };
      document.addEventListener('sclmw-lang', window.__stRoomLang);
    }
    detect().then(function(ok){
      if(!ok){ statusMsg=t('errNet'); paint(); return; }
      var code = savedCode();
      if(token() && code) api('/api/rooms/'+encodeURIComponent(code)).then(function(st){ if(!roomKind) roomKind='saved'; take(st); }).catch(function(e){ if(e && e.status===403 && e.body && e.body.error==='rejected'){ noteDenied(code); return; } paint(); });
      if(!window.__stRoomPoll) window.__stRoomPoll=setInterval(function(){
        if(state) refresh();
        var gate = document.getElementById('stGate');
        if(gate && !gate.hidden) pullPublic(true);
      }, 8000);
      if(!window.__stAgeTick) window.__stAgeTick=setInterval(tickAges, 1000);
      if(!window.__stPlazaPoll) window.__stPlazaPoll=setInterval(function(){ if(plazaOn) pullPlaza(); }, 2000);
      if(!window.__stLinkWatch){
        window.__stLinkWatch = 1;
        armLinkWatch();
        document.addEventListener('visibilitychange', function(){
          if(document.hidden || !linkMiss || !entered) return;
          armLinkWatch();
        });
      }
    if(!window.__stDdClose){
      window.__stDdClose=function(e){ if(e.target.closest&&e.target.closest('.st-dd')) return; document.querySelectorAll('.st-dd-list').forEach(function(n){ n.hidden=true; }); };
      document.addEventListener('click', window.__stDdClose);
    }
    });
  }

  SC.room = {start:start, openStarfix:openStarfix};
})();
