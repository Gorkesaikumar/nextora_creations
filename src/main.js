import './style.css';
import { mountInternships } from './internships/portal.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

mountInternships();

// Motion Preference Check
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// GSAP Animations setup
gsap.registerPlugin(ScrollTrigger);

// Lenis Smooth Scrolling (Only if reduced motion is disabled)
let lenis = null;
if (!prefersReducedMotion) {
    lenis = new Lenis({
        duration: 1.0,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        smoothTouch: false, // Maintain native smooth touch momentum on mobile devices
        touchMultiplier: 1.5
    });

    // Synchronize Lenis scroll position with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis RAF via GSAP ticker for synchronous smooth animation frame updates
    gsap.ticker.add((time) => {
        if (lenis) {
            lenis.raf(time * 1000);
        }
    });

    gsap.ticker.lagSmoothing(0);
}

// Smooth Scroll for Anchor Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href && href !== '#') {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                if (lenis) {
                    lenis.scrollTo(target, { offset: -20, duration: 1.0 });
                } else {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
});

if (!prefersReducedMotion) {
    // Fade up elements animation
    gsap.utils.toArray('.fade-up').forEach(elem => {
        gsap.fromTo(elem,
            { y: 40, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: elem,
                    start: "top 88%",
                    toggleActions: "play none none none"
                }
            }
        );
    });

    // Image Parallax animation
    gsap.utils.toArray('.parallax-img').forEach(elem => {
        gsap.to(elem, {
            yPercent: 15,
            ease: "none",
            scrollTrigger: {
                trigger: elem.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.5
            }
        });
    });

    // Magnetic Button Effect (Fine pointer devices only)
    if (isFinePointer) {
        const magneticBtns = document.querySelectorAll('.magnetic-btn');
        magneticBtns.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(btn, { x: x * 0.25, y: y * 0.25, duration: 0.3, ease: 'power2.out' });
            });
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
            });
        });
    }
} else {
    // Ensure all fade-up elements are instantly visible if reduced motion is preferred
    document.querySelectorAll('.fade-up').forEach(elem => {
        elem.style.opacity = '1';
        elem.style.transform = 'none';
    });
}

// Memory Leak Prevention: Kill ScrollTriggers on Unload
window.addEventListener('beforeunload', () => {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    if (lenis) {
        lenis.destroy();
    }
});

// Modal Logic & ARIA States
const modal = document.getElementById('projectModal');
const modalContent = document.getElementById('modalContent');
const openBtns = [
    document.getElementById('openModalBtnNav'),
    document.getElementById('openModalBtnCTA'),
    document.getElementById('openModalBtnNavMobile')
];
const closeBtn = document.getElementById('closeModalBtn');
const overlay = document.getElementById('modalOverlay');
let lastFocusedElement = null;

function openModal() {
    if (!modal || !modalContent) return;
    lastFocusedElement = document.activeElement;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.setAttribute('aria-hidden', 'false');
    modalContent.classList.remove('translate-y-10');
    modalContent.classList.add('translate-y-0');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();

    // Focus initial input
    const firstInput = modal.querySelector('input[name="name"]');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

function closeModal() {
    if (!modal || !modalContent) return;
    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.setAttribute('aria-hidden', 'true');
    modalContent.classList.remove('translate-y-0');
    modalContent.classList.add('translate-y-10');
    document.body.style.overflow = '';
    if (lenis) lenis.start();

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
}

openBtns.forEach(btn => {
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isMobileMenuOpen) toggleMobileMenu();
            openModal();
        });
    }
});

if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (overlay) overlay.addEventListener('click', closeModal);

// Close modal on Escape key press
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') {
        closeModal();
    }
});

// Mobile Menu Logic & ARIA States
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const hamburgerLine1 = document.getElementById('hamburger-line-1');
const hamburgerLine2 = document.getElementById('hamburger-line-2');
let isMobileMenuOpen = false;

function toggleMobileMenu() {
    if (!mobileMenu || !mobileMenuToggle) return;
    isMobileMenuOpen = !isMobileMenuOpen;
    mobileMenuToggle.setAttribute('aria-expanded', isMobileMenuOpen.toString());
    mobileMenu.setAttribute('aria-hidden', (!isMobileMenuOpen).toString());

    if (isMobileMenuOpen) {
        mobileMenu.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-[-100%]');
        mobileMenu.classList.add('translate-y-0');
        if (hamburgerLine1 && hamburgerLine2) {
            hamburgerLine1.classList.add('translate-y-[3px]', 'rotate-45');
            hamburgerLine2.classList.add('-translate-y-[3px]', '-rotate-45');
        }
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
    } else {
        mobileMenu.classList.add('opacity-0', 'pointer-events-none', 'translate-y-[-100%]');
        mobileMenu.classList.remove('translate-y-0');
        if (hamburgerLine1 && hamburgerLine2) {
            hamburgerLine1.classList.remove('translate-y-[3px]', 'rotate-45');
            hamburgerLine2.classList.remove('-translate-y-[3px]', '-rotate-45');
        }
        document.body.style.overflow = '';
        if (lenis) lenis.start();
    }
}

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
}

// Close menu on link click
document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
        if (isMobileMenuOpen) toggleMobileMenu();
    });
});

// Form Submission Logic to Google Sheets
const form = document.getElementById('projectForm');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const submitSpinner = document.getElementById('submitSpinner');
const formSuccess = document.getElementById('formSuccess');
const formError = document.getElementById('formError');

const scriptURL = 'https://script.google.com/macros/s/AKfycbwj8ewoi-zyYufafUrlxkU8wVqbrZDXkSQn_DSIssFbDsmXub-CB6lNxGxHbTXpAlJ-TQ/exec';

if (form) {
    form.addEventListener('submit', e => {
        e.preventDefault();

        if (submitBtn) submitBtn.disabled = true;
        if (submitText) submitText.textContent = 'Sending...';
        if (submitSpinner) submitSpinner.classList.remove('hidden');
        if (formSuccess) formSuccess.classList.add('hidden');
        if (formError) formError.classList.add('hidden');

        fetch(scriptURL, { method: 'POST', body: new URLSearchParams(new FormData(form)), mode: 'no-cors' })
            .then(() => {
                if (formSuccess) formSuccess.classList.remove('hidden');
                form.reset();
            })
            .catch(() => {
                if (formError) formError.classList.remove('hidden');
            })
            .finally(() => {
                if (submitBtn) submitBtn.disabled = false;
                if (submitText) submitText.textContent = 'Submit Requirements';
                if (submitSpinner) submitSpinner.classList.add('hidden');
            });
    });
}

