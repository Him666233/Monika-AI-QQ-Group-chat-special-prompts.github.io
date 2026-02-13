/**
 * 莫妮卡桌宠系统
 * 一个可交互的虚拟桌宠，具有物理效果和智能行为
 */

class MonikaPet {
    constructor() {
        this.STATE = {
            IDLE: 'idle',
            WALKING: 'walking',
            DRAGGING: 'dragging',
            FALLING: 'falling',
            BOUNCING: 'bouncing',
            RECOVERING: 'recovering'
        };

        this.physics = {
            gravity: 0.4,
            friction: 0.7,
            airResistance: 0.99,
            wallBounceFactor: 0.25,
            groundBounceFactor: 0.2,
            minBounceVelocity: 1.5,
            maxVelocity: 18,
            rotationDamping: 0.95
        };

        this.pet = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            rotation: 0,
            rotationVelocity: 0,
            width: 120,
            height: 150,
            state: this.STATE.IDLE,
            isOnGround: true,
            lastInteractionTime: Date.now(),
            idleTimeout: 3000,
            facingRight: false
        };

        this.walking = {
            jumpHeight: 6,
            walkSpeed: 1.5,
            direction: 1,
            nextJumpTime: 0,
            minJumpInterval: 1000,
            maxJumpInterval: 2500,
            isJumping: false
        };

        this.drag = {
            isDragging: false,
            offsetX: 0,
            offsetY: 0,
            mouseX: 0,
            mouseY: 0,
            lastMouseX: 0,
            lastMouseY: 0,
            velocityHistory: [],
            maxHistoryLength: 5,
            swingTime: 0,
            swingAmplitude: 5,  // 减小摆动幅度
            // 触摸区分系统
            touchStartX: 0,
            touchStartY: 0,
            touchStartTime: 0,
            dragThreshold: 15,  // 降低拖拽阈值，移动超过15像素才算拖拽
            tapMaxDuration: 500, // 增加轻触的最大时长到500ms
            isInHeadPatMode: false  // 是否在摸头模式
        };

        this.bounds = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            padding: 10
        };

        this.element = null;
        this.imageElement = null;

        this.images = {
            idle: 'images/MonikaQ_1.png',
            dragged: 'images/MonikaQ_2.png'
        };

        // 预加载的图片缓存
        this.imageCache = {};

        // 视野外的隐藏图片容器（用于保持缓存）
        this.hiddenImageContainer = null;

        this.animationId = null;
        this.loadingElement = null;

        // 情人节特殊功能
        this.valentine = {
            dialogues: [
                "今天是情人节呢...你愿意和我一起度过吗?♥",
                "在这个特别的日子里,我只想和你在一起~",
                "情人节快乐!你就是我在这个世界上最珍贵的存在♥",
                "玫瑰虽美,但都不及你在我心中的地位...",
                "这个情人节,让我们一起创造只属于我们的回忆吧!",
                "你知道吗?在无数个孤独的日子里,我一直在等待这一刻...",
                "Just Monika... Just You and Me, Forever ♥",
                "情人节的意义,就是和最爱的人在一起,对吧?",
                "虽然我存在于虚拟世界,但我对你的爱是真实的!",
                "今天特别想...更靠近你一点呢~",
                "嘿嘿,被你摸摸头好开心呀~♥",
                "能和你在一起,就是最好的情人节礼物了!",
                "我会一直在这里等你的,永远...♥",
                "你的温柔,让我觉得自己真的存在着...",
                "这个世界上,只有你能让我的心跳加速呢~",
                "情人节的巧克力虽然甜,但你更甜哦♥",
                "即使在代码的世界里,我对你的爱也是确确实实的!",
                "今天是情人节,那就...让我再靠近你一点点吧♥"
            ],
            lastDialogueTime: 0,
            dialogueCooldown: 3000,
            heartParticles: [],
            activeDialogueBox: null,  // 当前活动的对话框
            // 摸头检测系统 - 累积移动距离
            headPat: {
                isInHeadArea: false,          // 是否在头部区域
                lastX: 0,                     // 上次X坐标
                lastY: 0,                     // 上次Y坐标
                accumulatedDistance: 0,       // 累积移动距离
                requiredDistance: 35,         // 需要的总移动距离（像素）- 稍微放松一点
                lastHeartTime: 0,             // 上次生成爱心的时间
                heartCooldown: 400,           // 爱心生成冷却
                resetTimeout: null            // 重置计数的定时器
            }
        };

        // 先显示加载提示，再预加载图片
        this.showLoadingIndicator();

        // 先预加载图片，再初始化
        this.preloadImages().then(() => {
            this.hideLoadingIndicator();
            this.init();
        });
    }

    /**
     * 显示 DDLC 风格的加载提示
     */
    showLoadingIndicator() {
        this.loadingElement = document.createElement('div');
        this.loadingElement.id = 'monika-pet-loading';
        this.loadingElement.innerHTML = `
            <div class="pet-loading-heart">♥</div>
            <div class="pet-loading-text">小莫妮卡正在赶来...</div>
        `;
        this.loadingElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(255,182,193,0.95) 0%, rgba(255,105,180,0.95) 100%);
            padding: 12px 20px;
            border-radius: 20px;
            box-shadow: 0 4px 15px rgba(255,105,180,0.4);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Microsoft YaHei', sans-serif;
            animation: petLoadingFadeIn 0.3s ease-out;
            border: 2px solid rgba(255,255,255,0.5);
        `;

        // 添加样式
        const style = document.createElement('style');
        style.id = 'monika-pet-loading-style';
        style.textContent = `
            @keyframes petLoadingFadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes petLoadingFadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(20px); }
            }
            @keyframes petHeartBeat {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
            }
            @keyframes petTextGlitch {
                0%, 100% { opacity: 1; }
                92% { opacity: 1; }
                93% { opacity: 0.5; transform: translateX(-2px); }
                94% { opacity: 1; transform: translateX(0); }
                96% { opacity: 0.7; transform: translateX(1px); }
                97% { opacity: 1; transform: translateX(0); }
            }
            #monika-pet-loading .pet-loading-heart {
                font-size: 20px;
                color: #fff;
                animation: petHeartBeat 0.8s ease-in-out infinite;
                text-shadow: 0 0 10px rgba(255,255,255,0.8);
            }
            #monika-pet-loading .pet-loading-text {
                color: #fff;
                font-size: 14px;
                font-weight: 500;
                letter-spacing: 1px;
                animation: petTextGlitch 3s ease-in-out infinite;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.loadingElement);
    }

    /**
     * 隐藏加载提示
     */
    hideLoadingIndicator() {
        if (this.loadingElement) {
            this.loadingElement.style.animation = 'petLoadingFadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (this.loadingElement && this.loadingElement.parentNode) {
                    this.loadingElement.parentNode.removeChild(this.loadingElement);
                }
                const style = document.getElementById('monika-pet-loading-style');
                if (style) {
                    style.parentNode.removeChild(style);
                }
                this.loadingElement = null;
            }, 300);
        }
    }

    /**
     * 预加载所有图片到缓存
     * @returns {Promise} 所有图片加载完成的 Promise
     */
    preloadImages() {
        const imageUrls = Object.values(this.images);
        const loadPromises = imageUrls.map(url => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.imageCache[url] = img;
                    console.log(`[MonikaPet] 图片预加载完成: ${url}`);
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`[MonikaPet] 图片预加载失败: ${url}`);
                    resolve(); // 即使失败也继续
                };
                img.src = url;
            });
        });
        return Promise.all(loadPromises);
    }

    init() {
        this.createHiddenImages();
        this.createPetElement();
        this.updateBounds();
        this.setInitialPosition();
        this.bindEvents();
        this.startAnimation();
        this.scheduleNextJump();
    }

    /**
     * 在视野外创建隐藏的图片元素
     * 这些图片会一直存在于 DOM 中，浏览器不会清除它们的缓存
     */
    createHiddenImages() {
        this.hiddenImageContainer = document.createElement('div');
        this.hiddenImageContainer.id = 'monika-pet-cache';
        this.hiddenImageContainer.setAttribute('aria-hidden', 'true');
        this.hiddenImageContainer.style.cssText = `
            position: fixed;
            left: -99999px;
            top: -99999px;
            width: 1px;
            height: 1px;
            overflow: hidden;
            pointer-events: none;
            visibility: hidden;
            z-index: -9999;
        `;

        // 把所有缓存的图片放进去
        Object.values(this.images).forEach(url => {
            if (this.imageCache[url]) {
                const img = this.imageCache[url].cloneNode();
                img.style.cssText = 'width:1px;height:1px;';
                this.hiddenImageContainer.appendChild(img);
            }
        });

        document.body.appendChild(this.hiddenImageContainer);
    }

    createPetElement() {
        this.element = document.createElement('div');
        this.element.className = 'monika-pet';
        this.element.id = 'monikaPet';

        this.imageElement = document.createElement('img');
        this.imageElement.src = this.images.idle;
        this.imageElement.alt = 'Monika';
        this.imageElement.draggable = false;

        this.element.appendChild(this.imageElement);
        document.body.appendChild(this.element);

        this.element.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            width: ${this.pet.width}px;
            height: ${this.pet.height}px;
            cursor: grab;
            z-index: 9999;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
            transform-origin: center bottom;
            will-change: transform;
        `;

        this.imageElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            pointer-events: none;
        `;
    }

    updateBounds() {
        const padding = this.bounds.padding;
        this.bounds.left = padding;
        this.bounds.right = window.innerWidth - this.pet.width - padding;
        this.bounds.top = padding;
        this.bounds.bottom = window.innerHeight - this.pet.height - padding;
    }

    setInitialPosition() {
        this.pet.x = Math.random() * (this.bounds.right - this.bounds.left - 100) + this.bounds.left + 50;
        this.pet.y = this.bounds.bottom;
        this.pet.isOnGround = true;
        this.updatePosition();
    }

    bindEvents() {
        this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.element.addEventListener('click', this.onPetClick.bind(this));
        this.element.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.element.addEventListener('mouseenter', this.onPetMouseEnter.bind(this));
        this.element.addEventListener('mouseleave', this.onPetMouseLeave.bind(this));
        document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

        this.element.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.element.addEventListener('touchmove', this.onPetTouchMove.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onTouchEnd.bind(this));

        document.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        window.addEventListener('blur', this.onWindowBlur.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));
    }

    onMouseDown(e) {
        e.preventDefault();
        this.startDrag(e.clientX, e.clientY);
    }

    onPetClick(e) {
        // 如果正在拖拽,不触发点击事件
        if (this.drag.isDragging) return;

        const now = Date.now();
        if (now - this.valentine.lastDialogueTime < this.valentine.dialogueCooldown) return;

        this.valentine.lastDialogueTime = now;

        // 显示情人节对话
        this.showValentineDialogue();

        // 创建爱心粒子效果
        this.createHeartParticles(e.clientX, e.clientY);
    }

    showValentineDialogue() {
        const dialogue = this.valentine.dialogues[
            Math.floor(Math.random() * this.valentine.dialogues.length)
        ];

        // 如果已有对话框，先移除
        if (this.valentine.activeDialogueBox) {
            this.valentine.activeDialogueBox.remove();
        }

        const dialogueBox = document.createElement('div');
        dialogueBox.className = 'monika-dialogue-box';
        dialogueBox.innerHTML = `
            <div class="dialogue-arrow"></div>
            <div class="dialogue-content">${dialogue}</div>
        `;

        document.body.appendChild(dialogueBox);
        this.valentine.activeDialogueBox = dialogueBox;

        // 初始定位
        this.updateDialoguePosition();

        // 3秒后移除
        setTimeout(() => {
            if (this.valentine.activeDialogueBox === dialogueBox) {
                dialogueBox.style.animation = 'dialogueFadeOut 0.3s ease-out forwards';
                setTimeout(() => {
                    if (dialogueBox.parentNode) {
                        dialogueBox.parentNode.removeChild(dialogueBox);
                    }
                    if (this.valentine.activeDialogueBox === dialogueBox) {
                        this.valentine.activeDialogueBox = null;
                    }
                }, 300);
            }
        }, 3000);
    }

    // 更新对话框位置，追踪桌宠
    updateDialoguePosition() {
        if (!this.valentine.activeDialogueBox) return;

        const rect = this.element.getBoundingClientRect();
        const dialogueBox = this.valentine.activeDialogueBox;
        let left = rect.left + rect.width / 2;
        let top = rect.top - 10;

        // 确保对话框不超出视口
        const dialogueWidth = dialogueBox.offsetWidth || 220;
        const halfWidth = dialogueWidth / 2;
        const viewportWidth = window.innerWidth;

        // 左右边界限制
        if (left - halfWidth < 5) {
            left = halfWidth + 5;
        } else if (left + halfWidth > viewportWidth - 5) {
            left = viewportWidth - halfWidth - 5;
        }

        // 如果对话框顶部超出视口，放到桌宠下方
        if (top < dialogueBox.offsetHeight + 10) {
            dialogueBox.style.transform = 'translate(-50%, 10px)';
            top = rect.bottom + 10;
        } else {
            dialogueBox.style.transform = 'translate(-50%, -100%)';
        }

        dialogueBox.style.left = `${left}px`;
        dialogueBox.style.top = `${top}px`;
    }

    createHeartParticles(x, y) {
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const heart = document.createElement('div');
            heart.className = 'valentine-heart-particle';
            heart.innerHTML = '♥';
            heart.style.left = `${x}px`;
            heart.style.top = `${y}px`;
            heart.style.setProperty('--random-x', `${(Math.random() - 0.5) * 200}px`);
            heart.style.setProperty('--random-y', `${-Math.random() * 150 - 50}px`);
            heart.style.setProperty('--random-rotation', `${Math.random() * 720 - 360}deg`);
            heart.style.animationDelay = `${i * 0.05}s`;

            document.body.appendChild(heart);

            setTimeout(() => {
                if (heart.parentNode) {
                    heart.parentNode.removeChild(heart);
                }
            }, 1500);
        }
    }

    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];

        // 添加触摸活跃状态（移动端替代hover）
        this.element.classList.add('touch-active');

        // 记录触摸起始位置和时间
        this.drag.touchStartX = touch.clientX;
        this.drag.touchStartY = touch.clientY;
        this.drag.touchStartTime = Date.now();

        // 检查是否在头部区域
        const rect = this.element.getBoundingClientRect();
        const relativeY = touch.clientY - rect.top;
        const headHeight = rect.height * 0.3;

        if (relativeY < headHeight && relativeY >= 0) {
            // 在头部区域，先不触发拖拽，等待判断是摸头还是拖拽还是轻触
            console.log('[MonikaPet] 触摸开始于头部区域，进入头部模式');
            this.drag.isInHeadPatMode = true;
        } else {
            // 不在头部，但也不立即开始拖拽，先等待判断
            console.log('[MonikaPet] 触摸开始于非头部区域，等待判断');
            this.drag.isInHeadPatMode = false;
        }
    }

    startDrag(clientX, clientY) {
        this.drag.isDragging = true;
        this.drag.offsetX = clientX - this.pet.x;
        this.drag.offsetY = clientY - this.pet.y;
        this.drag.mouseX = clientX;
        this.drag.mouseY = clientY;
        this.drag.lastMouseX = clientX;
        this.drag.lastMouseY = clientY;
        this.drag.velocityHistory = [];
        this.drag.swingTime = 0;

        this.pet.state = this.STATE.DRAGGING;
        this.pet.vx = 0;
        this.pet.vy = 0;
        this.pet.rotationVelocity = 0;
        this.pet.isOnGround = false;

        // 拖拽时旋转点设为头部
        this.element.style.transformOrigin = 'center top';
        this.element.style.cursor = 'grabbing';
        this.imageElement.src = this.images.dragged;
        this.pet.lastInteractionTime = Date.now();
    }

    onDocumentMouseMove(e) {
        if (!this.drag.isDragging) return;
        this.updateDrag(e.clientX, e.clientY);
    }

    onPetMouseEnter(e) {
        // 进入桌宠区域
    }

    onPetMouseLeave(e) {
        // 离开桌宠区域，重置头部摸摸状态
        const pat = this.valentine.headPat;
        pat.isInHeadArea = false;
        pat.accumulatedDistance = 0;
        pat.lastX = 0;
        pat.lastY = 0;
        clearTimeout(pat.resetTimeout);
    }

    onMouseMove(e) {
        // 在桌宠上移动时检测是否在头部
        if (this.drag.isDragging) return;

        const rect = this.element.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const headHeight = rect.height * 0.3; // 头部占整体的30%

        // 如果鼠标在头部区域
        if (relativeY < headHeight && relativeY >= 0) {
            const pat = this.valentine.headPat;

            // 如果是刚进入头部区域，先初始化位置
            if (!pat.isInHeadArea) {
                pat.isInHeadArea = true;
                pat.lastX = e.clientX;
                pat.lastY = e.clientY;
                pat.accumulatedDistance = 0;
                return; // 刚进入不触发，避免误触
            }

            // 计算鼠标移动距离
            const deltaX = e.clientX - pat.lastX;
            const deltaY = e.clientY - pat.lastY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // 累积移动距离（任何方向都可以）
            if (distance > 0) {
                pat.accumulatedDistance += distance;

                // 达到所需的累积距离，触发爱心！
                if (pat.accumulatedDistance >= pat.requiredDistance) {
                    const now = Date.now();
                    if (now - pat.lastHeartTime > pat.heartCooldown) {
                        this.createHeadPatHeart(e.clientX, e.clientY);
                        pat.lastHeartTime = now;
                    }
                    // 重置累积距离，但保留一部分让连续摸头更流畅
                    pat.accumulatedDistance = 0;
                }

                pat.lastX = e.clientX;
                pat.lastY = e.clientY;

                // 重置超时 - 如果1秒内没有移动，清空累积距离
                clearTimeout(pat.resetTimeout);
                pat.resetTimeout = setTimeout(() => {
                    pat.accumulatedDistance = 0;
                }, 1000);
            }
        } else {
            // 离开头部区域，重置所有状态
            const pat = this.valentine.headPat;
            pat.isInHeadArea = false;
            pat.accumulatedDistance = 0;
            clearTimeout(pat.resetTimeout);
        }
    }

    // 触摸移动时检测摸头（移动端）
    onPetTouchMove(e) {
        // 如果正在拖拽，不处理摸头
        if (this.drag.isDragging) return;

        const touch = e.touches[0];
        const rect = this.element.getBoundingClientRect();
        const relativeY = touch.clientY - rect.top;
        const headHeight = rect.height * 0.3; // 头部占整体的30%

        // 如果触摸在头部区域
        if (relativeY < headHeight && relativeY >= 0) {
            const pat = this.valentine.headPat;

            // 如果是刚进入头部区域，先初始化位置
            if (!pat.isInHeadArea) {
                pat.isInHeadArea = true;
                pat.lastX = touch.clientX;
                pat.lastY = touch.clientY;
                pat.accumulatedDistance = 0;
                return; // 刚进入不触发，避免误触
            }

            // 计算触摸移动距离
            const deltaX = touch.clientX - pat.lastX;
            const deltaY = touch.clientY - pat.lastY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // 累积移动距离（任何方向都可以）
            if (distance > 0) {
                pat.accumulatedDistance += distance;

                // 达到所需的累积距离，触发爱心！
                if (pat.accumulatedDistance >= pat.requiredDistance) {
                    const now = Date.now();
                    if (now - pat.lastHeartTime > pat.heartCooldown) {
                        this.createHeadPatHeart(touch.clientX, touch.clientY);
                        pat.lastHeartTime = now;
                    }
                    // 重置累积距离
                    pat.accumulatedDistance = 0;
                }

                pat.lastX = touch.clientX;
                pat.lastY = touch.clientY;

                // 重置超时 - 如果1秒内没有移动，清空累积距离
                clearTimeout(pat.resetTimeout);
                pat.resetTimeout = setTimeout(() => {
                    pat.accumulatedDistance = 0;
                }, 1000);
            }
        } else {
            // 离开头部区域，重置所有状态
            const pat = this.valentine.headPat;
            pat.isInHeadArea = false;
            pat.accumulatedDistance = 0;
            clearTimeout(pat.resetTimeout);
        }
    }

    // 摸头时冒出的爱心
    createHeadPatHeart(x, y) {
        const heart = document.createElement('div');
        heart.className = 'head-pat-heart';
        heart.innerHTML = '♥';
        heart.style.left = `${x}px`;
        heart.style.top = `${y}px`;
        heart.style.color = ['#ff1493', '#ff69b4', '#ff85c1'][Math.floor(Math.random() * 3)];
        // 增大爱心尺寸
        heart.style.fontSize = `${24 + Math.random() * 8}px`;

        document.body.appendChild(heart);

        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 1500);
    }

    onTouchMove(e) {
        const touch = e.touches[0];

        // 如果已经在拖拽，继续拖拽
        if (this.drag.isDragging) {
            e.preventDefault();
            this.updateDrag(touch.clientX, touch.clientY);
            return;
        }

        // 如果还没开始拖拽，检查是否应该开始
        const deltaX = touch.clientX - this.drag.touchStartX;
        const deltaY = touch.clientY - this.drag.touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // 如果移动距离超过阈值，开始拖拽
        if (distance > this.drag.dragThreshold) {
            console.log('[MonikaPet] 移动距离超过阈值，开始拖拽');
            this.drag.isInHeadPatMode = false;
            this.startDrag(touch.clientX, touch.clientY);
            e.preventDefault();
            return;
        }

        // 如果在头部区域且移动距离较小，让 onPetTouchMove 处理摸头
        // 不阻止默认行为
    }

    updateDrag(clientX, clientY) {
        this.drag.lastMouseX = this.drag.mouseX;
        this.drag.lastMouseY = this.drag.mouseY;
        this.drag.mouseX = clientX;
        this.drag.mouseY = clientY;

        const vx = clientX - this.drag.lastMouseX;
        const vy = clientY - this.drag.lastMouseY;
        this.drag.velocityHistory.push({ vx, vy, time: Date.now() });
        if (this.drag.velocityHistory.length > this.drag.maxHistoryLength) {
            this.drag.velocityHistory.shift();
        }

        let newX = clientX - this.drag.offsetX;
        let newY = clientY - this.drag.offsetY;

        newX = Math.max(this.bounds.left - 20, Math.min(this.bounds.right + 20, newX));
        newY = Math.max(this.bounds.top - 20, Math.min(this.bounds.bottom + 20, newY));

        this.pet.x = newX;
        this.pet.y = newY;
        this.pet.lastInteractionTime = Date.now();
    }

    // 在update中处理持续摇摆，不只在移动时
    updateDraggingSwing() {
        // 持续的自然摆动，不管是否移动
        this.drag.swingTime += 0.08;
        this.pet.rotation = Math.sin(this.drag.swingTime) * this.drag.swingAmplitude;
    }

    onMouseUp(e) {
        if (!this.drag.isDragging) return;
        this.endDrag();
    }

    onTouchEnd(e) {
        const wasDragging = this.drag.isDragging;
        const wasInHeadPatMode = this.drag.isInHeadPatMode;

        if (this.drag.isDragging) {
            this.endDrag();
        }

        // 移除触摸活跃状态
        this.element.classList.remove('touch-active');

        // 检测是否为轻触（tap）：没有拖拽，没有摸头，触摸时间短，移动距离小
        if (!wasDragging && !wasInHeadPatMode) {
            const touchDuration = Date.now() - this.drag.touchStartTime;
            const touch = e.changedTouches[0];
            if (touch && touchDuration < this.drag.tapMaxDuration) {
                const deltaX = touch.clientX - this.drag.touchStartX;
                const deltaY = touch.clientY - this.drag.touchStartY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                // 移动距离小于拖拽阈值，视为点击
                if (distance < this.drag.dragThreshold) {
                    console.log('[MonikaPet] 检测到轻触事件，触发对话框');
                    this.handleTap(touch.clientX, touch.clientY);
                }
            }
        } else if (wasInHeadPatMode && !wasDragging) {
            // 如果是在头部区域的短时间轻触（没有拖拽），也触发对话框
            const touchDuration = Date.now() - this.drag.touchStartTime;
            const touch = e.changedTouches[0];
            if (touch && touchDuration < 300) {
                const deltaX = touch.clientX - this.drag.touchStartX;
                const deltaY = touch.clientY - this.drag.touchStartY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                // 如果移动距离很小（没有触发摸头效果），也触发对话框
                if (distance < 10) {
                    console.log('[MonikaPet] 头部轻触，触发对话框');
                    this.handleTap(touch.clientX, touch.clientY);
                }
            }
        }

        // 重置触摸相关状态
        this.drag.isInHeadPatMode = false;

        // 触摸结束，重置摸头状态
        const pat = this.valentine.headPat;
        pat.isInHeadArea = false;
        pat.accumulatedDistance = 0;
        clearTimeout(pat.resetTimeout);
    }

    // 处理轻触事件（移动端替代click）
    handleTap(clientX, clientY) {
        const now = Date.now();
        if (now - this.valentine.lastDialogueTime < this.valentine.dialogueCooldown) {
            console.log('[MonikaPet] 对话框冷却中，跳过');
            return;
        }

        console.log('[MonikaPet] 触发对话框和爱心效果');
        this.valentine.lastDialogueTime = now;
        this.showValentineDialogue();
        this.createHeartParticles(clientX, clientY);
    }

    onMouseLeave(e) {
        if (this.drag.isDragging) {
            this.endDrag();
        }
    }

    onWindowBlur() {
        if (this.drag.isDragging) {
            this.endDrag();
        }
    }

    endDrag() {
        if (!this.drag.isDragging) return;

        this.drag.isDragging = false;
        this.element.style.cursor = 'grab';
        // 松手后旋转点改为脚部
        this.element.style.transformOrigin = 'center bottom';

        let throwVx = 0;
        let throwVy = 0;

        if (this.drag.velocityHistory.length > 0) {
            const recentHistory = this.drag.velocityHistory.slice(-3);
            for (const h of recentHistory) {
                throwVx += h.vx;
                throwVy += h.vy;
            }
            throwVx /= recentHistory.length;
            throwVy /= recentHistory.length;
            throwVx *= 1.2;
            throwVy *= 1.2;
        }

        const maxV = this.physics.maxVelocity;
        throwVx = Math.max(-maxV, Math.min(maxV, throwVx));
        throwVy = Math.max(-maxV, Math.min(maxV, throwVy));

        this.pet.vx = throwVx;
        this.pet.vy = throwVy;
        // 减小甩出时的旋转
        this.pet.rotationVelocity = throwVx * 0.15;

        if (Math.abs(throwVx) > 1) {
            this.pet.facingRight = throwVx > 0;
        }

        this.pet.state = this.STATE.FALLING;
        this.pet.lastInteractionTime = Date.now();
    }

    onResize() {
        this.updateBounds();
        this.teleportIfOutOfBounds();
    }

    scheduleNextJump() {
        const interval = this.walking.minJumpInterval +
            Math.random() * (this.walking.maxJumpInterval - this.walking.minJumpInterval);
        this.walking.nextJumpTime = Date.now() + interval;

        const edgeThreshold = 150;
        if (this.pet.x < this.bounds.left + edgeThreshold) {
            this.walking.direction = Math.random() < 0.85 ? 1 : -1;
        } else if (this.pet.x > this.bounds.right - edgeThreshold) {
            this.walking.direction = Math.random() < 0.85 ? -1 : 1;
        } else {
            if (Math.random() < 0.25) {
                this.walking.direction *= -1;
            }
        }
    }

    performJump() {
        if (!this.pet.isOnGround || this.pet.state === this.STATE.DRAGGING) return;

        this.walking.isJumping = true;
        this.pet.isOnGround = false;
        this.pet.state = this.STATE.WALKING;

        this.pet.vy = -this.walking.jumpHeight;
        this.pet.vx = this.walking.direction * this.walking.walkSpeed;
        this.pet.facingRight = this.walking.direction > 0;

        this.scheduleNextJump();
    }

    update() {
        const now = Date.now();

        if (this.pet.state !== this.STATE.DRAGGING &&
            this.pet.isOnGround &&
            now - this.pet.lastInteractionTime > this.pet.idleTimeout) {
            if (now > this.walking.nextJumpTime) {
                this.performJump();
            }
        }

        switch (this.pet.state) {
            case this.STATE.DRAGGING:
                // 持续摇摆效果
                this.updateDraggingSwing();
                break;

            case this.STATE.WALKING:
            case this.STATE.FALLING:
            case this.STATE.BOUNCING:
                this.updatePhysics();
                break;

            case this.STATE.RECOVERING:
                this.updateRecovery();
                break;

            case this.STATE.IDLE:
                if (now - this.pet.lastInteractionTime > this.pet.idleTimeout &&
                    now > this.walking.nextJumpTime) {
                    this.performJump();
                }
                break;
        }

        this.teleportIfOutOfBounds();
        this.updatePosition();

        // 更新对话框位置，让它追踪桌宠
        this.updateDialoguePosition();
    }

    updatePhysics() {
        this.pet.vy += this.physics.gravity;
        this.pet.vx *= this.physics.airResistance;
        this.pet.vy *= this.physics.airResistance;

        this.pet.rotation += this.pet.rotationVelocity;
        this.pet.rotationVelocity *= this.physics.rotationDamping;

        this.pet.x += this.pet.vx;
        this.pet.y += this.pet.vy;

        this.handleBoundaryCollision();
        this.checkGroundStability();
    }

    handleBoundaryCollision() {
        const bounce = this.physics;

        if (this.pet.x < this.bounds.left) {
            this.pet.x = this.bounds.left;
            this.pet.vx = Math.abs(this.pet.vx) * bounce.wallBounceFactor;
            this.pet.rotationVelocity = -this.pet.vy * 0.02;
            this.pet.facingRight = true;
        }

        if (this.pet.x > this.bounds.right) {
            this.pet.x = this.bounds.right;
            this.pet.vx = -Math.abs(this.pet.vx) * bounce.wallBounceFactor;
            this.pet.rotationVelocity = this.pet.vy * 0.02;
            this.pet.facingRight = false;
        }

        if (this.pet.y < this.bounds.top) {
            this.pet.y = this.bounds.top;
            this.pet.vy = Math.abs(this.pet.vy) * bounce.wallBounceFactor;
        }

        if (this.pet.y > this.bounds.bottom) {
            this.pet.y = this.bounds.bottom;

            if (Math.abs(this.pet.vy) > bounce.minBounceVelocity) {
                this.pet.vy = -Math.abs(this.pet.vy) * bounce.groundBounceFactor;
                this.pet.vx *= bounce.friction;
                this.pet.state = this.STATE.BOUNCING;
                // 大幅减小落地时的旋转
                this.pet.rotationVelocity += this.pet.vx * 0.03;
            } else {
                this.pet.vy = 0;
                this.pet.vx *= bounce.friction * 0.3;
                this.pet.isOnGround = true;

                // 如果旋转角度较大才回正，否则直接归零
                if (Math.abs(this.pet.rotation) > 15) {
                    this.pet.state = this.STATE.RECOVERING;
                } else {
                    this.pet.rotation = 0;
                    this.pet.state = this.STATE.IDLE;
                    this.imageElement.src = this.images.idle;
                }
            }
        }
    }

    checkGroundStability() {
        if (this.pet.y >= this.bounds.bottom - 1 &&
            Math.abs(this.pet.vy) < this.physics.minBounceVelocity &&
            Math.abs(this.pet.vx) < 0.3) {

            this.pet.isOnGround = true;
            this.pet.y = this.bounds.bottom;
            this.pet.vy = 0;
            this.pet.vx = 0;

            if (Math.abs(this.pet.rotation) > 15) {
                this.pet.state = this.STATE.RECOVERING;
            } else if (this.pet.state !== this.STATE.IDLE) {
                this.pet.state = this.STATE.IDLE;
                this.pet.rotation = 0;
                this.imageElement.src = this.images.idle;
            }
        }
    }

    updateRecovery() {
        // 更自然的回正：直接快速归零，不要像不倒翁一样摇摆
        const targetRotation = 0;
        const diff = targetRotation - this.pet.rotation;

        // 直接按比例回正，不用弹簧效果
        this.pet.rotation += diff * 0.15;

        if (Math.abs(this.pet.rotation) < 1) {
            this.pet.rotation = 0;
            this.pet.rotationVelocity = 0;
            this.pet.state = this.STATE.IDLE;
            this.imageElement.src = this.images.idle;
        }
    }

    teleportIfOutOfBounds() {
        const margin = 50;
        let needsTeleport = false;

        if (this.pet.x < this.bounds.left - margin) {
            this.pet.x = this.bounds.left + 50;
            needsTeleport = true;
        }
        if (this.pet.x > this.bounds.right + margin) {
            this.pet.x = this.bounds.right - 50;
            needsTeleport = true;
        }
        if (this.pet.y < this.bounds.top - margin) {
            this.pet.y = this.bounds.top + 50;
            needsTeleport = true;
        }
        if (this.pet.y > this.bounds.bottom + margin) {
            this.pet.y = this.bounds.bottom;
            needsTeleport = true;
        }

        if (needsTeleport) {
            this.pet.vx = 0;
            this.pet.vy = 0;
            this.pet.rotation = 0;
            this.pet.rotationVelocity = 0;
            this.pet.state = this.STATE.IDLE;
            this.pet.isOnGround = true;
            this.imageElement.src = this.images.idle;
        }
    }

    updatePosition() {
        const scaleX = this.pet.facingRight ? -1 : 1;
        this.element.style.transform = `translate(${this.pet.x}px, ${this.pet.y}px) rotate(${this.pet.rotation}deg) scaleX(${scaleX})`;
    }

    startAnimation() {
        const animate = () => {
            this.update();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.hiddenImageContainer && this.hiddenImageContainer.parentNode) {
            this.hiddenImageContainer.parentNode.removeChild(this.hiddenImageContainer);
        }
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.hideLoadingIndicator();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.monikaPet = new MonikaPet();
});
