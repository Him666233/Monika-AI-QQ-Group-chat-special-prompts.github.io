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
            swingAmplitude: 5  // 减小摆动幅度
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
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

        this.element.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
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

    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.startDrag(touch.clientX, touch.clientY);
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

    onMouseMove(e) {
        if (!this.drag.isDragging) return;
        this.updateDrag(e.clientX, e.clientY);
    }

    onTouchMove(e) {
        if (!this.drag.isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.updateDrag(touch.clientX, touch.clientY);
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
        if (!this.drag.isDragging) return;
        this.endDrag();
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
