//Images import
const ASSET_BASE = "https://cdn.jsdelivr.net/gh/JhonTheDev/top10@main/";

function toAssetUrl(path) {
return ASSET_BASE + encodeURI(path);
}

function hydrateImageSources() {
const images = document.querySelectorAll("img[src]");

images.forEach((img) => {
const src = img.getAttribute("src");
if (!src) return;

});
}

document.addEventListener("DOMContentLoaded", () => {
hydrateImageSources();
});

// Card tilt effect
const cards = document.querySelectorAll('.card');
const max_rot = 2;

function getLocalMouse(event, element) {
    const rect = element.getBoundingClientRect ();
    const localX = event.clientX - rect.left;
    const localY =event.clientY - rect.top;
    return { localX, localY, width: rect.width, height: rect.height };        
}

function normalizeToCenter(localX, localY, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const nx = (localX - centerX) / centerX;
    const ny = (localY - centerY) / centerY;
    return { nx, ny };
}

function applyTilt(card, nx, ny) {
    const rotateY = nx * max_rot;
    const rotateX = -ny * max_rot;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;    
}

function resetTilt(card) {
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
}

cards.forEach((card) => {
    card.addEventListener('mousemove', (event) => {
        const { localX, localY, width, height } = getLocalMouse(event, card);
        const { nx, ny } = normalizeToCenter(localX, localY, width, height);
        applyTilt(card, nx, ny);
    });

    card.addEventListener('mouseleave', () => {
        resetTilt(card);
    });
});

// 3D carousel state
const shells = document.querySelectorAll('.card-shell');
let activeIndex = 0;

function updateCarousel() {
    const total = shells.length;
    const current = normalizeIndex(activeIndex, total);
    shells.forEach((shell, i) => {
        const offset = getCyclicOffset(i, current, total);

        const x = offset * 84;
        const z = -Math.abs(offset) * 140;
        const ry = offset * -16;
        const scale = offset === 0 ? 1 : 0.8;
        const opacity = Math.abs(offset) > 3 ? 0 : 1;

        shell.style.transform =
        `translateX(${x}%) translateZ(${z}px) rotateY(${ry}deg) scale(${scale})`;

        shell.style.opacity = opacity;
        shell.classList.toggle('is-active', offset === 0 );
    });
}

// Circular index helpers
function normalizeIndex(index, total) {
    return((index % total) + total) % total;
}

function getCyclicOffset(itemIndex, currentIndex, total) {
    let offset = itemIndex - currentIndex;
    const half = total / 2;
    if (offset > half) offset -= total;
    if (offset < -half) offset += total;
    return offset;
}

function goNext() {
    activeIndex += 1;
    updateCarousel();
}

function goPrev() {
    activeIndex -= 1;
    updateCarousel();
}

// Mouse wheel navigation
let wheelLock = false;

window.addEventListener('wheel', (e) => {
    if (wheelLock) return;
    wheelLock = true;

    if (e.deltaY > 0) goNext();
    else goPrev();

    setTimeout(() => {
        wheelLock = false;        
    }, 260);
}, { passive: true });

// Touch swipe navigation with axis lock
const carouselViewport = document.querySelector('.carousel-viewport');
const SWIPE_TRIGGER = 30;
const AXIS_LOCK_TRIGGER = 8;
const AXIS_RATIO = 1.25;

const touchState = {
    active: false,
    startX: 0,
    startY: 0,
    axisLocked: null,
    navigated: false
};

function resetTouchState() {
    touchState.active = false;
    touchState.startX = 0;
    touchState.startY = 0;
    touchState.axisLocked = null;
    touchState.navigated = false;
}

if (carouselViewport) {
    carouselViewport.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'touch') return;

        touchState.active = true;
        touchState.startX = event.clientX;
        touchState.startY = event.clientY;
        touchState.axisLocked = null;
        touchState.navigated = false;
    });

    carouselViewport.addEventListener('pointermove', (event) => {
        if (!touchState.active || event.pointerType !== 'touch') return;

        const dx = event.clientX - touchState.startX;
        const dy = event.clientY - touchState.startY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (!touchState.axisLocked && (absDx > AXIS_LOCK_TRIGGER || absDy > AXIS_LOCK_TRIGGER)) {
            touchState.axisLocked = absDx > absDy * AXIS_RATIO ? 'x' : 'y';
        }

        if (touchState.axisLocked !== 'x') return;

        event.preventDefault();

        if (touchState.navigated || absDx < SWIPE_TRIGGER) return;

        if (dx < 0) goNext();
        else goPrev();

        touchState.navigated = true;
    }, { passive: false });

    carouselViewport.addEventListener('pointerup', resetTouchState);
    carouselViewport.addEventListener('pointercancel', resetTouchState);
}

// Initial render and resize sync
updateCarousel();
window.addEventListener('resize', updateCarousel);
