// weather-v9.js — 从角色卡/正文读时间、地点、天气 + 24小时 + 日历
(function () {
  'use strict';

  const MOD = window.sillyPhone;
  if (!MOD) { console.error('[天气] 未找到 sillyPhone 宿主'); return; }

  const parentDoc = window.parent.document;
  const shadow    = MOD.shadow;

  /* ============================================================
   * 一、数据源：SeseLedgerAPI 表格
   * ============================================================ */
  function getLedgerApi() {
    try {
      const w = window.parent || window;
      if (w.SeseLedgerAPI) return w.SeseLedgerAPI.__legacyFace || w.SeseLedgerAPI;
      if (w.AutoCardUpdaterAPI) return w.AutoCardUpdaterAPI;
    } catch (e) {}
    return null;
  }
  function readGlobalTable() {
    const out = { time: '', location: '' };
    const api = getLedgerApi();
    if (!api || typeof api.exportTableAsJson !== 'function') return out;
    try {
      const data = api.exportTableAsJson();
      for (const key of Object.keys(data)) {
        const t = data[key];
        if (!t || t.name !== '全局数据表' || !Array.isArray(t.content)) continue;
        const header = t.content[0] || [];
        const row    = t.content[1] || [];
        const get = (col) => { const i = header.indexOf(col); return i >= 0 ? String(row[i] ?? '').trim() : ''; };
        out.time     = get('当前时间');
        out.location = get('当前详细地点') || get('当前地点');
        break;
      }
    } catch (e) {}
    return out;
  }

  /* ============================================================
   * 二、数据源：最近 AI 消息正则解析
   * ============================================================ */
  const WEATHER_WORDS = [
    '雷阵雨','暴雨','大雨','中雨','小雨','阵雨','雨夹雪',
    '大雪','中雪','小雪','暴雪',
    '台风','冰雹','沙尘','扬沙','霾','雾','大风','晴','多云','阴',
    '温暖','炎热','寒冷','凉爽'
  ];
  function parseFromMessages() {
    const out = { time: '', location: '', weather: '', temp: '' };
    try {
      const th = (window.parent && window.parent.TavernHelper) || window.TavernHelper;
      if (!th || typeof th.getChatMessages !== 'function') return out;
      const lastId = (typeof th.getLastMessageId === 'function') ? th.getLastMessageId() : -1;
      if (typeof lastId !== 'number' || lastId < 0) return out;
      const startId = Math.max(0, lastId - 25);
      const msgs = th.getChatMessages(`${startId}-${lastId}`, { role: 'assistant' }) || [];
      for (let i = msgs.length - 1; i >= 0; i--) {
        const text = String(msgs[i] && msgs[i].message || '');
        if (!text) continue;
        if (!out.time) {
          const t1 = text.match(/(\d{4})\s*[年\-\/\.]\s*(\d{1,2})\s*[月\-\/\.]\s*(\d{1,2})\s*[日号]?\s*(\d{1,2})[:：](\d{2})/);
          if (t1) out.time = `${t1[1]}年${+t1[2]}月${+t1[3]}日 ${t1[4].padStart(2,'0')}:${t1[5]}`;
          else {
            const t2 = text.match(/(\d{4})\s*[年\-\/\.]\s*(\d{1,2})\s*[月\-\/\.]\s*(\d{1,2})\s*[日号]?/);
            if (t2) out.time = `${t2[1]}年${+t2[2]}月${+t2[3]}日`;
          }
        }
        if (!out.weather) for (const w of WEATHER_WORDS) if (text.includes(w)) { out.weather = w; break; }
        if (!out.temp) {
          const tm = text.match(/(-?\d{1,2})\s*(?:°|℃|度)/);
          if (tm) { const n = parseInt(tm[1], 10); if (n > -40 && n < 60) out.temp = n + '°'; }
        }
        if (!out.location) {
          const loc = text.match(/(?:在|来到|走进|位于|地点[:：]|当前地点[:：])\s*([\u4e00-\u9fa5]{2,12}(?:市|区|县|镇|村|路|街|室|间|厅|房|府|院|馆|楼|店|山|河|湖|海|岛|林|园|桥|巷|门|站|场|咖啡馆|餐厅|酒吧|公寓|别墅|学校|医院))/);
          if (loc) out.location = loc[1];
        }
        if (out.time && out.weather && out.temp && out.location) break;
      }
    } catch (e) {}
    return out;
  }

  /* ============================================================
   * 三、天气映射
   * ============================================================ */
  const WEATHER_MAP = [
    { key: '雷阵雨', emoji: '⛈️', label: '雷阵雨', bg: 'linear-gradient(135deg,#4A4A6A,#7A6A8A)', temp: 22 },
    { key: '暴雨',   emoji: '⛈️', label: '暴雨',   bg: 'linear-gradient(135deg,#3D4E63,#5E7285)', temp: 18 },
    { key: '大雨',   emoji: '🌧️', label: '大雨',   bg: 'linear-gradient(135deg,#556B85,#7A8FA6)', temp: 19 },
    { key: '中雨',   emoji: '🌧️', label: '中雨',   bg: 'linear-gradient(135deg,#6E93B5,#95A9BD)', temp: 20 },
    { key: '小雨',   emoji: '🌦️', label: '小雨',   bg: 'linear-gradient(135deg,#8FB8D8,#B0C4D8)', temp: 21 },
    { key: '阵雨',   emoji: '🌦️', label: '阵雨',   bg: 'linear-gradient(135deg,#8FB8D8,#B0C4D8)', temp: 21 },
    { key: '雨夹雪', emoji: '🌨️', label: '雨夹雪', bg: 'linear-gradient(135deg,#B8C8D8,#DDE7F0)', temp: 2 },
    { key: '暴雪',   emoji: '❄️', label: '暴雪',   bg: 'linear-gradient(135deg,#B0C4D8,#DDE7F0)', temp: -5 },
    { key: '大雪',   emoji: '❄️', label: '大雪',   bg: 'linear-gradient(135deg,#B0C4D8,#DDE7F0)', temp: -3 },
    { key: '中雪',   emoji: '❄️', label: '中雪',   bg: 'linear-gradient(135deg,#C8D8E8,#E8EFF5)', temp: 0 },
    { key: '小雪',   emoji: '🌨️', label: '小雪',   bg: 'linear-gradient(135deg,#D8E5F0,#F0F5FA)', temp: 2 },
    { key: '台风',   emoji: '🌀', label: '台风',   bg: 'linear-gradient(135deg,#586478,#8898A8)', temp: 24 },
    { key: '冰雹',   emoji: '🧊', label: '冰雹',   bg: 'linear-gradient(135deg,#A0B0C0,#C8D8E5)', temp: 8 },
    { key: '沙尘',   emoji: '🌪️', label: '沙尘',   bg: 'linear-gradient(135deg,#C8B490,#E0D0B0)', temp: 20 },
    { key: '扬沙',   emoji: '🌪️', label: '扬沙',   bg: 'linear-gradient(135deg,#C8B490,#E0D0B0)', temp: 20 },
    { key: '霾',     emoji: '🌫️', label: '霾',     bg: 'linear-gradient(135deg,#A89E8E,#C8BFAF)', temp: 15 },
    { key: '雾',     emoji: '🌫️', label: '雾',     bg: 'linear-gradient(135deg,#B8BCC2,#D5D8DC)', temp: 12 },
    { key: '大风',   emoji: '💨', label: '大风',   bg: 'linear-gradient(135deg,#A8BCC8,#D0DDE5)', temp: 17 },
    { key: '晴',     emoji: '☀️', label: '晴朗',   bg: 'linear-gradient(135deg,#87CEEB,#FFD580)', temp: 24 },
    { key: '多云',   emoji: '⛅', label: '多云',   bg: 'linear-gradient(135deg,#A8C8E8,#D5DCE5)', temp: 22 },
    { key: '阴',     emoji: '☁️', label: '阴',     bg: 'linear-gradient(135deg,#9CA3AF,#C7CCD1)', temp: 20 },
    { key: '温暖',   emoji: '🌤️', label: '温暖',   bg: 'linear-gradient(135deg,#FFD580,#FFA76B)', temp: 25 },
    { key: '炎热',   emoji: '🔥', label: '炎热',   bg: 'linear-gradient(135deg,#FF9A76,#FF6F61)', temp: 35 },
    { key: '寒冷',   emoji: '🥶', label: '寒冷',   bg: 'linear-gradient(135deg,#7FB8D8,#B0D4E8)', temp: 3 },
    { key: '凉爽',   emoji: '🌤️', label: '凉爽',   bg: 'linear-gradient(135deg,#A8D8C8,#D0E8E0)', temp: 18 }
  ];
  const pickWeather = (raw) => WEATHER_MAP.find(w => raw && raw.includes(w.key)) || WEATHER_MAP.find(w => w.key === '多云');
  const hashOf = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); };

  /* ============================================================
   * 四、日期解析
   * ============================================================ */
  function parseDateInfo(timeStr) {
    const now = new Date();
    const r = {
      year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(),
      weekday: now.getDay(), hour: now.getHours(), minute: now.getMinutes(),
      valid: false
    };
    if (!timeStr) return r;
    const m = String(timeStr).match(/(\d{4})\D*?(\d{1,2})\D*?(\d{1,2})(?:\D*?(\d{1,2})\D*?(\d{2}))?/);
    if (m) {
      r.year = +m[1]; r.month = +m[2]; r.day = +m[3];
      if (m[4] != null && m[4] !== '') r.hour = +m[4];
      if (m[5] != null && m[5] !== '') r.minute = +m[5];
      r.weekday = new Date(r.year, r.month - 1, r.day).getDay();
      r.valid = true;
    }
    return r;
  }

  /* ============================================================
   * 五、构造数据
   * ============================================================ */
  function buildWeatherData() {
    const tbl = readGlobalTable();
    const msg = parseFromMessages();
    const time = tbl.time || msg.time || '';
    const loc  = tbl.location || msg.location || '未知地点';
    const rawW = msg.weather || '多云';
    const w    = pickWeather(rawW);
    const tempNum = msg.temp ? parseInt(msg.temp, 10) : w.temp;
    const tempStr = tempNum + '°';
    const hi = tempNum + Math.round(2 + (hashOf(rawW) % 4));
    const lo = tempNum - Math.round(3 + (hashOf(loc) % 4));
    const isRain = /雨/.test(rawW), isSnow = /雪/.test(rawW);
    const isSunny = /晴/.test(rawW) || rawW === '温暖' || rawW === '炎热';
    const humidity = isRain ? 75 + (hashOf(loc) % 20) : isSnow ? 60 + (hashOf(loc) % 15) : isSunny ? 30 + (hashOf(loc) % 15) : 55 + (hashOf(loc) % 15);
    const wind = 3 + (hashOf(loc + 'w') % 12);
    const uv   = isSunny ? 5 + (hashOf(loc + 'u') % 4) : /云|阴/.test(rawW) ? 2 + (hashOf(loc + 'u') % 2) : 1;
    const trend = [
      { tag: '上午', emoji: isRain ? '🌧️' : isSunny ? '☀️' : '⛅', lo: tempNum - 1, hi: tempNum + 2 },
      { tag: '下午', emoji: isRain ? '🌧️' : isSnow ? '🌨️' : isSunny ? '☀️' : '⛅', lo: tempNum, hi: tempNum + 3 },
      { tag: '晚上', emoji: isSnow ? '🌨️' : '🌙', lo: tempNum - 2, hi: tempNum + 1 }
    ];
    return { time, loc, rawW, w, tempStr, tempNum, hi, lo, humidity, wind, uv, trend, desc: buildDesc(rawW, tempNum, isRain, isSnow, isSunny) };
  }
  function buildDesc(w, t, isRain, isSnow, isSunny) {
    if (isRain) return `外面正在下${w}，记得带伞，路面湿滑小心行走。`;
    if (isSnow) return `雪还在下，出门注意保暖，路上可能结冰。`;
    if (w === '雾' || w === '霾') return `能见度较低，出门注意安全，尽量少在户外逗留。`;
    if (w === '沙尘' || w === '扬沙') return `空气中浮尘较多，外出建议戴口罩。`;
    if (isSunny && t >= 30) return `阳光很烈，注意防晒补水，避免长时间暴晒。`;
    if (isSunny) return `阳光正好，微风不燥，愿你有美好的一天。`;
    if (w === '大风' || w === '台风') return `风有点大，外出留意高空坠物和沿途广告牌。`;
    return `天气还算舒服，适合出门走走。`;
  }

  // 24小时天气
  function build24h(d) {
    const dateInfo = parseDateInfo(d.time);
    const baseTemp = d.tempNum;
    const raw = d.rawW;
    const arr = [];
    for (let i = 0; i < 24; i++) {
      const h = (dateInfo.hour + i) % 24;
      const hh = String(h).padStart(2, '0') + ':00';
      const hash = hashOf('24h-' + dateInfo.year + dateInfo.month + dateInfo.day + h);
      // 温度曲线：凌晨最低、下午最高
      const curve = Math.sin((h - 6) / 24 * Math.PI * 2) * 4;
      const temp = Math.round(baseTemp + curve + (hash % 3 - 1));
      const isNight = h < 6 || h >= 19;
      let emoji;
      if (/雨/.test(raw)) emoji = isNight ? '🌧️' : '🌧️';
      else if (/雪/.test(raw)) emoji = '🌨️';
      else if (/晴/.test(raw) || raw === '温暖' || raw === '炎热') emoji = isNight ? '🌙' : '☀️';
      else if (isNight) emoji = '🌙';
      else emoji = '⛅';
      arr.push({ h, hh, temp, emoji, isNow: i === 0 });
    }
    return arr;
  }

  // 日历数据
  function buildCalendar(dateInfo, view) {
    const y = dateInfo.year, m = dateInfo.month, today = dateInfo.day;
    if (view === 'day') {
      // 本周：从周日到周六
      const weekdays = ['日','一','二','三','四','五','六'];
      const base = new Date(y, m - 1, today);
      const sunday = new Date(base); sunday.setDate(base.getDate() - base.getDay());
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(sunday); d.setDate(sunday.getDate() + i);
        days.push({ name: weekdays[d.getDay()], num: d.getDate(), isToday: d.getDate() === today && d.getMonth() === m - 1 && d.getFullYear() === y });
      }
      return { kind: 'week', days };
    }
    if (view === 'month') {
      // 当前月网格 + 下月预览
      const firstDay = new Date(y, m - 1, 1);
      const firstWeekday = firstDay.getDay();
      const daysInMonth = new Date(y, m, 0).getDate();
      const daysInPrev = new Date(y, m - 1, 0).getDate();
      const cells = [];
      // 上月补位
      for (let i = firstWeekday - 1; i >= 0; i--) cells.push({ num: daysInPrev - i, muted: true });
      // 本月
      for (let d = 1; d <= daysInMonth; d++) cells.push({ num: d, muted: false, isToday: d === today });
      // 下月补位（填满 6 行）
      while (cells.length % 7 !== 0) cells.push({ num: cells.length - firstWeekday - daysInMonth + 1, muted: true });
      // 下月
      const nextM = m === 12 ? 1 : m + 1;
      const nextY = m === 12 ? y + 1 : y;
      const nextDaysInMonth = new Date(nextY, nextM, 0).getDate();
      const nextCells = [];
      const nextFirstWeekday = new Date(nextY, nextM - 1, 1).getDay();
      for (let i = 0; i < nextFirstWeekday; i++) nextCells.push({ num: new Date(nextY, nextM - 1, 0).getDate() - nextFirstWeekday + 1 + i, muted: true });
      for (let d = 1; d <= nextDaysInMonth; d++) nextCells.push({ num: d, muted: false });
      return { kind: 'month', cells, next: { y: nextY, m: nextM, cells: nextCells } };
    }
    // year：12 个小卡片
    const months = [];
    for (let mm = 1; mm <= 12; mm++) {
      const dim = new Date(y, mm, 0).getDate();
      const fw = new Date(y, mm - 1, 1).getDay();
      const cells = [];
      for (let i = 0; i < fw; i++) cells.push({ num: 0 });
      for (let d = 1; d <= dim; d++) cells.push({ num: d, isToday: mm === m && d === today });
      months.push({ m: mm, cells });
    }
    return { kind: 'year', months };
  }

  /* ============================================================
   * 六、样式
   * ============================================================ */
  const STYLE_ID = 'silly-weather-style';
  function injectStyle() {
    if (shadow.querySelector('#' + STYLE_ID)) return;
    const s = parentDoc.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .wx-wrap { position:absolute; inset:0; background:#eef1f6; display:flex; flex-direction:column; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif; color:#3b4a68; }
      .wx-head { height:50px; display:flex; align-items:center; padding:0 12px; background:#fff; border-bottom:1px solid #e5e8ee; flex-shrink:0; }
      .wx-back { width:36px; height:36px; border:none; background:transparent; font-size:18px; color:#5b6b8c; cursor:pointer; border-radius:8px; }
      .wx-back:active { background:#f0f2f7; }
      .wx-title { flex:1; text-align:center; font-weight:600; font-size:16px; color:#2f3b55; }
      .wx-head-right { width:36px; display:flex; justify-content:flex-end; }
      .wx-body { flex:1; min-height:0; overflow-y:auto; padding:14px 14px 76px; scrollbar-width:none; }
      .wx-body::-webkit-scrollbar { display:none; }

      /* 天气卡片 */
      .wx-card { border-radius:20px; padding:20px; color:#fff; box-shadow:0 8px 24px rgba(60,90,140,.18); position:relative; overflow:hidden; }
      .wx-card-top { display:flex; justify-content:space-between; align-items:flex-start; }
      .wx-city { font-size:16px; font-weight:600; opacity:.95; }
      .wx-city small { display:block; font-size:11px; opacity:.75; font-weight:400; margin-top:2px; }
      .wx-wlabel { font-size:12px; padding:3px 10px; border-radius:999px; background:rgba(255,255,255,.25); }
      .wx-main { display:flex; align-items:center; justify-content:space-between; margin-top:6px; }
      .wx-temp { font-size:64px; font-weight:300; letter-spacing:-2px; line-height:1; }
      .wx-emoji { font-size:56px; line-height:1; filter:drop-shadow(0 4px 8px rgba(0,0,0,.15)); }
      .wx-range { font-size:13px; opacity:.85; margin-top:6px; }
      .wx-desc { margin-top:14px; font-size:13px; line-height:1.6; background:rgba(255,255,255,.16); padding:10px 12px; border-radius:12px; }
      .wx-metrics { display:flex; gap:8px; margin-top:12px; font-size:11.5px; }
      .wx-metric { flex:1; background:rgba(255,255,255,.18); border-radius:10px; padding:8px; text-align:center; }
      .wx-metric b { display:block; font-size:14px; margin-top:2px; font-weight:600; }

      .wx-sec { margin-top:16px; }
      .wx-sec-title { font-size:14px; font-weight:600; color:#3b4a68; margin-bottom:10px; }
      .wx-trend { background:#fff; border-radius:16px; padding:14px 8px; display:flex; box-shadow:0 2px 8px rgba(60,90,140,.06); }
      .wx-tcell { flex:1; text-align:center; color:#3b4a68; }
      .wx-tcell + .wx-tcell { border-left:1px solid #eef1f6; }
      .wx-tcell .lbl { font-size:11.5px; color:#8b97b3; }
      .wx-tcell .ico { font-size:24px; margin:6px 0; }
      .wx-tcell .rng { font-size:12px; }

      /* 24小时 */
      .wx-24h { display:flex; overflow-x:auto; gap:8px; padding:2px; scrollbar-width:none; }
      .wx-24h::-webkit-scrollbar { display:none; }
      .wx-24h-cell { flex:none; width:56px; text-align:center; padding:10px 4px; background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(60,90,140,.06); }
      .wx-24h-cell .t { font-size:11px; color:#8b97b3; }
      .wx-24h-cell .e { font-size:22px; margin:6px 0; }
      .wx-24h-cell .v { font-size:12px; color:#3b4a68; font-weight:600; }
      .wx-24h-cell.now { background:linear-gradient(180deg,#FFE0EC,#FFC7DA); }
      .wx-24h-cell.now .t { color:#B23D6A; font-weight:600; }
      .wx-24h-cell.now .v { color:#B23D6A; }

      .wx-foot { text-align:center; font-size:11px; color:#9aa5bd; padding:14px 0 6px; }

      /* ==================== 日历 ==================== */
      .cal-wrap { position:absolute; inset:0; top:50px; bottom:0; overflow-y:auto; padding:14px 14px 76px; background:linear-gradient(180deg,#FFF5F8 0%,#F2F7FF 100%); display:none; scrollbar-width:none; }
      .cal-wrap::-webkit-scrollbar { display:none; }
      .cal-wrap.active { display:block; }
      .cal-viewswitch { display:flex; gap:2px; background:#F0E7EE; border-radius:10px; padding:2px; }
      .cal-vbtn { border:none; background:transparent; padding:4px 10px; font-size:12px; color:#A08F9B; border-radius:8px; cursor:pointer; font-family:inherit; }
      .cal-vbtn.on { background:#fff; color:#FF6B8F; font-weight:600; box-shadow:0 1px 3px rgba(255,107,143,.2); }

      /* 周视图 */
      .cal-week-card { background:#fff; border-radius:18px; padding:16px 12px 14px; margin-bottom:14px; box-shadow:0 4px 16px rgba(255,140,175,.08); }
      .cal-week-top { display:flex; justify-content:space-between; align-items:center; padding:0 4px 10px; }
      .cal-week-title { font-size:13px; font-weight:600; color:#5C4D5C; }
      .cal-week-nav { color:#C9B8C4; font-size:14px; letter-spacing:4px; }
      .cal-week-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
      .cal-day { text-align:center; padding:8px 2px; border-radius:14px; position:relative; transition:.2s; }
      .cal-day .n { font-size:11px; color:#A08F9B; font-weight:500; }
      .cal-day .d { font-size:16px; font-weight:600; color:#3B2E38; margin-top:3px; }
      .cal-day.today { background:linear-gradient(180deg,#FFB0C8,#FF7FA0); box-shadow:0 4px 12px rgba(255,107,143,.35); }
      .cal-day.today .n { color:rgba(255,255,255,.85); }
      .cal-day.today .d { color:#fff; }

      /* 今日日程 */
      .cal-today-card { background:#fff; border-radius:18px; padding:16px; box-shadow:0 4px 16px rgba(255,140,175,.08); }
      .cal-today-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
      .cal-today-title { font-size:15px; font-weight:700; color:#3B2E38; }
      .cal-today-title b { color:#FF6B8F; }
      .cal-today-add { font-size:12px; color:#FF6B8F; border:1px solid #FFD3E0; background:#FFF5F8; padding:5px 12px; border-radius:999px; cursor:pointer; }
      .cal-today-add:active { background:#FFE4ED; }
      .cal-empty { text-align:center; padding:28px 12px; color:#B8A8B4; font-size:13px; line-height:1.7; }
      .cal-empty .emoji { font-size:36px; display:block; margin-bottom:8px; }

      /* 月视图 */
      .cal-month-card { background:#fff; border-radius:18px; padding:14px 8px; margin-bottom:14px; box-shadow:0 4px 16px rgba(255,140,175,.08); }
      .cal-month-head { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; padding:0 4px 8px; }
      .cal-month-head span { text-align:center; font-size:11.5px; color:#A08F9B; font-weight:600; }
      .cal-month-head span:first-child, .cal-month-head span:last-child { color:#FF8FAB; }
      .cal-month-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; padding:0 4px; }
      .cal-cell { text-align:center; font-size:13px; padding:7px 0; border-radius:10px; color:#3B2E38; font-weight:500; }
      .cal-cell.muted { color:#D6C9D1; }
      .cal-cell.today { background:linear-gradient(180deg,#FFB0C8,#FF7FA0); color:#fff; font-weight:700; box-shadow:0 3px 8px rgba(255,107,143,.3); }

      .cal-next-title { font-size:12px; color:#A08F9B; font-weight:600; padding:2px 6px 8px; }

      /* 年视图 */
      .cal-year-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
      .cal-mini { background:#fff; border-radius:12px; padding:8px 5px 9px; box-shadow:0 3px 10px rgba(255,140,175,.06); }
      .cal-mini-title { font-size:11.5px; color:#FF6B8F; font-weight:700; text-align:center; margin-bottom:5px; }
      .cal-mini-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:0; }
      .cal-mini-grid span { font-size:7px; text-align:center; color:#B8A8B4; line-height:11px; }
      .cal-mini-grid span.muted { color:#E4D8DE; }
      .cal-mini-grid span.today { color:#fff; background:#FF7FA0; border-radius:50%; font-weight:700; }
      .cal-mini-head { display:grid; grid-template-columns:repeat(7,1fr); margin-bottom:2px; }
      .cal-mini-head span { font-size:6.5px; text-align:center; color:#C9B8C4; }

      /* ==================== 底部 Tab ==================== */
      .wx-tabbar { position:absolute; left:0; right:0; bottom:0; height:60px; background:rgba(255,255,255,.96); backdrop-filter:blur(20px); border-top:1px solid #EFF2F7; display:flex; z-index:5; padding-bottom:env(safe-area-inset-bottom,0); }
      .wx-tab { flex:1; border:none; background:none; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; cursor:pointer; font-family:inherit; color:#A8B0C4; font-size:11px; padding:0; }
      .wx-tab svg { width:24px; height:24px; stroke:currentColor; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
      .wx-tab.on { color:#FF6B8F; font-weight:600; }
      .wx-tab.on svg { stroke:#FF6B8F; }
    `;
    shadow.appendChild(s);
  }

  /* ============================================================
   * 七、渲染
   * ============================================================ */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

  const ICON_WEATHER = `<svg viewBox="0 0 24 24"><circle cx="9" cy="9.5" r="3.6"/><path d="M6.5 18.5h10a3.5 3.5 0 0 0 .6-6.96 5 5 0 0 0-9.5-1.2A4 4 0 0 0 6.5 18.5z"/></svg>`;
  const ICON_CALENDAR = `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/></svg>`;

  let viewEl = null;
  let refreshTimer = null;
  let thBound = false;
  let currentTab = 'weather';   // 'weather' | 'calendar'
  let calendarView = 'day';     // 'day' | 'month' | 'year'

  /* ----- 天气视图 ----- */
  function renderWeatherBody(d) {
    const h24 = build24h(d);
    return `
      <div class="wx-body" data-wx-body>
        <div class="wx-card" style="background:${d.w.bg}">
          <div class="wx-card-top">
            <div class="wx-city">
              ${esc(d.loc)}
              <small>${d.time ? esc(d.time) : '时间未获取'}</small>
            </div>
            <div class="wx-wlabel">${esc(d.w.label)}</div>
          </div>
          <div class="wx-main">
            <div>
              <div class="wx-temp">${esc(d.tempStr)}</div>
              <div class="wx-range">↑ ${d.hi}°　↓ ${d.lo}°</div>
            </div>
            <div class="wx-emoji">${d.w.emoji}</div>
          </div>
          <div class="wx-desc">${esc(d.desc)}</div>
          <div class="wx-metrics">
            <div class="wx-metric">降雨<b>${d.humidity}%</b></div>
            <div class="wx-metric">风<b>${d.wind} km/h</b></div>
            <div class="wx-metric">UV<b>${d.uv}</b></div>
          </div>
        </div>

        <div class="wx-sec">
          <div class="wx-sec-title">今日天气趋势</div>
          <div class="wx-trend">
            ${d.trend.map(t => `
              <div class="wx-tcell">
                <div class="lbl">${t.tag}</div>
                <div class="ico">${t.emoji}</div>
                <div class="rng">${t.lo}°~${t.hi}°</div>
              </div>`).join('')}
          </div>
        </div>

        <div class="wx-sec">
          <div class="wx-sec-title">24 小时天气</div>
          <div class="wx-24h">
            ${h24.map(c => `
              <div class="wx-24h-cell${c.isNow ? ' now' : ''}">
                <div class="t">${c.isNow ? '现在' : c.hh}</div>
                <div class="e">${c.emoji}</div>
                <div class="v">${c.temp}°</div>
              </div>`).join('')}
          </div>
        </div>

        <div class="wx-foot">数据来自角色卡 / 最近正文 · 每 15 秒刷新</div>
      </div>`;
  }

  /* ----- 日历视图 ----- */
  function renderCalendarBody(d) {
    const info = parseDateInfo(d.time);
    const cal = buildCalendar(info, calendarView);
    let inner = '';

    if (cal.kind === 'week') {
      const weekdays = ['日','一','二','三','四','五','六'];
      inner = `
        <div class="cal-week-card">
          <div class="cal-week-top">
            <div class="cal-week-title">本周日程</div>
            <div class="cal-week-nav">‹  ›</div>
          </div>
          <div class="cal-week-grid">
            ${cal.days.map(day => `
              <div class="cal-day${day.isToday ? ' today' : ''}">
                <div class="n">${day.name}</div>
                <div class="d">${day.num}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="cal-today-card">
          <div class="cal-today-top">
            <div class="cal-today-title">今天 · <b>${info.month}月${info.day}日</b></div>
            <div class="cal-today-add">＋ 添加日程</div>
          </div>
          <div class="cal-empty">
            <span class="emoji">🌸</span>
            今天还没有安排哦～<br>
            点右上角「添加日程」记录今天要做的事
          </div>
        </div>`;
    } else if (cal.kind === 'month') {
      const heads = ['日','一','二','三','四','五','六'];
      const renderGrid = (cells) => cells.map(c => `
        <div class="cal-cell${c.muted ? ' muted' : ''}${c.isToday ? ' today' : ''}">${c.num || ''}</div>`).join('');
      inner = `
        <div class="cal-month-card">
          <div class="cal-month-head">
            ${heads.map(h => `<span>${h}</span>`).join('')}
          </div>
          <div class="cal-month-grid">
            ${renderGrid(cal.cells)}
          </div>
        </div>
        <div class="cal-next-title">下月预览 · ${cal.next.y}年${cal.next.m}月</div>
        <div class="cal-month-card">
          <div class="cal-month-head">
            ${heads.map(h => `<span>${h}</span>`).join('')}
          </div>
          <div class="cal-month-grid">
            ${renderGrid(cal.next.cells)}
          </div>
        </div>`;
    } else {
      const miniHeads = ['日','一','二','三','四','五','六'];
      inner = `<div class="cal-year-grid">
        ${cal.months.map(mo => `
          <div class="cal-mini">
            <div class="cal-mini-title">${mo.m}月</div>
            <div class="cal-mini-head">${miniHeads.map(h => `<span>${h}</span>`).join('')}</div>
            <div class="cal-mini-grid">
              ${mo.cells.map(c => c.num === 0 ? '<span></span>' : `<span${c.isToday ? ' class="today"' : ''}>${c.num}</span>`).join('')}
            </div>
          </div>`).join('')}
      </div>`;
    }

    return `<div class="cal-wrap active" data-cal-body>${inner}</div>`;
  }

  /* ----- 主渲染 ----- */
  function render() {
    if (!viewEl || !viewEl.classList.contains('active')) return;
    const d = buildWeatherData();
    const info = parseDateInfo(d.time);

    // Head 不同
    let headTitle, headRight;
    if (currentTab === 'weather') {
      headTitle = '天气';
      headRight = '<div class="wx-head-right"></div>';
    } else {
      headTitle = `${info.year}年 ${info.month}月`;
      headRight = `
        <div class="wx-head-right" style="width:auto;">
          <div class="cal-viewswitch">
            <button class="cal-vbtn${calendarView==='day'?' on':''}" data-cal-view="day">日</button>
            <button class="cal-vbtn${calendarView==='month'?' on':''}" data-cal-view="month">月</button>
            <button class="cal-vbtn${calendarView==='year'?' on':''}" data-cal-view="year">年</button>
          </div>
        </div>`;
    }

    // Body
    const weatherBody = renderWeatherBody(d);
    const calBody = renderCalendarBody(d);

    viewEl.innerHTML = `
      <div class="wx-wrap">
        <div class="wx-head">
          <button class="wx-back" data-wx-back>←</button>
          <div class="wx-title">${esc(headTitle)}</div>
          ${headRight}
        </div>
        <div style="position:relative;flex:1;min-height:0;">
          <div data-body-weather style="position:absolute;inset:0;display:${currentTab==='weather'?'block':'none'};">${weatherBody}</div>
          <div data-body-calendar style="position:absolute;inset:0;display:${currentTab==='calendar'?'block':'none'};">${calBody}</div>
        </div>
        <div class="wx-tabbar">
          <button class="wx-tab${currentTab==='weather'?' on':''}" data-wx-tab="weather">${ICON_WEATHER}<span>看天气</span></button>
          <button class="wx-tab${currentTab==='calendar'?' on':''}" data-wx-tab="calendar">${ICON_CALENDAR}<span>看日历</span></button>
        </div>
      </div>
    `;

    // 事件绑定
    viewEl.querySelector('[data-wx-back]').addEventListener('click', close);
    viewEl.querySelectorAll('[data-wx-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.wxTab;
        if (t === currentTab) return;
        currentTab = t;
        render();
      });
    });
    viewEl.querySelectorAll('[data-cal-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.calView;
        if (v === calendarView) return;
        calendarView = v;
        render();
      });
    });

    // 24小时滚动到"现在"那一格
    const nowCell = viewEl.querySelector('.wx-24h .wx-24h-cell.now');
    if (nowCell) nowCell.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  /* ============================================================
   * 八、生命周期
   * ============================================================ */
  function open(phoneScreen) {
    injectStyle();
    let v = phoneScreen.querySelector('#silly-weather-view');
    if (!v) {
      v = parentDoc.createElement('div');
      v.id = 'silly-weather-view';
      v.className = 'app-view';
      v.style.cssText = 'background:#eef1f6;';
      phoneScreen.appendChild(v);
    }
    viewEl = v;
    v.classList.add('active');
    currentTab = 'weather';
    calendarView = 'day';
    render();

    if (!thBound) {
      thBound = true;
      try {
        const th = (window.parent && window.parent.TavernHelper) || window.TavernHelper;
        if (th && typeof th.eventOn === 'function') {
          th.eventOn('CHARACTER_MESSAGE_RENDERED', render);
          th.eventOn('CHAT_CHANGED', render);
        }
      } catch (e) {}
    }
    if (!refreshTimer) refreshTimer = setInterval(render, 15000);
  }
  function close() {
    if (viewEl) viewEl.classList.remove('active');
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  }

  MOD.registerApp({
    id: 'weather',
    name: '天气',
    emoji: '🌤️',
    color: '#7FB8E8',
    onOpen: open
  });

  console.log('[天气] weather-v9 已就绪（24小时 + 日历）');
})();
