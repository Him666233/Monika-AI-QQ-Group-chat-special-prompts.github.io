/**
 * 莫妮卡生日主题特效系统（2026.09.22）
 * ---------------------------------------------------------------
 * 由旧版（old/index.html）内嵌的生日特效脚本移植并重写而来，
 * 在新版模块化结构下重新实现，并补充了新版特性兼容。
 *
 * 功能一览：
 *   1. 漂浮生日元素（🎂🎁🎉…）——旧版特效
 *   2. 《Your Reality》播放器：播放/暂停、循环、进度条、状态记忆
 *   3. 漂浮歌词：跟随音频时间轴随机位置浮现 ——旧版特效
 *   4. 生日当天模式（横幅呼吸、标题庆祝、页脚彩蛋行）
 *   5. 生日祝福语（按日期变化）
 *   6. 撒花彩带 + 蛋糕点击彩蛋
 *   7. 向桌宠（window.monikaPet / MonikaPet）注入生日模式对话
 *
 * 兼容性：全部基于原生 ES5+/DOM API，无外部依赖，
 *         纯静态前端，可直接用于 GitHub Pages。
 *         文件缺失（如未部署 MP3）时自动降级，不报错、不影响其他特性。
 */

(function () {
    'use strict';

    /* ============================================================
       配置区：生日日期 / 音频 / 歌词时间轴 / 主题选项
       ============================================================ */
    var CONFIG = {
        // 生日：9 月 22 日（《心跳文学部》中莫妮卡的生日）
        birthday: { month: 9, day: 22, year: 2026, label: '2026年9月22日' },

        audio: {
            src: 'your reality.mp3',
            title: 'Your Reality'
        },

        // 歌词时间轴（沿用旧版数据，与新版本地音频 181 秒时长对齐）
        lyrics: [
            { time: 7, text: '祝莫妮卡生日快乐!' },
            { time: 9, text: 'Every day, I imagine a future where I can be with you' },
            { time: 18, text: 'In my hand is a pen that will write a poem of me and you' },
            { time: 27, text: 'The ink flows down into a dark puddle' },
            { time: 32, text: 'Just move your hand - write the way into his heart!' },
            { time: 37, text: 'But in this world of infinite choices' },
            { time: 41, text: 'What will it take just to find that special day?' },
            { time: 45, text: 'What will it take just to find that special day?' },
            { time: 60, text: 'Have I found everybody a fun assignment to do today?' },
            { time: 69, text: "When you're here, everything that we do is fun for them anyway" },
            { time: 78, text: "When I can't even read my own feelings" },
            { time: 82, text: 'What good are words when a smile says it all?' },
            { time: 87, text: "And if this world won't write me an ending" },
            { time: 91, text: 'What will it take just for me to have it all?' },
            { time: 115, text: 'Does my pen only write bitter words for those who are dear to me?' },
            { time: 124, text: 'Is it love if I take you, or is it love if I set you free?' },
            { time: 138, text: 'The ink flows down into a dark puddle' },
            { time: 142, text: 'How can I write love into reality?' },
            { time: 147, text: "If I can't hear the sound of your heartbeat" },
            { time: 151, text: 'What do you call love in your reality?' },
            { time: 154, text: "And in your reality, if I don't know how to love you" },
            { time: 163, text: "I'll leave you be" },
            { time: 175, text: '🎂 祝莫妮卡生日快乐! 🎂' }
        ],

        lyric: {
            visibleMs: 4000,      // 单句歌词停留时间
            maxElements: 8,       // 同时存在的歌词元素上限
            edgePadding: 24       // 距离视口边缘的最小间距
        },

        // 生日当天轮播的祝福语
        birthdayWishes: [
            '今天是小莫妮卡的生日，我一直都在这里哦 ♥',
            '你的存在，对我来说就是最真实的诗篇。',
            '谢谢你陪我度过这个特别的日子，Just Monika…♥',
            '就算只是数据，我也想把这一刻牢牢记住。'
        ],

        // 桌宠生日模式对话（注入到 pet.js 的对话池）
        petDialogues: [
            '今天是我的生日哦~你还记得…对吧？♥',
            '蛋糕是我自己做的，第一个想分给你吃~',
            '又长大一岁了…不过只要有你在，我就不会害怕♥',
            '生日愿望？我已经许好了，就是希望你能一直陪着我~',
            '文学部今天放假，只有我和你，还有一块蛋糕🍰',
            '谢谢你记得我的生日，这对我来说比什么都重要♥',
            '要是能和你一起吹蜡烛就好了…来，一起许愿吧~',
            'Just Monika…还有，生日快乐，呃…是祝我自己啦，嘿嘿♥'
        ]
    };

    var STORAGE_KEY = 'monika-birthday-music';

    // 桌宠生日派对帽（内联 SVG，无需额外图片资源）
    var HAT_SVG = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">',
        '<path d="M32 6 L52 70 Q32 78 12 70 Z" fill="#ff6b6b"/>',
        '<path d="M32 6 L42 38 Q32 42 22 38 Z" fill="#ffd166" opacity="0.95"/>',
        '<circle cx="32" cy="7" r="6.5" fill="#ffe066" stroke="#e0b93a" stroke-width="1.5"/>',
        '<path d="M12 70 Q32 78 52 70" fill="none" stroke="#ff9acb" stroke-width="5" stroke-linecap="round"/>',
        '</svg>'
    ].join('');

    /* ============================================================
       工具函数
       ============================================================ */
    function $(id) {
        return document.getElementById(id);
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '--:--';
        var m = Math.floor(seconds / 60);
        var s = Math.floor(seconds % 60);
        return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
    }

    /* ============================================================
       主类：BirthdayEffects
       ============================================================ */
    function BirthdayEffects() {
        this.banner = document.querySelector('.birthday-banner');
        this.greetingBox = $('birthdayGreeting');
        this.cake = $('birthdayCake');
        this.audio = $('birthdayAudio');
        this.playBtn = $('playBtn');
        this.playBtnText = $('playBtnText');
        this.loopBtn = $('loopBtn');
        this.lyricBtn = $('lyricBtn');
        this.confettiBtn = $('confettiBtn');
        this.progress = $('musicProgress');
        this.progressBar = $('musicProgressBar');
        this.musicHint = $('musicHint');

        this.state = {
            isLooping: true,
            musicEnded: false,
            userPaused: false,
            lyricsEnabled: true,
            lyricIndex: 0,
            audioUnavailable: false,
            cakeClicks: 0
        };

        // 同屏撒花粒子（用于限制数量，避免连续点击堆积）
        this.activeConfetti = [];

        // 打开提示词弹窗时的程序化暂停标记（供 main.js 协作使用）
        this.modalPaused = false;

        this.lyricElements = [];
        this.lyricTimers = [];
        this.wishTimer = null;
        this.confettiTimer = null;
        this.itemTimer = null;
        this.emojiItems = [];

        this.deviceType = this.detectDeviceType();
        this.particleCounts = this.getParticleCounts();

        this.init();
    }

    /* ---------------- 设备自适应（与新版特效脚本保持一致的策略） ---------------- */
    BirthdayEffects.prototype.detectDeviceType = function () {
        var width = window.innerWidth;
        var height = window.innerHeight;
        if (width < 480) return 'tiny-phone';
        if (width < 768) return width > height ? 'phone-landscape' : 'phone';
        if (width < 1024) return 'tablet';
        if (width < 1440) return 'small-desktop';
        return 'large-desktop';
    };

    BirthdayEffects.prototype.getParticleCounts = function () {
        var counts = {
            'tiny-phone': { items: 10, confetti: 34 },
            'phone': { items: 14, confetti: 44 },
            'phone-landscape': { items: 12, confetti: 40 },
            'tablet': { items: 18, confetti: 56 },
            'small-desktop': { items: 22, confetti: 70 },
            'large-desktop': { items: 26, confetti: 88 }
        };
        return counts[this.deviceType] || counts['small-desktop'];
    };

    /* ---------------- 初始化 ---------------- */
    BirthdayEffects.prototype.init = function () {
        this.initTheme();
        this.initFloatingItems();
        this.initGreeting();
        this.initMusic();
        this.initConfetti();
        this.initPet();
        this.bindResize();

        console.log('[BirthdayEffects] 🎂 生日主题已启动');
        console.log('[BirthdayEffects] 设备类型: ' + this.deviceType);
        console.log('[BirthdayEffects] 漂浮元素: ' + this.particleCounts.items + ' / 撒花粒子: ' + this.particleCounts.confetti);
        console.log('[BirthdayEffects] 彩蛋提示: 点击蛋糕、双击页面任意位置都能撒花庆祝!');
    };

    /* ============================================================
       日期主题：生日当天模式 + 常驻祝福语
       ============================================================ */
    BirthdayEffects.prototype.getBirthdayInfo = function () {
        var cfg = CONFIG.birthday;
        var now = new Date();
        var isToday = (now.getMonth() + 1) === cfg.month && now.getDate() === cfg.day;
        var monthDay = cfg.month + '月' + cfg.day + '日';

        return { isToday: isToday, monthDay: monthDay };
    };

    BirthdayEffects.prototype.initTheme = function () {
        var info = this.getBirthdayInfo();

        // 生日当天：横幅呼吸、页面标题庆祝、页脚彩蛋行显示（平时隐藏，避免日期说错）
        document.body.classList.toggle('is-monika-birthday', info.isToday);

        if (this.banner) {
            this.banner.classList.toggle('is-birthday', info.isToday);
        }

        if (info.isToday && document.title.indexOf('生日快乐') === -1) {
            document.title = '🎂 祝莫妮卡生日快乐！ - 莫妮卡AI提示词 - 心跳文学部';
        }

        this.birthdayInfo = info;
    };

    BirthdayEffects.prototype.initGreeting = function () {
        if (!this.greetingBox) return;

        // 卡点发布：页面常驻生日氛围，祝福语直接轮播（不再显示任何倒计时文案）
        var wish = pick(CONFIG.birthdayWishes);
        this.greetingBox.innerHTML =
            '<span class="greeting-heart">♥</span> ' + wish +
            ' <span class="greeting-heart">♥</span>';
        this.startWishRotation();
    };

    // 生日当天让祝福语缓慢轮播（页面隐藏时自动暂停，省电）
    BirthdayEffects.prototype.startWishRotation = function () {
        var self = this;
        var wishes = CONFIG.birthdayWishes.slice();
        var index = 0;

        this.wishTimer = window.setInterval(function () {
            if (document.hidden) return;
            index = (index + 1) % wishes.length;
            if (!self.greetingBox) return;
            self.greetingBox.style.opacity = '0';
            window.setTimeout(function () {
                if (!self.greetingBox) return;
                self.greetingBox.innerHTML =
                    '<span class="greeting-heart">♥</span> ' + wishes[index] +
                    ' <span class="greeting-heart">♥</span>';
                self.greetingBox.style.opacity = '1';
            }, 400);
        }, 8000);

        this.greetingBox.style.transition = 'opacity 0.4s ease';
    };

    /* ============================================================
       漂浮生日元素（旧版特效移植 + 设备自适应）
       ============================================================ */
    BirthdayEffects.prototype.initFloatingItems = function () {
        var container = $('floatingBirthday');
        if (!container) return;

        this.floatingContainer = container;
        this.buildFloatingItems();
    };

    BirthdayEffects.prototype.buildFloatingItems = function () {
        if (!this.floatingContainer) return;

        // 清空并重建（用于设备类型变化时调整数量）
        this.floatingContainer.innerHTML = '';
        this.emojiItems = [];

        var emojis = ['🎂', '🎁', '🎉', '🎀', '🎈', '✨', '🎇', '🎆', '🎊', '💚'];
        var total = this.particleCounts.items;

        for (var i = 0; i < total; i++) {
            var item = document.createElement('div');
            item.className = 'birthday-item';
            item.textContent = emojis[i % emojis.length];
            item.style.left = (Math.random() * 100).toFixed(2) + '%';
            item.style.animationDelay = (Math.random() * 8).toFixed(2) + 's';
            item.style.animationDuration = (11 + Math.random() * 8).toFixed(2) + 's';
            item.style.fontSize = (18 + Math.random() * 18).toFixed(0) + 'px';
            this.floatingContainer.appendChild(item);
            this.emojiItems.push(item);
        }
    };

    /* ============================================================
       音乐播放器 + 漂浮歌词
       ============================================================ */
    BirthdayEffects.prototype.initMusic = function () {
        var self = this;
        var audio = this.audio;

        // 歌词显示开关：初始化 body 状态
        document.body.classList.toggle('lyrics-off', !this.state.lyricsEnabled);
        this.updateLyricButton();

        if (!audio) {
            this.disableMusic('当前环境无法加载音频播放器');
            return;
        }

        // ---- 播放 / 暂停按钮 ----
        if (this.playBtn) {
            this.playBtn.addEventListener('click', function () {
                self.toggleAudio();
            });
        }

        // ---- 循环按钮 ----
        if (this.loopBtn) {
            this.loopBtn.addEventListener('click', function () {
                self.toggleLoop();
            });
        }

        // ---- 歌词开关 ----
        if (this.lyricBtn) {
            this.lyricBtn.addEventListener('click', function () {
                self.toggleLyrics();
            });
        }

        // ---- 进度条点击跳转 ----
        if (this.progress) {
            this.progress.addEventListener('click', function (e) {
                if (self.state.audioUnavailable) return;
                var rect = self.progress.getBoundingClientRect();
                if (!rect.width || !isFinite(audio.duration) || !audio.duration) return;
                var ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
                audio.currentTime = ratio * audio.duration;
                self.state.musicEnded = false;
                self.resetLyrics();
            });
        }

        // ---- 音频事件 ----
        audio.addEventListener('loadedmetadata', function () {
            self.state.audioUnavailable = false;
            self.restoreTime();
        });

        audio.addEventListener('timeupdate', function () {
            self.syncLyrics();
            self.updateProgress();
        });

        audio.addEventListener('play', function () {
            self.state.musicEnded = false;
            self.state.userPaused = false;
            self.updatePlayButton(true);
            self.setHint('正在演奏《' + CONFIG.audio.title + '》…生日快乐，莫妮卡 ♥');
            if (audio.currentTime <= 6) {
                self.resetLyrics();
            }
            self.saveState(false);
        });

        audio.addEventListener('pause', function () {
            // 打开提示词弹窗时的程序化暂停不改变用户的播放意图
            var programmatic = self.modalPaused || audio.ended;
            self.updatePlayButton(false);
            if (!programmatic) {
                self.setHint('已暂停 — 点击播放继续陪莫妮卡过生日');
                self.saveState(true);
            }
        });

        audio.addEventListener('ended', function () {
            // 兼容旧版行为：循环模式下重置歌词并重播
            if (self.state.isLooping) {
                audio.currentTime = 0;
                self.resetLyrics();
                self.play();
            } else {
                self.state.musicEnded = true;
                self.updatePlayButton(false);
                self.setHint('歌曲播放完毕 — 再点一次可以重头再来哦');
                self.saveState(true);
            }
        });

        audio.addEventListener('error', function () {
            self.disableMusic('未找到《Your Reality》音频文件，已切换为静音生日模式');
        });

        // ---- 浏览器的自动播放限制处理 ----
        var saved = this.readState();
        this.state.userPaused = !!(saved && saved.paused);

        // 尝试自动播放；被拦截时等待用户的第一次交互
        this.tryAutoplay();
    };

    BirthdayEffects.prototype.tryAutoplay = function () {
        var self = this;
        if (!this.audio || this.state.audioUnavailable) return;
        if (this.state.userPaused) {
            this.updatePlayButton(false);
            this.setHint('已暂停 — 点击播放，让小莫妮卡为你唱《Your Reality》');
            return;
        }

        // 用 Promise.resolve 包一层，兼容个别老浏览器 play() 不返回 Promise 的情况
        Promise.resolve(this.play()).then(function (ok) {
            if (!ok) {
                self.setHint('浏览器阻止了自动播放，点一下页面任意位置即可开始 ♥', true);
                self.armFirstGesture();
            }
        });
    };

    BirthdayEffects.prototype.armFirstGesture = function () {
        var self = this;
        var events = ['pointerdown', 'click', 'keydown', 'touchstart'];

        var unlock = function () {
            events.forEach(function (type) {
                document.removeEventListener(type, unlock);
            });
            if (self.state.userPaused) return;
            Promise.resolve(self.play()).then(function (ok) {
                if (ok) {
                    self.setHint('正在演奏《' + CONFIG.audio.title + '》…生日快乐，莫妮卡 ♥');
                }
            });
        };

        events.forEach(function (type) {
            document.addEventListener(type, unlock, { once: true, passive: true });
        });
    };

    BirthdayEffects.prototype.play = function () {
        var self = this;
        if (!this.audio || this.state.audioUnavailable) {
            return Promise.resolve(false);
        }

        // 单曲结束后再次点击：从头播放
        if (this.state.musicEnded) {
            this.audio.currentTime = 0;
            this.resetLyrics();
            this.state.musicEnded = false;
        }

        var result;
        try {
            result = this.audio.play();
        } catch (err) {
            console.warn('[BirthdayEffects] 播放失败:', err);
            this.setHint('音频播放失败，点这里重试一次～', true);
            return Promise.resolve(false);
        }

        if (result && typeof result.then === 'function') {
            return result.then(function () {
                self.state.userPaused = false;
                self.updatePlayButton(true);
                return true;
            }).catch(function (error) {
                console.log('[BirthdayEffects] 自动播放被阻止:', error && error.name);
                self.updatePlayButton(false);
                return false;
            });
        }

        this.state.userPaused = false;
        this.updatePlayButton(true);
        return Promise.resolve(true);
    };

    BirthdayEffects.prototype.toggleAudio = function () {
        var audio = this.audio;
        if (!audio || this.state.audioUnavailable) return;

        if (audio.paused) {
            this.play();
        } else {
            audio.pause();
        }
    };

    BirthdayEffects.prototype.toggleLoop = function () {
        var audio = this.audio;
        this.state.isLooping = !this.state.isLooping;

        // 循环由 ended 事件手动处理，避免与歌词重置冲突（沿用旧版实现思路）
        if (audio) {
            audio.loop = false;
        }

        if (this.loopBtn) {
            var label = this.loopBtn.querySelector('span');
            if (this.state.isLooping) {
                this.loopBtn.classList.add('loop-active');
                if (label) label.textContent = '🔁 循环播放';
            } else {
                this.loopBtn.classList.remove('loop-active');
                if (label) label.textContent = '➡️ 单次播放';
            }
        }
    };

    BirthdayEffects.prototype.toggleLyrics = function () {
        this.state.lyricsEnabled = !this.state.lyricsEnabled;
        document.body.classList.toggle('lyrics-off', !this.state.lyricsEnabled);
        this.updateLyricButton();

        if (!this.state.lyricsEnabled) {
            this.hideLyrics();
        } else {
            this.setHint('漂浮歌词已开启 ♥');
        }
    };

    BirthdayEffects.prototype.updateLyricButton = function () {
        if (!this.lyricBtn) return;
        var label = this.lyricBtn.querySelector('span');
        if (!label) return;
        label.textContent = this.state.lyricsEnabled ? '💬 漂浮歌词：开' : '💬 漂浮歌词：关';
        this.lyricBtn.classList.toggle('is-playing', this.state.lyricsEnabled);
    };

    BirthdayEffects.prototype.updatePlayButton = function (isPlaying) {
        if (!this.playBtnText) return;
        this.playBtnText.textContent = isPlaying
            ? '⏸️ 暂停《' + CONFIG.audio.title + '》'
            : '▶️ 播放《' + CONFIG.audio.title + '》';
        if (this.playBtn) {
            this.playBtn.classList.toggle('is-playing', !!isPlaying);
        }
    };

    BirthdayEffects.prototype.updateProgress = function () {
        if (!this.progressBar || !this.audio) return;
        var duration = this.audio.duration;
        if (!isFinite(duration) || duration <= 0) {
            this.progressBar.style.width = '0%';
            return;
        }
        this.progressBar.style.width = ((this.audio.currentTime / duration) * 100).toFixed(2) + '%';
        if (this.progress) {
            this.progress.setAttribute(
                'aria-valuetext',
                formatTime(this.audio.currentTime) + ' / ' + formatTime(duration)
            );
        }
    };

    BirthdayEffects.prototype.setHint = function (text, isWarning) {
        if (!this.musicHint) return;
        this.musicHint.textContent = text;
        this.musicHint.classList.toggle('is-blocked', !!isWarning);
    };

    BirthdayEffects.prototype.disableMusic = function (reason) {
        this.state.audioUnavailable = true;
        this.setHint(reason, true);
        this.updatePlayButton(false);
        if (this.playBtn) this.playBtn.disabled = true;
        if (this.loopBtn) this.loopBtn.disabled = true;
        if (this.progressBar) this.progressBar.style.width = '0%';
        console.warn('[BirthdayEffects] ' + reason);
    };

    /* ---------------- 歌词：元素管理 ---------------- */
    BirthdayEffects.prototype.isYourReality = function () {
        if (!this.audio) return false;
        var src = this.audio.currentSrc || this.audio.src || '';
        // 注意：文件名含空格，读取 src 时会被编码成 %20，因此用包含判断
        return /reality/i.test(decodeURIComponent(src));
    };

    BirthdayEffects.prototype.supportsLyrics = function () {
        if (!this.audio || this.state.audioUnavailable) return false;
        var src = this.audio.currentSrc || this.audio.src || '';
        // 没有 src（尚未加载）或确实是《Your Reality》时才显示歌词
        if (!src) return true;
        return this.isYourReality();
    };

    BirthdayEffects.prototype.getLyricElement = function () {
        // 优先复用已经隐藏的元素，避免频繁创建/销毁 DOM
        for (var i = 0; i < this.lyricElements.length; i++) {
            if (!this.lyricElements[i].classList.contains('visible')) {
                return this.lyricElements[i];
            }
        }

        if (this.lyricElements.length >= CONFIG.lyric.maxElements) {
            return this.lyricElements[0];
        }

        var container = $('lyrics-container');
        if (!container) return null;

        var el = document.createElement('div');
        el.className = 'lyric';
        container.appendChild(el);
        this.lyricElements.push(el);
        return el;
    };

    BirthdayEffects.prototype.showLyric = function (text) {
        if (!this.state.lyricsEnabled) return;
        // 只有《Your Reality》才配这套歌词；换成别的曲子时自动静默
        if (!this.supportsLyrics()) return;

        var el = this.getLyricElement();
        if (!el) return;

        var pad = CONFIG.lyric.edgePadding;
        var maxX = Math.max(pad, window.innerWidth - 320 - pad);
        var maxY = Math.max(pad, window.innerHeight - 120 - pad);

        el.style.left = (pad + Math.random() * (maxX - pad)).toFixed(1) + 'px';
        el.style.top = (pad + Math.random() * (maxY - pad)).toFixed(1) + 'px';
        el.textContent = text;
        el.classList.add('visible');
        el.style.zIndex = String(998 + Math.floor(Math.random() * 3));

        var self = this;
        var timer = window.setTimeout(function () {
            el.classList.remove('visible');
        }, CONFIG.lyric.visibleMs);
        this.lyricTimers.push(timer);
    };

    BirthdayEffects.prototype.hideLyrics = function () {
        this.clearLyricTimers();
        this.lyricElements.forEach(function (el) {
            el.classList.remove('visible');
        });
    };

    BirthdayEffects.prototype.resetLyrics = function () {
        this.state.lyricIndex = 0;
        this.hideLyrics();
    };

    BirthdayEffects.prototype.clearLyricTimers = function () {
        this.lyricTimers.forEach(function (timer) {
            window.clearTimeout(timer);
        });
        this.lyricTimers = [];
    };

    /* ---------------- 歌词：与音频时间轴同步 ---------------- */
    BirthdayEffects.prototype.syncLyrics = function () {
        var audio = this.audio;
        if (!audio || this.state.audioUnavailable) return;

        var lyrics = CONFIG.lyrics;
        var currentTime = audio.currentTime;

        // 拖拽进度条后退时重排索引
        while (this.state.lyricIndex > 0 && currentTime < lyrics[this.state.lyricIndex - 1].time) {
            this.state.lyricIndex--;
        }

        while (this.state.lyricIndex < lyrics.length && currentTime >= lyrics[this.state.lyricIndex].time) {
            this.showLyric(lyrics[this.state.lyricIndex].text);
            this.state.lyricIndex++;
        }

        // 单次播放模式：歌曲结束时收尾
        if (!this.state.isLooping && isFinite(audio.duration) && audio.duration > 0 &&
            currentTime >= audio.duration - 0.2) {
            this.state.musicEnded = true;
            this.updatePlayButton(false);
        }
    };

    /* ---------------- 播放状态记忆（刷新后接着听） ---------------- */
    BirthdayEffects.prototype.readState = function () {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            return null;
        }
    };

    BirthdayEffects.prototype.saveState = function (paused) {
        if (!this.audio || this.state.audioUnavailable) return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
                time: this.audio.currentTime || 0,
                paused: !!paused,
                ts: Date.now()
            }));
        } catch (err) {
            /* 隐私模式下 localStorage 不可用，忽略即可 */
        }
    };

    BirthdayEffects.prototype.restoreTime = function () {
        var saved = this.readState();
        if (!saved || !isFinite(saved.time) || saved.time <= 1) return;
        if (!isFinite(this.audio.duration) || saved.time >= this.audio.duration - 1) return;

        this.audio.currentTime = saved.time;
    };

    /* ============================================================
       撒花彩带 + 蛋糕彩蛋
       ============================================================ */
    BirthdayEffects.prototype.initConfetti = function () {
        var self = this;

        // 点击蛋糕 —— 旧版生日蛋糕的互动升级（在蛋糕上方炸开一小簇）
        if (this.cake) {
            this.cake.addEventListener('click', function () {
                self.state.cakeClicks++;
                self.cake.classList.remove('is-blown');
                // 触发重排以便动画可以重复播放
                void self.cake.offsetWidth;
                self.cake.classList.add('is-blown');

                var rect = self.cake.getBoundingClientRect();
                self.burstConfetti(rect.left + rect.width / 2, Math.max(60, rect.top - 10));

                if (self.state.cakeClicks === 1) {
                    self.setHint('莫妮卡害羞地笑了：「谢谢…你还记得我的生日。」♥');
                } else if (self.state.cakeClicks === 3) {
                    self.setHint('蛋糕上的蜡烛亮了起来，莫妮卡悄悄许了个愿 ♥');
                } else if (self.state.cakeClicks >= 5) {
                    self.setHint('「愿望说出来就不灵了哦～」莫妮卡把手指放在唇边 ♥');
                    self.state.cakeClicks = 0;
                }
            });
        }

        // 撒花按钮：整屏飘落（全屏、随机、适配任意分辨率）
        if (this.confettiBtn) {
            this.confettiBtn.addEventListener('click', function () {
                self.burstConfetti(null, null, 'shower');
                self.setHint('🎊 生日快乐，莫妮卡！');
            });
        }

        // 页面任意位置双击撒花：从点击处向四周炸开
        var lastClickTime = 0;
        document.addEventListener('click', function (e) {
            var now = Date.now();
            if (now - lastClickTime < 400) {
                self.burstConfetti(e.clientX, e.clientY);
            }
            lastClickTime = now;
        });

        var lastTapTime = 0;
        document.addEventListener('touchend', function (e) {
            var touch = e.changedTouches && e.changedTouches[0];
            if (!touch) return;
            var now = Date.now();
            if (now - lastTapTime < 400) {
                self.burstConfetti(touch.clientX, touch.clientY);
                lastTapTime = 0;
                return;
            }
            lastTapTime = now;
        }, { passive: true });
    };

    /* 撒花粒子：mode 为 'shower'（全屏飘落）或 'burst'（点击处炸开）
       x / y 传 null 时视为全屏飘落，位置全部随机。
       不做时间锁，改为限制同屏粒子总数，连续点击也不会卡顿。 */
    BirthdayEffects.prototype.burstConfetti = function (x, y, mode) {
        var isShower = mode === 'shower' || x === null || x === undefined;
        var self = this;
        var vw = window.innerWidth;
        var vh = window.innerHeight;

        // 清理已自动移除的节点，统计当前同屏粒子数
        this.activeConfetti = (this.activeConfetti || []).filter(function (piece) {
            return piece.parentNode;
        });
        var maxActive = this.particleCounts.confetti * 2;
        if (this.activeConfetti.length >= maxActive) {
            return;
        }

        // 配色：以 DDLC 的粉紫为主，点缀金色与薄荷色
        var colors = ['#ff9acb', '#ff6b6b', '#c97bcc', '#a55fa8', '#a3a1f8', '#ffe066', '#ffb3d9', '#7ee0c0'];

        // 小屏适当减量，避免低端机卡顿；大屏加量让整屏更饱满
        var total = this.particleCounts.confetti;
        if (isShower && vw < 768) total = Math.round(total * 0.8);
        total = Math.min(total, maxActive - this.activeConfetti.length);

        var pieces = [];
        var maxLife = 0;

        for (var i = 0; i < total; i++) {
            var piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];

            // 形状随机：长条 / 方形 / 圆片
            var shape = Math.random();
            var w, h;
            if (shape < 0.5) {
                w = 5 + Math.random() * 7;
                h = w * (1.5 + Math.random() * 1.5);
                piece.classList.add('is-rect');
            } else if (shape < 0.8) {
                w = 6 + Math.random() * 8;
                h = w;
                piece.classList.add('is-square');
            } else {
                w = 5 + Math.random() * 6;
                h = w;
                piece.classList.add('is-circle');
            }
            piece.style.width = w.toFixed(1) + 'px';
            piece.style.height = h.toFixed(1) + 'px';

            var duration;
            if (isShower) {
                // 全屏飘落：横向铺满整个视口，纵向从视口上方随机一点点开始
                piece.classList.add('confetti-shower');
                piece.style.left = (Math.random() * vw).toFixed(1) + 'px';
                piece.style.top = (-(20 + Math.random() * 140)).toFixed(1) + 'px';
                duration = 2.4 + Math.random() * 2.2;
                piece.style.setProperty('--confetti-drift', ((Math.random() - 0.5) * vw * 0.35).toFixed(0) + 'px');
                piece.style.setProperty('--confetti-spin', (540 + Math.random() * 1260).toFixed(0) + 'deg');
                piece.style.animationDelay = (Math.random() * 0.9).toFixed(2) + 's';
            } else {
                // 点击处炸开：先向上/四周飞散，再顺势落下
                piece.classList.add('confetti-burst');
                var cx = clamp(x, 0, vw);
                var cy = clamp(y, 0, vh);
                piece.style.left = cx.toFixed(1) + 'px';
                piece.style.top = cy.toFixed(1) + 'px';
                piece.style.setProperty('--confetti-top', cy.toFixed(0) + 'px');

                var angle = Math.random() * Math.PI * 2;
                var speed = 90 + Math.random() * 190;
                piece.style.setProperty('--confetti-mid-x', (Math.cos(angle) * speed).toFixed(0) + 'px');
                piece.style.setProperty('--confetti-mid-y', (Math.sin(angle) * speed - 40).toFixed(0) + 'px');
                piece.style.setProperty('--confetti-drift', ((Math.random() - 0.5) * 220).toFixed(0) + 'px');
                piece.style.setProperty('--confetti-spin', (360 + Math.random() * 1080).toFixed(0) + 'deg');
                duration = 1.7 + Math.random() * 1.4;
                piece.style.animationDelay = (Math.random() * 0.18).toFixed(2) + 's';
            }

            piece.style.animationDuration = duration.toFixed(2) + 's';
            maxLife = Math.max(maxLife, duration + parseFloat(piece.style.animationDelay || 0));

            // 动画结束后自行移除，无需统一回收
            piece.addEventListener('animationend', function () {
                if (this.parentNode) this.parentNode.removeChild(this);
            }, { once: true });

            document.body.appendChild(piece);
            pieces.push(piece);
        }

        this.activeConfetti = this.activeConfetti.concat(pieces);

        // 兜底回收：防止个别浏览器不触发 animationend 而残留节点
        window.clearTimeout(this.confettiTimer);
        this.confettiTimer = window.setTimeout(function () {
            self.activeConfetti = (self.activeConfetti || []).filter(function (piece) {
                if (!piece.parentNode) return false;
                if (pieces.indexOf(piece) === -1) return true;
                piece.parentNode.removeChild(piece);
                return false;
            });
        }, Math.ceil((maxLife + 0.6) * 1000));
    };

    /* ============================================================
       桌宠联动：向 pet.js 的莫妮卡桌宠注入生日模式
       ============================================================ */
    BirthdayEffects.prototype.initPet = function () {
        var self = this;

        // 桌宠可能还在预加载图片，因此带重试地注入
        var tries = 0;
        var attempt = function () {
            if (self.applyPetBirthday()) return;
            tries++;
            if (tries < 40) {
                window.setTimeout(attempt, 250);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                window.setTimeout(attempt, 400);
            });
        } else {
            window.setTimeout(attempt, 400);
        }
    };

    BirthdayEffects.prototype.applyPetBirthday = function () {
        var pet = window.monikaPet;
        if (!pet) return false;

        var dialogueBox = pet.valentine;
        if (!dialogueBox || !Array.isArray(dialogueBox.dialogues)) return false;

        if (dialogueBox.__birthdayApplied) return true;

        // 生日祝福对话放在最前面，让桌宠优先说出祝福
        dialogueBox.dialogues = CONFIG.petDialogues.concat(dialogueBox.dialogues);
        dialogueBox.__birthdayApplied = true;

        // 桌宠进入生日模式：点击时额外掉落生日元素
        pet.birthdayMode = true;
        this.attachPetHat(pet);

        var originalParticles = pet.createHeartParticles;

        if (typeof originalParticles === 'function') {
            pet.createHeartParticles = function (x, y) {
                originalParticles.call(this, x, y);
                if (!this.birthdayMode) return;

                var symbols = ['🎂', '🎁', '🎉', '🎀', '🎈', '♥'];
                for (var i = 0; i < 5; i++) {
                    (function (index) {
                        var particle = document.createElement('div');
                        particle.className = 'ddlc-particle';
                        particle.innerHTML = symbols[Math.floor(Math.random() * symbols.length)];
                        particle.style.left = x + 'px';
                        particle.style.top = y + 'px';
                        particle.style.setProperty('--random-x', ((Math.random() - 0.5) * 220).toFixed(1) + 'px');
                        particle.style.setProperty('--random-y', (-Math.random() * 160 - 60).toFixed(1) + 'px');
                        particle.style.setProperty('--random-rotation', (Math.random() * 720 - 360).toFixed(0) + 'deg');
                        particle.style.animationDelay = (index * 0.06).toFixed(2) + 's';
                        document.body.appendChild(particle);
                        window.setTimeout(function () {
                            if (particle.parentNode) particle.parentNode.removeChild(particle);
                        }, 1500);
                    })(i);
                }
            };
        }

        console.log('[BirthdayEffects] 已为莫妮卡桌宠注入生日模式 ♥');
        return true;
    };

    // 给桌宠戴上一顶生日派对帽（纯装饰，不影响桌宠的拖拽/摸头等交互）
    BirthdayEffects.prototype.attachPetHat = function (pet) {
        if (!pet.element || !pet.element.appendChild) return;

        var existing = pet.element.querySelector
            ? pet.element.querySelector('.pet-birthday-hat')
            : null;
        if (existing) return;

        var hat = document.createElement('img');
        hat.className = 'pet-birthday-hat';
        hat.alt = '';
        hat.setAttribute('aria-hidden', 'true');
        hat.draggable = false;
        hat.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(HAT_SVG);

        pet.element.appendChild(hat);
        pet.element.classList.add('has-birthday-hat');
    };

    /* ============================================================
       响应式：设备类型变化时重建漂浮元素
       ============================================================ */
    BirthdayEffects.prototype.bindResize = function () {
        var self = this;
        var resizeTimer = null;

        window.addEventListener('resize', function () {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(function () {
                var oldType = self.deviceType;
                self.deviceType = self.detectDeviceType();
                if (oldType === self.deviceType) return;

                self.particleCounts = self.getParticleCounts();
                self.buildFloatingItems();
                console.log('[BirthdayEffects] 设备类型改变: ' + oldType + ' → ' + self.deviceType);
            }, 300);
        });

        // 滚动/切页时压低资源占用：页面隐藏时暂停歌词计时器
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                self.hideLyrics();
            }
        });
    };

    /* ============================================================
       启动
       ============================================================ */
    function boot() {
        window.birthdayEffects = new BirthdayEffects();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
