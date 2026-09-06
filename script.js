gsap.registerPlugin(ScrollTrigger);

const book = document.querySelector('.book');
const leftSide = document.querySelector('.left-side');
const rightSide = document.querySelector('.right-side');

const pages = gsap.utils.toArray('.page');
// We don't flip the static back cover
const flippablePages = pages.filter(p => !p.classList.contains('back-cover'));
const totalFlippable = flippablePages.length;

// ==========================================
// SCENES DATA CONFIGURATION (Single Source of Truth)
// ==========================================
const SCENES_CONFIG = [
    {
        id: 1,
        pageIndex: 1,
        title: "BEGINNING",
        subtitle: "THE SACRED AWAKENING & EARLY CALLING",
        narrationSrc: "audio/1.mp3",
    },
    {
        id: 2,
        pageIndex: 2,
        title: "ASCETIC LIFE THE WANDERER",
        subtitle: "THE WANDERER'S SEARCH FOR TRUTH",
        narrationSrc: "audio/2nd_audio.mp3",
    },
    {
        id: 3,
        pageIndex: 3,
        title: "REUNION WITH HIS FATHER",
        subtitle: "A TOUCHING RETURN ON THE SACRED GANGA",
        narrationSrc: "audio/hanuman.mp3",
    },
    {
        id: 4,
        pageIndex: 4,
        title: "MIDDLE LIFE",
        subtitle: "TOTAL RENUNCIATION & DEVOTION TO SERVICE",
        narrationSrc: "audio/1.mp3",
    },
    {
        id: 5,
        pageIndex: 5,
        title: "WORK OF GOD BY THE MAN OF GOD",
        subtitle: "COMPASSION & A PROMISE FULFILLED",
        narrationSrc: "audio/2nd_audio.mp3",
    },
    {
        id: 6,
        pageIndex: 6,
        title: "THE TRAIN INCIDENT SCENE 1",
        subtitle: "THE MYSTERIOUS HALT AT FARRUKHABAD",
        narrationSrc: "audio/1.mp3",
    },
    {
        id: 7,
        pageIndex: 7,
        title: "TRAIN INCIDENT SCENE 2",
        subtitle: "DIVINE REVELATION & THE POWER OF HUMILITY",
        narrationSrc: "audio/1.mp3",
    },
    {
        id: 8,
        pageIndex: 8,
        title: "OTHER MIRACLE REAL",
        subtitle: "HEALING PAIN & TRANSFORMATION OF WATER",
        narrationSrc: "audio/2nd_audio.mp3",
    },
    {
        id: 9,
        pageIndex: 9,
        title: "TEMPLE FIRE",
        subtitle: "DIVINE PROTECTION OVER KAINCHI DHAM",
        narrationSrc: "audio/hanuman.mp3",
    },
    {
        id: 10,
        pageIndex: 10,
        title: "FLOOD 1",
        subtitle: "RAGING WATERS & UNTOUCHED SERENITY",
        narrationSrc: "audio/1.mp3",
    },
    {
        id: 11,
        pageIndex: 11,
        title: "FLOOD 2",
        subtitle: "SAVING THE ASHRAM THROUGH DIVINE GRACE",
        narrationSrc: "audio/2nd_audio.mp3",
    },
    {
        id: 12,
        pageIndex: 12,
        title: "DA BEGINNING",
        subtitle: "AN ETERNAL HORIZON OF FAITH & DEVOTION",
        narrationSrc: "audio/hanuman.mp3",
    }
];

// Initialize left-page titles on every scene spread from the single config source
function initLeftPageTitles() {
    SCENES_CONFIG.forEach(scene => {
        const prevPageIndex = scene.pageIndex - 1;
        if (prevPageIndex >= 0 && prevPageIndex < flippablePages.length) {
            const backEl = flippablePages[prevPageIndex].querySelector('.back');
            if (backEl) {
                if (!backEl.querySelector('.back-design')) {
                    const design = document.createElement('div');
                    design.className = 'back-design';
                    backEl.appendChild(design);
                }
                let titleBlock = backEl.querySelector('.left-page-title-block');
                if (!titleBlock) {
                    titleBlock = document.createElement('div');
                    titleBlock.className = 'left-page-title-block';
                    backEl.appendChild(titleBlock);
                }
                titleBlock.innerHTML = `
                    <div class="left-page-accent">✦</div>
                    <h3 class="left-page-title">${scene.title}</h3>
                    <div class="left-page-rule"></div>
                    <p class="left-page-subtitle">${scene.subtitle}</p>
                `;
            }
        }
    });
}
initLeftPageTitles();

// Set dynamic height for the scroll container based on number of pages
const scrollContainer = document.querySelector('.scroll-container');
// Give plenty of scrolling space for a smooth experience (120vh per page)
scrollContainer.style.height = `${totalFlippable * 120}vh`;

// --- INITIAL CLOSED BOOK POSITION & STYLING ---
// When closed, center the single hardcover book (shift -25%) and hide the left blank side
gsap.set(book, { xPercent: -25, '--spine-opacity': 0 });
gsap.set(leftSide, { opacity: 0, pointerEvents: 'none' });

// --- AUDIO SETUP FOR PAGE TURN ---
let audioCtx = null;
let audioEnabled = false;
let paperSlideBuffer = null;
let isPaperSlideLoading = false;
const paperAudioSrc = 'Paper Slide - Sound Effect.mp3';

// Preload HTML5 Audio instance for instant fallback
const fallbackPageAudio = new Audio(paperAudioSrc);
fallbackPageAudio.preload = 'auto';

function loadPaperSlideBuffer() {
    if (!audioCtx || paperSlideBuffer || isPaperSlideLoading) return;
    isPaperSlideLoading = true;
    fetch(paperAudioSrc)
        .then(res => {
            if (!res.ok) throw new Error('Network error loading audio');
            return res.arrayBuffer();
        })
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(decoded => {
            paperSlideBuffer = decoded;
            isPaperSlideLoading = false;
        })
        .catch(err => {
            console.warn('Web Audio decode failed, fallback will be used:', err);
            isPaperSlideLoading = false;
        });
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioEnabled = true;
        loadPaperSlideBuffer();
    } else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Initialize audio on first user interaction to comply with browser autoplay policies
window.addEventListener('click', initAudio, { once: true });
window.addEventListener('touchstart', initAudio, { once: true });
window.addEventListener('wheel', initAudio, { once: true });
window.addEventListener('scroll', initAudio, { once: true });

function playPageTurnSound() {
    initAudio();
    
    // Prefer Web Audio API buffer source for zero-latency, overlapping sound
    if (audioCtx && paperSlideBuffer) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const source = audioCtx.createBufferSource();
        source.buffer = paperSlideBuffer;
        
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.85, audioCtx.currentTime);
        
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);
        return;
    }
    
    // Fallback: clone HTML5 Audio for instant playback
    try {
        const soundClone = fallbackPageAudio.cloneNode();
        soundClone.volume = 0.85;
        const playPromise = soundClone.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
    } catch (e) {
        // Fallback error safely handled
    }
}
// ----------------------------------

let tl = gsap.timeline({
    scrollTrigger: {
        trigger: '.scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5, // 1.5 seconds smoothing for the scrub
    }
});

let lastPageFlipped = -1;

tl.eventCallback("onUpdate", function() {
    // Calculate current page based on total progress
    let currentPage = Math.floor(tl.progress() * totalFlippable);
    
    // Prevent out-of-bounds at exactly 1.0 progress
    if (currentPage >= totalFlippable) currentPage = totalFlippable - 1;
    
    // If the page index changed during scrolling, play the sound
    if (currentPage !== lastPageFlipped) {
        if (lastPageFlipped !== -1) {
            playPageTurnSound();
            stopSceneExperience();
            
            // Interrupt any ongoing cinematic or narration
            if (isCinematicPlaying || synth.speaking) {
                synth.cancel();
                cinematicInterrupted = true;
                narrateBtn.classList.remove('playing');
                if (window.activeBgAudio) {
                    window.activeBgAudio.pause();
                    window.activeBgAudio = null;
                }
                isCinematicPlaying = false;
                document.body.classList.remove('cinematic-active');
                
                // Clear any inline styles that might have been applied to images on the previous page
                document.querySelectorAll('.cinematic-target').forEach(el => {
                    el.classList.remove('cinematic-target');
                    if (el.querySelector('img')) {
                        el.querySelector('img').style.transform = '';
                        el.querySelector('img').style.transition = '';
                        el.querySelector('img').style.transformOrigin = '';
                    }
                });
            }
        }
        lastPageFlipped = currentPage;
    }
});

// Create a flip animation for each page
flippablePages.forEach((page, i) => {
    // We construct a mini-timeline for each page flip
    let pageTl = gsap.timeline();
    
    // Rotate the page with keyframes for realistic bending, lifting, and shadowing
    pageTl.to(page, {
        keyframes: {
            "0%": { rotationY: 0, z: i, rotationX: 0, boxShadow: "none" },
            "50%": { rotationY: -90, z: 120 + i, rotationX: 4, boxShadow: "-20px 20px 50px rgba(0,0,0,0.7)" },
            "100%": { rotationY: -180, z: i, rotationX: 0, boxShadow: "none" }
        },
        duration: 2,
        ease: "power1.inOut"
    }, 0);

    // Front Cover Flip (Page 0): Smoothly expand from centered single closed book to open 2-page spread
    if (i === 0) {
        pageTl.to(book, { xPercent: 0, duration: 2, ease: "power1.inOut" }, 0);
        pageTl.to(leftSide, { opacity: 1, pointerEvents: 'all', duration: 1.2, ease: "power1.inOut" }, 0);
        pageTl.to(book, { '--spine-opacity': 1, duration: 1.5, ease: "power1.inOut" }, 0);
    }

    // Back Cover Flip (Last flippable page): Smoothly close book and center the back cover
    if (i === totalFlippable - 1) {
        pageTl.to(book, { xPercent: 25, duration: 2, ease: "power1.inOut" }, 0);
        pageTl.to(rightSide, { opacity: 0, duration: 1.2, ease: "power1.inOut" }, 0);
        pageTl.to(book, { '--spine-opacity': 0, duration: 1.2, ease: "power1.inOut" }, 0);
    }

    // Add this page's timeline to the master timeline sequentially
    tl.add(pageTl, i * 1.5); // Slight overlap for continuous smooth scrolling
});

// Interactive 3D tilt on mouse move
let isScrolling = false;
let scrollTimeout;

window.addEventListener('scroll', () => {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
    }, 100);
});

document.addEventListener('mousemove', (e) => {
    if (isScrolling) return; // Reduce jitter while scrolling
    
    // Calculate tilt based on mouse position relative to center of screen
    const mouseX = (e.clientX / window.innerWidth) - 0.5;
    const mouseY = (e.clientY / window.innerHeight) - 0.5;
    
    // Smoothly animate the book rotation
    gsap.to(book, {
        rotationY: mouseX * -20, // max 10 deg rotation
        rotationX: 10 + (mouseY * 10), // Base 10deg + max 5 deg rotation
        duration: 1,
        ease: "power2.out"
    });
});

// --- LIGHTBOX & ENLARGE SETUP (Single Reusable Overlay) ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.querySelector('.lightbox-close');

function openLightbox(target, altText = '') {
    if (!lightbox || !lightboxImg) return;
    let src = '';
    let alt = altText;
    if (typeof target === 'string') {
        src = target;
    } else if (target && target.tagName === 'IMG') {
        src = target.src || target.currentSrc;
        alt = altText || target.alt || '';
    } else if (target && target.querySelector) {
        const img = target.querySelector('img');
        if (img) {
            src = img.src || img.currentSrc;
            alt = altText || img.alt || '';
        }
    }
    if (!src) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add('active');
}

function openEnlargedImage(imgSrc, alt = '') {
    openLightbox(imgSrc, alt);
}

function closeEnlargedImage() {
    if (!lightbox || !lightboxImg) return;
    lightbox.classList.remove('active');
    setTimeout(() => {
        if (!lightbox.classList.contains('active')) {
            lightboxImg.src = '';
            lightboxImg.alt = '';
            lightboxImg.style.transform = '';
            lightboxImg.style.transition = '';
            lightboxImg.style.transformOrigin = '';
        }
    }, 400);
}

function closeLightbox() {
    stopSceneExperience();
}

// ONE delegated event listener on document: guarantees first click/tap always works reliably
document.addEventListener('click', function(e) {
    // If clicking inside active lightbox, let lightbox click handlers manage backdrop/close
    if (lightbox && lightbox.classList.contains('active') && lightbox.contains(e.target)) {
        return;
    }
    const target = e.target.closest('.img-container');
    if (target) {
        openLightbox(target);
    }
});

// Close lightbox on clicking backdrop (outside image) or close (×) button
if (lightbox) {
    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) {
            stopSceneExperience();
        }
    });
}

if (lightboxClose) {
    lightboxClose.addEventListener('click', (e) => {
        e.stopPropagation();
        stopSceneExperience();
    });
}

// Close & stop on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
        if (lightbox && lightbox.classList.contains('active')) {
            stopSceneExperience();
        }
    }
});

// --- TEXT NARRATION & CINEMATIC SETUP ---
const narrateBtn = document.getElementById('narrate-btn');
const synth = window.speechSynthesis;
let isCinematicPlaying = false;
let cinematicInterrupted = false;

// Function to generate synthetic SFX for the train scene
function playSFX(type) {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (type === 'whistle') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(700, audioCtx.currentTime + 0.5);
        osc.frequency.setValueAtTime(700, audioCtx.currentTime + 1.5);
        osc.frequency.linearRampToValueAtTime(550, audioCtx.currentTime + 2.0);
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime + 1.5);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.0);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 2.0);
    } else if (type === 'steam') {
        const bufferSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.0);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start();
    } else if (type === 'chug') {
        for(let i=0; i<5; i++) {
            setTimeout(() => playPageTurnSound(), i * 350); 
        }
    }
}

// Voice loading
let maleVoice = null;
let femaleVoice = null;
let enMaleVoice = null;
let enFemaleVoice = null;

function initVoices() {
    let voices = synth.getVoices();
    
    // Hindi voices
    let hiVoices = voices.filter(v => v.lang.startsWith('hi'));
    maleVoice = hiVoices.find(v => v.name.toLowerCase().includes('hemant') || v.name.toLowerCase().includes('male')) || hiVoices[0];
    femaleVoice = hiVoices.find(v => v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('female')) || hiVoices[0];
    
    // English voices
    let enVoices = voices.filter(v => v.lang.startsWith('en'));
    enMaleVoice = enVoices.find(v => v.name.toLowerCase().includes('male')) || enVoices[0];
    enFemaleVoice = enVoices.find(v => v.name.toLowerCase().includes('female')) || enVoices[0];
}
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = initVoices;
}
initVoices();

// Keep utterances in memory to prevent Chrome garbage collection bug
window.activeUtterances = [];

// Speak function returning a promise
function speakLine(text, character, lang = 'hi-IN') {
    return new Promise((resolve) => {
        if (cinematicInterrupted) return resolve();
        if (!maleVoice || !femaleVoice) initVoices();
        
        const utterance = new SpeechSynthesisUtterance(text);
        window.activeUtterances.push(utterance);
        utterance.lang = lang; // Use passed language
        
        // Select base voices depending on language
        const isEnglish = lang.startsWith('en');
        const activeMaleVoice = isEnglish ? enMaleVoice : maleVoice;
        const activeFemaleVoice = isEnglish ? enFemaleVoice : femaleVoice;
        
        if (character === 'baba' || character === 'british' || character === 'magistrate' || character === 'man' || character === 'husband' || character === 'motiram' || character === 'railway-officer' || character === 'conductor' || character === 'official' || character === 'devotee' || character === 'devotee-man' || character === 'devotee-elder') {
            if (activeMaleVoice) utterance.voice = activeMaleVoice;
            if (character === 'baba') {
                utterance.pitch = 0.35; // Deeper, heavier, older voice
                utterance.rate = 0.75;  // Slower, very soothing and calm
            } else if (character === 'british') {
                utterance.pitch = 1.2;
                utterance.rate = 1.1;
            } else if (character === 'railway-officer' || character === 'conductor') {
                utterance.pitch = 0.95;
                utterance.rate = 0.92;  // Polite, apologetic duty
            } else if (character === 'husband') {
                utterance.pitch = 0.95;
                utterance.rate = 0.95;  // Worried, earnest
            } else if (character === 'motiram') {
                utterance.pitch = 0.85;
                utterance.rate = 0.9;   // Pleading, emotional father
            } else if (character === 'devotee' || character === 'devotee-man') {
                utterance.pitch = 1.05;
                utterance.rate = 1.05;  // Anxious, urgent pleading
            } else if (character === 'devotee-elder') {
                utterance.pitch = 0.88;
                utterance.rate = 0.92;  // Earnest, emotional elder
            } else {
                // Magistrate or Man
                utterance.pitch = 1.0;
                utterance.rate = 1.0;
            }
        } else {
            // Narrator, Girl, British-Woman, Devotee-Female, or Narrator-Slow
            if (activeFemaleVoice) utterance.voice = activeFemaleVoice;
            if (character === 'girl') {
                utterance.pitch = 1.45; // Higher pitch for young girl
                utterance.rate = 1.05;
            } else if (character === 'british-woman') {
                utterance.pitch = 1.25; // Sharp aristocratic tone
                utterance.rate = 1.05;
            } else if (character === 'devotee-female') {
                utterance.pitch = 1.25;
                utterance.rate = 1.08;  // Frightened, pleading female devotee
            } else if (character === 'narrator-slow') {
                utterance.pitch = 0.95;
                utterance.rate = 0.8;   // Slow, reverent, emotional
            } else {
                utterance.pitch = 1.0;
                utterance.rate = 0.95;
            }
        }

        utterance.onend = () => {
            window.activeUtterances = window.activeUtterances.filter(u => u !== utterance);
            resolve();
        };
        utterance.onerror = (e) => {
            console.warn("Speech synthesis error", e);
            window.activeUtterances = window.activeUtterances.filter(u => u !== utterance);
            resolve();
        };

        window.speechSynthesis.speak(utterance);
    });
}

// Function to handle cinematic sequences
async function playCinematicScene(pageIndex, pageEl, inLightbox = false) {
    if (isCinematicPlaying) return;
    isCinematicPlaying = true;
    cinematicInterrupted = false;
    narrateBtn.classList.add('playing');
    
    // UI Setup
    document.body.classList.add('cinematic-active');
    
    let targetImg;
    let imgContainer;
    
    if (inLightbox) {
        targetImg = lightboxImg;
        imgContainer = lightbox; // Not strictly needed but for cleanup
    } else {
        imgContainer = pageEl.querySelector('.img-container');
        targetImg = imgContainer.querySelector('img');
        imgContainer.classList.add('cinematic-target');
    }

    if (pageIndex === 1 && inLightbox) {
        // --- LIGHTBOX CINEMATIC FOR "BEGINNING" (14 PANELS: CHILDHOOD & MARRIAGE) ---

        const focusAndSpeak = async (scale, tx, ty, text, character, zoomFactor = 1.06, hold = false, transTime = '1.3s') => {
            if (cinematicInterrupted) return;
            
            // Smooth camera transition between panels
            targetImg.style.setProperty('transition', `transform ${transTime} cubic-bezier(0.25, 1, 0.5, 1)`, 'important');
            targetImg.style.transform = `scale(${scale}) translate(${tx}%, ${ty}%)`;
            
            const waitMs = Math.round(parseFloat(transTime) * 1000);
            await new Promise(r => setTimeout(r, waitMs));
            if (cinematicInterrupted) return;
            
            // Subtle zoom-in during narration
            if (!hold && zoomFactor !== 1.0) {
                targetImg.style.setProperty('transition', 'transform 6s ease-out', 'important');
                targetImg.style.transform = `scale(${(scale * zoomFactor).toFixed(2)}) translate(${tx}%, ${ty}%)`;
            }
            
            // Speak narrator line
            await speakLine(text, character);
            if (cinematicInterrupted) return;
            
            // Subtle pause between panels
            await new Promise(r => setTimeout(r, 450));
        };

        // ==========================================
        // ACT 1 — LAKSHMAN'S CHILDHOOD
        // ==========================================
        
        // Start wide on the left-side childhood section
        targetImg.style.setProperty('transition', 'transform 1.2s ease-out', 'important');
        targetImg.style.transform = 'scale(1.6) translate(25.0%, 0.0%)';
        await new Promise(r => setTimeout(r, 1300));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 1 — TOP LEFT: Young Lakshman near the village, interacting with the cow
        await focusAndSpeak(2.6, 35.0, 35.6, "बचपन से ही लक्ष्मण नारायण शर्मा का मन संसार की सामान्य बातों से कहीं अधिक ईश्वर की ओर आकर्षित था।", "narrator", 1.08, false, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 2 — TOP CENTER-LEFT: Close-up of young Lakshman looking upward thoughtfully
        await focusAndSpeak(2.8, 10.8, 35.6, "उसके मन में बचपन से ही एक गहरी जिज्ञासा थी—ईश्वर कौन हैं, और मनुष्य के जीवन का सच्चा उद्देश्य क्या है?", "narrator", 1.06, true, '1.3s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 350));

        // PANEL 3 — SECOND ROW LEFT: Young Lakshman praying before the deity
        await focusAndSpeak(2.7, 35.0, 9.0, "वह मंदिरों में बैठकर घंटों प्रार्थना करता और ईश्वर के बारे में जानने की कोशिश करता।", "narrator", 1.06, false, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 4 — SECOND ROW CENTER-LEFT: Young Lakshman feeding/helping animals
        await focusAndSpeak(2.7, 10.8, 9.0, "उसके भीतर केवल ईश्वर को जानने की इच्छा ही नहीं थी, बल्कि हर जीव के प्रति करुणा और सेवा की भावना भी गहरी होती जा रही थी।", "narrator", 1.06, false, '1.3s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ACT 2 — ज्ञान की खोज
        // ==========================================

        // PANEL 5 — THIRD ROW LEFT: Young Lakshman sitting with an elderly sadhu
        await focusAndSpeak(2.8, 35.0, -15.7, "वह साधु-संतों के पास बैठता, उनकी बातें ध्यान से सुनता और उनसे आध्यात्मिक ज्ञान प्राप्त करने का प्रयास करता।", "narrator", 1.06, false, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 6 — THIRD ROW CENTER-LEFT: Young Lakshman studying a religious book
        await focusAndSpeak(2.8, 10.8, -15.7, "पंडितों और संतों से मिले ज्ञान को वह मन लगाकर समझता और शास्त्रों के माध्यम से ईश्वर की खोज को और गहरा करता गया।", "narrator", 1.06, false, '1.3s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 7 — BOTTOM LEFT: Energetic among other people, spiritually inclined
        await focusAndSpeak(2.8, 35.0, -37.6, "जैसे-जैसे वह बड़ा होने लगा, उसके भीतर वैराग्य और ईश्वर की खोज की इच्छा और प्रबल होती गई।", "narrator", 1.06, false, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 8 — BOTTOM CENTER-LEFT: Looking toward the distant mountains/sunset
        await focusAndSpeak(2.8, 10.8, -37.6, "उसका मन मानो उसे किसी ऐसी यात्रा के लिए पुकार रहा था, जिसका रास्ता संसार से नहीं, बल्कि परमात्मा की ओर जाता था।", "narrator", 1.08, false, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // CAMERA TRANSITION: Hold final childhood panel for a moment
        await new Promise(r => setTimeout(r, 600));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Slowly pull the camera back and travel across the page toward the RIGHT SIDE
        targetImg.style.setProperty('transition', 'transform 2.2s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(1.5) translate(-10.0%, 0.0%)';
        await new Promise(r => setTimeout(r, 2300));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ACT 3 — विवाह
        // ==========================================

        // PANEL 9 — TOP RIGHT / FAMILY: Family preparing him for marriage
        await focusAndSpeak(2.6, -12.8, 35.6, "लेकिन परिवार की अपनी अपेक्षाएँ थीं। कम उम्र में ही लक्ष्मण के विवाह का निर्णय ले लिया गया।", "narrator", 1.06, false, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 10 — TOP RIGHT CLOSE-UP: Young Lakshman dressed as groom
        await focusAndSpeak(2.9, -37.1, 35.6, "लगभग ग्यारह वर्ष की आयु में, वह बालक विवाह के बंधन में बाँध दिया गया।", "narrator-slow", 1.05, true, '1.3s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        // PANEL 11 — LARGE WEDDING PANEL: Wide view then push toward young couple
        targetImg.style.setProperty('transition', 'transform 1.6s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(1.9) translate(-24.7%, 1.2%)';
        await new Promise(r => setTimeout(r, 1500));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        targetImg.style.setProperty('transition', 'transform 8s ease-out', 'important');
        targetImg.style.transform = 'scale(2.4) translate(-24.7%, 1.2%)';

        await speakLine("विवाह की रस्में पूरी हुईं और परिवार के लिए यह एक नए जीवन की शुरुआत थी।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        await new Promise(r => setTimeout(r, 600)); // Pause

        await speakLine("लेकिन लक्ष्मण के भीतर ईश्वर को जानने और मानव सेवा करने की वह पुकार अभी भी जीवित थी।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        // PANEL 12 — WEDDING RITUAL: Sacred ceremony and garland
        await focusAndSpeak(2.6, -8.6, -34.7, "संसार ने उसे गृहस्थ जीवन की ओर बाँध दिया था, लेकिन उसके भीतर का वैरागी मन अभी भी किसी और मंज़िल की तलाश में था।", "narrator", 1.06, false, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 13 — YOUNG GROOM CLOSE-UP: Lakshman looking thoughtful beside bride
        await focusAndSpeak(2.7, -24.9, -34.7, "उसकी आँखों में विवाह की रस्मों के बीच भी वही पुरानी जिज्ञासा थी—ईश्वर को जानने की, सत्य को समझने की और दूसरों के जीवन में सेवा का प्रकाश लाने की।", "narrator", 1.06, false, '1.3s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 14 — FINAL WEDDING PANEL: Newly married couple from behind
        targetImg.style.setProperty('transition', 'transform 1.4s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(2.5) translate(-41.0%, -34.7%)';
        await new Promise(r => setTimeout(r, 1300));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Slowly pull back
        targetImg.style.setProperty('transition', 'transform 10s ease-out', 'important');
        targetImg.style.transform = 'scale(2.0) translate(-41.0%, -34.7%)';

        await speakLine("यह विवाह उसके जीवन का अंत नहीं था, बल्कि उसकी आध्यात्मिक यात्रा के अगले अध्याय से पहले का एक पड़ाव था।", "narrator-slow");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 600));

        // Smooth overview pull back at the end
        targetImg.style.setProperty('transition', 'transform 2.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.0) translate(0%, 0%)';
        await new Promise(r => setTimeout(r, 2500));

    } else if (pageIndex === 2 && inLightbox) {
        // --- LIGHTBOX CINEMATIC FOR "ASCETIC LIFE THE WANDERER" (ROW 1: 4 PANELS -> ROW 2: 4 PANELS -> ROW 3: 1 LARGE PANEL) ---

        const focusAndSpeak = async (scale, tx, ty, text, character = "narrator", zoomFactor = 1.06, hold = false, transTime = '1.3s') => {
            if (cinematicInterrupted) return;
            
            // Smooth camera transition between panels
            targetImg.style.setProperty('transition', `transform ${transTime} cubic-bezier(0.25, 1, 0.5, 1)`, 'important');
            targetImg.style.transform = `scale(${scale}) translate(${tx}%, ${ty}%)`;
            
            const waitMs = Math.round(parseFloat(transTime) * 1000);
            await new Promise(r => setTimeout(r, waitMs));
            if (cinematicInterrupted) return;
            
            // Subtle zoom-in during narration
            if (!hold && zoomFactor !== 1.0) {
                targetImg.style.setProperty('transition', 'transform 6s ease-out', 'important');
                targetImg.style.transform = `scale(${(scale * zoomFactor).toFixed(2)}) translate(${tx}%, ${ty}%)`;
            }
            
            // Speak narrator line
            await speakLine(text, character);
            if (cinematicInterrupted) return;
            
            // Subtle pause between panels
            await new Promise(r => setTimeout(r, 450));
        };

        // ==========================================
        // 🌿 ROW 1 — THE JOURNEY BEGINS (4 PANELS)
        // ==========================================

        // Start wide establishing shot on Row 1 before focusing on Panel 1
        targetImg.style.setProperty('transition', 'transform 1.0s ease-out', 'important');
        targetImg.style.transform = 'scale(1.8) translate(0.0%, 35.3%)';
        await new Promise(r => setTimeout(r, 1000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ROW 1 PANEL 1 — TOP LEFT: Slow push toward young Lakshman walking
        await focusAndSpeak(3.2, 36.2, 35.3, "यह कहानी उस समय की है, जब लक्ष्मण नारायण शर्मा अभी एक बालक ही थे।", "narrator", 1.08, false, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ROW 1 PANEL 2 — Pan into the rainy landscape and Lakshman continuing his journey
        await focusAndSpeak(3.2, 12.1, 35.3, "बचपन से ही उनके मन में संसार को समझने से कहीं अधिक, ईश्वर को जानने की एक गहरी जिज्ञासा थी।", "narrator", 1.06, false, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ROW 1 PANEL 3 — Slowly follow him through the snowy mountains
        await focusAndSpeak(3.2, -11.7, 35.3, "घर की सीमाओं से बाहर निकलकर वे प्रकृति, तीर्थों और अनजान रास्तों के बीच अपनी खोज जारी रखते रहे।", "narrator", 1.06, false, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ROW 1 PANEL 4 — Transition into the warm sunset landscape and hold briefly on Lakshman's silhouette
        await focusAndSpeak(3.2, -36.1, 35.3, "कभी घने जंगल, कभी वर्षा, कभी बर्फीले पहाड़ और कभी तपती धूप—उनकी यात्रा लगातार आगे बढ़ती रही।", "narrator", 1.05, true, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 600)); // Hold briefly on silhouette

        // ==========================================
        // 🛕 ROW 2 — SEARCH FOR GOD (4 PANELS)
        // ==========================================

        // Smoothly move DOWN into Row 2 Panel 1 (drinking water from the river)
        await focusAndSpeak(3.2, 36.2, 9.0, "अपनी यात्रा के दौरान लक्ष्मण नारायण शर्मा प्रकृति के बीच रहते, नदियों के किनारे रुकते और सरल जीवन जीते थे।", "narrator", 1.08, false, '1.6s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ROW 2 PANEL 2 — Approaching the temple (slow push toward entrance, then follow Lakshman)
        targetImg.style.setProperty('transition', 'transform 1.3s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(3.1) translate(11.7%, 9.5%)';
        await new Promise(r => setTimeout(r, 1300));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        await speakLine("जहाँ कहीं मंदिर दिखाई देता, उनका मन स्वयं उन्हें वहाँ खींच ले जाता।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 350));

        // Follow Lakshman walking toward it
        targetImg.style.setProperty('transition', 'transform 3.5s ease-out', 'important');
        targetImg.style.transform = 'scale(3.4) translate(11.7%, 8.5%)';
        await speakLine("वे मंदिरों में जाते, प्रार्थना करते और ईश्वर के बारे में जानने का प्रयास करते।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 450));

        // ROW 2 PANEL 3 — Walking among people toward spiritual place (pan from Lakshman to spiritual figures and back)
        targetImg.style.setProperty('transition', 'transform 1.3s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(3.2) translate(-12.8%, 9.0%)';
        await new Promise(r => setTimeout(r, 1300));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        await speakLine("रास्ते में मिलने वाले साधु-संतों और विद्वानों से भी वे ज्ञान प्राप्त करने का प्रयास करते।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 350));

        // Pan to people & spiritual figures, then return focus to Lakshman
        targetImg.style.setProperty('transition', 'transform 4.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(3.3) translate(-14.5%, 9.0%)';
        await speakLine("हर संत की बात, हर उपदेश और हर अनुभव उनके भीतर ईश्वर की खोज को और गहरा करता गया।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 450));

        // ROW 2 PANEL 4 — Looking across the river toward the temple/city
        // Slow push toward Lakshman's face
        targetImg.style.setProperty('transition', 'transform 1.4s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(3.5) translate(-34.5%, 8.5%)';
        await new Promise(r => setTimeout(r, 1400));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        await speakLine("लेकिन जितना अधिक वे सीखते गए, उतना ही उनके भीतर एक और बड़ा प्रश्न जन्म लेता गया—आखिर उस परम सत्य तक पहुँचा कैसे जाए?", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 350));

        // Follow his gaze toward the distant temple and horizon
        targetImg.style.setProperty('transition', 'transform 2.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(3.2) translate(-38.5%, 9.5%)';
        await new Promise(r => setTimeout(r, 2200));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // 🧘 ROW 3 — THE LARGE FINAL FRAME
        // ==========================================

        // Treat this entire bottom section as ONE SINGLE CINEMATIC FRAME
        // Start with a wide shot showing: Lakshman + enormous tree + surrounding forest + mountains + his simple belongings
        targetImg.style.setProperty('transition', 'transform 2.2s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(1.8) translate(0.0%, -26.4%)';
        await new Promise(r => setTimeout(r, 2200));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        await speakLine("समय के साथ लक्ष्मण नारायण शर्मा का मन संसार से अधिक साधना की ओर झुकता गया।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        await speakLine("अब उनकी खोज केवल मंदिरों और शास्त्रों तक सीमित नहीं रही थी।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        // Slowly push toward Lakshman's face and settle on his peaceful contemplative gaze
        targetImg.style.setProperty('transition', 'transform 3.0s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(2.5) translate(0.0%, -30.0%)';
        await new Promise(r => setTimeout(r, 3000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        await speakLine("वे अपने भीतर उस सत्य को अनुभव करना चाहते थे, जिसके बारे में वे बचपन से सुनते आए थे।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        await speakLine("प्रकृति की नीरवता में बैठकर वे ध्यान करते और ईश्वर का स्मरण करते।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        await speakLine("उनके भीतर वैराग्य, भक्ति और मानव सेवा की भावना धीरे-धीरे और प्रबल होती गई।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 500));

        // On the final sentence, very slowly zoom out from Lakshman, revealing the enormous tree and mountains
        targetImg.style.setProperty('transition', 'transform 8.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.7) translate(0.0%, -26.4%)';

        await speakLine("एक साधारण बालक की यह यात्रा आगे चलकर एक असाधारण आध्यात्मिक जीवन की नींव बनने वाली थी।", "narrator-slow");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Hold the complete final composition for several seconds peacefully
        await new Promise(r => setTimeout(r, 4000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Smooth overview pull back to full page
        targetImg.style.setProperty('transition', 'transform 2.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.0) translate(0%, 0%)';
        await new Promise(r => setTimeout(r, 2500));

    } else if (pageIndex === 5 && inLightbox) {
        // --- LIGHTBOX CINEMATIC FOR "WORK OF GOD BY THE MAN OF GOD" (16 PANELS) ---

        const focusAndSpeak = async (scale, tx, ty, text, character, zoomFactor = 1.07, hold = false, transTime = '1.2s') => {
            if (cinematicInterrupted) return;
            
            // Smooth 0.8–1.5s camera transition between panels
            targetImg.style.setProperty('transition', `transform ${transTime} cubic-bezier(0.25, 1, 0.5, 1)`, 'important');
            targetImg.style.transform = `scale(${scale}) translate(${tx}%, ${ty}%)`;
            
            const waitMs = Math.round(parseFloat(transTime) * 1000);
            await new Promise(r => setTimeout(r, waitMs));
            if (cinematicInterrupted) return;
            
            // Subtle 5–10% zoom-in during dialogue (if not holding steady)
            if (!hold && zoomFactor !== 1.0) {
                targetImg.style.setProperty('transition', 'transform 6s ease-out', 'important');
                targetImg.style.transform = `scale(${(scale * zoomFactor).toFixed(2)}) translate(${tx}%, ${ty}%)`;
            }
            
            // Speak the dialogue/narrator line
            await speakLine(text, character);
            if (cinematicInterrupted) return;
            
            // Subtle pause between panels
            await new Promise(r => setTimeout(r, 400));
        };

        // Start with the full comic page
        targetImg.style.setProperty('transition', 'transform 0.8s ease-out', 'important');
        targetImg.style.transform = 'scale(1.0) translate(0%, 0%)';
        await new Promise(r => setTimeout(r, 900));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ROW 1: WARTIME CRISIS IN JHANSI
        // ==========================================
        
        // PANEL 1 — TOP LEFT: Jhansi 1942, soldiers, wartime atmosphere
        await focusAndSpeak(3.4, 33.9, 40.6, "सन् 1942… द्वितीय विश्व युद्ध के कठिन समय में, झाँसी में एक परिवार गहरे संकट से गुजर रहा था।", "narrator", 1.07);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 2 — TOP CENTER: Sick woman lying down, husband beside her
        await focusAndSpeak(3.3, 3.2, 40.6, "चंद्र शेखर पांडे की पत्नी लंबे समय से गंभीर बीमारी से जूझ रही थीं और उनकी हालत लगातार बिगड़ती जा रही थी।", "narrator", 1.06);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 2 (Husband): Focus closer on husband
        await focusAndSpeak(3.6, 2.0, 42.0, "डॉक्टरों ने भी उम्मीद छोड़ दी है… अब समझ नहीं आता कि क्या करूँ।", "husband", 1.05, false, '0.9s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 3 — TOP RIGHT: Motiram praying before the saint
        await focusAndSpeak(3.2, -21.0, 40.6, "अपनी बेटी की हालत सुनकर मोतीराम व्याकुल हो उठे और उन्होंने संत से सहायता की प्रार्थना की।", "narrator", 1.06);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 3 (Motiram): Shift gently toward saint
        await focusAndSpeak(3.4, -27.0, 40.6, "मेरी बेटी को बचा लीजिए… उसकी जान बच जाए, इसके लिए मैं कुछ भी करने को तैयार हूँ।", "motiram", 1.06, false, '1.0s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ROW 2 — BABA'S OLD PROMISE
        // ==========================================

        // PANEL 4 — SECOND ROW, FAR LEFT: Young girl speaking to young Baba
        await focusAndSpeak(3.3, 34.4, 22.0, "लेकिन इस कहानी का एक रहस्य वर्षों पहले ही लिखा जा चुका था।", "narrator", 1.06);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 4 (Girl): Zoom toward little girl
        await focusAndSpeak(3.6, 38.0, 21.0, "बाबा… अगर मैं कभी मर जाऊँ, तो क्या आप मुझे फिर से ज़िंदा कर देंगे?", "girl", 1.06, false, '0.9s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 5 — SECOND ROW, CENTER-LEFT: Baba answering the girl
        await focusAndSpeak(3.6, 23.6, 22.5, "डर मत बच्ची… तुम अभी नहीं मरोगी।", "baba", 1.05, false, '1.0s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 6 — SECOND ROW, CENTER-RIGHT: Baba arriving at the house
        await focusAndSpeak(3.1, -7.6, 22.0, "वर्षों बाद, वही वचन एक बार फिर जीवित होने वाला था। बाबा अचानक उस परिवार के घर पहुँच गए।", "narrator", 1.06);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 7 — SECOND ROW, FAR RIGHT: Close-up of Baba (Hold on Baba's face!)
        await focusAndSpeak(3.6, -37.4, 22.0, "वह अभी मरी नहीं है।", "baba", 1.0, true, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ROW 3 — THE MIRACLE BEGINS
        // ==========================================

        // PANEL 8 — THIRD ROW, FAR LEFT: Baba asking for grapes, bowl and spoon
        await focusAndSpeak(3.3, 31.4, 3.5, "अंगूर लाओ… एक कटोरा और चम्मच भी।", "baba", 1.06);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 9 — THIRD ROW, CENTER-LEFT: Baba squeezing grapes and feeding juice
        await focusAndSpeak(3.3, -3.7, 3.5, "बाबा ने अपने हाथों से अंगूर दबाकर उनका रस निकाला और उसे धीरे-धीरे पिलाने लगे।", "narrator", 1.07);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 10 — THIRD ROW, CENTER-RIGHT: Woman opening eyes (very slow zoom toward eyes)
        await focusAndSpeak(3.4, -35.4, 3.5, "कुछ ही क्षणों में उसकी नाड़ी फिर चलने लगी… और उसकी बंद होती आँखों में जीवन लौटने लगा।", "narrator", 1.12);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 11 — THIRD ROW, FAR RIGHT: Baba and family around recovering woman
        await focusAndSpeak(2.9, -28.0, 3.5, "घर में निराशा की जगह फिर से उम्मीद ने जन्म लिया।", "narrator", 1.06);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ROW 4 — RECOVERY
        // ==========================================

        // PANEL 12 — FOURTH ROW, FAR LEFT: Baba giving instructions to family
        await focusAndSpeak(3.3, 31.9, -14.6, "उसे अंगूर का रस और दूध देना… वह ठीक हो जाएगी।", "baba", 1.06);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 13 — FOURTH ROW, CENTER: Baba standing and leaving
        await focusAndSpeak(3.2, 0.0, -14.6, "अपना काम पूरा करके बाबा वहाँ से शांत भाव से उठे और चले गए।", "narrator", 1.06);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 14 — FOURTH ROW, RIGHT-CENTER: Family watching recovering woman
        await focusAndSpeak(3.2, -32.0, -14.6, "समय के साथ उसकी हालत लगातार सुधरती गई और वह धीरे-धीरे पूरी तरह स्वस्थ होने लगी।", "narrator", 1.06);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // PANEL 15 — FOURTH ROW, FAR RIGHT: Final part of recovery / faith restored
        await focusAndSpeak(2.6, -32.0, -14.6, "जिस घर में कुछ समय पहले मृत्यु का भय छाया हुआ था, वहाँ अब जीवन और विश्वास लौट आया था।", "narrator", 0.95);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ROW 5 — FINAL WIDE SHOT
        // ==========================================

        // PANEL 16 — FULL-WIDTH BOTTOM PANEL
        // Zoom out to reveal the entire bottom panel
        targetImg.style.setProperty('transition', 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(1.8) translate(0%, -36.6%)';
        await new Promise(r => setTimeout(r, 1400));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Slowly push toward Baba under the tree
        targetImg.style.setProperty('transition', 'transform 12s ease-out', 'important');
        targetImg.style.transform = 'scale(2.6) translate(7.0%, -36.6%)';

        // Narrator — slow, emotional voice
        await speakLine("बाबा ने उस बच्ची से वर्षों पहले किया अपना वचन निभाया था।", "narrator-slow");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 300));

        await speakLine("भक्तों के लिए यह केवल एक चमत्कार नहीं था…", "narrator-slow");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 300));

        await speakLine("यह एक संत की करुणा, विश्वास और अपने भक्त के प्रति निभाए गए वचन की कहानी थी।", "narrator-slow");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Final camera: Slowly zoom out from Baba. End on the full bottom panel.
        targetImg.style.setProperty('transition', 'transform 3.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.8) translate(0%, -36.6%)';
        await new Promise(r => setTimeout(r, 3500));

    } else if (pageIndex === 6 && inLightbox) {
        // --- NEW LIGHTBOX CINEMATIC FOR "THE TRAIN INCIDENT SCENE 1" ---

        const focusAndSpeak = async (scale, tx, ty, text, character, zoomFactor = 1.06, transTime = '1.2s') => {
            if (cinematicInterrupted) return;
            
            // Smooth 0.8–1.5s camera transition between panels
            targetImg.style.setProperty('transition', `transform ${transTime} cubic-bezier(0.25, 1, 0.5, 1)`, 'important');
            targetImg.style.transform = `scale(${scale}) translate(${tx}%, ${ty}%)`;
            
            const waitMs = Math.round(parseFloat(transTime) * 1000);
            await new Promise(r => setTimeout(r, waitMs));
            if (cinematicInterrupted) return;
            
            // Subtle 5–10% zoom-in during dialogue
            if (zoomFactor !== 1.0) {
                targetImg.style.setProperty('transition', 'transform 6s ease-out', 'important');
                targetImg.style.transform = `scale(${(scale * zoomFactor).toFixed(2)}) translate(${tx}%, ${ty}%)`;
            }
            
            // Speak the dialogue/narrator line
            await speakLine(text, character);
            if (cinematicInterrupted) return;
            
            // Subtle pause between panels
            await new Promise(r => setTimeout(r, 400));
        };

        // Start with the full comic page visible
        targetImg.style.setProperty('transition', 'transform 0.8s ease-out', 'important');
        targetImg.style.transform = 'scale(1.0) translate(0%, 0%)';
        await new Promise(r => setTimeout(r, 900));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // PANEL 1 — TOP LEFT: Train in forest
        // ==========================================
        // Smoothly move into TOP-LEFT panel. Frame locomotive, track, forest. Slow push-in toward train.
        await focusAndSpeak(2.7, 33.9, 34.7, "एक और यात्रा के दौरान, बाबा फ़र्स्ट-क्लास डिब्बे में बैठकर फ़र्रुखाबाद की ओर जा रहे थे।", "narrator", 1.10, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // PANEL 2 — TOP CENTER: Baba in First Class
        // ==========================================
        // Smoothly pan from Panel 1 → Panel 2. Center primarily on Baba, keeping other passenger visible. Very subtle zoom toward Baba.
        await focusAndSpeak(2.7, 6.4, 34.4, "फ़र्स्ट-क्लास डिब्बे में बाबा शांत भाव से बैठे थे। उनके साथ एक अन्य यात्री भी मौजूद था।", "narrator", 1.07, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // PANEL 3 — TOP RIGHT: British passengers & officials
        // ==========================================
        // Smoothly pan right from Panel 2 → Panel 3. Frame British woman and railway officials, keeping Baba visible in foreground.
        // British Woman: gently zoom toward the woman.
        await focusAndSpeak(2.7, -31.4, 37.3, "यह आदमी भिखारी जैसा दिखता है! इसे इस डिब्बे से बाहर निकाल देना चाहिए।", "british-woman", 1.07, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // British Official: shift camera slightly toward the British official while he speaks.
        await focusAndSpeak(2.8, -25.5, 33.4, "यह फ़र्स्ट-क्लास डिब्बा है। इसे यहाँ यात्रा करने की अनुमति नहीं है।", "british", 1.06, '0.9s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // PANEL 4 — SECOND ROW LEFT: Railway Officer speaks to Baba
        // ==========================================
        // Smoothly move DOWN and LEFT from Panel 3 → Panel 4. Frame Baba and railway officer together.
        await focusAndSpeak(2.5, 31.8, 3.6, "महाराज, मुझे क्षमा कीजिए। मैं केवल अपना कर्तव्य निभा रहा हूँ। ऐसा लगता है कि आपके पास टिकट नहीं है… आपको नीचे उतरना होगा।", "railway-officer", 1.07, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // PANEL 5 — SECOND ROW CENTER: British Official insists
        // ==========================================
        // Smoothly pan RIGHT from Panel 4 → Panel 5. Frame British official pointing toward Baba. Slowly zoom toward official's face and pointing hand.
        await focusAndSpeak(2.7, -1.4, 3.6, "हाँ, हाँ! इन्हें बाहर निकाल दीजिए! यह फ़र्स्ट-क्लास डिब्बा है। हम साधुओं और भिखारियों के साथ यात्रा नहीं कर सकते।", "british", 1.11, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // PANEL 6 — SECOND ROW RIGHT: Baba stepping down
        // ==========================================
        // Smoothly pan RIGHT from Panel 5 → Panel 6. Frame Baba stepping down from train with cloth bag. Gently follow Baba from train doorway toward platform.
        await focusAndSpeak(2.5, -29.4, 3.6, "बाबा बिना किसी विवाद के शांतिपूर्वक ट्रेन से उतर गए। वे फ़र्रुखाबाद के पास एक छोटे से स्टेशन पर नीचे उतरकर किनारे बैठ गए।", "narrator", 1.08, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // FINAL COMBINED FRAME — BOTTOM LEFT + BOTTOM RIGHT
        // Panels 7 and 8 MUST be treated as ONE SINGLE LARGE CINEMATIC FRAME.
        // STOP ALL NARRATION & CHARACTER DIALOGUES.
        // ==========================================

        // Move DOWN toward entire bottom section and zoom OUT to show BOTH bottom-left and bottom-right panels together
        targetImg.style.setProperty('transition', 'transform 2.0s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(1.8) translate(0%, -30.7%)';

        // Immediately start 2nd audio.mp3
        let bgAudio1 = new Audio('2ND AUDIO.mp3');
        bgAudio1.volume = 0.6;
        bgAudio1.play().catch(e => console.log("Audio play blocked", e));
        window.activeBgAudio = bgAudio1;

        let audioEnded = false;
        bgAudio1.onended = () => { audioEnded = true; };
        bgAudio1.onerror = () => { audioEnded = true; };

        // Hold wide on the combined bottom panels
        await new Promise(r => setTimeout(r, 2600));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Step 1: Slight push toward Baba sitting beneath the tree
        targetImg.style.setProperty('transition', 'transform 6.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(2.3) translate(33.1%, -31.1%)';
        await new Promise(r => setTimeout(r, 6500));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Step 2: Slow movement toward the train
        targetImg.style.setProperty('transition', 'transform 8.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(2.2) translate(-18.4%, -30.1%)';
        await new Promise(r => setTimeout(r, 8500));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Step 3: Return to Baba
        targetImg.style.setProperty('transition', 'transform 8.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(2.3) translate(33.1%, -31.1%)';
        await new Promise(r => setTimeout(r, 8500));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Step 4: Very slow zoom out to full bottom combined composition
        targetImg.style.setProperty('transition', 'transform 6.0s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.8) translate(0%, -30.7%)';
        await new Promise(r => setTimeout(r, 6000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Hold on the complete bottom-left + bottom-right combined composition until 2nd audio finishes
        while (!audioEnded) {
            if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
            await new Promise(r => setTimeout(r, 300));
        }

        // Final gentle pause after audio finishes
        await new Promise(r => setTimeout(r, 1000));

    } else if (pageIndex === 6 && !inLightbox) {
        // --- OLD IN-BOOK CINEMATIC FOR SCENE 1 ---
        targetImg.style.transformOrigin = 'center 10%';
        targetImg.style.transform = 'scale(2.5)';
        playSFX('steam');
        await speakLine("नीब करोरी स्टेशन पर, बाबा एक प्रथम श्रेणी के डिब्बे में बैठे थे।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        
        targetImg.style.transformOrigin = 'center 50%';
        playSFX('whistle');
        await speakLine("एक ब्रिटिश अधिकारी ने उन्हें भिखारी समझकर गुस्से से कहा", "narrator");
        await speakLine("तुम यहाँ कैसे आए? बाहर निकलो!", "british");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        
        // Slow zoom and music for the last row
        targetImg.style.setProperty('transition', 'transform 6s ease-in-out, transform-origin 6s ease-in-out', 'important');
        targetImg.style.transformOrigin = 'center 90%';
        targetImg.style.transform = 'scale(3.0)';
        
        let bgAudio1 = new Audio('1.mp3');
        bgAudio1.volume = 0.5;
        bgAudio1.play().catch(e => console.log("Audio play blocked", e));
        window.activeBgAudio = bgAudio1;
        
        await speakLine("बाबा शांति से बाहर निकल गए। लेकिन रहस्यमय तरीके से, ट्रेन अपनी जगह से हिली तक नहीं।", "narrator");
        
    } else if (pageIndex === 7 && inLightbox) {
        // --- NEW LIGHTBOX CINEMATIC FOR "TRAIN INCIDENT SCENE 2" ---

        const focusAndSpeak = async (scale, tx, ty, text, character, zoomFactor = 1.06, transTime = '1.2s', hold = false) => {
            if (cinematicInterrupted) return;
            
            // Smooth 0.8–1.5s camera transition between panels
            targetImg.style.setProperty('transition', `transform ${transTime} cubic-bezier(0.25, 1, 0.5, 1)`, 'important');
            targetImg.style.transform = `scale(${scale}) translate(${tx}%, ${ty}%)`;
            
            const waitMs = Math.round(parseFloat(transTime) * 1000);
            await new Promise(r => setTimeout(r, waitMs));
            if (cinematicInterrupted) return;
            
            // Subtle 5–10% zoom-in during dialogue
            if (!hold && zoomFactor !== 1.0) {
                targetImg.style.setProperty('transition', 'transform 6s ease-out', 'important');
                targetImg.style.transform = `scale(${(scale * zoomFactor).toFixed(2)}) translate(${tx}%, ${ty}%)`;
            }
            
            // Speak the dialogue/narrator line
            await speakLine(text, character);
            if (cinematicInterrupted) return;
            
            // Subtle pause between panels
            await new Promise(r => setTimeout(r, 400));
        };

        // ==========================================
        // ACT 1 — MASTERPIECE / HERO PANEL
        // PANEL 1 — LARGE TOP-LEFT MASTER PANEL
        // ==========================================

        // Start with a wide shot of the ENTIRE comic page
        targetImg.style.setProperty('transition', 'transform 0.8s ease-out', 'important');
        targetImg.style.transform = 'scale(1.0) translate(0%, 0%)';
        await new Promise(r => setTimeout(r, 900));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Slowly move into the large first master panel (framing Baba + Lord Hanuman + stopped train)
        targetImg.style.setProperty('transition', 'transform 1.5s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(1.52) translate(17.0%, 30.6%)';

        // Play 1.mp3 immediately when camera reaches this master panel
        let bgAudio2 = new Audio('1.mp3');
        bgAudio2.volume = 0.6;
        bgAudio2.play().catch(e => console.log("Audio play blocked", e));
        window.activeBgAudio = bgAudio2;

        let audioEnded = false;
        bgAudio2.onended = () => { audioEnded = true; };
        bgAudio2.onerror = () => { audioEnded = true; };

        // Hold wide master shot to establish the scene (3 seconds)
        await new Promise(r => setTimeout(r, 3000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // 1. Very subtle push toward Baba beneath the tree
        targetImg.style.setProperty('transition', 'transform 6.0s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.90) translate(0.4%, 22.9%)';
        await new Promise(r => setTimeout(r, 6000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // 2. Slight movement upward toward Lord Hanuman appearing majestically in golden sky
        targetImg.style.setProperty('transition', 'transform 6.0s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.90) translate(9.4%, 35.3%)';
        await new Promise(r => setTimeout(r, 6000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // 3. Slowly reveal the stopped train
        targetImg.style.setProperty('transition', 'transform 6.0s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.80) translate(30.3%, 29.7%)';
        await new Promise(r => setTimeout(r, 6000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // 4. Return to complete Baba + Hanuman + train master composition
        targetImg.style.setProperty('transition', 'transform 6.0s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.52) translate(17.0%, 30.6%)';
        await new Promise(r => setTimeout(r, 6000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Hold on master panel until 1.mp3 has completely finished
        while (!audioEnded) {
            if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
            await new Promise(r => setTimeout(r, 200));
        }

        // When 1.mp3 finishes, immediately stop music - NO SONGS from this point onward
        if (window.activeBgAudio) {
            window.activeBgAudio.pause();
            window.activeBgAudio = null;
        }

        // ==========================================
        // ACT 2 — TOP RIGHT PANEL (Panel 2)
        // ==========================================
        // Smoothly move from large master panel → TOP-RIGHT PANEL
        await focusAndSpeak(2.7, -32.9, 30.6, "बाबा के पेड़ के नीचे बैठते ही ट्रेन अचानक रुक गई। बार-बार कोशिश करने के बावजूद इंजन आगे नहीं बढ़ा। रेलवे अधिकारी और अंग्रेज़ यात्री यह देखकर हैरान रह गए।", "narrator", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // During the official's dialogue, gently move closer toward officials' confused expressions
        await focusAndSpeak(3.0, -32.9, 28.6, "आखिर यह ट्रेन चल क्यों नहीं रही है? हमने इंजन की बार-बार जाँच की है, फिर भी कोई कारण समझ नहीं आ रहा।", "british", 1.05, '1.0s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ACT 3 — SECOND ROW LEFT (Panel 3)
        // ==========================================
        // Move DOWN and LEFT from Panel 2. Center on Indian magistrate, keeping British official visible
        await focusAndSpeak(2.9, 38.6, -3.7, "उसी समय वहाँ एक स्थानीय मजिस्ट्रेट आगे आया। वह बाबा को पहले से जानता था और उनके प्रति गहरी श्रद्धा रखता था।", "narrator", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Hold on magistrate while he speaks
        await focusAndSpeak(3.1, 38.6, -3.7, "वे कोई साधारण व्यक्ति नहीं हैं। वे महान संत हैं। कृपया उनसे वापस आने के लिए कहिए।", "magistrate", 1.05, '0.8s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ACT 4 — SECOND ROW CENTER (Panel 4)
        // ==========================================
        // Pan RIGHT into second-row center panel. Frame British official raising hand & rejecting
        await focusAndSpeak(2.8, 13.4, -3.7, "यह अंधविश्वास है! हम किसी साधु के लिए ट्रेन को देर नहीं कर सकते।", "british", 1.08, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Slight push-in toward official's face. Hold until narration finishes
        await focusAndSpeak(3.0, 14.5, -3.0, "अधिकारियों ने पहले उसकी बात को गंभीरता से नहीं लिया। उन्हें लगा कि ट्रेन की समस्या का संत से कोई संबंध नहीं हो सकता।", "narrator", 1.05, '0.8s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ACT 5 — SECOND ROW RIGHT (Panel 5)
        // ==========================================
        // Move RIGHT into second-row-right panel. Frame group approaching Baba
        await focusAndSpeak(2.3, -16.5, -3.7, "लेकिन ट्रेन को चलाने की हर कोशिश नाकाम होती रही। अंततः अधिकारियों ने हार मान ली और बाबा के पास जाकर उनसे क्षमा माँगी।", "narrator", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Slowly shift camera toward Baba sitting beneath tree
        await focusAndSpeak(2.4, -33.4, -4.1, "महाराज, हमें क्षमा कर दीजिए। कृपया हमारे साथ वापस ट्रेन में चलिए।", "official", 1.05, '1.0s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ACT 6 — THIRD ROW LEFT (Panel 6)
        // ==========================================
        // Move DOWN and LEFT into this panel. Slowly zoom toward Baba's peaceful face
        // Hold completely on Baba's face while he says "चलो।" Do not move until finished.
        await focusAndSpeak(3.0, 39.9, -34.2, "चलो।", "baba", 1.0, '1.2s', true);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 600));

        // ==========================================
        // ACT 7 — THIRD ROW CENTER (Panel 7)
        // ==========================================
        // Pan RIGHT into this panel. Frame Baba, railway officials, British officials, passengers
        await focusAndSpeak(2.8, 15.1, -34.2, "अब वही अधिकारी और अंग्रेज़ यात्री, जो कुछ देर पहले बाबा को साधारण समझकर बाहर निकाल रहे थे, उनके सामने पूरी श्रद्धा और सम्मान के साथ खड़े थे।", "narrator", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Official requests respectfully, keeping Baba as visual center
        await focusAndSpeak(2.8, 15.1, -34.2, "महाराज, कृपया वापस ट्रेन में चलिए।", "official", 1.05, '0.8s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ACT 8 — THIRD ROW RIGHT (Panel 8)
        // ==========================================
        // Move RIGHT into final right-side panel. Follow Baba as he boards train
        await focusAndSpeak(2.4, -16.5, -34.2, "बाबा शांत भाव से फिर ट्रेन में सवार हो गए।", "narrator", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        await new Promise(r => setTimeout(r, 400));
        await focusAndSpeak(2.3, -22.0, -34.4, "और कुछ ही क्षणों बाद…", "narrator", 1.04, '0.8s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Begin slow cinematic push toward the train
        targetImg.style.setProperty('transition', 'transform 1.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(2.3) translate(-30.0%, -34.6%)';
        await new Promise(r => setTimeout(r, 1400));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ACT 9 — TRAIN STARTS
        // ==========================================
        await speakLine("ट्रेन फिर से चल पड़ी।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 600));

        // Slowly track along the train as it begins moving
        targetImg.style.setProperty('transition', 'transform 6.0s linear', 'important');
        targetImg.style.transform = 'scale(2.2) translate(-36.0%, -34.6%)';

        await speakLine("जिस ट्रेन को कोई शक्ति आगे नहीं बढ़ा पा रही थी, वह बाबा के वापस बैठते ही अपने आप चलने लगी।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Gradually pull back
        targetImg.style.setProperty('transition', 'transform 3.0s ease-out', 'important');
        targetImg.style.transform = 'scale(1.9) translate(-24.7%, -34.2%)';
        await new Promise(r => setTimeout(r, 3000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // At the end, slowly zoom out to show the ENTIRE comic page again
        targetImg.style.setProperty('transition', 'transform 2.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.0) translate(0%, 0%)';
        await new Promise(r => setTimeout(r, 2600));

    } else if (pageIndex === 7 && !inLightbox) { 
        // Fallback for Scene 2 in-book (mirrors the authentic 9-act storyline)
        let bgAudio = new Audio('1.mp3');
        bgAudio.volume = 0.5;
        bgAudio.play().catch(e => console.log("Audio play blocked", e));
        window.activeBgAudio = bgAudio;
        
        targetImg.style.transformOrigin = '25% 20%';
        targetImg.style.transform = 'scale(1.8)';
        
        // Wait for 1.mp3 or initial preview
        await new Promise(r => {
            bgAudio.onended = r;
            bgAudio.onerror = r;
            setTimeout(r, 8000); // 8s preview if not fully listened
        });
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        
        if (window.activeBgAudio) {
            window.activeBgAudio.pause();
            window.activeBgAudio = null;
        }

        targetImg.style.transformOrigin = '80% 20%';
        await speakLine("बाबा के पेड़ के नीचे बैठते ही ट्रेन अचानक रुक गई। बार-बार कोशिश करने के बावजूद इंजन आगे नहीं बढ़ा। रेलवे अधिकारी और अंग्रेज़ यात्री यह देखकर हैरान रह गए।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        
        targetImg.style.transformOrigin = '25% 50%';
        await speakLine("उसी समय वहाँ एक स्थानीय मजिस्ट्रेट आगे आया। वह बाबा को पहले से जानता था और उनके प्रति गहरी श्रद्धा रखता था।", "narrator");
        await speakLine("वे कोई साधारण व्यक्ति नहीं हैं। वे महान संत हैं। कृपया उनसे वापस आने के लिए कहिए।", "magistrate");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        
        targetImg.style.transformOrigin = '50% 50%';
        await speakLine("यह अंधविश्वास है! हम किसी साधु के लिए ट्रेन को देर नहीं कर सकते।", "british");
        await speakLine("अधिकारियों ने पहले उसकी बात को गंभीरता से नहीं लिया। लेकिन हर कोशिश नाकाम होती रही।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        targetImg.style.transformOrigin = '80% 50%';
        await speakLine("महाराज, हमें क्षमा कर दीजिए। कृपया हमारे साथ वापस ट्रेन में चलिए।", "official");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        targetImg.style.transformOrigin = '25% 85%';
        await speakLine("चलो।", "baba");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        targetImg.style.transformOrigin = '80% 85%';
        await speakLine("बाबा शांत भाव से फिर ट्रेन में सवार हो गए।", "narrator");
        await speakLine("ट्रेन फिर से चल पड़ी। जिस ट्रेन को कोई शक्ति आगे नहीं बढ़ा पा रही थी, वह बाबा के वापस बैठते ही अपने आप चलने लगी।", "narrator");
    } else if (pageIndex === 8 && inLightbox) {
        // --- NEW LIGHTBOX CINEMATIC FOR "OTHER MIRACLE REAL" (TWO HORIZONTAL ACTS) ---

        const focusAndSpeak = async (scale, tx, ty, text, zoomFactor = 1.05, transTime = '1.3s', hold = false) => {
            if (cinematicInterrupted) return;
            
            // Smooth 0.8–1.5s camera transition between positions
            targetImg.style.setProperty('transition', `transform ${transTime} cubic-bezier(0.25, 1, 0.5, 1)`, 'important');
            targetImg.style.transform = `scale(${scale}) translate(${tx}%, ${ty}%)`;
            
            const waitMs = Math.round(parseFloat(transTime) * 1000);
            await new Promise(r => setTimeout(r, waitMs));
            if (cinematicInterrupted) return;
            
            // Subtle 5–10% zoom-in during narration
            if (!hold && zoomFactor !== 1.0) {
                targetImg.style.setProperty('transition', 'transform 6s ease-out', 'important');
                targetImg.style.transform = `scale(${(scale * zoomFactor).toFixed(2)}) translate(${tx}%, ${ty}%)`;
            }
            
            // Speak narration line (NO character dialogue on this page — ONLY narrator voice)
            await speakLine(text, "narrator");
            if (cinematicInterrupted) return;
            
            // Subtle pause between narration lines
            await new Promise(r => setTimeout(r, 400));
        };

        // Start with a wide shot of the ENTIRE comic page
        targetImg.style.setProperty('transition', 'transform 0.8s ease-out', 'important');
        targetImg.style.transform = 'scale(1.0) translate(0%, 0%)';
        await new Promise(r => setTimeout(r, 900));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // 🌿 ACT 1 — BABA TAKES AWAY THE SUFFERING
        // TOP HORIZONTAL FRAME (12 NARRATION LINES)
        // ==========================================

        // Begin by moving toward TOP HORIZONTAL FRAME and reveal the entire horizontal composition
        // Line 1:
        await focusAndSpeak(2.0, 0.0, 24.5, "नीम करौली बाबा के जीवन में करुणा केवल एक भावना नहीं थी, बल्कि उनके लिए दूसरों का दुख अपना दुख था।", 1.04, '1.5s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 2: Slowly move across frame, gently focusing first on suffering devotee & family, keeping Baba visible
        await focusAndSpeak(2.35, 20.0, 24.5, "जो भी व्यक्ति शारीरिक पीड़ा, बीमारी या गहरे मानसिक कष्ट में उनके पास आता, बाबा उसे प्रेम और करुणा से देखते थे।", 1.05, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 3: Focus on suffering devotee in agony and Baba extending his hand in blessing
        await focusAndSpeak(2.55, 16.0, 24.5, "भक्तों की मान्यता थी कि बाबा अपने भक्तों की पीड़ा को स्वयं अपने ऊपर ले लेते थे।", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 4: Slow focus on the devotee's pain
        await focusAndSpeak(2.65, 19.0, 24.5, "कहा जाता है कि किसी भक्त का शरीर दर्द से टूट रहा हो, तो बाबा स्वयं उस पीड़ा को सहने लगते थे।", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 5: Camera pans slowly toward Baba's compassionate presence
        await focusAndSpeak(2.60, 9.0, 24.5, "कभी किसी भक्त की बीमारी अचानक कम होती दिखाई देती, तो बाबा के शरीर में वही तकलीफ़ प्रकट हो जाती।", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 6: Push toward Baba with his halo, smiling in boundless love
        await focusAndSpeak(2.65, 1.0, 24.5, "उनके लिए किसी पीड़ित मनुष्य की सहायता करना केवल शब्दों या उपदेशों तक सीमित नहीं था।", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 7: Gently pan to reveal the spiritual cloud vision where Baba embraces the devotee
        await focusAndSpeak(2.60, -12.0, 24.5, "वे अपने भक्त के दुख को अपने भीतर समेट लेने की अद्भुत क्षमता रखते थे।", 1.05, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 8: Focus on Baba's embrace in the cloud of compassion and the devotee gaining relief
        await focusAndSpeak(2.70, -11.0, 24.5, "भक्तों के अनुसार, जब सामने वाला व्यक्ति राहत महसूस करने लगता, तब भी बाबा शांत और स्थिर बने रहते थे।", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 9: Visual connection between Baba, the cloud vision, and the relieved devotee
        await focusAndSpeak(2.55, -4.0, 24.5, "ऐसा लगता था मानो दूसरे का सारा भार उनके शरीर और मन ने स्वयं उठा लिया हो।", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 10: Reverent focus on Baba's enduring calm, patience, and gentle smile
        await focusAndSpeak(2.80, 2.0, 24.5, "लेकिन उस पीड़ा के बीच भी बाबा की भक्ति, उनका धैर्य और उनकी मुस्कान बनी रहती थी।", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 11: Framing devotees praying in gratitude and the Kainchi temple
        await focusAndSpeak(2.40, -20.0, 24.5, "इसीलिए उनके भक्त उन्हें केवल संत नहीं, बल्कि दुखियों के लिए करुणा का सहारा मानते थे।", 1.05, '1.3s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 12: Pull back so the entire top horizontal frame is visible again
        await focusAndSpeak(2.0, 0.0, 24.5, "उनके जीवन की ऐसी कथाएँ आज भी यही संदेश देती हैं—दूसरों का दर्द समझना और उनकी सेवा करना ही सच्ची करुणा है।", 1.03, '1.5s', true);
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Hold top frame for a brief moment before moving downward
        await new Promise(r => setTimeout(r, 1200));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // 🔥 ACT 2 — WATER BECOMES GHEE
        // BOTTOM HORIZONTAL FRAME (12 NARRATION LINES)
        // ==========================================

        // Smoothly move camera DOWN toward the bottom horizontal frame. Treat as ONE large cinematic frame
        // Line 1: Wide view showing Baba, family, large cooking vessels, food prepared, Kainchi Dham surroundings
        await focusAndSpeak(2.0, 0.0, -25.5, "एक दिन काँचि धाम में भंडारे की तैयारी चल रही थी और बड़ी संख्या में भक्तों के लिए भोजन बनाया जा रहा था।", 1.04, '1.8s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 2: Slowly move toward the left portion where cooks and empty vessels are
        await focusAndSpeak(2.35, 25.0, -25.5, "भोजन तैयार करने के लिए घी की आवश्यकता थी, लेकिन अचानक पता चला कि घी पर्याप्त मात्रा में उपलब्ध नहीं था।", 1.05, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 3: Framing the worried devotee speaking to Baba
        await focusAndSpeak(2.50, 22.0, -25.5, "इतने बड़े भंडारे के लिए घी की कमी एक बड़ी समस्या बन सकती थी।", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 4: Pan to Baba sitting serenely with his glowing halo
        await focusAndSpeak(2.55, 10.0, -25.5, "तभी बाबा वहाँ पहुँचे और परिस्थिति को देखकर भी बिल्कुल शांत रहे।", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 5: Baba pointing upward/toward the river with devotee holding metal container
        await focusAndSpeak(2.60, 14.0, -25.5, "उन्होंने पास से पानी मँगवाया और उसे एक बड़े पात्र में लाने को कहा।", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 6: Showing the puzzled yet obedient devotees
        await focusAndSpeak(2.45, 19.0, -25.5, "भक्तों को समझ नहीं आया कि पानी से आखिर भोजन कैसे तैयार होगा।", 1.05, '1.2s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 7: Panning across toward cooking area as Baba prepares
        await focusAndSpeak(2.40, 2.0, -25.5, "लेकिन बाबा ने बिना किसी चिंता के उस पानी को घी के स्थान पर उपयोग करने का निर्देश दिया।", 1.05, '1.3s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 8: Gently zoom toward Baba's hand, metal container, and large cooking vessel
        await focusAndSpeak(2.85, -11.0, -25.5, "फिर बाबा ने स्वयं उस पानी को बड़े कड़ाह में डालना शुरू किया।", 1.06, '1.4s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 9: Focus on golden bubbling liquid in the giant wok / kadhai
        await focusAndSpeak(2.95, -14.0, -24.5, "भक्तों की मान्यता के अनुसार, बाबा की कृपा से वही पानी घी में परिवर्तित हो गया।", 1.06, '1.3s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 10: Slowly reveal contents of vessel and people witnessing the miracle
        await focusAndSpeak(2.70, -20.0, -25.5, "जिस पात्र में कुछ क्षण पहले साधारण पानी था, उसमें अब भोजन पकाने के लिए घी दिखाई देने लगा।", 1.05, '1.3s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 11: Framing heaps of fried puris, prasad, and happy devotees
        await focusAndSpeak(2.50, -26.0, -25.5, "भंडारा बिना किसी कमी के चलता रहा और सभी भक्तों के लिए भोजन तैयार हुआ।", 1.05, '1.3s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Line 12: Devotees with folded hands in awe and devotion, with Kainchi Dham temple in background
        await focusAndSpeak(2.40, -30.0, -25.5, "भक्तों ने इस घटना को बाबा की अद्भुत लीला और उनकी असीम कृपा के रूप में याद रखा।", 1.04, '1.3s');
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // 🎥 FINAL CAMERA DIRECTION
        // Slowly zoom out from cooking vessel and reveal entire bottom horizontal composition
        // Baba → devotees → cooking vessel → food → Kainchi Dham temple
        // ==========================================
        targetImg.style.setProperty('transition', 'transform 3.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(2.0) translate(0%, -25.5%)';
        
        // Hold wide composition for a few seconds
        await new Promise(r => setTimeout(r, 4000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // End scene peacefully by slowly zooming out to show the ENTIRE comic page again
        targetImg.style.setProperty('transition', 'transform 2.5s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.0) translate(0%, 0%)';
        await new Promise(r => setTimeout(r, 2600));

    } else if (pageIndex === 8 && !inLightbox) {
        // In-book fallback for Page 8
        targetImg.style.transformOrigin = 'center 25%';
        targetImg.style.transform = 'scale(1.8)';
        await speakLine("नीम करौली बाबा के जीवन में करुणा केवल एक भावना नहीं थी, बल्कि उनके लिए दूसरों का दुख अपना दुख था।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        
        await speakLine("भक्तों की मान्यता थी कि बाबा अपने भक्तों की पीड़ा को स्वयं अपने ऊपर ले लेते थे।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        targetImg.style.transformOrigin = 'center 75%';
        await speakLine("एक दिन काँचि धाम में भंडारे की तैयारी चल रही थी और घी की कमी हो गई।", "narrator");
        await speakLine("बाबा की कृपा से वही पानी घी में परिवर्तित हो गया, और भंडारा बिना किसी कमी के संपन्न हुआ।", "narrator");
    } else if (pageIndex === 10 && inLightbox) {
        // --- LIGHTBOX CINEMATIC FOR "FLOOD 1" (ATMOSPHERE OF RISING DANGER, PANIC & EXTRAORDINARY CALMNESS) ---

        // 1. Start with a wide establishing shot of the entire scene — Kainchi Dham, raging floodwater, Baba under the shelter, and the crowd
        targetImg.style.setProperty('transition', 'transform 1.0s ease-out', 'important');
        targetImg.style.transform = 'scale(1.0) translate(0%, 0%)';
        await new Promise(r => setTimeout(r, 1200));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        await speakLine("उत्तराखंड की पहाड़ियों में मूसलाधार वर्षा ने विकराल रूप ले लिया।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        // 2. Slowly push toward the floodwater as it moves deeper into the temple premises. Make the water feel threatening and powerful.
        targetImg.style.setProperty('transition', 'transform 3.5s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(2.2) translate(-26.0%, -14.0%)';
        await new Promise(r => setTimeout(r, 3400));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        targetImg.style.setProperty('transition', 'transform 6.0s ease-out', 'important');
        targetImg.style.transform = 'scale(2.5) translate(-29.0%, -18.0%)';
        await speakLine("कैंची धाम के निकट बहने वाली पहाड़ी नदी में प्रलयंकारी बाढ़ आ गई। मटमैला उफनता पानी, टूटती बाड़ और बहते लट्ठे मंदिर परिसर की ओर विकराल वेग से बढ़ने लगे।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // 3. Suddenly increase camera movement speed and rapidly sweep across the crowd
        // Show multiple people rushing, looking terrified, helping one another, and trying to escape the rising water.
        // Use brief fast camera movements to communicate panic with subtle camera shake only during this section.
        
        // Fast sweep 1 to running woman and rushing crowd
        targetImg.style.setProperty('transition', 'transform 0.45s ease-out', 'important');
        targetImg.style.transform = 'scale(2.35) translate(-6.0%, -12.0%)';
        await new Promise(r => setTimeout(r, 450));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Subtle camera shake 1 (rapid small tremors)
        targetImg.style.setProperty('transition', 'transform 0.12s ease-in-out', 'important');
        targetImg.style.transform = 'scale(2.37) translate(-4.5%, -10.5%)';
        await new Promise(r => setTimeout(r, 120));
        targetImg.style.transform = 'scale(2.34) translate(-7.5%, -13.5%)';
        await new Promise(r => setTimeout(r, 120));
        targetImg.style.transform = 'scale(2.35) translate(-6.0%, -12.0%)';
        await new Promise(r => setTimeout(r, 120));

        // Fast sweep 2 to people helping each other and scrambling on wet steps
        targetImg.style.setProperty('transition', 'transform 0.5s ease-out', 'important');
        targetImg.style.transform = 'scale(2.30) translate(8.0%, -9.0%)';
        await new Promise(r => setTimeout(r, 500));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Subtle camera shake 2
        targetImg.style.setProperty('transition', 'transform 0.12s ease-in-out', 'important');
        targetImg.style.transform = 'scale(2.32) translate(9.5%, -7.5%)';
        await new Promise(r => setTimeout(r, 120));
        targetImg.style.transform = 'scale(2.28) translate(6.5%, -10.5%)';
        await new Promise(r => setTimeout(r, 120));
        targetImg.style.transform = 'scale(2.30) translate(8.0%, -9.0%)';
        await new Promise(r => setTimeout(r, 120));

        await speakLine("पानी का विकराल रूप देखकर आश्रम में भगदड़ मच गई! लोग अपनी जान बचाने के लिए बदहवास होकर भागने लगे!", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // 4. Then abruptly slow everything down. Transition into a subtle, smooth cinematic zoom toward Baba.
        targetImg.style.setProperty('transition', 'transform 2.5s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(2.3) translate(30.0%, -5.0%)';
        await new Promise(r => setTimeout(r, 2500));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // 5. Hold on Baba sitting completely calm and composed while chaos continues around him.
        // The contrast between the terrified crowd and Baba's stillness should be the emotional centerpiece.
        targetImg.style.setProperty('transition', 'transform 4.5s ease-out', 'important');
        targetImg.style.transform = 'scale(2.55) translate(34.0%, -4.0%)';
        await speakLine("परंतु इस भयानक प्रलय और मचे हाहाकार के बीच… बाबा नीब करौरी महाराज अपने आसन पर पूर्ण शांत, स्थिर और निश्चिंत विराजमान थे।", "narrator-slow");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 500));

        // 6. Slowly move the camera across the devotees gathered around Baba — folded hands, frightened faces, people pleading with him.
        targetImg.style.setProperty('transition', 'transform 1.8s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(2.55) translate(18.0%, -14.0%)';
        await new Promise(r => setTimeout(r, 1800));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Devotee 1:
        targetImg.style.setProperty('transition', 'transform 2.5s ease-out', 'important');
        targetImg.style.transform = 'scale(2.65) translate(18.0%, -14.0%)';
        await speakLine("बाबाजी, कुछ कीजिए… पानी आश्रम के अंदर आ रहा है!", "devotee-man");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        // Devotee 2:
        targetImg.style.setProperty('transition', 'transform 2.5s ease-out', 'important');
        targetImg.style.transform = 'scale(2.65) translate(14.0%, -11.0%)';
        await speakLine("महाराज, हमें बचा लीजिए!", "devotee-female");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        // Devotee 3:
        targetImg.style.setProperty('transition', 'transform 2.5s ease-out', 'important');
        targetImg.style.transform = 'scale(2.65) translate(21.0%, -14.0%)';
        await speakLine("बाबा, अब सिर्फ आप ही हमारी रक्षा कर सकते हैं!", "devotee-elder");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 600));

        // 7. End with a slow, powerful push-in toward Baba's calm face while the panic remains visible in the background.
        // Completely stable and peaceful.
        targetImg.style.setProperty('transition', 'transform 4.5s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(3.1) translate(35.5%, 1.5%)';
        await new Promise(r => setTimeout(r, 3000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        await speakLine("सब कुछ डूबने के कगार पर था, लेकिन बाबा की शांत और करुणामयी दृष्टि आने वाले दिव्य चमत्कार का मौन आश्वासन दे रही थी।", "narrator-slow");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Peaceful hold on Baba's serene face
        await new Promise(r => setTimeout(r, 3500));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Gently return to the full establishing view of the comic page
        targetImg.style.setProperty('transition', 'transform 3.0s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.0) translate(0%, 0%)';
        await new Promise(r => setTimeout(r, 3000));

    } else if (pageIndex === 10 && !inLightbox) {
        // In-book fallback for Flood 1
        targetImg.style.transformOrigin = '80% 50%';
        targetImg.style.transform = 'scale(1.8)';
        await speakLine("कैंची धाम के निकट बहने वाली नदी में अचानक प्रलयंकारी बाढ़ आ गई।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        targetImg.style.transformOrigin = '50% 50%';
        await speakLine("बाबाजी, कुछ कीजिए… पानी आश्रम के अंदर आ रहा है!", "devotee-man");
        await speakLine("महाराज, हमें बचा लीजिए!", "devotee-female");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        targetImg.style.transformOrigin = '20% 50%';
        await speakLine("परंतु इस भयानक प्रलय के बीच… बाबा नीब करौरी महाराज अपने आसन पर पूर्ण शांत और स्थिर बैठे थे।", "narrator-slow");

    } else if (pageIndex === 11 && inLightbox) {
        // --- LIGHTBOX CINEMATIC FOR "FLOOD 2" (TWO LARGE HORIZONTAL FRAMES: LEFT & RIGHT) ---

        // ==========================================
        // 🌊 ACT 1 — BABA ENTERS THE FLOOD (LEFT FRAME)
        // ==========================================

        // 1. Start with a wide view of the entire LEFT FRAME:
        // Showing Baba sitting at the flooded ghat, the raging water, the temple, and devotees praying behind him.
        targetImg.style.setProperty('transition', 'transform 1.2s ease-out', 'important');
        targetImg.style.transform = 'scale(2.0) translate(25.0%, 0%)';
        await new Promise(r => setTimeout(r, 1300));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Slowly push camera toward Baba stepping down toward the floodwater and drinking water from his hand
        targetImg.style.setProperty('transition', 'transform 4.5s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(2.5) translate(30.0%, -6.0%)';

        // Line 1:
        await speakLine("बाबाजी ने बाढ़ की विकराल लहरों को देखा, लेकिन उनके चेहरे पर ज़रा भी भय नहीं था।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        // Line 2: Focus on Baba stepping down to the floodwater and taking water in his hands
        targetImg.style.setProperty('transition', 'transform 4.5s ease-out', 'important');
        targetImg.style.transform = 'scale(2.8) translate(33.0%, -8.0%)';
        await speakLine("वे धीरे-धीरे पानी के पास उतरे और अपने हाथों में बाढ़ का पानी लिया।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        // Line 3: Baba drinking the water peacefully from his hand
        targetImg.style.setProperty('transition', 'transform 4.0s ease-out', 'important');
        targetImg.style.transform = 'scale(2.95) translate(34.0%, -9.0%)';
        await speakLine("बाबाजी ने उस पानी को शांत भाव से पी लिया।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 500));

        // Line 4: Stunned devotees standing in the background
        targetImg.style.setProperty('transition', 'transform 5.0s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(2.7) translate(29.0%, -4.0%)';
        await speakLine("चारों ओर खड़े भक्त यह देखकर स्तब्ध रह गए कि इतनी भयंकर परिस्थिति में भी बाबा बिल्कुल निश्चिंत थे।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        // Line 5: Camera slowly refocused deeply on Baba
        targetImg.style.setProperty('transition', 'transform 4.5s ease-out', 'important');
        targetImg.style.transform = 'scale(3.1) translate(34.5%, -7.0%)';
        await speakLine("पानी पीकर बाबा ने जैसे आने वाले समय को भीतर से महसूस कर लिया।", "narrator");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);
        await new Promise(r => setTimeout(r, 400));

        // Line 6: Hold close-up on Baba's peaceful face for a brief moment. Floodwater moving violently in background.
        targetImg.style.setProperty('transition', 'transform 3.5s ease-out', 'important');
        targetImg.style.transform = 'scale(3.35) translate(34.5%, -4.5%)';
        await speakLine("फिर उन्होंने शांत स्वर में कहा—यह बाढ़ भी अधिक देर नहीं रहेगी।", "narrator-slow");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Hold close-up on Baba's peaceful face for a moment. Do not transition early.
        await new Promise(r => setTimeout(r, 1200));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // ⚡ ACT 2 — RAPID TRANSITION (WHIP-PAN TO RIGHT FRAME)
        // ==========================================
        // Sudden change from uncertainty to Baba's absolute confidence.
        // Quick whip-pan / rapid horizontal movement straight to Baba in the RIGHT FRAME.
        targetImg.style.setProperty('transition', 'transform 0.38s cubic-bezier(0.25, 1, 0.3, 1.1)', 'important');
        targetImg.style.transform = 'scale(2.8) translate(-33.0%, -3.0%)';
        await new Promise(r => setTimeout(r, 420));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // ==========================================
        // 🛕 ACT 3 — RIGHT FRAME (BABA AT KAINCHI DHAM)
        // ==========================================
        // Immediately stabilize camera locked onto Baba standing in front of Kainchi Dham
        targetImg.style.setProperty('transition', 'transform 2.0s ease-out', 'important');
        targetImg.style.transform = 'scale(2.85) translate(-33.0%, -3.0%)';
        await new Promise(r => setTimeout(r, 800));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // BABAJI DIALOGUE (Spoken directly while locked steady on Baba in the RIGHT FRAME)
        await speakLine("यह भी चला जाएगा।", "baba");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Hold steady on Baba after dialogue
        await new Promise(r => setTimeout(r, 1000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Slowly widen the shot to reveal Baba + devotees + temple + receding floodwater together
        targetImg.style.setProperty('transition', 'transform 5.0s cubic-bezier(0.25, 1, 0.5, 1)', 'important');
        targetImg.style.transform = 'scale(2.0) translate(-25.0%, 0%)';
        await new Promise(r => setTimeout(r, 2000));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // NARRATOR — AFTER DIALOGUE
        await speakLine("बाबा के इन शब्दों में केवल बाढ़ के समाप्त होने का विश्वास नहीं था… बल्कि उस अडिग भरोसे की झलक थी, जो उनके भक्तों को हमेशा उनके साथ जोड़कर रखता था।", "narrator-slow");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Hold the serene complete revelation of the right frame
        await new Promise(r => setTimeout(r, 3500));
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Gently return to the full establishing 2-panel canvas
        targetImg.style.setProperty('transition', 'transform 3.0s ease-in-out', 'important');
        targetImg.style.transform = 'scale(1.0) translate(0%, 0%)';
        await new Promise(r => setTimeout(r, 3000));

    } else if (pageIndex === 11 && !inLightbox) {
        // In-book fallback for Flood 2
        targetImg.style.transformOrigin = '25% 50%';
        targetImg.style.transform = 'scale(1.9)';
        await speakLine("बाबाजी ने बाढ़ की विकराल लहरों को देखा, लेकिन उनके चेहरे पर ज़रा भी भय नहीं था।", "narrator");
        await speakLine("वे धीरे-धीरे पानी के पास उतरे और अपने हाथों में बाढ़ का पानी लिया।", "narrator");
        await speakLine("बाबाजी ने उस पानी को शांत भाव से पी लिया।", "narrator");
        await speakLine("चारों ओर खड़े भक्त यह देखकर स्तब्ध रह गए कि इतनी भयंकर परिस्थिति में भी बाबा बिल्कुल निश्चिंत थे।", "narrator");
        await speakLine("पानी पीकर बाबा ने जैसे आने वाले समय को भीतर से महसूस कर लिया।", "narrator");
        await speakLine("फिर उन्होंने शांत स्वर में कहा—यह बाढ़ भी अधिक देर नहीं रहेगी।", "narrator-slow");
        if (cinematicInterrupted) return cleanupCinematic(imgContainer, targetImg, inLightbox);

        // Quick transition to right frame
        targetImg.style.transformOrigin = '80% 50%';
        targetImg.style.transform = 'scale(1.9)';
        await new Promise(r => setTimeout(r, 500));
        await speakLine("यह भी चला जाएगा।", "baba");
        await speakLine("बाबा के इन शब्दों में केवल बाढ़ के समाप्त होने का विश्वास नहीं था… बल्कि उस अडिग भरोसे की झलक थी, जो उनके भक्तों को हमेशा उनके साथ जोड़कर रखता था।", "narrator-slow");
    }

    cleanupCinematic(imgContainer, targetImg, inLightbox);
}

function cleanupCinematic(imgContainer, img, inLightbox) {
    if (window.activeBgAudio) {
        window.activeBgAudio.pause();
        window.activeBgAudio = null;
    }
    
    img.style.transition = '';
    img.style.transform = '';
    setTimeout(() => {
        document.body.classList.remove('cinematic-active');
        if (!inLightbox && imgContainer) {
            imgContainer.classList.remove('cinematic-target');
        }
        if (narrateBtn) narrateBtn.classList.remove('playing');
        isCinematicPlaying = false;
        cinematicInterrupted = false;
    }, 1500);
}

// ==========================================
// SCENE NARRATION CONTROLLER
// ==========================================

let currentNarrationAudio = null;

// Helper to identify page index from image source
function getPageIndexFromImgSrc(src) {
    if (!src) return -1;
    const decodedSrc = decodeURIComponent(src);
    for (let i = 0; i < flippablePages.length; i++) {
        const img = flippablePages[i].querySelector('.img-container img');
        if (img) {
            const rawSrc = img.getAttribute('src');
            if (src === img.src || decodedSrc.includes(rawSrc) || (rawSrc && decodedSrc.endsWith(rawSrc))) {
                return i;
            }
        }
    }
    for (let scene of SCENES_CONFIG) {
        if (decodedSrc.toUpperCase().includes(scene.title.toUpperCase())) {
            return scene.pageIndex;
        }
    }
    return -1;
}

// Stop all audio & speech synthesis narration
function stopAllNarration() {
    cinematicInterrupted = true;
    isCinematicPlaying = false;

    if (window.activeBgAudio) {
        window.activeBgAudio.pause();
        window.activeBgAudio = null;
    }
    if (currentNarrationAudio) {
        currentNarrationAudio.pause();
        currentNarrationAudio.currentTime = 0;
        currentNarrationAudio = null;
    }
    if ('speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    window.activeUtterances = [];

    document.body.classList.remove('cinematic-active');
    if (narrateBtn) narrateBtn.classList.remove('playing');

    document.querySelectorAll('.cinematic-target').forEach(el => {
        el.classList.remove('cinematic-target');
        const img = el.querySelector('img');
        if (img) {
            img.style.transform = '';
            img.style.transition = '';
            img.style.transformOrigin = '';
        }
    });
}

// Play narration audio for a given page index
function playNarrationForPage(pageIndex, inLightbox = false) {
    if (pageIndex < 0 || pageIndex >= flippablePages.length) return;
    const pageEl = flippablePages[pageIndex];
    if (!pageEl) return;

    // Cinematic Scenes (1, 2, 5, 6, 7, 8, 10, 11) have synchronized camera pan/zoom animations
    const cinematicPages = [1, 2, 5, 6, 7, 8, 10, 11];
    if (cinematicPages.includes(pageIndex)) {
        cinematicInterrupted = false;
        playCinematicScene(pageIndex, pageEl, inLightbox);
    } else {
        // Voice narration for other scenes
        const textToRead = pageEl.getAttribute('data-narration') || "No description available.";
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = 'hi-IN';
            utterance.rate = 0.95;
            window.activeUtterances = [utterance];

            utterance.onstart = () => {
                if (narrateBtn) narrateBtn.classList.add('playing');
            };
            utterance.onend = () => {
                if (narrateBtn) narrateBtn.classList.remove('playing');
                window.activeUtterances = [];
            };
            utterance.onerror = () => {
                if (narrateBtn) narrateBtn.classList.remove('playing');
                window.activeUtterances = [];
            };
            window.speechSynthesis.speak(utterance);
        }
    }
}

// Complete stop & reverse sequence: stops narration and shrinks image back down
function stopSceneExperience() {
    stopAllNarration();
    closeEnlargedImage();
}

function stopSceneNarration() {
    stopSceneExperience();
}

// Dedicated sound button click handler: narrate active enlarged visual or current page
narrateBtn.addEventListener('click', () => {
    initAudio();
    let visibleIndex = lastPageFlipped === -1 ? 0 : lastPageFlipped;
    if (visibleIndex >= flippablePages.length) {
        visibleIndex = flippablePages.length - 1; 
    }
    const isLightboxActive = lightbox && lightbox.classList.contains('active');

    // If lightbox is open, accurately identify the active scene by the displayed image
    if (isLightboxActive && lightboxImg.src) {
        const detectedIndex = getPageIndexFromImgSrc(lightboxImg.src);
        if (detectedIndex !== -1) {
            visibleIndex = detectedIndex;
        }
    }

    const visiblePage = flippablePages[visibleIndex];

    // Check if narration is currently playing -> toggle it off
    if (isCinematicPlaying || (synth && synth.speaking) || narrateBtn.classList.contains('playing')) {
        stopAllNarration();
        return;
    }

    // Start narration
    stopAllNarration();
    narrateBtn.classList.add('playing');

    const cinematicPages = [1, 2, 5, 6, 7, 8, 10, 11];
    if (cinematicPages.includes(visibleIndex)) {
        if (!isLightboxActive) {
            const img = visiblePage ? visiblePage.querySelector('.img-container img') : null;
            if (img) {
                openEnlargedImage(img.src);
                setTimeout(() => {
                    playCinematicScene(visibleIndex, visiblePage, true);
                }, 400);
                return;
            }
        }
        playCinematicScene(visibleIndex, visiblePage, isLightboxActive);
        return;
    }

    // Normal speech narration
    playNarrationForPage(visibleIndex, isLightboxActive);
});

// --- AMBIENT DUST & LIGHT PARTICLES (ANTIGRAVITY EFFECT) ---
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const PARTICLE_COUNT = 90;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * width;
            this.y = initial ? Math.random() * height : height + 10 + Math.random() * 20;
            this.size = Math.random() * 2.5 + 0.8; // 0.8px to 3.3px
            this.speedY = -(Math.random() * 0.45 + 0.15); // gentle upward drift
            this.speedX = (Math.random() - 0.5) * 0.3; // subtle horizontal drift
            this.baseAlpha = Math.random() * 0.5 + 0.25;
            this.alpha = this.baseAlpha;
            this.pulseSpeed = Math.random() * 0.02 + 0.008;
            this.pulse = Math.random() * Math.PI * 2;
            
            // Gold, amber, and warm starlight tones
            const tones = [
                { r: 255, g: 215, b: 120 }, // Pure Gold
                { r: 245, g: 190, b: 90 },  // Warm Amber
                { r: 255, g: 240, b: 200 }, // Warm Starlight
                { r: 210, g: 160, b: 70 }   // Antique Bronze
            ];
            this.color = tones[Math.floor(Math.random() * tones.length)];
            this.glow = Math.random() > 0.6;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.pulse) * 0.25;
            this.pulse += this.pulseSpeed;
            this.alpha = this.baseAlpha + Math.sin(this.pulse) * 0.2;
            if (this.alpha < 0.05) this.alpha = 0.05;

            // Reset when drifted out of frame
            if (this.y < -15 || this.x < -20 || this.x > width + 20) {
                this.reset(false);
            }
        }

        draw() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
            if (this.glow) {
                ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`;
                ctx.shadowBlur = this.size * 4;
            }
            ctx.fill();
            ctx.restore();
        }
    }

    for (let p = 0; p < PARTICLE_COUNT; p++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        requestAnimationFrame(animate);
    }
    animate();
}

initParticles();
