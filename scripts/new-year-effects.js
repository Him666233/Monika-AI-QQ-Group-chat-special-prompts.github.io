/**
 * 春节特效系统
 * 飘落的红包、烟花和其他新年效果
 */

class NewYearEffects {
    constructor() {
        this.container = document.getElementById('redEnvelopesContainer');
        this.sparkleContainer = document.getElementById('sparkleParticles');
        this.envelopes = [];

        // 根据设备类型和屏幕尺寸自适应粒子数量
        this.deviceType = this.detectDeviceType();
        this.particleCounts = this.getParticleCounts();

        this.maxEnvelopes = this.particleCounts.envelopes;
        this.maxSparkles = this.particleCounts.sparkles;
        this.init();
    }

    detectDeviceType() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isLandscape = width > height;

        // 极小屏手机
        if (width < 480) return 'tiny-phone';
        // 普通手机
        if (width < 768) return isLandscape ? 'phone-landscape' : 'phone';
        // 平板
        if (width < 1024) return 'tablet';
        // 小屏电脑
        if (width < 1440) return 'small-desktop';
        // 大屏电脑
        return 'large-desktop';
    }

    getParticleCounts() {
        const counts = {
            'tiny-phone': { envelopes: 12, sparkles: 8, fireworkRain: 10 },
            'phone': { envelopes: 20, sparkles: 12, fireworkRain: 15 },
            'phone-landscape': { envelopes: 15, sparkles: 10, fireworkRain: 12 },
            'tablet': { envelopes: 35, sparkles: 20, fireworkRain: 20 },
            'small-desktop': { envelopes: 45, sparkles: 25, fireworkRain: 25 },
            'large-desktop': { envelopes: 60, sparkles: 35, fireworkRain: 35 }
        };

        return counts[this.deviceType] || counts['small-desktop'];
    }

    init() {
        if (!this.container) {
            console.warn('[NewYearEffects] 找不到红包容器');
            return;
        }

        // 创建初始红包
        this.createEnvelopes();

        // 定期添加新红包
        setInterval(() => {
            this.addRandomEnvelope();
        }, 800);

        // 创建闪烁粒子
        this.createSparkles();

        // 添加双击触发烟花雨彩蛋
        this.setupFireworkRainEasterEgg();

        // 窗口大小改变时重新计算粒子数量
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 300);
        });

        console.log('[NewYearEffects] 春节特效已启动');
        console.log(`[NewYearEffects] 设备类型: ${this.deviceType}`);
        console.log(`[NewYearEffects] 粒子配置 - 红包:${this.maxEnvelopes} 闪烁:${this.maxSparkles} 烟花雨:${this.particleCounts.fireworkRain}`);
        console.log('[NewYearEffects] 🧧 彩蛋提示: 双击页面任意位置触发烟花雨!');
    }

    handleResize() {
        const oldDeviceType = this.deviceType;
        this.deviceType = this.detectDeviceType();

        // 如果设备类型改变（如旋转屏幕），调整粒子数量
        if (oldDeviceType !== this.deviceType) {
            this.particleCounts = this.getParticleCounts();
            this.maxEnvelopes = this.particleCounts.envelopes;
            this.maxSparkles = this.particleCounts.sparkles;

            console.log(`[NewYearEffects] 设备类型改变: ${oldDeviceType} → ${this.deviceType}`);
            console.log(`[NewYearEffects] 新粒子配置 - 红包:${this.maxEnvelopes} 闪烁:${this.maxSparkles}`);
        }
    }

    setupFireworkRainEasterEgg() {
        let lastClickTime = 0;
        const doubleClickDelay = 400;

        // 桌面端：click检测双击
        document.addEventListener('click', (e) => {
            const now = Date.now();
            if (now - lastClickTime < doubleClickDelay) {
                // 双击触发
                this.createFireworkRain(e.clientX, e.clientY);
            }
            lastClickTime = now;
        });

        // 移动端：touchend检测双击（更灵敏）
        let lastTapTime = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            const touch = e.changedTouches[0];
            if (!touch) return;
            if (now - lastTapTime < doubleClickDelay) {
                this.createFireworkRain(touch.clientX, touch.clientY);
                lastTapTime = 0; // 防止连续触发
                return;
            }
            lastTapTime = now;
        });

        // 鼠标移动时偶尔生成小福字轨迹
        let lastTrailTime = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            // 降低概率到15%，减少频率到200ms
            if (now - lastTrailTime > 200 && Math.random() < 0.15) {
                this.createMouseTrailBlessing(e.clientX, e.clientY);
                lastTrailTime = now;
            }
        });

        // 移动端：触摸移动时生成福字轨迹
        let lastTouchTrailTime = 0;
        document.addEventListener('touchmove', (e) => {
            const now = Date.now();
            const touch = e.touches[0];
            if (!touch) return;
            // 频率稍低，概率稍低，避免移动端性能问题
            if (now - lastTouchTrailTime > 300 && Math.random() < 0.1) {
                this.createMouseTrailBlessing(touch.clientX, touch.clientY);
                lastTouchTrailTime = now;
            }
        }, { passive: true });
    }

    createMouseTrailBlessing(x, y) {
        const blessing = document.createElement('div');
        blessing.className = 'mouse-trail-blessing';
        const blessings = ['福', '🧧', '🏮'];
        blessing.innerHTML = blessings[Math.floor(Math.random() * blessings.length)];
        blessing.style.left = `${x}px`;
        blessing.style.top = `${y}px`;
        blessing.style.color = ['#dc143c', '#ffd700', '#ff6b6b'][Math.floor(Math.random() * 3)];

        document.body.appendChild(blessing);

        setTimeout(() => {
            if (blessing.parentNode) {
                blessing.parentNode.removeChild(blessing);
            }
        }, 1000);
    }

    createFireworkRain(centerX, centerY) {
        const fireworkCount = this.particleCounts.fireworkRain;
        const colors = ['#dc143c', '#ffd700', '#ff6b6b', '#ffdf00', '#dc143c'];
        const emojis = ['✨', '🎆', '🎇', '💫', '🧧', '🏮'];

        for (let i = 0; i < fireworkCount; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.className = 'firework-rain';
                firework.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];

                // 随机颜色
                firework.style.color = colors[Math.floor(Math.random() * colors.length)];

                // 从中心向四周散开
                const angle = (Math.PI * 2 * i) / fireworkCount + (Math.random() - 0.5) * 0.5;
                const distance = 50 + Math.random() * 100;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;

                firework.style.left = `${x}px`;
                firework.style.top = `${y}px`;
                firework.style.fontSize = `${16 + Math.random() * 20}px`;

                document.body.appendChild(firework);

                setTimeout(() => {
                    if (firework.parentNode) {
                        firework.parentNode.removeChild(firework);
                    }
                }, 2000);
            }, i * 30);
        }
    }

    createEnvelopes() {
        for (let i = 0; i < this.maxEnvelopes; i++) {
            setTimeout(() => {
                this.createEnvelope(Math.random() * 100);
            }, i * 200);
        }
    }

    // 创建闪烁粒子
    createSparkles() {
        if (!this.sparkleContainer) return;

        for (let i = 0; i < this.maxSparkles; i++) {
            setTimeout(() => {
                this.createSparkle();
            }, i * 200);
        }
    }

    createSparkle() {
        if (!this.sparkleContainer) return;

        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';

        // 随机位置
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.top = `${Math.random() * 100}%`;

        // 随机动画延迟
        sparkle.style.animationDelay = `${Math.random() * 3}s`;

        // 随机大小
        const size = 3 + Math.random() * 3;
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;

        this.sparkleContainer.appendChild(sparkle);
    }

    createEnvelope(leftPercent, delay = 0) {
        const envelope = document.createElement('div');
        envelope.className = 'red-envelope';

        // 随机位置
        const left = leftPercent !== undefined ? leftPercent : Math.random() * 100;
        envelope.style.left = `${left}%`;

        // 随机大小
        const width = 8 + Math.random() * 8;
        const height = width * 1.3;
        envelope.style.width = `${width}px`;
        envelope.style.height = `${height}px`;

        // 随机动画时长(10-20秒)
        const duration = 10 + Math.random() * 10;
        envelope.style.animationDuration = `${duration}s`;

        // 随机延迟
        if (delay > 0) {
            envelope.style.animationDelay = `${delay}s`;
        } else {
            envelope.style.animationDelay = `${Math.random() * 5}s`;
        }

        // 随机水平偏移
        const randomX = (Math.random() - 0.5) * 200;
        envelope.style.setProperty('--envelope-x-offset', `${randomX}px`);

        this.container.appendChild(envelope);

        // 动画结束后移除并创建新红包
        envelope.addEventListener('animationend', () => {
            if (envelope.parentNode) {
                envelope.parentNode.removeChild(envelope);
            }
            // 创建新红包保持总数
            this.createEnvelope();
        });
    }

    addRandomEnvelope() {
        if (this.container.children.length < this.maxEnvelopes) {
            this.createEnvelope();
        }
    }

    // 创建特殊的红包爆发效果
    createEnvelopeBurst(x, y) {
        const burstCount = 15;
        for (let i = 0; i < burstCount; i++) {
            const envelope = document.createElement('div');
            envelope.className = 'red-envelope-burst';
            envelope.style.left = `${x}px`;
            envelope.style.top = `${y}px`;

            const angle = (Math.PI * 2 * i) / burstCount;
            const velocity = 100 + Math.random() * 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            envelope.style.setProperty('--burst-vx', `${vx}px`);
            envelope.style.setProperty('--burst-vy', `${vy}px`);
            envelope.style.animationDelay = `${i * 0.02}s`;

            document.body.appendChild(envelope);

            setTimeout(() => {
                if (envelope.parentNode) {
                    envelope.parentNode.removeChild(envelope);
                }
            }, 2000);
        }
    }
}

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    window.newYearEffects = new NewYearEffects();
});
