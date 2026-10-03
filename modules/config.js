// modules/config.js
export function initSettings() {
  const sillyPhone = window.sillyPhone;
  if (!sillyPhone) return;

  sillyPhone.registerApp({
    id: 'settings',
    name: '设置',
    emoji: '⚙️',
    color: 'linear-gradient(135deg, #a4b9cc, #78909c)',
    onOpen: (phoneScreen) => {
      const appView = document.createElement('div');
      appView.className = 'app-view active';
      appView.style.cssText = 'position: absolute; inset: 0; background: rgba(255,255,255,.97); z-index: 100; display: flex; flex-direction: column; border-radius: 34px;';
      
      appView.innerHTML = `
        <div class="app-view-header" style="height: 50px; display: flex; align-items: center; padding: 0 16px; border-bottom: 1px solid #e0e0e0;">
          <button onclick="this.closest('.app-view').remove()" style="background: none; border: none; font-size: 16px; color: #007aff; cursor: pointer;">← 返回</button>
          <div class="app-view-title" style="flex: 1; text-align: center; font-weight: 600; font-size: 16px; color: #1a1a1a;">设置</div>
        </div>
        <div class="app-view-content" style="flex: 1; padding: 20px; padding-bottom: 60px; overflow-y: auto;">
          <label style="font-size:14px; font-weight:600; margin-bottom:8px; display:block; color:#333;">手机背景</label>
          <label class="setting-btn" style="display: block; width: 100%; padding: 12px; border-radius: 10px; background: #f0f2f5; color: #1a1a1a; border: 1px solid #d0d5dd; cursor: pointer; font-size: 14px; text-align: center; margin-bottom: 16px;">
            选择相册图片
            <input type="file" accept="image/*" id="setting-bg-file" style="display: none;">
          </label>

          <label style="font-size:14px; font-weight:600; margin-bottom:8px; display:block; color:#333;">天气图标</label>
          <label class="setting-btn" style="display: block; width: 100%; padding: 12px; border-radius: 10px; background: #f0f2f5; color: #1a1a1a; border: 1px solid #d0d5dd; cursor: pointer; font-size: 14px; text-align: center; margin-bottom: 16px;">
            选择相册图片
            <input type="file" accept="image/*" id="setting-icon-weather" style="display: none;">
          </label>
          
          <label style="font-size:14px; font-weight:600; margin-bottom:8px; display:block; color:#333;">地图图标</label>
          <label class="setting-btn" style="display: block; width: 100%; padding: 12px; border-radius: 10px; background: #f0f2f5; color: #1a1a1a; border: 1px solid #d0d5dd; cursor: pointer; font-size: 14px; text-align: center; margin-bottom: 16px;">
            选择相册图片
            <input type="file" accept="image/*" id="setting-icon-map" style="display: none;">
          </label>
          
          <label style="font-size:14px; font-weight:600; margin-bottom:8px; display:block; color:#333;">设置图标</label>
          <label class="setting-btn" style="display: block; width: 100%; padding: 12px; border-radius: 10px; background: #f0f2f5; color: #1a1a1a; border: 1px solid #d0d5dd; cursor: pointer; font-size: 14px; text-align: center; margin-bottom: 16px;">
            选择相册图片
            <input type="file" accept="image/*" id="setting-icon-settings" style="display: none;">
          </label>
          
          <div style="font-size:12px; color:#888; margin-top:10px; line-height:1.5;">
            * 选图后双指捏合或滚轮缩放，自由拖动图片选择区域。
            * 确定后，原封不动印上去，绝不压缩变形。
          </div>
        </div>
      `;
      phoneScreen.appendChild(appView);

      // 延迟绑定事件，确保 DOM 已插入
      setTimeout(() => {
        const phoneRatio = phoneScreen.clientHeight / phoneScreen.clientWidth;
        
        const handleImageUpload = (inputId, targetType, targetElement) => {
          const input = appView.querySelector(inputId);
          if (!input) return;
          input.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
              // 背景图比例和手机屏幕一致，图标比例 1:1
              const ratioStr = targetType === 'background' ? `1/${phoneRatio.toFixed(3)}` : '1/1';
              
              // 调用主脚本暴露出来的编辑器
              sillyPhone.openImageEditor(ev.target.result, ratioStr, (transform) => {
                const { x, y, scale, editorWidth } = transform;
                
                if (targetType === 'background') {
                  const screenBgLayer = sillyPhone.phoneScreen.querySelector('.screen-bg-layer') || (() => {
                    const img = document.createElement('img');
                    img.className = 'screen-bg-layer';
                    img.style.cssText = 'position: absolute; top: 50%; left: 50%; transform-origin: center center; z-index: 0; display: block;';
                    sillyPhone.phoneScreen.insertBefore(img, sillyPhone.phoneScreen.firstChild);
                    return img;
                  })();
                  
                  screenBgLayer.src = ev.target.result;
                  sillyPhone.phoneScreen.style.background = 'none';
                  
                  screenBgLayer.onload = () => {
                    const imgAspect = screenBgLayer.naturalWidth / screenBgLayer.naturalHeight;
                    const containerAspect = sillyPhone.phoneScreen.clientWidth / sillyPhone.phoneScreen.clientHeight;
                    if (imgAspect > containerAspect) { screenBgLayer.style.width = 'auto'; screenBgLayer.style.height = '100%'; }
                    else { screenBgLayer.style.width = '100%'; screenBgLayer.style.height = 'auto'; }
                    
                    const factor = sillyPhone.phoneScreen.clientWidth / editorWidth;
                    screenBgLayer.style.transform = `translate(calc(-50% + ${x * factor}px), calc(-50% + ${y * factor}px)) scale(${scale})`;
                  };
                } else {
                  const emojiLayer = targetElement.querySelector('.emoji-layer');
                  const customImg = targetElement.querySelector('.custom-img');
                  
                  emojiLayer.style.display = 'none';
                  customImg.src = ev.target.result;
                  customImg.style.display = 'block';
                  
                  customImg.onload = () => {
                    const imgAspect = customImg.naturalWidth / customImg.naturalHeight;
                    if (imgAspect > 1) { customImg.style.width = 'auto'; customImg.style.height = '100%'; }
                    else { customImg.style.width = '100%'; customImg.style.height = 'auto'; }
                    
                    const factor = 56 / editorWidth;
                    customImg.style.transform = `translate(calc(-50% + ${x * factor}px), calc(-50% + ${y * factor}px)) scale(${scale})`;
                  };
                }
                if (window.toastr) toastr.success('已应用');
              });
            };
            reader.readAsDataURL(file);
          });
        };

        handleImageUpload('#setting-bg-file', 'background', null);
        
        const weatherBox = sillyPhone.iconGrid.querySelector('[data-app-id="weather"] .icon-box');
        handleImageUpload('#setting-icon-weather', 'icon', weatherBox);
        
        const mapBox = sillyPhone.iconGrid.querySelector('[data-app-id="map"] .icon-box');
        handleImageUpload('#setting-icon-map', 'icon', mapBox);
        
        const settingsBox = sillyPhone.iconGrid.querySelector('[data-app-id="settings"] .icon-box');
        handleImageUpload('#setting-icon-settings', 'icon', settingsBox);
        
      }, 50);
    }
  });
}
initSettings();
