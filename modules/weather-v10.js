// weather-v10.js — 从角色卡/正文读时间、地点、天气
// 依赖：window.sillyPhone（小狗手机主加载器已注册）

(function () {
  'use strict';

  const MOD = window.sillyPhone;
  if (!MOD) { console.error('[天气] 未找到 sillyPhone 宿主，请确认主加载器已执行'); return; }

  const parentDoc = window.parent.document;
  const shadow    = MOD.shadow;

  // ============================================================
  // 一、数据源：SeseLedgerAPI 表格（结构化，优先级最高）
  // ============================================================
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
        const get = (col) => {
          const i = header.indexOf(col);
          return i >= 0 ? String(row[i] ?? '').trim() : '';
        };
        out.time     = get('当前时间');
        out.location = get('当前详细地点') || get('当前地点');
        break;
      }
    } catch (e) { console.warn('[天气] 读表失败', e); }
    return out;
  }

  // ============================================================
  // 二、数据源：最近 AI 消息正则解析（通用兜底）
  // ============================================================
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

      // 从最新往旧扫，命中的就停
      for (let i = msgs.length - 1; i >= 0; i--) {
        const text = String(msgs[i] && msgs[i].message || '');
        if (!text) continue;

        // --- 时间 ---
        if (!out.time) {
          const t1 = text.match(/(\d{4})\s*[年\-\/\.]\s*(\d{1,2})\s*[月\-\/\.]\s*(\d{1,2})\s*[日号]?\s*(\d{1,2})[:：](\d{2})/);
          if (t1) {
            out.time = `${t1[1]}年${+t1[2]}月${+t1[3]}日 ${t1[4].padStart(2,'0')}:${t1[5]}`;
          } else {
            const t2 = text.match(/(\d{4})\s*[年\-\/\.]\s*(\d{1,2})\s*[月\-\/\.]\s*(\d{1,2})\s*[日号]?/);
            if (t2) out.time = `${t2[1]}年${+t2[2]}月${+t2[3]}日`;
            else {
              const t3 = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?\s*(\d{1,2})?[:：]?(\d{2})?/);
              if (t3) out.time = `${+t3[1]}月${+t3[2]}日${t3[3] ? ' ' + t3[3].padStart(2,'0') + ':' + t3[4] : ''}`;
            }
          }
        }

        // --- 天气 ---
        if (!out.weather) {
          for (const w of WEATHER_WORDS) {
            if (text.includes(w)) { out.weather = w; break; }
          }
        }

        // --- 温度 ---
        if (!out.temp) {
          const tm = text.match(/(-?\d{1,2})\s*(?:°|℃|度)/);
          if (tm) {
            const n = parseInt(tm[1], 10);
            if (n > -40 && n < 60) out.temp = n + '°';
          }
        }

        // --- 地点 ---
        if (!out.location) {
          const loc = text.match(/(?:在|来到|走进|位于|地点[:：]|当前地点[:：])\s*([\u4e00-\u9fa5]{2,12}(?:市|区|县|镇|村|路|街|室|间|厅|房|府|院|馆|楼|店|山|河|湖|海|岛|林|园|桥|巷|门|站|场|咖啡馆|餐厅|酒吧|公寓|别墅|学校|医院))/);
          if (loc) out.location = loc[1];
        }

        if (out.time && out.weather && out.temp && out.location) break;
      }
    } catch (e) { console.warn('[天气] 解析消息失败', e); }
    return out;
  }

  // ============================================================
  // 三、天气枚举 → 视觉映射
  // ============================================================
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

  function pickWeather(raw) {
    if (!raw) return WEATHER_MAP.find(w => w.key === '多云');
    return WEATHER_MAP.find(w => raw.includes(w.key)) || WEATHER_MAP.find(w => w.key === '多云');
  }

  // ============================================================
  // 四、派生数据（温度 / 趋势 / 湿度 / 风 / UV）
  // ============================================================
  function hashOf(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }

  function buildWeatherData() {
    const tbl = readGlobalTable();
    const msg = parseFromMessages();

    const time    = tbl.time || msg.time || '';
    const loc     = tbl.location || msg.location || '未知地点';
    const rawW    = msg.weather || '多云';
    const w       = pickWeather(rawW);

    const tempNum = msg.temp ? parseInt(msg.temp, 10) : w.temp;
    const tempStr = tempNum + '°';
    const hi      = tempNum + Math.round(2 + (hashOf(rawW) % 4));
    const lo      = tempNum - Math.round(3 + (hashOf(loc) % 4));

    // 湿度 / 风力 / UV：按天气类型做启发式
    const isRain  = /雨/.test(rawW);
    const isSnow  = /雪/.test(rawW);
    const isSunny = /晴/.test(rawW) || rawW === '温暖' || rawW === '炎热';
    const humidity = isRain ? 75 + (hashOf(loc) % 20) : isSnow ? 60 + (hashOf(loc) % 15) : isSunny ? 30 + (hashOf(loc) % 15) : 55 + (hashOf(loc) % 15);
    const wind     = 3 + (hashOf(loc + 'w') % 12);
    const uv       = isSunny ? 5 + (hashOf(loc + 'u') % 4) : /云|阴/.test(rawW) ? 2 + (hashOf(loc + 'u') % 2) : 1;

    // 三段趋势
    const trend = [
      { tag: '上午', emoji: isRain ? '🌧️' : isSunny ? '☀️' : '⛅', lo: tempNum - 1, hi: tempNum + 2 },
      { tag: '下午', emoji: isRain ? '🌧️' : isSnow ? '🌨️' : isSunny ? '☀️' : '⛅', lo: tempNum, hi: tempNum + 3 },
      { tag: '晚上', emoji: isSnow ? '🌨️' : '🌙', lo: tempNum - 2, hi: tempNum + 1 }
    ];

    const desc = buildDesc(rawW, tempNum, isRain, isSnow, isSunny);

    return { time, loc, rawW, w, tempStr, hi, lo, humidity, wind, uv, trend, desc };
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

  // ============================================================
  // 五、UI
  // ============================================================
  const STYLE_ID = 'silly-weather-style';

  function injectStyle() {
    if (shadow.querySelector('#' + STYLE_ID)) return;
    const s = parentDoc.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .wx-wrap { position:absolute; inset:0; background:#eef1f6; display:flex; flex-direction:column; }
      .wx-head { height:50px; display:flex; align-items:center; padding:0 12px; background:#fff; border-bottom:1px solid #e5e8ee; flex-shrink:0; }
      .wx-back { width:36px; height:36px; border:none; background:transparent; font-size:18px; color:#5b6b8c; cursor:pointer; border-radius:8px; }
      .wx-back:active { background:#f0f2f7; }
      .wx-title { flex:1; text-align:center; font-weight:600; font-size:16px; color:#2f3b55; }
      .wx-scroll { flex:1; overflow-y:auto; padding:14px; }
      .wx-card { border-radius:20px; padding:20px; color:#fff; box-shadow:0 8px 24px rgba(60,90,140,.18); position:relative; overflow:hidden; }
      .wx-card-top { display:flex; justify-content:space-between; align-items:flex-start; }
      .wx-city { font-size:16px; font-weight:600; opacity:.95; }
      .wx-city small { display:block; font-size:11px; opacity:.75; font-weight:400; margin-top:2px; }
      .wx-wlabel { font-size:12px; padding:3px 10px; border-radius:999px; background:rgba(255,255,255,.25); backdrop-filter:blur(4px); }
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
      .wx-foot { text-align:center; font-size:11px; color:#9aa5bd; padding:14px 0 6px; }
    `;
    shadow.appendChild(s);
  }

  // ============================================================
  // 六、注册 app
  // ============================================================
  let viewEl = null;
  let refreshTimer = null;
  let thBound = false;

  function render() {
    if (!viewEl || !viewEl.classList.contains('active')) return;
    const d = buildWeatherData();

    viewEl.innerHTML = `
      <div class="wx-wrap">
        <div class="wx-head">
          <button class="wx-back" data-wx-back>←</button>
          <div class="wx-title">天气</div>
          <div style="width:36px"></div>
        </div>
        <div class="wx-scroll">
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

          <div class="wx-foot">数据来自角色卡 / 最近正文 · 每 15 秒刷新</div>
        </div>
      </div>
    `;

    viewEl.querySelector('[data-wx-back]').addEventListener('click', close);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

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
    render();

    if (!thBound) {
      thBound = true;
      try {
        const th = (window.parent && window.parent.TavernHelper) || window.TavernHelper;
        if (th && typeof th.eventOn === 'function') {
          th.eventOn('CHARACTER_MESSAGE_RENDERED', render);
          th.eventOn('CHAT_CHANGED', render);
        }
      } catch (e) { console.warn('[天气] 事件监听失败', e); }
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

  console.log('[天气] weather-v9 已就绪（数据源：角色卡表格 + 最近正文）');
})();
