// modules/weather.js
export function initWeather() {
  const sillyPhone = window.sillyPhone;
  if (!sillyPhone) return;

  // --- 配置与数据 ---
  const WEATHER_TIPS = {
    sunny: ['今天天气晴朗，阳光明媚，适合外出散步哦！', '阳光正好，微风不燥，愿你拥有美好的一天！', '晴天适合出游，记得涂好防晒霜哦！'],
    cloudy: ['多云天气，温度适宜，是个喝下午茶的好日子！', '天空有点阴沉，但心情要保持晴朗呀！', '云朵在飘，不要忘记带一把小伞以备不时之需。'],
    rain: ['外面下雨了，记得带伞，小心别淋湿感冒了。', '听着雨声，喝杯热茶，享受片刻的宁静吧。', '雨天路滑，出门一定要注意安全。'],
    storm: ['暴雨天气，尽量待在室内不要出门哦！', '狂风暴雨，注意关好门窗，注意安全。', '雷雨交加，记得拔掉电器电源，保护好自己。'],
    snow: ['下雪啦！多穿点衣服，一起去看雪景吧！', '雪天路滑，走路要慢一点，小心摔跤哦。', '堆雪人、打雪仗，享受冬日的浪漫吧！'],
    fog: ['雾霾天气，能见度低，出门记得戴上口罩。', '雾气蒙蒙，开车的朋友请减速慢行。', '大雾天气，尽量减少户外活动哦。'],
    default: ['天气变化无常，请随时关注天气预报哦！', '不管天气如何，都要保持好心情呀~']
  };

  const WEATHER_TYPES = ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'fog'];
  const WEATHER_ICONS = {
    sunny: '☀️', cloudy: '☁️', rain: '🌧️', storm: '⛈️', snow: '❄️', fog: '🌫️'
  };
  const WEATHER_NAMES = {
    sunny: '晴朗', cloudy: '多云', rain: '小雨', storm: '暴雨', snow: '下雪', fog: '雾霾'
  };

  // 获取当前日期对象
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11

  // --- 核心逻辑：从角色卡和世界书获取天气数据 ---
  let currentCity = '未知城市';
  let currentTemp = 25;
  let currentWeatherType = 'sunny';
  let currentTip = WEATHER_TIPS.default[0];

  // 尝试解析角色卡和聊天记录
  try {
    if (window.TavernHelper) {
      // 1. 尝试从角色卡获取城市
      const charData = window.TavernHelper.getCharData('current');
      if (charData && charData.description) {
        // 匹配 "在xx市" 或 "位于xx" 等常见格式
        const cityMatch = charData.description.match(/(?:在|位于)([^，。、\s]+?)(?:市|区|县|镇)/);
        if (cityMatch) currentCity = cityMatch[1];
      }

      // 2. 尝试从最新消息获取当前天气
      const messages = window.TavernHelper.getChatMessages(-1);
      if (messages && messages.length > 0) {
        const text = messages[0].message;
        // 匹配温度，如 25°
        const tempMatch = text.match(/(\d{1,2})°/);
        if (tempMatch) currentTemp = parseInt(tempMatch[1], 10);
        
        // 匹配天气描述
        if (text.includes('雨')) currentWeatherType = 'rain';
        else if (text.includes('晴')) currentWeatherType = 'sunny';
        else if (text.includes('雪')) currentWeatherType = 'snow';
        else if (text.includes('云')) currentWeatherType = 'cloudy';
        else if (text.includes('雾')) currentWeatherType = 'fog';
        else if (text.includes('阴')) currentWeatherType = 'cloudy';
      }
    }
  } catch (e) {
    console.warn('[天气App] 解析角色数据失败，使用默认值', e);
  }

  // 生成当前天气的提示语
  const tipsArray = WEATHER_TIPS[currentWeatherType] || WEATHER_TIPS.default;
  currentTip = tipsArray[Math.floor(Math.random() * tipsArray.length)];

  // --- 生成未来几天的天气（用于日历和注入世界书） ---
  function generateFutureWeather(days = 7) {
    const future = [];
    for (let i = 0; i < days; i++) {
      const type = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
      const tempMax = Math.floor(Math.random() * 10) + 20; // 20-30度
      const tempMin = tempMax - Math.floor(Math.random() * 5) - 5; // 低于最高温5-10度
      future.push({
        date: new Date(currentYear, currentMonth, today.getDate() + i),
        type: type,
        tempMax: tempMax,
        tempMin: tempMin,
        tip: WEATHER_TIPS[type][Math.floor(Math.random() * WEATHER_TIPS[type].length)]
      });
    }
    return future;
  }

  const futureWeather = generateFutureWeather(7);

  // --- 将天气注入世界书 ---
  function injectWeatherToWorldbook() {
    if (!window.TavernHelper || !window.TavernHelper.getCharWorldbookNames) return;
    
    try {
      const charWorldbooks = window.TavernHelper.getCharWorldbookNames('current');
      const worldbookName = charWorldbooks.primary || charWorldbooks.additional[0];
      
      if (worldbookName) {
        // 构建注入内容
        let content = `【未来一周天气预报】\n`;
        futureWeather.forEach(w => {
          const dateStr = `${w.date.getMonth() + 1}月${w.date.getDate()}日`;
          content += `${dateStr}：${WEATHER_NAMES[w.type]}，气温${w.tempMin}℃~${w.tempMax}℃，${w.tip}\n`;
        });

        // 使用 updateWorldbookWith 更新或添加条目
        window.TavernHelper.updateWorldbookWith(worldbookName, (worldbook) => {
          const existingEntry = worldbook.find(entry => entry.name === '手机天气预报');
          if (existingEntry) {
            existingEntry.content = content;
          } else {
            worldbook.push({
              name: '手机天气预报',
              content: content,
              enabled: true,
              strategy: { type: 'constant', keys: [] },
              position: { type: 'at_depth', role: 'system', depth: 1, order: 100 },
              extra: { source: 'sillyPhoneWeatherApp' }
            });
          }
          return worldbook;
        }, { render: 'debounced' });
        
        console.log('[天气App] 未来天气已成功注入世界书！');
      }
    } catch (e) {
      console.error('[天气App] 注入世界书失败：', e);
    }
  }

  // 延迟执行注入，避免卡顿
  setTimeout(injectWeatherToWorldbook, 2000);

  // --- UI 渲染 ---
  sillyPhone.registerApp({
    id: 'weather',
    name: '天气',
    emoji: '☀️',
    color: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    onOpen: (phoneScreen) => {
      const appView = document.createElement('div');
      appView.className = 'app-view active';
      appView.style.cssText = 'position: absolute; inset: 0; background: #f0f5fa; z-index: 100; display: flex; flex-direction: column; border-radius: 34px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;';
      
      appView.innerHTML = `
        <style>
          .weather-app { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
          .weather-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
          .weather-search { background: rgba(255,255,255,0.8); border-radius: 12px; padding: 8px 15px; font-size: 14px; color: #333; flex: 1; margin-right: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
          .weather-main-card { margin: 0 20px 15px 20px; background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); border-radius: 24px; padding: 20px; color: #fff; box-shadow: 0 8px 20px rgba(0,0,0,0.1); position: relative; overflow: hidden; flex-shrink: 0; }
          .weather-main-card .city { font-size: 20px; font-weight: 600; margin-bottom: 5px; }
          .weather-main-card .temp { font-size: 64px; font-weight: 300; line-height: 1; margin: 10px 0; }
          .weather-main-card .temp span { font-size: 24px; }
          .weather-main-card .range { font-size: 14px; opacity: 0.9; margin-bottom: 15px; }
          .weather-main-card .tip { font-size: 13px; background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 12px; line-height: 1.4; margin-top: 10px; }
          .weather-main-card .icon-large { position: absolute; right: 20px; top: 20px; font-size: 80px; opacity: 0.8; }
          .weather-details { display: flex; justify-content: space-between; margin-top: 15px; font-size: 12px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); }
          .weather-section { margin: 0 20px; }
          .weather-section-title { font-size: 14px; font-weight: 600; color: #666; margin-bottom: 10px; }
          .trend-container { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; }
          .trend-item { background: #fff; border-radius: 16px; padding: 12px; min-width: 70px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); flex-shrink: 0; }
          .trend-item .time { font-size: 12px; color: #999; margin-bottom: 5px; }
          .trend-item .icon { font-size: 20px; margin-bottom: 5px; }
          .trend-item .temp { font-size: 14px; font-weight: 600; color: #333; }
          
          /* 底部导航 */
          .bottom-nav { display: flex; justify-content: space-around; background: #fff; padding: 10px 0; border-top: 1px solid #e0e0e0; margin-top: auto; flex-shrink: 0; }
          .nav-item { display: flex; flex-direction: column; align-items: center; font-size: 11px; color: #999; cursor: pointer; flex: 1; }
          .nav-item.active { color: #4facfe; }
          .nav-item svg { margin-bottom: 4px; }
          
          /* 日历页面 */
          .calendar-view { display: none; flex-direction: column; height: 100%; padding: 20px; box-sizing: border-box; }
          .calendar-view.active { display: flex; }
          .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .calendar-header h3 { font-size: 18px; margin: 0; color: #333; }
          .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; text-align: center; }
          .calendar-grid .day-name { font-size: 12px; color: #999; margin-bottom: 5px; }
          .calendar-grid .day { padding: 8px 0; border-radius: 50%; font-size: 14px; color: #333; cursor: pointer; position: relative; }
          .calendar-grid .day.today { background: #4facfe; color: #fff; font-weight: 600; }
          .calendar-grid .day.has-weather::after { content: ''; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; background: #ff6b6b; border-radius: 50%; }
          .calendar-detail { margin-top: 20px; background: #fff; border-radius: 16px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
          .calendar-detail .weather-info { display: flex; align-items: center; justify-content: space-between; }
          .calendar-detail .weather-icon { font-size: 40px; }
          .calendar-detail .weather-text { font-size: 14px; color: #666; }
        </style>

        <!-- 天气视图 -->
        <div class="weather-app" id="weather-view">
          <div class="weather-header">
            <div class="weather-search">🔍 搜索城市</div>
          </div>
          
          <div class="weather-main-card">
            <div class="city">${currentCity} · 温暖</div>
            <div class="temp">${currentTemp}<span>°</span></div>
            <div class="range">↑ ${currentTemp + 3}° | ↓ ${currentTemp - 3}°</div>
            <div class="tip">${currentTip}</div>
            <div class="icon-large">${WEATHER_ICONS[currentWeatherType]}</div>
            <div class="weather-details">
              <span>💧 降雨 0%</span>
              <span>💨 风 9 km/h</span>
              <span>☀️ UV 5</span>
            </div>
          </div>

          <div class="weather-section">
            <div class="weather-section-title">今日天气趋势</div>
            <div class="trend-container">
              <div class="trend-item"><div class="time">上午</div><div class="icon">☀️</div><div class="temp">22°~28°</div></div>
              <div class="trend-item"><div class="time">下午</div><div class="icon">🌧️</div><div class="temp">26°~29°</div></div>
              <div class="trend-item"><div class="time">晚上</div><div class="icon">🌙</div><div class="temp">26°~27°</div></div>
              <div class="trend-item"><div class="time">现在</div><div class="icon">☀️</div><div class="temp">27°</div></div>
              <div class="trend-item"><div class="time">15:00</div><div class="icon">☁️</div><div class="temp">28°</div></div>
              <div class="trend-item"><div class="time">16:00</div><div class="icon">🌧️</div><div class="temp">26°</div></div>
              <div class="trend-item"><div class="time">17:00</div><div class="icon">🌧️</div><div class="temp">25°</div></div>
            </div>
          </div>

          <div class="bottom-nav">
            <div class="nav-item active" onclick="switchTab('weather')">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              <span>看天气</span>
            </div>
            <div class="nav-item" onclick="switchTab('calendar')">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>看日历</span>
            </div>
          </div>
        </div>

        <!-- 日历视图 -->
        <div class="calendar-view" id="calendar-view">
          <div class="calendar-header">
            <h3>${currentYear}年${currentMonth + 1}月</h3>
          </div>
          <div class="calendar-grid" id="calendar-days">
            <!-- 动态填充 -->
          </div>
          <div class="calendar-detail">
            <div class="weather-info" id="calendar-weather-info">
              <span class="weather-text">点击日期查看天气</span>
            </div>
          </div>
          <div class="bottom-nav" style="margin-top:auto;">
            <div class="nav-item" onclick="switchTab('weather')">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              <span>看天气</span>
            </div>
            <div class="nav-item active" onclick="switchTab('calendar')">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>看日历</span>
            </div>
          </div>
        </div>
      `;

      phoneScreen.appendChild(appView);

      // --- 初始化日历 ---
      const calendarDays = appView.querySelector('#calendar-days');
      const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
      dayNames.forEach(name => {
        const div = document.createElement('div');
        div.className = 'day-name';
        div.textContent = name;
        calendarDays.appendChild(div);
      });

      const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

      for (let i = 0; i < firstDayOfMonth; i++) {
        const empty = document.createElement('div');
        calendarDays.appendChild(empty);
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.textContent = i;
        
        // 高亮今天
        if (i === today.getDate()) {
          dayDiv.classList.add('today');
        }

        // 绑定天气数据
        const weatherForDay = futureWeather.find(w => w.date.getDate() === i && w.date.getMonth() === currentMonth);
        if (weatherForDay) {
          dayDiv.classList.add('has-weather');
          dayDiv.addEventListener('click', () => {
            const infoDiv = appView.querySelector('#calendar-weather-info');
            infoDiv.innerHTML = `
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="weather-icon">${WEATHER_ICONS[weatherForDay.type]}</span>
                <div>
                  <div style="font-weight:600; color:#333;">${WEATHER_NAMES[weatherForDay.type]}</div>
                  <div style="font-size:12px; color:#666;">气温：${weatherForDay.tempMin}℃ ~ ${weatherForDay.tempMax}℃</div>
                  <div style="font-size:12px; color:#666; margin-top:5px;">${weatherForDay.tip}</div>
                </div>
              </div>
            `;
          });
        }

        calendarDays.appendChild(dayDiv);
      }

      // 初始化默认选中天气
      const todayWeather = futureWeather.find(w => w.date.getDate() === today.getDate());
      if (todayWeather) {
        const infoDiv = appView.querySelector('#calendar-weather-info');
        infoDiv.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="weather-icon">${WEATHER_ICONS[todayWeather.type]}</span>
            <div>
              <div style="font-weight:600; color:#333;">今天 · ${WEATHER_NAMES[todayWeather.type]}</div>
              <div style="font-size:12px; color:#666;">气温：${todayWeather.tempMin}℃ ~ ${todayWeather.tempMax}℃</div>
              <div style="font-size:12px; color:#666; margin-top:5px;">${todayWeather.tip}</div>
            </div>
          </div>
        `;
      }

      // --- 切换 Tab 逻辑 ---
      window.switchTab = (tab) => {
        const weatherView = appView.querySelector('#weather-view');
        const calendarView = appView.querySelector('#calendar-view');
        
        if (tab === 'weather') {
          weatherView.style.display = 'flex';
          calendarView.classList.remove('active');
        } else {
          weatherView.style.display = 'none';
          calendarView.classList.add('active');
        }
      };
    }
  });
}
initWeather();
