// modules/map.js
export function initMap() {
  const sillyPhone = window.sillyPhone;
  if (!sillyPhone) return;

  sillyPhone.registerApp({
    id: 'map',
    name: '地图',
    emoji: '🗺️',
    color: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    onOpen: (phoneScreen) => {
      const appView = document.createElement('div');
      appView.className = 'app-view active';
      appView.style.cssText = 'position: absolute; inset: 0; background: rgba(255,255,255,.97); z-index: 100; display: flex; flex-direction: column; border-radius: 34px;';
      
      appView.innerHTML = `
        <div class="app-view-header" style="height: 50px; display: flex; align-items: center; padding: 0 16px; border-bottom: 1px solid #e0e0e0;">
          <button onclick="this.closest('.app-view').remove()" style="background: none; border: none; font-size: 16px; color: #007aff; cursor: pointer;">← 返回</button>
          <div class="app-view-title" style="flex: 1; text-align: center; font-weight: 600; font-size: 16px; color: #1a1a1a;">地图</div>
        </div>
        <div class="app-view-content" style="flex: 1; padding: 20px; overflow-y: auto; text-align: center;">
          <div style="font-size:64px; margin-top: 20px;">🗺️</div>
          <div style="font-size:18px; margin:10px 0; color: #1a1a1a;">地图应用</div>
          <div style="color:#666; font-size:14px;">这里可以显示地图内容</div>
        </div>
      `;
      phoneScreen.appendChild(appView);
    }
  });
}
initMap();
