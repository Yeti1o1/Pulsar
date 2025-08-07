function setupScrollArrows(category) {
    const btnContainer = category.querySelector('.btn-container, .favorite-container, .btn-container-grid');
    const leftArrow = category.querySelector('.scroll-arrow.left-arrow');
    const rightArrow = category.querySelector('.scroll-arrow.right-arrow');

    if (!btnContainer || !leftArrow || !rightArrow) {
        return;
    }

    let scrollAmount;
    const updateScrollAmount = () => {
        const visibleButtons = Array.from(btnContainer.querySelectorAll('.btn'))
            .filter(btn => window.getComputedStyle(btn).display !== 'none');
        if (visibleButtons.length > 0) {
            const buttonWidth = visibleButtons[0].offsetWidth;
            scrollAmount = Math.max(buttonWidth * 3, 150);
        } else {
            scrollAmount = btnContainer.clientWidth / 2;
        }
    };

    updateScrollAmount();

    function updateArrowVisibility() {
        if (!category.offsetParent || !btnContainer.offsetParent ||
            window.getComputedStyle(btnContainer).display === 'none' ||
            window.getComputedStyle(category).display === 'none') {
            leftArrow.classList.add('hidden');
            rightArrow.classList.add('hidden');
            return;
        }

        const visibleButtons = Array.from(btnContainer.querySelectorAll('.btn'))
            .filter(btn => window.getComputedStyle(btn).display !== 'none');
        if (visibleButtons.length === 0) {
            leftArrow.classList.add('hidden');
            rightArrow.classList.add('hidden');
            return;
        }

        const tolerance = 5;
        const maxScrollLeft = btnContainer.scrollWidth - btnContainer.clientWidth;
        const canScroll = btnContainer.scrollWidth > btnContainer.clientWidth + tolerance;

        if (canScroll && btnContainer.scrollLeft > tolerance) {
            leftArrow.classList.remove('hidden');
            if (!leftArrow._wasVisible) {
                leftArrow.classList.add('show-pulse');
                setTimeout(() => leftArrow.classList.remove('show-pulse'), 400);
            }
            leftArrow._wasVisible = true;
        } else {
            leftArrow.classList.add('hidden');
            leftArrow._wasVisible = false;
        }

        if (canScroll && btnContainer.scrollLeft < maxScrollLeft - tolerance) {
            rightArrow.classList.remove('hidden');
            if (!rightArrow._wasVisible) {
                rightArrow.classList.add('show-pulse');
                setTimeout(() => rightArrow.classList.remove('show-pulse'), 400);
            }
            rightArrow._wasVisible = true;
        } else {
            rightArrow.classList.add('hidden');
            rightArrow._wasVisible = false;
        }
    }

    const debouncedUpdateArrows = debounce(updateArrowVisibility, 50);
    category._updateArrowVisibility = debouncedUpdateArrows;

    btnContainer.addEventListener('scroll', debouncedUpdateArrows);

    const mutationObserver = new MutationObserver(debouncedUpdateArrows);
    mutationObserver.observe(btnContainer, { childList: true, attributes: true, subtree: true });

    const resizeObserver = new ResizeObserver(() => {
        updateScrollAmount();
        debouncedUpdateArrows();
    });
    resizeObserver.observe(btnContainer);
    resizeObserver.observe(category);

    const easeInOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    let isAnimating = false;
    const animateScroll = (direction, duration = 400) => {
        if (isAnimating) return;
        isAnimating = true;

        const start = btnContainer.scrollLeft;
        const target = start + direction * scrollAmount;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutQuad(progress);
            btnContainer.scrollLeft = start + (target - start) * easedProgress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                isAnimating = false;
            }
        };

        requestAnimationFrame(animate);
    };

    const scrollStep = (direction) => {
        if (isNaN(scrollAmount) || scrollAmount <= 0) return;
        animateScroll(direction, 400);
    };

    if (category._scrollStepListeners) {
        leftArrow.removeEventListener('click', category._scrollStepListeners.left);
        rightArrow.removeEventListener('click', category._scrollStepListeners.right);
        leftArrow.removeEventListener('mousedown', category._scrollStepListeners.leftHoldStart);
        leftArrow.removeEventListener('mouseup', category._scrollStepListeners.leftHoldStop);
        leftArrow.removeEventListener('mouseleave', category._scrollStepListeners.leftHoldStop);
        leftArrow.removeEventListener('touchstart', category._scrollStepListeners.leftHoldStartTouch);
        leftArrow.removeEventListener('touchend', category._scrollStepListeners.leftHoldStop);
        leftArrow.removeEventListener('touchcancel', category._scrollStepListeners.leftHoldStop);
        rightArrow.removeEventListener('mousedown', category._scrollStepListeners.rightHoldStart);
        rightArrow.removeEventListener('mouseup', category._scrollStepListeners.rightHoldStop);
        rightArrow.removeEventListener('mouseleave', category._scrollStepListeners.rightHoldStop);
        rightArrow.removeEventListener('touchstart', category._scrollStepListeners.rightHoldStartTouch);
        rightArrow.removeEventListener('touchend', category._scrollStepListeners.rightHoldStop);
        rightArrow.removeEventListener('touchcancel', category._scrollStepListeners.rightHoldStop);
    }

    const leftClickListener = () => scrollStep(-1);
    const rightClickListener = () => scrollStep(1);

    leftArrow.addEventListener('click', leftClickListener);
    rightArrow.addEventListener('click', rightClickListener);

    let scrollHoldInterval = null;
    const startHoldScrolling = (direction) => {
        stopHoldScrolling();
        if (!isAnimating) {
            scrollStep(direction);
            scrollHoldInterval = setInterval(() => {
                if (!isAnimating) scrollStep(direction);
            }, 450);
        }
    };
    const stopHoldScrolling = () => {
        clearInterval(scrollHoldInterval);
        scrollHoldInterval = null;
    };

    const leftHoldStart = () => startHoldScrolling(-1);
    const leftHoldStop = stopHoldScrolling;
    const leftHoldStartTouch = (e) => { e.preventDefault(); startHoldScrolling(-1); };

    const rightHoldStart = () => startHoldScrolling(1);
    const rightHoldStop = stopHoldScrolling;
    const rightHoldStartTouch = (e) => { e.preventDefault(); startHoldScrolling(1); };

    leftArrow.addEventListener('mousedown', leftHoldStart);
    leftArrow.addEventListener('mouseup', leftHoldStop);
    leftArrow.addEventListener('mouseleave', leftHoldStop);
    leftArrow.addEventListener('touchstart', leftHoldStartTouch, { passive: false });
    leftArrow.addEventListener('touchend', leftHoldStop);
    leftArrow.addEventListener('touchcancel', leftHoldStop);

    rightArrow.addEventListener('mousedown', rightHoldStart);
    rightArrow.addEventListener('mouseup', rightHoldStop);
    rightArrow.addEventListener('mouseleave', rightHoldStop);
    rightArrow.addEventListener('touchstart', rightHoldStartTouch, { passive: false });
    rightArrow.addEventListener('touchend', rightHoldStop);
    rightArrow.addEventListener('touchcancel', rightHoldStop);

    category._scrollStepListeners = {
        left: leftClickListener, right: rightClickListener,
        leftHoldStart: leftHoldStart, leftHoldStop: leftHoldStop, leftHoldStartTouch: leftHoldStartTouch,
        rightHoldStart: rightHoldStart, rightHoldStop: rightHoldStop, rightHoldStartTouch: rightHoldStartTouch
    };

    updateArrowVisibility();
}


function filterGames() {
    const input = document.getElementById('myInput');
    const filter = input.value.toUpperCase().trim();
    const categoriesWrapper = document.getElementById('categoriesWrapper');

    const categories = categoriesWrapper?.querySelectorAll('.game-category');
    const noResultsMessage = document.getElementById('noResultsMessage');
    let hasVisibleGames = false;

    categories?.forEach(category => {
        const buttons = category.querySelectorAll('.btn');
        let categoryHasVisibleButton = false;

        buttons.forEach(button => {
            const gameName = getButtonName(button);
            const buttonMatches = gameName.toUpperCase().includes(filter);

            if (buttonMatches) {
                if (button.classList.contains('hidden')) {
                    button.classList.remove('hidden');
                }
                hasVisibleGames = true;
                categoryHasVisibleButton = true;
            } else {
                if (!button.classList.contains('hidden')) {
                    button.classList.add('hidden');
                }
            }
        });

        if (filter === '') {
            category.style.display = '';
        } else {
            category.style.display = categoryHasVisibleButton ? '' : 'none';
        }

        const updateFunc = category._updateArrowVisibility;
        if (typeof updateFunc === 'function') {
            setTimeout(updateFunc, 10);
        }
    });

    if (noResultsMessage) {
        noResultsMessage.style.display = (filter !== '' && !hasVisibleGames) ? 'block' : 'none';
    }
}

function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function getButtonName(button) {
    const spanText = button.querySelector('.game-info-bar .game-name')?.textContent.trim();
    if (spanText) return spanText;

    const imgAlt = button.querySelector('.imgg')?.alt;
    if (imgAlt) return imgAlt;

    let name = "";
    button.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "") {
            name = node.textContent.trim();
        }
    });
    if (name) return name;

    const path = button.getAttribute('data-path');
    if (path) {
        let pathName = path.split('/').pop().split('.')[0].replace(/[-_]/g, ' ');
        return pathName.replace(/\b\w/g, l => l.toUpperCase());
    }

    return 'Unknown Game';
}

(() => {
    let favoriteContainer = null;
    let favoritesSection = null;

    function updateFavoritesSectionVisibility() {
        if (!favoriteContainer || !favoritesSection) return;

        const hasAnyFavorites = favoriteContainer.children.length > 0;
        favoritesSection.style.display = hasAnyFavorites ? '' : 'none';

        if (hasAnyFavorites) {
            const updateFunc = favoritesSection._updateArrowVisibility;
            if (typeof updateFunc === 'function') setTimeout(updateFunc, 10);
        }
    }

    function handleHeartIconClick(event) {
        event.stopPropagation();

        const heartIcon = event.currentTarget;
        const button = heartIcon.closest(".btn");
        if (!button) return;

        toggleFavoriteState(button);
    }

    function toggleFavoriteState(button) {
        const heartIcon = button.querySelector('.heart-icon');
        if (!heartIcon) return;

        let gameId = button.dataset.gameId;

        if (!gameId) {
            const gamePath = button.getAttribute("data-path");
            gameId = gamePath ? `fav-${gamePath.replace(/[^a-zA-Z0-9]+/g, '-')}` : `fav-unknown-${Math.random().toString(16).slice(2)}`;
            button.dataset.gameId = gameId;
            console.warn(`Generated gameId for button on click: ${gameId}`);
        }

        const isCurrentlyHearted = heartIcon.classList.contains("hearted");
        const allMatchingButtons = document.querySelectorAll(`.btn[data-game-id="${gameId}"]`);

        if (isCurrentlyHearted) {
            allMatchingButtons.forEach(btn => btn.querySelector('.heart-icon')?.classList.remove("hearted"));
            localStorage.setItem(`heartState-${gameId}`, "false");
            removeFromFavorites(gameId);
        } else {
            allMatchingButtons.forEach(btn => btn.querySelector('.heart-icon')?.classList.add("hearted"));
            localStorage.setItem(`heartState-${gameId}`, "true");

            const originalButton = document.querySelector(`.categories-wrapper .game-category:not(#favoritesSection) .btn[data-game-id="${gameId}"]`);
            if (originalButton) {
                addToFavorites(originalButton);
            } else {
                updateFavoritesSectionVisibility();
            }
        }
    }

    function addToFavorites(originalButton) {
        if (!favoriteContainer) return;
        const gameId = originalButton.dataset.gameId;

        const existingFavorite = favoriteContainer.querySelector(`.btn[data-game-id="${gameId}"]`);

        if (!existingFavorite) {
            const clonedButton = originalButton.cloneNode(true);

            const clonedHeartIcon = clonedButton.querySelector('.heart-icon');
            if (clonedHeartIcon) {
                clonedHeartIcon.classList.add('hearted');

                clonedHeartIcon.removeEventListener('click', handleHeartIconClick);
                clonedHeartIcon.addEventListener('click', handleHeartIconClick);
            }

            favoriteContainer.appendChild(clonedButton);
        } else {
            existingFavorite.querySelector('.heart-icon')?.classList.add('hearted');

            const existingHeartIcon = existingFavorite.querySelector('.heart-icon');
            if (existingHeartIcon && !existingHeartIcon._hasHeartListener) {
                existingHeartIcon.addEventListener('click', handleHeartIconClick);
                existingHeartIcon._hasHeartListener = true;
            }
        }

        updateFavoritesSectionVisibility();
    }

    function removeFromFavorites(gameId) {
        const favoritedItem = favoriteContainer?.querySelector(`.btn[data-game-id="${gameId}"]`);
        if (favoritedItem) {
            favoriteContainer.removeChild(favoritedItem);
        }
        updateFavoritesSectionVisibility();
    }

    document.addEventListener("DOMContentLoaded", function () {
        favoriteContainer = document.querySelector("#favoritesSection .favorite-container");
        favoritesSection = document.getElementById('favoritesSection');
        if (!favoriteContainer || !favoritesSection) {
            console.error("Favorites container or section not found.");
            return;
        }

        document.querySelectorAll(".categories-wrapper .btn[data-path]").forEach(button => {
            const heartIcon = button.querySelector(".heart-icon");
            if (!heartIcon) {
                return;
            }

            let gameId = button.dataset.gameId;
            if (!gameId) {
                const gamePath = button.getAttribute("data-path");
                gameId = gamePath ? `fav-${gamePath.replace(/[^a-zA-Z0-9]+/g, '-')}` : `fav-unknown-${Math.random().toString(16).slice(2)}`;
                button.dataset.gameId = gameId;
            }

            if (!heartIcon._hasHeartListener) {
                heartIcon.addEventListener('click', handleHeartIconClick);
                heartIcon._hasHeartListener = true;
            }

            const isHearted = localStorage.getItem(`heartState-${gameId}`) === "true";
            if (isHearted) {
                heartIcon.classList.add("hearted");
            } else {
                heartIcon.classList.remove("hearted");
            }
        });

        document.querySelectorAll(".categories-wrapper .game-category:not(#favoritesSection) .btn[data-game-id]").forEach(button => {
            const gameId = button.dataset.gameId;
            const isHearted = localStorage.getItem(`heartState-${gameId}`) === "true";

            if (isHearted) {
                addToFavorites(button);
            }
        });

        updateFavoritesSectionVisibility();
    });
})();

(() => {
    document.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('Toggle');
        const categoriesWrapper = document.getElementById('categoriesWrapper');

        if (!toggleBtn || !categoriesWrapper) {
            return;
        }

        toggleBtn.addEventListener('click', () => {
            const isHidden = window.getComputedStyle(categoriesWrapper).display === 'none';
            if (isHidden) {
                categoriesWrapper.style.display = '';
                toggleBtn.textContent = 'Hide Categories';
                toggleBtn.setAttribute('aria-expanded', 'true');

                document.querySelectorAll('.game-category').forEach(category => {
                    if (window.getComputedStyle(category).display !== 'none') {
                        const updateFunc = category._updateArrowVisibility;
                        if (typeof updateFunc === 'function') setTimeout(updateFunc, 10);
                    }
                });
            } else {
                categoriesWrapper.style.display = 'none';
                toggleBtn.textContent = 'Show Categories';
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });

        toggleBtn.setAttribute('aria-expanded', window.getComputedStyle(categoriesWrapper).display !== 'none');
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    console.log("Main Initializer: DOM Loaded. Initializing...");

    try {
        console.log("Main Initializer: Setting up scroll arrows for all categories...");
        document.querySelectorAll('.game-category').forEach(setupScrollArrows);
        console.log("Main Initializer: Scroll arrow setup complete.");
    } catch (error) {
        console.error("Main Initializer: Error setting up scroll arrows:", error);
    }

    try {
        const mainContainer = document.querySelector('main.hub-container');
        if (mainContainer) {
            console.log("Main Initializer: Attaching delegated item launch listener to main.hub-container");

            mainContainer.addEventListener('click', function (event) {
                const clickedButton = event.target.closest('.btn[data-path]');
                if (!clickedButton || event.target.classList.contains('heart-icon') || event.target.closest('.heart-icon')) {
                    return;
                }

                console.log("Delegated listener: Valid button click detected for launching:", clickedButton);

                const path = clickedButton.getAttribute('data-path');
                const itemName = getButtonName(clickedButton);

                if (path && path !== '#') {
                    console.log(`LAUNCHING (Delegated): "${itemName}" from path: "${path}"`);
                    localStorage.setItem("lastClickedUrl", path);
                    localStorage.setItem("lastClickedGame", itemName);
                    window.location.href = "game.html";
                } else {
                    console.error("Delegated Launch Error: Button missing or has invalid data-path.", clickedButton);
                    alert("Error: Could not determine app details to launch.");
                }
            });

            console.log("Main Initializer: Delegated item launch listener attached.");
        } else {
            console.error("Main Initializer: Could not find main.hub-container for delegated listener.");
        }
    } catch (error) {
        console.error("Main Initializer: Error attaching delegated item launch listener:", error);
    }

    try {
        console.log("Main Initializer: Attaching search listeners...");
        const searchInput = document.getElementById('myInput');
        const searchIconBtn = document.querySelector('.search-icon-btn');

        if (searchInput && searchIconBtn) {
            searchIconBtn.addEventListener('click', () => {
                searchInput.focus();
                filterGames();
            });

            searchInput.addEventListener('keypress', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    filterGames();
                }
            });

            searchInput.addEventListener('input', debounce(filterGames, 250));
            console.log("Main Initializer: Search listeners attached.");
        } else {
            console.error("Main Initializer: Search input (#myInput) or button (.search-icon-btn) not found.");
        }

        if (searchInput && searchInput.value.trim() !== '') {
            console.log("Main Initializer: Performing initial filter based on input value.");
            filterGames();
        } else {
            console.log("Main Initializer: No initial search value, skipping filter.");
        }
    } catch (error) {
        console.error("Main Initializer: Error attaching search listeners or performing initial filter:", error);
    }

    console.log("Main Initializer: Initialization complete.");
});

function showFavoritedGames(event) {
    event.preventDefault();

    const bigDiv = document.getElementById('bigDivToHide');
    if (bigDiv) bigDiv.style.display = 'none';

    const clickedLink = event.currentTarget;
    if (clickedLink) clickedLink.style.display = 'none';

    const categoriesWrapper = document.getElementById('categoriesWrapper');
    if (categoriesWrapper) {
        categoriesWrapper.querySelectorAll('section.game-category').forEach(section => {
            if (!section.classList.contains('favorites-section')) {
                section.style.display = 'none';
            }
        });
    }

    const favoritesSection = document.querySelector('section.favorites-section');
    if (favoritesSection) {
        favoritesSection.querySelectorAll('.scroll-arrows').forEach(arrowDiv => {
            arrowDiv.style.display = 'none';
        });

        const btnContainer = favoritesSection.querySelector('.btn-container');
        if (btnContainer) {
            btnContainer.classList.remove('btn-container');
            btnContainer.classList.add('btnnn-container');
        }
    }

    const viewAllBtn = document.querySelector('.toggle-categories-btn[href="index.html"]');
    const hideCategoriesBtn = document.querySelector('.toggle-categories-btn[href="gamesall.html?category=all"]');

    if (viewAllBtn) viewAllBtn.hidden = false;
    if (hideCategoriesBtn) hideCategoriesBtn.hidden = true;
}
