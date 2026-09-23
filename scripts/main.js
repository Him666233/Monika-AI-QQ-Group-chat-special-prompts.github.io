// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async function() {
    // 显示加载提示
    showLoadingMessage();
    
    // 加载提示词数据
    await loadPromptVersions();
    
    // 隐藏加载提示
    hideLoadingMessage();
    
    // 初始化页面功能
    initNavigation();
    initVersionCards();
    initModal();
    initScrollEffects();
});

// 显示加载提示
function showLoadingMessage() {
    const versionGrid = document.getElementById('versionGrid');
    if (versionGrid) {
        versionGrid.innerHTML = '<div class="loading-message">⏳ 正在加载提示词版本...</div>';
    }
}

// 隐藏加载提示
function hideLoadingMessage() {
    const loadingMsg = document.querySelector('.loading-message');
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

// 导航栏功能
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navbar = document.querySelector('.navbar');

    // 移动端菜单切换
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            console.log('Menu toggled:', navMenu.classList.contains('active'));
        });
    }

    // 导航链接点击后关闭菜单
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            if (navToggle) {
                navToggle.classList.remove('active');
            }
        });
    });

    // 点击菜单外部关闭菜单
    document.addEventListener('click', function(e) {
        if (navMenu && navToggle &&
            navMenu.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !navToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });

    // 滚动时添加导航栏阴影
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// 初始化版本卡片
function initVersionCards() {
    const versionGrid = document.getElementById('versionGrid');
    
    if (!versionGrid) return;
    
    // 生成版本卡片
    promptVersions.forEach(version => {
        const card = createVersionCard(version);
        versionGrid.appendChild(card);
    });
}

// 创建版本卡片元素
function createVersionCard(version) {
    const card = document.createElement('div');
    card.className = 'version-card';
    card.setAttribute('data-version', version.version);
    
    card.innerHTML = `
        ${version.isLatest ? '<span class="version-badge">最新</span>' : ''}
        <div class="version-number">V${version.version}</div>
        <div class="version-name">${version.name}</div>
        <div class="version-description">${version.description}</div>
    `;
    
    // 添加点击事件
    card.addEventListener('click', function() {
        openVersionModal(version);
    });
    
    return card;
}

// 模态窗口功能
function initModal() {
    const modal = document.getElementById('versionModal');
    const closeBtn = document.getElementById('modalClose');
    const copyBtn = document.getElementById('copyBtn');
    
    // 关闭按钮点击事件
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeModal();
        });
    }
    
    // 点击模态窗口外部关闭
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
    
    // ESC键关闭模态窗口
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
    
    // 复制按钮功能
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            copyPromptContent();
        });
    }
}

// 打开版本模态窗口
function openVersionModal(version) {
    const modal = document.getElementById('versionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalIntro = document.getElementById('modalIntro');
    const modalPromptContent = document.getElementById('modalPromptContent');
    
    // 设置内容
    modalTitle.textContent = `提示词版本 ${version.name}`;
    // 将换行符转换为 <br> 标签
    const introWithBreaks = version.intro.replace(/\n/g, '<br>');
    modalIntro.innerHTML = `
        <h3>更新简介</h3>
        <p>${introWithBreaks}</p>
    `;
    modalPromptContent.textContent = version.prompt;
    
    // 显示模态窗口
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 关闭模态窗口
function closeModal() {
    const modal = document.getElementById('versionModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// 复制提示词内容
function copyPromptContent() {
    const promptContent = document.getElementById('modalPromptContent');
    const copyBtn = document.getElementById('copyBtn');
    const text = promptContent.textContent;

    function onCopySuccess() {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已复制！';
        copyBtn.classList.add('copied');
        setTimeout(function() {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    }

    // 优先使用现代 Clipboard API（移动端兼容性更好）
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onCopySuccess).catch(function() {
            // Clipboard API 失败时使用回退方案
            fallbackCopy(text, onCopySuccess);
        });
    } else {
        fallbackCopy(text, onCopySuccess);
    }
}

// 回退复制方案（兼容旧浏览器）
function fallbackCopy(text, onSuccess) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = 'position:fixed;left:-999999px;top:-999999px;opacity:0;';
    // iOS需要以下属性才能正确选择文本
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);

    try {
        // iOS特殊处理
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, text.length);

        document.execCommand('copy');
        onSuccess();
    } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请长按手动选择复制');
    } finally {
        document.body.removeChild(textArea);
    }
}

// 滚动效果
function initScrollEffects() {
    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 滚动时显示元素动画
    const observerOptions = {
        threshold: 0.05,
        rootMargin: '0px 0px 200px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 观察所有卡片元素
    document.querySelectorAll('.content-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

// 工具函数：节流
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 工具函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
