
/* =========================================
   BISING! CLUB
   INTRO JAVASCRIPT

   LOADING + SURPRISE + MUSIC
========================================= */

(() => {
    "use strict";

    /* =====================================
       ELEMENT SELECTORS
    ===================================== */

    const $ = (selector) => {
        return document.querySelector(selector);
    };

    const loadingScreen = $("#loadingScreen");
    const revealScreen = $("#revealScreen");

    const progressFill = $("#progressFill");
    const progressNumber = $("#progressNumber");
    const loadingMessage = $("#loadingMessage");

    const musicOnButton = $("#introMusicOn");
    const musicOffButton = $("#introMusicOff");
    const musicChoiceStatus = $("#musicChoiceStatus");

    const enterButton = $("#enterButton");
    const introTransition = $("#introTransition");
    const confettiLayer = $("#introConfetti");

    /* =====================================
       CONFIGURATION
    ===================================== */

    const LOADING_DURATION = 4200;

    const DESTINATION = "home.html";

    const INTRO_MUSIC_SRC =
        "aset/music/lagu-01.mp3";

    const INTRO_MUSIC_VOLUME = 0.7;

    const CONFETTI_COLORS = [
        "#d3ff50",
        "#ff91c5",
        "#91baff",
        "#ff9966",
        "#ffffff"
    ];

    const LOADING_MESSAGES = [
        "Lagi ngumpulin aib...",
        "Mencari foto yang paling memalukan...",
        "Mengumpulkan 143 foto...",
        "Memeriksa 51 video...",
        "Menghubungi anggota geng...",
        "Mempersiapkan kekacauan...",
        "DIKIT LAGI WOI..."
    ];

    /* =====================================
       STATE
    ===================================== */

    let messageIndex = -1;
    let hasEntered = false;
    let useMusic = true;

    /* =====================================
       INTRO AUDIO
    ===================================== */

    const introAudio = new Audio();

    introAudio.src = INTRO_MUSIC_SRC;
    introAudio.volume = INTRO_MUSIC_VOLUME;
    introAudio.preload = "metadata";

    // Loop hanya untuk musik intro.
    introAudio.loop = true;

    /* =====================================
       MUSIC BUTTON DISPLAY
    ===================================== */

    function updateMusicChoice() {
        if (
            !musicOnButton ||
            !musicOffButton ||
            !musicChoiceStatus
        ) {
            return;
        }

        musicOnButton.classList.toggle(
            "selected",
            useMusic
        );

        musicOffButton.classList.toggle(
            "selected",
            !useMusic
        );

        musicOnButton.setAttribute(
            "aria-pressed",
            String(useMusic)
        );

        musicOffButton.setAttribute(
            "aria-pressed",
            String(!useMusic)
        );

        if (!useMusic) {
            musicChoiceStatus.textContent =
                "✕ MASUK TANPA MUSIK";

        } else if (introAudio.paused) {
            musicChoiceStatus.textContent =
                "♫ KLIK PAKAI LAGU UNTUK PUTAR";

        } else {
            musicChoiceStatus.textContent =
                "♫ LAGI NYETEL LAGU";
        }
    }

    /* =====================================
       PLAY INTRO MUSIC
    ===================================== */

    async function playIntroMusic() {
        useMusic = true;

        try {
            await introAudio.play();

            musicChoiceStatus.textContent =
                "♫ LAGI NYETEL LAGU";

        } catch (error) {
            console.error(
                "Gagal memutar musik intro:",
                error.name,
                error.message
            );

            if (error.name === "NotAllowedError") {
                musicChoiceStatus.textContent =
                    "BROWSER MEMBLOKIR AUDIO";

            } else if (
                error.name === "NotSupportedError"
            ) {
                musicChoiceStatus.textContent =
                    "FORMAT LAGU TIDAK DIDUKUNG";

            } else {
                musicChoiceStatus.textContent =
                    "GAGAL MEMUTAR FILE LAGU";
            }
        }

        updateMusicChoice();
    }

    /* =====================================
       PAUSE INTRO MUSIC
    ===================================== */

    function stopIntroMusic() {
        introAudio.pause();

        updateMusicChoice();
    }

    /* =====================================
       MUSIC SELECTION
    ===================================== */

    function selectMusicOn() {
        useMusic = true;

        updateMusicChoice();

        // Dijalankan langsung dari klik pengguna.
        playIntroMusic();
    }

    function selectMusicOff() {
        useMusic = false;

        stopIntroMusic();
    }

    /* =====================================
       LOADING MESSAGE
    ===================================== */

    function updateLoadingMessage(value) {
        const index = Math.min(
            Math.floor(
                value / 100 *
                LOADING_MESSAGES.length
            ),
            LOADING_MESSAGES.length - 1
        );

        if (index === messageIndex) {
            return;
        }

        messageIndex = index;

        loadingMessage.textContent =
            LOADING_MESSAGES[index];
    }

    /* =====================================
       PROGRESS BAR
    ===================================== */

    function updateProgress(value) {
        const progress = Math.min(
            100,
            Math.max(0, Math.round(value))
        );

        progressFill.style.width =
            `${progress}%`;

        progressNumber.textContent =
            `${progress}%`;

        updateLoadingMessage(progress);
    }

    /* =====================================
       CONFETTI
    ===================================== */

    function createConfetti(amount = 90) {
        if (!confettiLayer) {
            return;
        }

        const fragment =
            document.createDocumentFragment();

        for (let i = 0; i < amount; i++) {
            const piece =
                document.createElement("i");

            const color = CONFETTI_COLORS[
                Math.floor(
                    Math.random() *
                    CONFETTI_COLORS.length
                )
            ];

            const duration =
                2 + Math.random() * 2.5;

            const movement =
                (Math.random() - 0.5) * 300;

            const rotation =
                (Math.random() - 0.5) * 1400;

            piece.style.left =
                `${Math.random() * 100}%`;

            piece.style.background = color;

            piece.style.width =
                `${7 + Math.random() * 9}px`;

            piece.style.height =
                `${12 + Math.random() * 17}px`;

            piece.style.setProperty(
                "--fall-duration",
                `${duration}s`
            );

            piece.style.setProperty(
                "--fall-x",
                `${movement}px`
            );

            piece.style.setProperty(
                "--fall-rotate",
                `${rotation}deg`
            );

            piece.style.animationDelay =
                `${Math.random() * 0.45}s`;

            fragment.append(piece);
        }

        confettiLayer.append(fragment);

        setTimeout(() => {
            confettiLayer.innerHTML = "";
        }, 5500);
    }

    /* =====================================
       REVEAL SCREEN
    ===================================== */

    function showReveal() {
        loadingScreen.classList.remove(
            "active"
        );

        loadingScreen.hidden = true;

        revealScreen.hidden = false;

        revealScreen.classList.add(
            "active"
        );

        createConfetti(110);

        updateMusicChoice();

        enterButton.focus();
    }

    /* =====================================
       LOADING ANIMATION
    ===================================== */

    function startLoading() {
        const startTime = performance.now();

        updateProgress(0);

        function animate(now) {
            const elapsed = now - startTime;

            const percentage =
                elapsed / LOADING_DURATION * 100;

            updateProgress(percentage);

            if (percentage >= 100) {
                updateProgress(100);

                setTimeout(
                    showReveal,
                    450
                );

                return;
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

    /* =====================================
       SAVE INTRO MUSIC STATE
    ===================================== */

    function saveMusicPreference() {
        const playing =
            useMusic && !introAudio.paused;

        const time = Number.isFinite(
            introAudio.currentTime
        )
            ? introAudio.currentTime
            : 0;

        try {
            localStorage.setItem(
                "bising.music.introChoice",
                JSON.stringify(useMusic)
            );

            localStorage.setItem(
                "bising.music.playing",
                JSON.stringify(playing)
            );

            localStorage.setItem(
                "bising.music.index",
                JSON.stringify(0)
            );

            localStorage.setItem(
                "bising.music.time",
                JSON.stringify(
                    useMusic ? time : 0
                )
            );
        } catch (error) {
            console.warn(
                "Gagal menyimpan pilihan musik:",
                error
            );
        }
    }

    /* =====================================
       ENTER WEBSITE
    ===================================== */

    function enterWebsite() {
        if (hasEntered) {
            return;
        }

        hasEntered = true;

        enterButton.disabled = true;

        enterButton.textContent =
            "GASSS! ✳";

        createConfetti(50);

        introTransition.classList.add(
            "active"
        );

        // Simpan posisi sesaat sebelum pindah.
        setTimeout(() => {
            saveMusicPreference();

            window.location.href =
                DESTINATION;
        }, 800);
    }

    /* =====================================
       AUDIO EVENTS
    ===================================== */

    function initAudioEvents() {
        introAudio.addEventListener(
            "playing",
            () => {
                updateMusicChoice();
            }
        );

        introAudio.addEventListener(
            "pause",
            () => {
                updateMusicChoice();
            }
        );

        introAudio.addEventListener(
            "error",
            () => {
                const error = introAudio.error;

                console.error(
                    "Audio intro error:",
                    error?.code,
                    INTRO_MUSIC_SRC
                );

                musicChoiceStatus.textContent =
                    "FILE MUSIK TIDAK TERBACA";
            }
        );
    }

    /* =====================================
       BUTTON EVENTS
    ===================================== */

    function initEvents() {
        musicOnButton.addEventListener(
            "click",
            selectMusicOn
        );

        musicOffButton.addEventListener(
            "click",
            selectMusicOff
        );

        enterButton.addEventListener(
            "click",
            enterWebsite
        );
    }

    /* =====================================
       INITIALIZE INTRO
    ===================================== */

    function initIntro() {
        const requiredElements = [
            loadingScreen,
            revealScreen,
            progressFill,
            progressNumber,
            loadingMessage,
            musicOnButton,
            musicOffButton,
            musicChoiceStatus,
            enterButton,
            introTransition
        ];

        if (
            requiredElements.some(
                (element) => !element
            )
        ) {
            console.error(
                "Ada elemen intro yang hilang."
            );

            return;
        }

        initAudioEvents();

        initEvents();

        updateMusicChoice();

        startLoading();
    }

    initIntro();

})();
