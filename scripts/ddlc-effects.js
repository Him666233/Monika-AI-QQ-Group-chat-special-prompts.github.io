/**
 * DDLC风格特效（简化版）
 * 减少性能消耗，保留核心特效
 */

class DDLCEffects {
    constructor() {
        this.init();
    }

    init() {
        // 简化：只保留彩蛋功能
        this.addEasterEggs();
        // 随机故障效果（大幅降低频率）
        this.scheduleRandomGlitch();
    }

    scheduleRandomGlitch() {
        // 每30-90秒可能触发一次，概率20%
        const triggerGlitch = () => {
            const delay = 30000 + Math.random() * 60000;
            setTimeout(() => {
                if (Math.random() < 0.2) {
                    this.performSimpleGlitch();
                }
                triggerGlitch();
            }, delay);
        };
        triggerGlitch();
    }

    performSimpleGlitch() {
        // 简单的文字闪烁效果
        const titles = document.querySelectorAll('h2');
        if (titles.length > 0) {
            const randomTitle = titles[Math.floor(Math.random() * titles.length)];
            randomTitle.classList.add('glitch-text');
            setTimeout(() => {
                randomTitle.classList.remove('glitch-text');
            }, 400);
        }
    }

    addEasterEggs() {
        // Konami Code
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
                          'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
                          'KeyB', 'KeyA'];
        let konamiIndex = 0;

        document.addEventListener('keydown', (e) => {
            if (e.code === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    this.triggerMonikaSpecial();
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        });

        // 点击莫妮卡头像5次
        const monikaCard = document.querySelector('.character-card:last-child');
        if (monikaCard) {
            let clickCount = 0;
            let lastClickTime = 0;

            monikaCard.addEventListener('click', () => {
                const now = Date.now();
                if (now - lastClickTime > 2000) {
                    clickCount = 0;
                }
                lastClickTime = now;
                clickCount++;

                if (clickCount >= 5) {
                    this.triggerMonikaSpecial();
                    clickCount = 0;
                }
            });
        }
    }

    triggerMonikaSpecial() {
        const message = document.createElement('div');
        message.innerHTML = '<p style="color:white;font-size:2.5rem;font-family:serif;text-align:center;">Just Monika.</p>';
        message.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            cursor: pointer;
            animation: fadeIn 0.5s ease;
        `;

        document.body.appendChild(message);

        const close = () => {
            message.style.opacity = '0';
            message.style.transition = 'opacity 0.3s';
            setTimeout(() => message.remove(), 300);
        };

        message.addEventListener('click', close);
        setTimeout(close, 4000);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    window.ddlcEffects = new DDLCEffects();
});
