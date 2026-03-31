let settings = {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
};

let currentMode = 'pomodoro';
let timeLeft = settings.pomodoro * 60;
let isRunning = false;
let timerInterval = null;
let inactivityTimeout = null;

const quotes = [
    "“In the middle of difficulty lies opportunity.” — Albert Einstein",
    "“Genius is one percent inspiration and ninety-nine percent perspiration.” — Thomas Edison",
    "“Your time is limited, so don’t waste it living someone else’s life.” — Steve Jobs",
    "“Success is not final, failure is not fatal: it is the courage to continue that counts.” — Winston Churchill",
    "“It does not matter how slowly you go as long as you do not stop.” — Confucius",
    "“The only place success comes before work is in the dictionary.” — Vince Lombardi",
    "“The most difficult thing is the decision to act, the rest is merely tenacity.” — Amelia Earhart",
    "“You may encounter many defeats, but you must not be defeated.” — Maya Angelou",
    "“I hated every minute of training, but I said, ‘Don’t quit; suffer now and live the rest of your life as a champion.’” — Muhammad Ali",
    "“Believe you can and you’re halfway there.” — Theodore Roosevelt"
];

let currentQuoteIndex = 0;
const quoteDisplay = document.getElementById('quote-display');

const presetBackgrounds = [
    'custom-photos/IMG_1538 copy.JPG',
    'custom-photos/IMG_2741.JPG',
    'custom-photos/IMG_2743.JPG',
    'custom-photos/IMG_5563.JPG',
    'custom-photos/IMG_5573.JPG',
    'custom-photos/IMG_5612.JPG'
];
let customBackgrounds = JSON.parse(localStorage.getItem('customBackgrounds')) || [];
let currentBgUrl = 'custom-photos/IMG_5573.JPG';

const timeDisplay = document.getElementById('time-left');
const btnStartPause = document.getElementById('btn-start-pause');
const btnReset = document.getElementById('btn-reset');
const modeBtns = document.querySelectorAll('.mode-btn');

const modalSettings = document.getElementById('modal-settings');
const modalBackground = document.getElementById('modal-background');

const inputPomodoro = document.getElementById('input-pomodoro');
const inputShort = document.getElementById('input-short');
const inputLong = document.getElementById('input-long');

const appBody = document.getElementById('app-body');
const presetBgContainer = document.getElementById('preset-backgrounds');
const inputCustomBg = document.getElementById('input-custom-bg');
const inputLocalBg = document.getElementById('input-local-bg');

function init() {
    updateDisplay();
    setupBackgroundPicker();
    setupEventListeners();
    setupInactivityHiding();
    
    // Setup quote cycler
    quoteDisplay.textContent = quotes[currentQuoteIndex];
    setInterval(() => {
        quoteDisplay.style.opacity = '0'; // force fade out
        setTimeout(() => {
            currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
            quoteDisplay.textContent = quotes[currentQuoteIndex];
            
            // Fade back in only if the app is currently in focus mode
            if (appBody.classList.contains('inactive')) {
                quoteDisplay.style.opacity = '1';
                setTimeout(() => quoteDisplay.style.opacity = '', 1000); // clear inline style to let CSS handle it
            } else {
                quoteDisplay.style.opacity = ''; // clear right away if active
            }
        }, 1000); // wait for 1s fade to finish before swapping text
    }, 60000); // swap every 60s
    
    const savedBg = localStorage.getItem('lastUsedBg');
    if (savedBg) {
        changeBackground(savedBg);
    }
}

function updateDisplay() {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    let formattedTime;
    if (hours > 0) {
        formattedTime = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    timeDisplay.textContent = formattedTime;
    document.title = `${formattedTime} - FocusTimer`;
}

function switchMode(mode) {
    if (isRunning) pauseTimer();
    
    currentMode = mode;
    modeBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    timeLeft = settings[mode] * 60;
    updateDisplay();
}

function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (timeLeft <= 0) return;
    isRunning = true;
    btnStartPause.textContent = 'Pause';
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();
        
        if (timeLeft <= 0) {
            pauseTimer();
            notifyComplete();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    btnStartPause.textContent = 'Start';
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    timeLeft = settings[currentMode] * 60;
    updateDisplay();
}

function notifyComplete() {
    playChime();
    setTimeout(() => {
        alert(`Time's up for ${currentMode}! Great job.`);
    }, 500);
}

function playChime() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.5);
}

function resetInactivityTimer() {
    appBody.classList.remove('inactive');
    quoteDisplay.style.opacity = ''; // yield opacity to state CSS
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        if (!modalSettings.classList.contains('hidden') || !modalBackground.classList.contains('hidden')) {
            return; // block auto-hide if modals are open
        }
        appBody.classList.add('inactive');
    }, 5000); // 5 seconds
}

function setupInactivityHiding() {
    ['keydown', 'click', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, resetInactivityTimer);
    });
    
    document.addEventListener('mousemove', () => {
        if (!appBody.classList.contains('inactive')) {
            resetInactivityTimer();
        }
    });

    resetInactivityTimer();
}

document.getElementById('btn-fullscreen').addEventListener('click', (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

function setupBackgroundPicker() {
    presetBackgrounds.forEach((url) => {
        addThumbToPicker(url);
    });
    customBackgrounds.forEach((url) => {
        addThumbToPicker(url);
    });
}

function changeBackground(url) {
    if (!url) return;
    appBody.style.backgroundImage = `url('${url}')`;
    currentBgUrl = url;
    localStorage.setItem('lastUsedBg', url);
}

function saveCustomBackground(dataUrl) {
    if (!customBackgrounds.includes(dataUrl)) {
        customBackgrounds.push(dataUrl);
        try {
            localStorage.setItem('customBackgrounds', JSON.stringify(customBackgrounds));
            addThumbToPicker(dataUrl);
        } catch (e) {
            console.error("Storage full or blocked", e);
            customBackgrounds.pop();
        }
    }
}

function addThumbToPicker(url) {
    const thumb = document.createElement('div');
    thumb.className = 'bg-thumb';
    thumb.style.backgroundImage = `url('${url}')`;
    if (url === currentBgUrl) thumb.classList.add('selected');
    
    thumb.addEventListener('click', () => {
        document.querySelectorAll('.bg-thumb').forEach(t => t.classList.remove('selected'));
        thumb.classList.add('selected');
        inputCustomBg.value = url;
        currentBgUrl = url;
    });
    
    presetBgContainer.appendChild(thumb);
}

function setupEventListeners() {
    btnStartPause.addEventListener('click', toggleTimer);
    btnReset.addEventListener('click', resetTimer);
    
    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => switchMode(e.target.dataset.mode));
    });
    
    document.getElementById('btn-settings').addEventListener('click', () => {
        modalSettings.classList.remove('hidden');
    });
    document.getElementById('btn-background').addEventListener('click', () => {
        modalBackground.classList.remove('hidden');
    });
    
    document.getElementById('btn-close-settings').addEventListener('click', () => {
        modalSettings.classList.add('hidden');
    });
    document.getElementById('btn-save-settings').addEventListener('click', () => {
        const p = parseInt(inputPomodoro.value);
        const s = parseInt(inputShort.value);
        const l = parseInt(inputLong.value);
        
        if (p > 0 && s > 0 && l > 0) {
            settings.pomodoro = p;
            settings.shortBreak = s;
            settings.longBreak = l;
            
            if (!isRunning) switchMode(currentMode);
            
            modalSettings.classList.add('hidden');
        } else {
            alert('Please enter valid positive numbers');
        }
    });
    
    document.getElementById('btn-close-bg').addEventListener('click', () => {
        modalBackground.classList.add('hidden');
    });
    document.getElementById('btn-apply-bg').addEventListener('click', () => {
        if (inputLocalBg.files && inputLocalBg.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                changeBackground(e.target.result);
                saveCustomBackground(e.target.result);
                modalBackground.classList.add('hidden');
            };
            reader.readAsDataURL(inputLocalBg.files[0]);
        } else {
            const val = inputCustomBg.value.trim() || currentBgUrl;
            changeBackground(val);
            if (val && !presetBackgrounds.includes(val) && !customBackgrounds.includes(val)) {
                saveCustomBackground(val);
            }
            modalBackground.classList.add('hidden');
        }
    });

    inputLocalBg.addEventListener('change', () => {
        if (inputLocalBg.files && inputLocalBg.files[0]) {
            document.querySelectorAll('.bg-thumb').forEach(t => t.classList.remove('selected'));
            inputCustomBg.value = '';
        }
    });
}

init();
