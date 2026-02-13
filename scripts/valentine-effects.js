/**
 * 情人节特效系统
 * 飘落的玫瑰花瓣和其他浪漫效果
 */

class ValentineEffects {
    constructor() {
        this.container = document.getElementById('rosePetalsContainer');
        this.sparkleContainer = document.getElementById('sparkleParticles');
        this.petals = [];

        // 根据设备类型和屏幕尺寸自适应粒子数量
        this.deviceType = this.detectDeviceType();
        this.particleCounts = this.getParticleCounts();

        this.maxPetals = this.particleCounts.petals;
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
            'tiny-phone': { petals: 12, sparkles: 8, heartRain: 10 },
            'phone': { petals: 20, sparkles: 12, heartRain: 15 },
            'phone-landscape': { petals: 15, sparkles: 10, heartRain: 12 },
            'tablet': { petals: 35, sparkles: 20, heartRain: 20 },
            'small-desktop': { petals: 45, sparkles: 25, heartRain: 25 },
            'large-desktop': { petals: 60, sparkles: 35, heartRain: 35 }
        };

        return counts[this.deviceType] || counts['small-desktop'];
    }

    init() {
        if (!this.container) {
            console.warn('[ValentineEffects] 找不到玫瑰花瓣容器');
            return;
        }

        // 创建初始花瓣
        this.createPetals();

        // 定期添加新花瓣
        setInterval(() => {
            this.addRandomPetal();
        }, 800);

        // 创建闪烁粒子
        this.createSparkles();

        // 添加双击触发爱心雨彩蛋
        this.setupHeartRainEasterEgg();

        // 窗口大小改变时重新计算粒子数量
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 300);
        });

        console.log('[ValentineEffects] 情人节特效已启动');
        console.log(`[ValentineEffects] 设备类型: ${this.deviceType}`);
        console.log(`[ValentineEffects] 粒子配置 - 花瓣:${this.maxPetals} 闪烁:${this.maxSparkles} 爱心雨:${this.particleCounts.heartRain}`);
        console.log('[ValentineEffects] 💝 彩蛋提示: 双击页面任意位置触发爱心雨!');
    }

    handleResize() {
        const oldDeviceType = this.deviceType;
        this.deviceType = this.detectDeviceType();

        // 如果设备类型改变（如旋转屏幕），调整粒子数量
        if (oldDeviceType !== this.deviceType) {
            this.particleCounts = this.getParticleCounts();
            this.maxPetals = this.particleCounts.petals;
            this.maxSparkles = this.particleCounts.sparkles;

            console.log(`[ValentineEffects] 设备类型改变: ${oldDeviceType} → ${this.deviceType}`);
            console.log(`[ValentineEffects] 新粒子配置 - 花瓣:${this.maxPetals} 闪烁:${this.maxSparkles}`);
        }
    }

    setupHeartRainEasterEgg() {
        let lastClickTime = 0;
        const doubleClickDelay = 400;

        // 桌面端：click检测双击
        document.addEventListener('click', (e) => {
            const now = Date.now();
            if (now - lastClickTime < doubleClickDelay) {
                // 双击触发
                this.createHeartRain(e.clientX, e.clientY);
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
                this.createHeartRain(touch.clientX, touch.clientY);
                lastTapTime = 0; // 防止连续触发
                return;
            }
            lastTapTime = now;
        });

        // 鼠标移动时偶尔生成小爱心轨迹
        let lastTrailTime = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            // 降低概率到15%，减少频率到200ms
            if (now - lastTrailTime > 200 && Math.random() < 0.15) {
                this.createMouseTrailHeart(e.clientX, e.clientY);
                lastTrailTime = now;
            }
        });

        // 移动端：触摸移动时生成爱心轨迹
        let lastTouchTrailTime = 0;
        document.addEventListener('touchmove', (e) => {
            const now = Date.now();
            const touch = e.touches[0];
            if (!touch) return;
            // 频率稍低，概率稍低，避免移动端性能问题
            if (now - lastTouchTrailTime > 300 && Math.random() < 0.1) {
                this.createMouseTrailHeart(touch.clientX, touch.clientY);
                lastTouchTrailTime = now;
            }
        }, { passive: true });
    }

    createMouseTrailHeart(x, y) {
        const heart = document.createElement('div');
        heart.className = 'mouse-trail-heart';
        heart.innerHTML = '♥';
        heart.style.left = `${x}px`;
        heart.style.top = `${y}px`;
        heart.style.color = ['#ff1493', '#ff69b4', '#ff85c1'][Math.floor(Math.random() * 3)];

        document.body.appendChild(heart);

        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 1000);
    }

    createHeartRain(centerX, centerY) {
        const heartCount = this.particleCounts.heartRain;
        const colors = ['#ff1493', '#ff69b4', '#ff85c1', '#ffb6c1', '#ff1493'];

        for (let i = 0; i < heartCount; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'heart-rain';
                heart.innerHTML = '♥';

                // 随机颜色
                heart.style.color = colors[Math.floor(Math.random() * colors.length)];

                // 从中心向四周散开
                const angle = (Math.PI * 2 * i) / heartCount + (Math.random() - 0.5) * 0.5;
                const distance = 50 + Math.random() * 100;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;

                heart.style.left = `${x}px`;
                heart.style.top = `${y}px`;
                heart.style.fontSize = `${16 + Math.random() * 20}px`;

                document.body.appendChild(heart);

                setTimeout(() => {
                    if (heart.parentNode) {
                        heart.parentNode.removeChild(heart);
                    }
                }, 2000);
            }, i * 30);
        }
    }

    createPetals() {
        for (let i = 0; i < this.maxPetals; i++) {
            setTimeout(() => {
                this.createPetal(Math.random() * 100);
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

    createPetal(leftPercent, delay = 0) {
        const petal = document.createElement('div');
        petal.className = 'rose-petal';

        // 随机位置
        const left = leftPercent !== undefined ? leftPercent : Math.random() * 100;
        petal.style.left = `${left}%`;

        // 随机大小
        const size = 8 + Math.random() * 8;
        petal.style.width = `${size}px`;
        petal.style.height = `${size}px`;

        // 随机动画时长(10-20秒)
        const duration = 10 + Math.random() * 10;
        petal.style.animationDuration = `${duration}s`;

        // 随机延迟
        if (delay > 0) {
            petal.style.animationDelay = `${delay}s`;
        } else {
            petal.style.animationDelay = `${Math.random() * 5}s`;
        }

        // 随机水平偏移
        const randomX = (Math.random() - 0.5) * 200;
        petal.style.setProperty('--petal-x-offset', `${randomX}px`);

        this.container.appendChild(petal);

        // 动画结束后移除并创建新花瓣
        petal.addEventListener('animationend', () => {
            if (petal.parentNode) {
                petal.parentNode.removeChild(petal);
            }
            // 创建新花瓣保持总数
            this.createPetal();
        });
    }

    addRandomPetal() {
        if (this.container.children.length < this.maxPetals) {
            this.createPetal();
        }
    }

    // 创建特殊的玫瑰爆发效果
    createRoseBurst(x, y) {
        const burstCount = 15;
        for (let i = 0; i < burstCount; i++) {
            const petal = document.createElement('div');
            petal.className = 'rose-burst-petal';
            petal.style.left = `${x}px`;
            petal.style.top = `${y}px`;

            const angle = (Math.PI * 2 * i) / burstCount;
            const velocity = 100 + Math.random() * 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            petal.style.setProperty('--burst-vx', `${vx}px`);
            petal.style.setProperty('--burst-vy', `${vy}px`);
            petal.style.animationDelay = `${i * 0.02}s`;

            document.body.appendChild(petal);

            setTimeout(() => {
                if (petal.parentNode) {
                    petal.parentNode.removeChild(petal);
                }
            }, 2000);
        }
    }
}

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    window.valentineEffects = new ValentineEffects();
});
