const STYLES = `
/* 整体应用背景与字体 */
.weather-app-container {
    background: linear-gradient(180deg, #dcf0ff 0%, #f2f9ff 100%);
    width: 100%; height: 100%; display: flex; flex-direction: column;
    color: #333; font-family: -apple-system, "PingFang SC", sans-serif;
    position: relative;
}

/* 顶部搜索栏 */
.weather-search-bar {
    background: rgba(255,255,255,0.6); margin: 40px 15px 15px 15px; padding: 10px 15px;
    border-radius: 20px; font-size: 14px; color: #666; display: flex; align-items: center;
    backdrop-filter: blur(10px);
}

/* 天气主卡片 - 复刻蓝橙渐变 */
.weather-main-card {
    background: linear-gradient(150deg, #74b9ff 0%, #a2c2e8 40%, #fbdcb0 100%);
    margin: 0 15px 15px 15px; border-radius: 24px; padding: 20px; color: #fff;
    box-shadow: 0 8px 20px rgba(116, 185, 255, 0.3); position: relative; overflow: hidden;
}
.weather-main-card .city-title { font-size: 16px; font-weight: 600; text-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.weather-main-card .temp-huge { font-size: 72px; font-weight: 800; line-height: 1; margin: 10px 0 5px 0; text-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.weather-main-card .temp-range { font-size: 13px; opacity: 0.9; margin-bottom: 25px; }
.weather-main-card .tips-text { font-size: 14px; line-height: 1.5; margin-bottom: 20px; font-weight: 500; }
.weather-main-card .details-row { display: flex; justify-content: space-between; font-size: 12px; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 15px; }
.weather-giant-icon { position: absolute; right: 10px; top: 40px; font-size: 110px; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.15)); line-height: 1; }

/* 玻璃态小卡片通用样式 */
.glass-card {
    background: rgba(255, 255, 255, 0.55); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.7);
    margin: 0 15px 15px 15px; border-radius: 20px; padding: 15px; color: #444;
}
.card-title { font-size: 14px; font-weight: 700; color: #1e5ba9; margin-bottom: 12px; }

/* 今日天气趋势 */
.trend-row { display: flex; justify-content: space-between; text-align: center; }
.trend-item { flex: 1; font-size: 13px; line-height: 1.6; }
.trend-item .phase { font-weight: 600; color: #555; }
.trend-item .desc { color: #1a73e8; }
.trend-item .range { font-size: 12px; color: #777; }

/* 24小时天气 */
.hourly-row { display: flex; overflow-x: auto; gap: 15px; padding-bottom: 5px; scrollbar-width: none; }
.hourly-item { display: flex; flex-direction: column; align-items: center; min-width: 45px; font-size: 12px; color: #666; gap: 6px; padding: 8px 0; border-radius: 12px; }
.hourly-item.active { background: #fff; color: #1a73e8; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.hourly-item .icon { font-size: 20px; }

/* 日历页面样式 */
.weather-tabs { display: flex; background: #e0edfb; border-radius: 20px; margin: 40px 15px 15px 15px; padding: 4px; flex-shrink: 0; }
.weather-tab { flex: 1; text-align: center; padding: 8px 0; border-radius: 16px; font-size: 14px; color: #5a8bd4; cursor: pointer; transition: 0.3s; font-weight: 500; }
.weather-tab.active { background: #fff; color: #1a73e8; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

.calendar-wrapper { background: #fff; border-radius: 24px; margin: 0 15px 15px 15px; padding: 20px; box-shadow: 0 4px 20px rgba(180,210,240,0.3); flex: 1; overflow-y: auto; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 900; margin-bottom: 15px; color: #222; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; gap: 10px 0; font-size: 15px; }
.calendar-grid .weekday { font-size: 12px; color: #999; margin-bottom: 5px; }
.calendar-grid .weekend { color: #ff6b6b; }
.calendar-grid .day-cell { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 42px; border-radius: 10px; font-weight: 500; }
.calendar-grid .day-cell.empty { background: transparent; }
.calendar-grid .day-cell.active { background: #e8f3ff; color: #1a73e8; font-weight: 800; }
.day-cell .lunar { font-size: 10px; color: #aaa; transform: scale(0.85); margin-top: -2px; }

/* 底部导航栏 */
.bottom-nav { display: flex; justify-content: space-around; padding: 12px 0 24px 0; background: rgba(255,255,255,0.95); border-top: 1px solid rgba(0,0,0,0.05); flex-shrink: 0; backdrop-filter: blur(10px); }
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 5px; font-size: 12px; color: #999; cursor: pointer; transition: 0.2s; font-weight: 500; flex: 1; }
.nav-item.active { color: #1a73e8; }
.nav-item i { font-size: 22px; font-style: normal; }

/* 隐藏滚动条 */
::-webkit-scrollbar { display: none; }
`;

// 生成 100+ 条温馨提示库
const baseTipsA = ["天气正好", "有些干燥", "风力微弱", "温度适宜", "略显闷热", "紫外线较强", "空气清新", "稍有降温", "阳光明媚", "细雨绵绵", "湿度偏高", "气候凉爽"];
const baseTipsB = ["适合出门散步", "记得多喝热水", "注意防晒保护", "记得带把小伞", "穿轻薄衣物即可", "适合宅家看剧", "注意早晚温差", "多吃点水果", "保持好心情哦", "适合户外运动", "记得添件外套"];
const WARM_TIPS = [];
for (let i = 0; i < baseTipsA.length; i++) {
    for (let j = 0; j < baseTipsB.length; j++) {
        WARM_TIPS.push(`温馨提示：${baseTipsA[i]}，${baseTipsB[j]}。`);
    }
}

// 基于角色ID生成确定性的哈希数值，确保同一个角色看天气是一致的
function getCharHash(charId) {
    let hash = 0;
    const str = charId || "default";
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash);
}

// 注入30天天气预报到 AI 世界书
function injectWeatherForecast() {
    const context = window.parent.SillyTavern?.getContext?.();
    if (!context || !context.characterId) return;
    
    let weatherForecast = "【未来30天本地天气预报】\n";
    const weathers = ['晴朗', '多云', '阵雨', '大风', '阴天', '暴雨', '雷阵雨'];
    for(let i = 1; i <= 30; i++) {
        weatherForecast += `未来第${i}天：${weathers[Math.floor(Math.random() * weathers.length)]}；`;
    }

    if (window.parent.TavernHelper && window.parent.TavernHelper.injectPrompts) {
        window.parent.TavernHelper.injectPrompts([{
            id: `dogphone_weather_forecast`,
            position: 'before_char',
            depth: 0,
            role: 'system',
            content: `这是一份通过手机查看到的本地天气预报，请根据预报合理安排出行或室内剧情：\n${weatherForecast}`,
            should_scan: true
        }], { once: false });
    }
}

class WeatherApp {
    constructor(container) {
        this.container = container;
        this.currentView = 'weather'; // 'weather' or 'calendar'
        this.calTab = 'month'; // 'day', 'month', 'year'
        this.lastCharId = null;
        this.render();
        this.startCharMonitor();
    }

    // 监控酒馆当前选中角色的变化
    startCharMonitor() {
        this.charInterval = setInterval(() => {
            const context = window.parent.SillyTavern?.getContext?.();
            const currentCharId = context?.characterId;
            if (currentCharId && currentCharId !== this.lastCharId) {
                this.lastCharId = currentCharId;
                this.render(); // 角色切换，重新渲染生成该角色的专属天气
                injectWeatherForecast();
            }
        }, 1000);
    }

    // 获取当前角色专属天气数据
    getWeatherData() {
        const hash = getCharHash(this.lastCharId);
        const tempBase = 15 + (hash % 20); // 15° - 35°
        const weatherIcons = ['☀️', '⛅', '☁️', '🌧️', '⛈️'];
        const weatherDescs = ['晴朗', '多云', '阴天', '阵雨', '雷阵雨'];
        const wIdx = hash % weatherIcons.length;
        
        return {
            city: "本地城市",
            temp: tempBase,
            tempHigh: tempBase + 3,
            tempLow: tempBase - 4,
            icon: weatherIcons[wIdx],
            desc: weatherDescs[wIdx],
            rain: (hash % 100) + '%',
            wind: (hash % 20 + 1) + ' km/h',
            uv: (hash % 10 + 1),
            tip: WARM_TIPS[hash % WARM_TIPS.length],
            trend: [
                { time: '上午', desc: weatherDescs[(wIdx+1)%5], range: `${tempBase-2}°~${tempBase+1°}` },
                { time: '下午', desc: weatherDescs[(wIdx)%5], range: `${tempBase}°~${tempBase+3°}` },
                { time: '晚上', desc: weatherDescs[(wIdx+2)%5], range: `${tempBase-3}°~${tempBase-1°}` }
            ],
            hourly: Array.from({length: 6}, (_, i) => ({
                time: i === 1 ? '现在' : `${12 + i}:00`,
                icon: weatherIcons[(wIdx + i) % 5],
                active: i === 1
            }))
        };
    }

    render() {
        if (this.currentView === 'weather') {
            this.container.innerHTML = this.getWeatherHTML();
        } else {
            this.container.innerHTML = this.getCalendarHTML();
            this.bindCalendarTabs();
        }
        this.bindNavEvents();
    }

    getWeatherHTML() {
        const data = this.getWeatherData();
        const hourlyHTML = data.hourly.map(h => `
            <div class="hourly-item ${h.active ? 'active' : ''}">
                <span>${h.time}</span>
                <span class="icon">${h.icon}</span>
            </div>
        `).join('');

        return `
        <div class="weather-app-container" style="overflow-y: auto;">
            <div class="weather-search-bar">🔍 搜索城市 / 景点</div>
            
            <div class="weather-main-card">
                <div class="city-title">${data.city} · ${data.desc}</div>
                <div class="temp-huge">${data.temp}°</div>
                <div class="temp-range">↑ ${data.tempHigh}° ↓ ${data.tempLow}°</div>
                <div class="weather-giant-icon">${data.icon}</div>
                
                <div class="tips-text">今日天气播报<br>${data.tip}</div>
                
                <div class="details-row">
                    <span>💧 降雨 ${data.rain}</span>
                    <span>💨 风 ${data.wind}</span>
                    <span>☀️ UV ${data.uv}</span>
                </div>
            </div>

            <div class="glass-card">
                <div class="card-title">今日天气趋势</div>
                <div class="trend-row">
                    ${data.trend.map(t => `
                        <div class="trend-item">
                            <div class="phase">${t.time}</div>
                            <div class="desc">${t.desc}</div>
                            <div class="range">${t.range}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="glass-card">
                <div class="card-title">24小时天气</div>
                <div class="hourly-row">${hourlyHTML}</div>
            </div>

            ${this.getNavHTML()}
        </div>
        `;
    }

    getCalendarHTML() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let gridHTML = `
            <div class="weekday weekend">日</div>
            <div class="weekday">一</div>
            <div class="weekday">二</div>
            <div class="weekday">三</div>
            <div class="weekday">四</div>
            <div class="weekday">五</div>
            <div class="weekday weekend">六</div>
        `;
        
        for (let i = 0; i < firstDay; i++) gridHTML += `<div class="day-cell empty"></div>`;
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = i === today ? 'active' : '';
            const isWeekend = (firstDay + i - 1) % 7 === 0 || (firstDay + i - 1) % 7 === 6 ? 'weekend' : '';
            const lunarDay = i % 2 === 0 ? '初一' : '十五'; // 模拟农历
            gridHTML += `<div class="day-cell ${isToday} ${isWeekend}"><span>${i}</span><span class="lunar">${lunarDay}</span></div>`;
        }

        const isDay = this.calTab === 'day' ? 'active' : '';
        const isMonth = this.calTab === 'month' ? 'active' : '';
        const isYear = this.calTab === 'year' ? 'active' : '';

        // 简易视图占位，核心展示月视图
        const contentArea = this.calTab === 'month' ? `
            <div class="calendar-header">
                <span>${year}年${month + 1}月</span>
                <span style="color:#aaa; font-size:14px;">&lt; &gt;</span>
            </div>
            <div class="calendar-grid">${gridHTML}</div>
        ` : `<div style="text-align:center; padding: 40px 0; color:#888;">【${this.calTab === 'day' ? '今日日程' : '年度预览'}视图】<br>UI已对齐截图结构</div>`;

        return `
        <div class="weather-app-container">
            <div class="weather-tabs">
                <div class="weather-tab ${isDay}" data-tab="day">日</div>
                <div class="weather-tab ${isMonth}" data-tab="month">月</div>
                <div class="weather-tab ${isYear}" data-tab="year">年</div>
            </div>
            
            <div class="calendar-wrapper">
                ${contentArea}
            </div>

            ${this.getNavHTML()}
        </div>
        `;
    }

    getNavHTML() {
        const isW = this.currentView === 'weather' ? 'active' : '';
        const isC = this.currentView === 'calendar' ? 'active' : '';
        // 删除了“小火车”和“我的”
        return `
        <div class="bottom-nav">
            <div class="nav-item ${isW}" id="nav-weather">
                <i>🌤️</i><span>看天气</span>
            </div>
            <div class="nav-item ${isC}" id="nav-calendar">
                <i>📅</i><span>看日历</span>
            </div>
        </div>
        `;
    }

    bindCalendarTabs() {
        const tabs = this.container.querySelectorAll('.weather-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                this.calTab = tab.dataset.tab;
                this.render();
            };
        });
    }

    bindNavEvents() {
        const btnW = this.container.querySelector('#nav-weather');
        const btnC = this.container.querySelector('#nav-calendar');
        if (btnW) btnW.onclick = () => { this.currentView = 'weather'; this.render(); };
        if (btnC) btnC.onclick = () => { this.currentView = 'calendar'; this.render(); };
    }

    destroy() {
        if (this.charInterval) clearInterval(this.charInterval);
    }
}

if (window.sillyPhone) {
    window.sillyPhone.registerApp({
        id: 'weather-calendar-v12',
        name: '搭搭天气',
        emoji: '☀️',
        color: '#e0edfb',
        onOpen: (phoneScreen) => {
            const shadow = window.sillyPhone.shadow;
            
            if (!shadow.querySelector('#weather-style')) {
                const styleEl = document.createElement('style');
                styleEl.id = 'weather-style';
                styleEl.textContent = STYLES;
                shadow.appendChild(styleEl);
            }

            const appView = document.createElement('div');
            appView.className = 'app-view active';
            
            const container = document.createElement('div');
            container.style.cssText = "flex: 1; overflow: hidden; display: flex; flex-direction: column;";
            
            appView.innerHTML = `
                <div class="app-view-header">
                    <span style="cursor:pointer; font-size:18px;" class="back-btn">🔙</span>
                    <div class="app-view-title" style="font-weight:700;">搭搭天气</div>
                </div>
            `;
            appView.appendChild(container);
            phoneScreen.appendChild(appView);

            // 初始化应用
            const app = new WeatherApp(container);

            appView.querySelector('.back-btn').addEventListener('click', () => {
                app.destroy();
                appView.remove();
            });
            
            // 初次打开注入一次
            injectWeatherForecast();
        }
    });
}
