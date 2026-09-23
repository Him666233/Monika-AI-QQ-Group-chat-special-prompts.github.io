/**
 * 卡片堆叠滚动效果 - 翻书式
 * 翻过去的卡片隐藏，像翻书一样
 */

(function() {
    'use strict';

    let heroSection = null;
    let stackCards = []; // 参与堆叠的卡片（不包括Footer）
    let ticking = false;

    function init() {
        heroSection = document.querySelector('.hero-section');
        const allCards = document.querySelectorAll('.content-card');

        if (!heroSection || allCards.length === 0) return;

        // 找出参与堆叠的卡片（到versions为止）
        stackCards = [];
        let foundVersions = false;
        allCards.forEach(card => {
            if (!foundVersions) {
                stackCards.push(card);
                if (card.id === 'versions') {
                    foundVersions = true;
                }
            }
        });

        // 设置Hero - 在导航栏下方
        heroSection.style.position = 'sticky';
        heroSection.style.top = '0';
        heroSection.style.zIndex = '50';

        // 设置参与堆叠的卡片 - 都在导航栏下方
        stackCards.forEach((card, index) => {
            card.style.position = 'sticky';
            card.style.top = '0';
            // 越下面的卡片z-index越高
            card.style.zIndex = (60 + index).toString();
            card.style.boxShadow = '0 -8px 30px rgba(0, 0, 0, 0.15)';
        });

        // 监听滚动
        window.addEventListener('scroll', onScroll, { passive: true });

        // 初始更新
        updatePositions();
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updatePositions();
                ticking = false;
            });
            ticking = true;
        }
    }

    function updatePositions() {
        const scrollY = window.scrollY;
        const viewportHeight = window.innerHeight;

        // 更新Hero效果
        if (heroSection) {
            const heroHeight = heroSection.offsetHeight;

            // 当第一个卡片开始覆盖时，Hero快速退出
            if (stackCards.length > 0) {
                const firstCardRect = stackCards[0].getBoundingClientRect();
                if (firstCardRect.top < heroHeight * 0.9) {
                    const exitProgress = Math.min(1, (heroHeight * 0.9 - firstCardRect.top) / (heroHeight * 0.3));
                    heroSection.style.transform = `translateY(${-exitProgress * heroHeight}px)`;
                    heroSection.style.opacity = (1 - exitProgress).toString();
                    heroSection.style.visibility = exitProgress >= 1 ? 'hidden' : 'visible';
                } else {
                    heroSection.style.transform = 'translateY(0)';
                    heroSection.style.opacity = '1';
                    heroSection.style.visibility = 'visible';
                }
            }
        }

        // 更新每个卡片的效果
        stackCards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const cardHeight = rect.height;

            // 检查是否被下一个卡片覆盖
            let exitProgress = 0;
            if (index < stackCards.length - 1) {
                const nextCard = stackCards[index + 1];
                const nextRect = nextCard.getBoundingClientRect();

                // 当下一个卡片的顶部接近视口顶部时，当前卡片开始退出
                if (nextRect.top < cardHeight * 0.7) {
                    exitProgress = Math.min(1, (cardHeight * 0.7 - nextRect.top) / (cardHeight * 0.25));
                }
            }

            // 应用效果 - 快速完全移出
            if (exitProgress > 0) {
                const translateY = -exitProgress * cardHeight * 1.2; // 完全移出
                card.style.transform = `translateY(${translateY}px)`;
                card.style.opacity = Math.max(0, 1 - exitProgress * 2).toString();
                card.style.visibility = exitProgress >= 0.9 ? 'hidden' : 'visible';
            } else {
                card.style.transform = 'translateY(0)';
                card.style.opacity = '1';
                card.style.visibility = 'visible';
            }
        });
    }

    // DOM加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
