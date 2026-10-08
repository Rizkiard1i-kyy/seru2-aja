
/* =========================================
   BISING! CLUB
   MAIN JAVASCRIPT
   MUSIC + ALBUM + BOOTH + ARCADE + WALL + SPA
========================================= */

(() => {
    "use strict";

    /* =====================================
       1. HELPERS
    ===================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const rand = (number) =>
        Math.floor(Math.random() * number);

    const shuffle = (items) => {
        const result = [...items];

        for (let i = result.length - 1; i > 0; i--) {
            const j = rand(i + 1);

            [result[i], result[j]] = [
                result[j],
                result[i]
            ];
        }

        return result;
    };

    const clamp = (value, min, max) =>
        Math.max(min, Math.min(max, value));

    let page = document.body.dataset.page;

    const storage = {
        get(key, fallback) {
            try {
                const value = localStorage.getItem(key);

                return value === null
                    ? fallback
                    : JSON.parse(value);
            } catch {
                return fallback;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(
                    key,
                    JSON.stringify(value)
                );
            } catch (error) {
                console.warn("Storage error:", error);
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn("Storage error:", error);
            }
        }
    };

    /* =====================================
       2. FAVORITES
    ===================================== */

    const savedFavorites = storage.get(
        "bising.favorites",
        []
    );

    const favorites = new Set(
        (Array.isArray(savedFavorites) ? savedFavorites : [])
            .map((id) =>
                typeof id === "number"
                    ? `foto-${id}`
                    : id
            )
    );

    const mediaKey = (item) =>
        `${item.type}-${item.id}`;

    function isFavorite(item) {
        return favorites.has(mediaKey(item));
    }

    function toggleFav(item) {
        const key = mediaKey(item);

        if (favorites.has(key)) {
            favorites.delete(key);
        } else {
            favorites.add(key);
        }

        storage.set(
            "bising.favorites",
            [...favorites]
        );

        syncViewerHeart();

        if (page === "album") {
            renderAlbum();
        }
    }

    /* =====================================
       3. TOAST
    ===================================== */

    let toastTimer = null;

    function toast(message) {
        const element = $("#toast");

        if (!element) return;

        element.textContent = message;
        element.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            element.classList.remove("show");
        }, 2500);
    }

    /* =====================================
       4. CONFETTI
    ===================================== */

    function burst(amount = 40) {
        const layer = $("#confettiLayer");

        if (!layer) return;

        const colors = [
            "#d3ff50",
            "#ff91c5",
            "#91baff",
            "#ff9865",
            "#ffffff"
        ];

        for (let i = 0; i < amount; i++) {
            const element = document.createElement("i");

            element.className = "confetti-piece";

            element.style.left =
                `${Math.random() * 100}%`;

            element.style.background =
                colors[rand(colors.length)];

            element.style.setProperty(
                "--duration",
                `${1.5 + Math.random() * 2}s`
            );

            element.style.setProperty(
                "--dx",
                `${(Math.random() - 0.5) * 330}px`
            );

            element.style.setProperty(
                "--rot",
                `${(Math.random() - 0.5) * 1300}deg`
            );

            layer.append(element);

            setTimeout(() => {
                element.remove();
            }, 3700);
        }
    }

    /* =====================================
       5. MUSIC PLAYLIST

       NAMA FILE HARUS SAMA DENGAN FOLDER
       aset/music/
    ===================================== */

    const MUSIC_PLAYLIST = [
        {
            title: "LAGU 01",
            src: "aset/music/lagu-01.mp3"
        },
        {
            title: "LAGU 02",
            src: "aset/music/lagu-02.mp3"
        },
        {
            title: "LAGU 03",
            src: "aset/music/lagu-03.mp3"
        }
    ];

    /* =====================================
       6. MUSIC PLAYER STATE
    ===================================== */

    let musicAudio = null;
    let musicPlayRequested = false;
    let musicPausedForVideo = false;

    let musicPlay = null;
    let musicPause = null;

    function updateMusicStatus() {
        const button = $("#musicToggle");
        const title = $("#musicTitle");
        const status = $("#musicStatus");

        if (
            !musicAudio ||
            !button ||
            !title ||
            !status
        ) {
            return;
        }

        const index = Number(
            storage.get("bising.music.index", 0)
        );

        const song =
            MUSIC_PLAYLIST[index] ||
            MUSIC_PLAYLIST[0];

        title.textContent = song.title;

        button.textContent =
            musicAudio.paused ? "▶" : "⏸";

        button.setAttribute(
            "aria-label",
            musicAudio.paused
                ? "Putar musik"
                : "Jeda musik"
        );

        status.textContent =
            musicAudio.paused
                ? "MUSIC OFF"
                : "NOW PLAYING ♫";
    }

    /* =====================================
       7. INITIALIZE MUSIC
    ===================================== */

    function initMusicPlayer() {
        const audio = $("#backgroundMusic");
        const toggle = $("#musicToggle");
        const previous = $("#musicPrev");
        const next = $("#musicNext");
        const status = $("#musicStatus");

        if (
            !audio ||
            !toggle ||
            !previous ||
            !next ||
            !status
        ) {
            console.warn(
                "Elemen music player tidak ditemukan."
            );

            return;
        }

        // Jangan memasang listener dua kali.
        if (audio.dataset.initialized === "true") {
            return;
        }

        audio.dataset.initialized = "true";
        musicAudio = audio;

        let songIndex = Number(
            storage.get("bising.music.index", 0)
        );

        if (
            !Number.isInteger(songIndex) ||
            songIndex < 0 ||
            songIndex >= MUSIC_PLAYLIST.length
        ) {
            songIndex = 0;
        }

        let savedTime = Number(
            storage.get("bising.music.time", 0)
        );

        if (!Number.isFinite(savedTime)) {
            savedTime = 0;
        }

        musicPlayRequested = Boolean(
            storage.get("bising.music.playing", false)
        );

        /* LOAD SONG */

        function loadSong(restore = false) {
            const song = MUSIC_PLAYLIST[songIndex];

            savedTime = restore
                ? Number(
                    storage.get("bising.music.time", 0)
                ) || 0
                : 0;

            audio.src = song.src;
            audio.load();

            storage.set(
                "bising.music.index",
                songIndex
            );

            if (!restore) {
                storage.set(
                    "bising.music.time",
                    0
                );
            }

            updateMusicStatus();
        }

        /* PLAY */

        async function play() {
            musicPlayRequested = true;

            try {
                await audio.play();

                storage.set(
                    "bising.music.playing",
                    true
                );

                updateMusicStatus();

                return true;

            } catch (error) {
                console.error(
                    "Gagal memutar musik:",
                    error.name,
                    error.message
                );

                musicPlayRequested = false;

                storage.set(
                    "bising.music.playing",
                    false
                );

                updateMusicStatus();

                if (error.name === "NotAllowedError") {
                    status.textContent =
                        "KLIK ▶ UNTUK PUTAR";

                } else if (
                    error.name === "NotSupportedError"
                ) {
                    status.textContent =
                        "FORMAT TIDAK DIDUKUNG";

                } else {
                    status.textContent =
                        "GAGAL PUTAR LAGU";
                }

                return false;
            }
        }

        /* PAUSE */

        function pause() {
            musicPlayRequested = false;
            musicPausedForVideo = false;

            audio.pause();

            storage.set(
                "bising.music.playing",
                false
            );

            storage.set(
                "bising.music.time",
                audio.currentTime
            );

            updateMusicStatus();
        }

        musicPlay = play;
        musicPause = pause;

        /* NEXT / PREVIOUS */

        function changeSong(direction) {
            songIndex = (
                songIndex +
                direction +
                MUSIC_PLAYLIST.length
            ) % MUSIC_PLAYLIST.length;

            loadSong(false);
            play();
        }

        /* BUTTON EVENTS */

        toggle.addEventListener("click", () => {
            if (audio.paused) {
                play();
            } else {
                pause();
            }
        });

        previous.addEventListener("click", () => {
            changeSong(-1);
        });

        next.addEventListener("click", () => {
            changeSong(1);
        });

        audio.addEventListener("ended", () => {
            changeSong(1);
        });

        /* RESTORE TIME */

        audio.addEventListener(
            "loadedmetadata",
            () => {
                if (
                    !Number.isFinite(savedTime) ||
                    savedTime <= 0
                ) {
                    return;
                }

                try {
                    if (
                        Number.isFinite(audio.duration)
                    ) {
                        audio.currentTime = Math.min(
                            savedTime,
                            Math.max(
                                0,
                                audio.duration - 0.5
                            )
                        );
                    } else {
                        audio.currentTime = savedTime;
                    }
                } catch (error) {
                    console.warn(
                        "Gagal restore waktu:",
                        error
                    );
                }

                savedTime = 0;
            }
        );

        /* SAVE CURRENT TIME */

        let lastSecond = -1;

        audio.addEventListener(
            "timeupdate",
            () => {
                const second = Math.floor(
                    audio.currentTime
                );

                if (second === lastSecond) return;

                lastSecond = second;

                storage.set(
                    "bising.music.time",
                    audio.currentTime
                );
            }
        );

        /* DISPLAY EVENTS */

        audio.addEventListener(
            "playing",
            updateMusicStatus
        );

        audio.addEventListener(
            "pause",
            updateMusicStatus
        );

        audio.addEventListener(
            "error",
            () => {
                status.textContent =
                    "FILE LAGU ERROR";

                console.error(
                    "File lagu gagal dibaca:",
                    audio.currentSrc
                );
            }
        );

        /* SAVE WHEN EXIT */

        window.addEventListener(
            "pagehide",
            () => {
                storage.set(
                    "bising.music.time",
                    audio.currentTime
                );

                storage.set(
                    "bising.music.playing",
                    musicPlayRequested
                );
            }
        );

        /* =================================
           MUSIC CHOICE FROM INTRO
        ================================= */

        loadSong(true);

        const introChoice = storage.get(
            "bising.music.introChoice",
            null
        );

        if (introChoice === true) {
            musicPlayRequested = true;

            /*
               Browser mungkin menolak autoplay
               sesudah pindah dari intro.html.
            */

            play();

        } else if (introChoice === false) {
            musicPlayRequested = false;

            storage.set(
                "bising.music.playing",
                false
            );

            audio.pause();
            updateMusicStatus();

        } else if (musicPlayRequested) {
            status.textContent =
                "KLIK ▶ UNTUK LANJUT";
        }

        storage.remove(
            "bising.music.introChoice"
        );
    }

    /* =====================================
       8. VIEWER STATE
    ===================================== */

    let current = 0;
    let viewerOpen = false;
    let previousFocus = null;
    let touchStartX = null;
    let viewerItems = PHOTOS;

    function currentMedia() {
        return viewerItems[current];
    }

    function syncViewerHeart() {
        const button = $("#viewerHeart");
        const item = currentMedia();

        if (!button || !item) return;

        const favorite = isFavorite(item);

        button.textContent =
            favorite ? "♥" : "♡";

        button.classList.toggle(
            "is-fav",
            favorite
        );

        button.setAttribute(
            "aria-label",
            favorite
                ? "Hapus favorit"
                : "Tambahkan favorit"
        );
    }

    /* =====================================
       9. VIDEO VIEWER + MUSIC
    ===================================== */

    function ensureViewerVideo() {
        let video = $("#viewerVideo");

        if (!video) {
            const image = $("#viewerImage");

            if (!image) return;

            video = document.createElement("video");

            video.id = "viewerVideo";
            video.controls = true;
            video.playsInline = true;
            video.preload = "metadata";
            video.hidden = true;

            image.insertAdjacentElement(
                "afterend",
                video
            );
        }

        if (video.dataset.musicBound === "true") {
            return;
        }

        video.dataset.musicBound = "true";

        video.addEventListener("play", () => {
            if (
                musicAudio &&
                !musicAudio.paused
            ) {
                musicPausedForVideo = true;
                musicAudio.pause();
            }
        });

        video.addEventListener("ended", () => {
            resumeMusicAfterVideo();
        });
    }

    function resumeMusicAfterVideo() {
        if (!musicPausedForVideo) return;

        musicPausedForVideo = false;

        if (
            musicPlayRequested &&
            typeof musicPlay === "function"
        ) {
            musicPlay();
        }
    }

    /* =====================================
       10. SHOW MEDIA
    ===================================== */

    function showMedia(index) {
        if (!viewerItems.length) return;

        current = (
            index + viewerItems.length
        ) % viewerItems.length;

        const item = currentMedia();

        const image = $("#viewerImage");
        const video = $("#viewerVideo");

        if (!image) return;

        if (video) {
            video.pause();
            video.removeAttribute("src");
            video.load();
            video.hidden = true;
        }

        image.hidden = true;
        image.removeAttribute("src");

        if (
            item.type === "video" &&
            video
        ) {
            video.hidden = false;
            video.src = item.src;
            video.load();

        } else {
            image.hidden = false;
            image.src = item.src;
            image.alt = item.title;

            resumeMusicAfterVideo();
        }

        const tag = $("#viewerTag");
        const label = $("#viewerLabel");
        const download = $("#viewerDownload");

        if (tag) {
            tag.textContent =
                `${item.type.toUpperCase()} ` +
                `${String(
                    current + 1
                ).padStart(2, "0")}` +
                `/${viewerItems.length}`;
        }

        if (label) {
            label.textContent = item.title;
        }

        if (download) {
            download.href = item.src;
            download.download = item.file;
        }

        syncViewerHeart();
    }

    function openMedia(
        item,
        collection = PHOTOS
    ) {
        const viewer = $("#photoViewer");

        if (!viewer) return;

        viewerItems = collection;

        const found = collection.findIndex(
            (media) =>
                media.type === item.type &&
                media.id === item.id
        );

        if (found === -1) return;

        previousFocus = document.activeElement;

        showMedia(found);

        viewer.classList.add("open");

        viewer.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow = "hidden";

        viewerOpen = true;

        $(".viewer-actions [data-close]")?.focus();
    }

    function openViewer(id) {
        const item = PHOTOS[id];

        if (item) {
            openMedia(item, PHOTOS);
        }
    }

    function closeViewer() {
        if (!viewerOpen) return;

        viewerOpen = false;

        const video = $("#viewerVideo");

        if (video) {
            video.pause();
            video.removeAttribute("src");
            video.load();
        }

        $("#photoViewer")?.classList.remove("open");

        $("#photoViewer")?.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow = "";

        resumeMusicAfterVideo();

        if (previousFocus?.isConnected) {
            previousFocus.focus();
        }
    }

    /* =====================================
       11. INITIALIZE VIEWER
    ===================================== */

    function initViewer() {
        if (!$("#photoViewer")) return;

        ensureViewerVideo();

        $$('[data-close="viewer"]').forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    closeViewer
                );
            }
        );

        $("#viewerNext")?.addEventListener(
            "click",
            () => showMedia(current + 1)
        );

        $("#viewerPrev")?.addEventListener(
            "click",
            () => showMedia(current - 1)
        );

        $("#viewerHeart")?.addEventListener(
            "click",
            () => {
                const item = currentMedia();

                if (!item) return;

                toggleFav(item);

                toast(
                    isFavorite(item)
                        ? "DISIMPEN ♡"
                        : "FAV DICABUT"
                );
            }
        );

        document.addEventListener(
            "keydown",
            (event) => {
                if (!viewerOpen) return;

                if (event.key === "Escape") {
                    closeViewer();
                }

                if (event.key === "ArrowRight") {
                    event.preventDefault();
                    showMedia(current + 1);
                }

                if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    showMedia(current - 1);
                }

                if (event.key === "Tab") {
                    const controls = $$(
                        ".viewer-shell button, " +
                        ".viewer-shell a, " +
                        ".viewer-shell video"
                    ).filter(
                        (element) =>
                            !element.disabled &&
                            !element.hidden
                    );

                    if (!controls.length) return;

                    const first = controls[0];
                    const last = controls[
                        controls.length - 1
                    ];

                    if (
                        event.shiftKey &&
                        document.activeElement === first
                    ) {
                        event.preventDefault();
                        last.focus();

                    } else if (
                        !event.shiftKey &&
                        document.activeElement === last
                    ) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            }
        );

        const image = $("#viewerImage");

        image?.addEventListener(
            "touchstart",
            (event) => {
                touchStartX =
                    event.touches[0].clientX;
            },
            { passive: true }
        );

        image?.addEventListener(
            "touchend",
            (event) => {
                if (touchStartX === null) return;

                const difference =
                    event.changedTouches[0].clientX -
                    touchStartX;

                if (Math.abs(difference) > 42) {
                    showMedia(
                        current +
                        (difference < 0 ? 1 : -1)
                    );
                }

                touchStartX = null;
            },
            { passive: true }
        );
    }

    /* =====================================
       12. HOME PAGE
    ===================================== */

    function initHome() {
        const cards = $$(".stack-card");

        function mix() {
            const ids = shuffle(
                PHOTOS.map((photo) => photo.id)
            ).slice(0, 3);

            cards.forEach((card, index) => {
                const image = $("img", card);

                card.style.opacity = "0.4";

                setTimeout(() => {
                    if (!card.isConnected) return;

                    const photo = PHOTOS[ids[index]];

                    if (!photo || !image) return;

                    image.src = photo.src;
                    image.alt = photo.title;

                    card.dataset.photo = photo.id;

                    card.setAttribute(
                        "aria-label",
                        `Buka ${photo.title}`
                    );

                    card.style.opacity = "1";
                }, 140);
            });

            burst(15);
        }

        cards.forEach((card) => {
            card.addEventListener("click", () => {
                openViewer(
                    Number(card.dataset.photo)
                );
            });
        });

        $("#shuffleStack")?.addEventListener(
            "click",
            mix
        );

        const stage = $("#heroStage");

        const canHover = matchMedia(
            "(hover: hover) and (pointer: fine)"
        ).matches;

        const reducedMotion = matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (stage && canHover && !reducedMotion) {
            stage.addEventListener(
                "pointermove",
                (event) => {
                    const rect =
                        stage.getBoundingClientRect();

                    const x =
                        (event.clientX - rect.left) /
                        rect.width - 0.5;

                    const y =
                        (event.clientY - rect.top) /
                        rect.height - 0.5;

                    const first = $(".scribble-1", stage);
                    const second = $(".scribble-2", stage);

                    if (first) {
                        first.style.translate =
                            `${x * 15}px ${y * 15}px`;
                    }

                    if (second) {
                        second.style.translate =
                            `${-x * 12}px ${-y * 12}px`;
                    }
                }
            );

            stage.addEventListener(
                "pointerleave",
                () => {
                    $$(".scribble", stage).forEach(
                        (element) => {
                            element.style.translate = "";
                        }
                    );
                }
            );
        }
    }

    /* =====================================
       13. ALBUM
    ===================================== */

    let albumFilter = "all";
    let albumFilm = false;
    let albumLimit = 24;

    let albumOrder = MEDIA.map(
        (item) => mediaKey(item)
    );

    let visibleAlbum = [];

    function getAlbumList() {
        const mediaLookup = new Map(
            MEDIA.map(
                (item) => [mediaKey(item), item]
            )
        );

        return albumOrder
            .map((key) => mediaLookup.get(key))
            .filter(Boolean)
            .filter((item) => {
                if (albumFilter === "all") {
                    return true;
                }

                if (albumFilter === "foto") {
                    return item.type === "foto";
                }

                if (albumFilter === "video") {
                    return item.type === "video";
                }

                if (albumFilter === "fav") {
                    return isFavorite(item);
                }

                return item.category === albumFilter;
            });
    }

    function renderAlbum() {
        const grid = $("#albumGrid");

        if (!grid) return;

        const list = getAlbumList();

        visibleAlbum = list;

        const displayed = list.slice(
            0,
            albumLimit
        );

        const count = $("#photoCount");
        const empty = $("#emptyGallery");

        if (count) {
            count.textContent = list.length;
        }

        if (empty) {
            empty.hidden = list.length > 0;
        }

        grid.classList.toggle(
            "filmstrip",
            albumFilm
        );

        grid.innerHTML = displayed.map(
            (item, index) => {
                const wide =
                    !albumFilm && index % 9 === 3
                        ? "wide"
                        : "";

                const tall =
                    !albumFilm && index % 11 === 7
                        ? "tall"
                        : "";

                const tilt = [
                    -1, 1.2, -0.8, 0.8, 0
                ][index % 5];

                const ratio =
                    index % 4 === 0
                        ? "4/3"
                        : "4/5";

                const favorite = isFavorite(item);

                const mediaContent =
                    item.type === "video"
                        ? `
                            <div class="video-thumbnail">
                                <video
                                    src="${item.src}"
                                    preload="metadata"
                                    muted
                                    playsinline
                                ></video>

                                <span class="video-play">
                                    ▶
                                </span>

                                <span class="video-label">
                                    VIDEO
                                </span>
                            </div>
                        `
                        : `
                            <img
                                src="${item.src}"
                                alt="${item.title}"
                                loading="lazy"
                                decoding="async"
                            >
                        `;

                return `
                    <article
                        class="album-photo ${wide} ${tall}"
                        role="button"
                        tabindex="0"
                        data-type="${item.type}"
                        data-id="${item.id}"
                        style="
                            --tilt: ${tilt}deg;
                            --ratio: ${ratio};
                        "
                        aria-label="Buka ${item.title}"
                    >
                        ${mediaContent}

                        <span class="photo-no">
                            #${String(
                                item.id + 1
                            ).padStart(2, "0")}
                        </span>

                        <span class="photo-foot">
                            ${item.title}
                        </span>

                        <button
                            class="photo-fav ${
                                favorite ? "is-fav" : ""
                            }"
                            data-fav-type="${item.type}"
                            data-fav-id="${item.id}"
                            type="button"
                            aria-label="${
                                favorite
                                    ? "Hapus favorit"
                                    : "Tambah favorit"
                            }"
                        >
                            ${favorite ? "♥" : "♡"}
                        </button>
                    </article>
                `;
            }
        ).join("");

        const loadMore = $("#albumLoadMore");

        if (loadMore) {
            loadMore.hidden =
                albumLimit >= list.length;

            loadMore.textContent =
                `+ MUAT LAGI (${Math.max(
                    list.length - albumLimit,
                    0
                )} TERSISA)`;
        }
    }

    function initAlbum() {
        renderAlbum();

        $("#albumFilters")?.addEventListener(
            "click",
            (event) => {
                const button =
                    event.target.closest(
                        "[data-filter]"
                    );

                if (!button) return;

                albumFilter = button.dataset.filter;
                albumLimit = 24;

                $$(
                    "[data-filter]",
                    $("#albumFilters")
                ).forEach((item) => {
                    item.classList.toggle(
                        "active",
                        item === button
                    );
                });

                renderAlbum();
            }
        );

        $("#albumShuffle")?.addEventListener(
            "click",
            () => {
                albumOrder = shuffle(albumOrder);

                renderAlbum();

                toast("DIACAK. TIDAK ADA ALASAN.");
            }
        );

        $("#albumLayout")?.addEventListener(
            "click",
            () => {
                albumFilm = !albumFilm;

                renderAlbum();

                toast(
                    albumFilm
                        ? "MODE FILMSTRIP"
                        : "MODE GRID"
                );
            }
        );

        $("#albumLoadMore")?.addEventListener(
            "click",
            () => {
                albumLimit += 24;
                renderAlbum();
            }
        );

        const grid = $("#albumGrid");

        function getCardMedia(card) {
            return MEDIA.find(
                (item) =>
                    item.type === card.dataset.type &&
                    item.id === Number(card.dataset.id)
            );
        }

        grid?.addEventListener(
            "click",
            (event) => {
                const favorite =
                    event.target.closest(
                        "[data-fav-type]"
                    );

                if (favorite) {
                    event.stopPropagation();

                    const item = MEDIA.find(
                        (media) =>
                            media.type ===
                                favorite.dataset.favType &&
                            media.id === Number(
                                favorite.dataset.favId
                            )
                    );

                    if (item) {
                        toggleFav(item);
                    }

                    return;
                }

                const card =
                    event.target.closest(
                        ".album-photo"
                    );

                if (!card) return;

                const item = getCardMedia(card);

                if (item) {
                    openMedia(item, visibleAlbum);
                }
            }
        );

        grid?.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key !== "Enter" &&
                    event.key !== " "
                ) {
                    return;
                }

                if (
                    !event.target.matches(
                        ".album-photo"
                    )
                ) {
                    return;
                }

                event.preventDefault();

                const item = getCardMedia(
                    event.target
                );

                if (item) {
                    openMedia(item, visibleAlbum);
                }
            }
        );

        $("#topAlbum")?.addEventListener(
            "click",
            () => {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        );
    }

    /* =====================================
       14. PHOTOBOOTH
    ===================================== */

    let boothIds = [1, 7, 12, 4];
    let boothSwatch = "lime";
    let boothLook = "normal";
    let boothBusy = false;
    let boothShuffleInterval = null;

    const swatchHex = {
        lime: "#d3ff50",
        pink: "#ff93bb",
        blue: "#91c4ff",
        orange: "#ffac6b",
        white: "#fffaf0"
    };

    function updateBooth() {
        const grid = $("#stripPhotos");

        if (!grid) return;

        grid.className =
            `strip-photos look-${boothLook}`;

        grid.innerHTML = boothIds.map(
            (id, slot) => `
                <button
                    type="button"
                    class="strip-photo"
                    data-slot="${slot}"
                    title="Klik buat ganti"
                >
                    <img
                        src="${PHOTOS[id].src}"
                        alt="Foto ${slot + 1}"
                    >
                </button>
            `
        ).join("");

        $("#boothStrip").className =
            `booth-strip strip-${boothSwatch}`;

        $("#stripCaption").textContent = (
            $("#boothCaption").value.trim() ||
            "GENG GAK JELAS"
        ).toUpperCase();

        $("#stripDate").textContent =
            new Date().getFullYear();
    }

    function initBooth() {
        updateBooth();

        $("#boothSwatches")?.addEventListener(
            "click",
            (event) => {
                const button =
                    event.target.closest(
                        "[data-swatch]"
                    );

                if (!button) return;

                boothSwatch = button.dataset.swatch;

                $$("[data-swatch]").forEach((item) => {
                    const active = item === button;

                    item.classList.toggle(
                        "active",
                        active
                    );

                    item.textContent =
                        active ? "✓" : "";
                });

                updateBooth();
            }
        );

        $("#boothFilters")?.addEventListener(
            "click",
            (event) => {
                const button =
                    event.target.closest(
                        "[data-look]"
                    );

                if (!button) return;

                boothLook = button.dataset.look;

                $$("[data-look]").forEach((item) => {
                    item.classList.toggle(
                        "active",
                        item === button
                    );
                });

                updateBooth();
            }
        );

        $("#boothCaption")?.addEventListener(
            "input",
            updateBooth
        );

        $("#stripPhotos")?.addEventListener(
            "click",
            (event) => {
                const button =
                    event.target.closest(
                        "[data-slot]"
                    );

                if (!button || boothBusy) return;

                const slot = Number(
                    button.dataset.slot
                );

                let id = rand(PHOTOS.length);

                if (id === boothIds[slot]) {
                    id = (id + 1) % PHOTOS.length;
                }

                boothIds[slot] = id;

                updateBooth();
            }
        );

        $("#boothShuffle")?.addEventListener(
            "click",
            () => {
                if (boothBusy) return;

                boothBusy = true;

                const button = $("#boothShuffle");

                button.disabled = true;

                let iterations = 0;

                boothShuffleInterval = setInterval(
                    () => {
                        boothIds = shuffle(
                            PHOTOS.map(
                                (photo) => photo.id
                            )
                        ).slice(0, 4);

                        updateBooth();

                        $$(".strip-photo").forEach(
                            (item) => {
                                item.classList.add(
                                    "flashing"
                                );
                            }
                        );

                        iterations++;

                        if (iterations >= 9) {
                            clearInterval(
                                boothShuffleInterval
                            );

                            boothShuffleInterval = null;
                            boothBusy = false;
                            button.disabled = false;

                            updateBooth();

                            toast("TADAA! FOTO BARU");
                        }
                    },
                    80
                );
            }
        );

        $("#boothSave")?.addEventListener(
            "click",
            saveBooth
        );
    }

    /* =====================================
       15. SAVE PHOTOBOOTH PNG
    ===================================== */

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();

            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
        });
    }

    function canvasCover(
        ctx,
        image,
        x,
        y,
        width,
        height
    ) {
        const ratio = Math.max(
            width / image.naturalWidth,
            height / image.naturalHeight
        );

        const drawWidth =
            image.naturalWidth * ratio;

        const drawHeight =
            image.naturalHeight * ratio;

        ctx.drawImage(
            image,
            x + (width - drawWidth) / 2,
            y + (height - drawHeight) / 2,
            drawWidth,
            drawHeight
        );
    }

    async function saveBooth() {
        if (boothBusy) return;

        const status = $("#boothStatus");
        const button = $("#boothSave");

        button.disabled = true;
        status.textContent =
            "BENTAR, LAGI NYETAK...";

        try {
            const pictures = await Promise.all(
                boothIds.map(
                    (id) => loadImage(PHOTOS[id].src)
                )
            );

            const canvas =
                document.createElement("canvas");

            canvas.width = 720;
            canvas.height = 1610;

            const ctx = canvas.getContext("2d");

            if (!ctx) {
                throw Error("Canvas tidak tersedia");
            }

            ctx.fillStyle = swatchHex[boothSwatch];

            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.fillStyle = "#161616";
            ctx.textAlign = "center";

            ctx.font =
                "bold 64px Impact, Arial Black, sans-serif";

            ctx.fillText("B!  CLUB.", 360, 85);

            const filters = {
                normal: "none",
                bw: "grayscale(1) contrast(1.15)",
                retro:
                    "sepia(.7) saturate(.8) contrast(1.15)",
                pop:
                    "saturate(2.2) contrast(1.2)"
            };

            pictures.forEach((image, index) => {
                const y = 115 + index * 322;

                ctx.fillStyle = "#161616";

                ctx.fillRect(
                    34,
                    y - 4,
                    652,
                    303
                );

                ctx.save();
                ctx.beginPath();
                ctx.rect(40, y, 640, 291);
                ctx.clip();

                ctx.filter = filters[boothLook];

                canvasCover(
                    ctx,
                    image,
                    40,
                    y,
                    640,
                    291
                );

                ctx.restore();
            });

            ctx.fillStyle = "#161616";

            ctx.font =
                "bold 51px Impact, Arial Black, sans-serif";

            const caption = (
                $("#boothCaption").value.trim() ||
                "GENG GAK JELAS"
            ).toUpperCase();

            ctx.fillText(
                caption,
                360,
                1462,
                650
            );

            ctx.font = "bold 23px monospace";

            ctx.fillText(
                `✳ BISING CLUB / ${
                    new Date().getFullYear()
                } ✳`,
                360,
                1520
            );

            const blob = await new Promise(
                (resolve, reject) => {
                    canvas.toBlob(
                        (result) => {
                            if (result) {
                                resolve(result);
                            } else {
                                reject(
                                    Error("PNG gagal dibuat")
                                );
                            }
                        },
                        "image/png"
                    );
                }
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = "bising-photobooth.png";

            document.body.append(link);
            link.click();
            link.remove();

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 3000);

            status.textContent =
                "SELESAI! CEK DOWNLOAD.";

            toast("FOTO STRIP DISIMPAN!");
            burst(20);

        } catch (error) {
            console.error(error);

            status.textContent =
                "GAGAL NYETAK. COBA VIA LIVE SERVER.";

            toast("GAGAL SIMPAN FOTO");

        } finally {
            button.disabled = false;
        }
    }

    /* =====================================
       16. MEMORY GAME
    ===================================== */

    let memoryTimer = null;
    let memoryStart = 0;
    let memoryMoves = 0;
    let memoryMatches = 0;
    let memoryFlipped = [];
    let memoryLocked = false;
    let memoryFlipTimeout = null;
    let memoryFinished = false;

    function fmtTime(seconds) {
        const minutes = Math.floor(seconds / 60);

        return (
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds % 60).padStart(2, "0")
        );
    }

    function initMemory() {
        clearInterval(memoryTimer);
        clearTimeout(memoryFlipTimeout);

        memoryTimer = null;
        memoryFlipTimeout = null;

        memoryMoves = 0;
        memoryMatches = 0;
        memoryFlipped = [];
        memoryLocked = false;
        memoryFinished = false;

        $("#memoryMoves").textContent = "0";
        $("#memoryTime").textContent = "00:00";

        $("#memoryMessage").textContent =
            "Cari 6 pasangan. Jangan ngasal.";

        const chosen = shuffle(
            PHOTOS.map((photo) => photo.id)
        ).slice(0, 6);

        const deck = shuffle([
            ...chosen,
            ...chosen
        ]);

        $("#memoryGrid").innerHTML = deck.map(
            (id) => `
                <button
                    type="button"
                    class="memory-card"
                    data-memory="${id}"
                    aria-label="Buka kartu"
                >
                    <span class="memory-inner">

                        <span class="memory-front">
                            ✳
                        </span>

                        <span class="memory-back">
                            <img
                                src="${PHOTOS[id].src}"
                                alt="Foto pasangan"
                            >
                        </span>

                    </span>
                </button>
            `
        ).join("");
    }

    function flipMemory(card) {
        if (
            memoryLocked ||
            memoryFinished ||
            card.classList.contains("flipped") ||
            card.classList.contains("matched")
        ) {
            return;
        }

        if (!memoryTimer) {
            memoryStart = Date.now();

            memoryTimer = setInterval(() => {
                const seconds = Math.floor(
                    (Date.now() - memoryStart) / 1000
                );

                const time = $("#memoryTime");

                if (time) {
                    time.textContent = fmtTime(seconds);
                }
            }, 500);
        }

        card.classList.add("flipped");
        memoryFlipped.push(card);

        if (memoryFlipped.length !== 2) return;

        memoryMoves++;

        $("#memoryMoves").textContent =
            memoryMoves;

        const [first, second] = memoryFlipped;

        if (
            first.dataset.memory ===
            second.dataset.memory
        ) {
            first.classList.add("matched");
            second.classList.add("matched");

            memoryFlipped = [];
            memoryMatches++;

            if (memoryMatches === 6) {
                clearInterval(memoryTimer);

                memoryTimer = null;
                memoryFinished = true;

                $("#memoryMessage").textContent =
                    `SELESAI! ${memoryMoves} LANGKAH.`;

                burst(80);

                toast("GOKIL. INGATAN MASIH AMAN.");
            }

        } else {
            memoryLocked = true;

            memoryFlipTimeout = setTimeout(() => {
                first.classList.remove("flipped");
                second.classList.remove("flipped");

                memoryFlipped = [];
                memoryLocked = false;
                memoryFlipTimeout = null;
            }, 850);
        }
    }

    /* =====================================
       17. ROULETTE
    ===================================== */

    let spinInterval = null;

    function spinRoulette() {
        if (spinInterval) return;

        const button = $("#rouletteSpin");
        const image = $("#rouletteImg");
        const frame = $("#roulettePhoto");

        button.disabled = true;
        frame.classList.add("spinning");

        let iterations = 0;

        spinInterval = setInterval(() => {
            const randomPhoto =
                PHOTOS[rand(PHOTOS.length)];

            image.src = randomPhoto.src;

            $("#rouletteName").textContent = "???";

            iterations++;

            if (iterations >= 22) {
                clearInterval(spinInterval);

                spinInterval = null;

                const selected =
                    PHOTOS[rand(PHOTOS.length)];

                image.src = selected.src;

                $("#rouletteName").textContent =
                    `FOTO #${String(
                        selected.id + 1
                    ).padStart(2, "0")}`;

                frame.classList.remove("spinning");

                button.disabled = false;

                burst(23);
            }
        }, 75);
    }

    function initArcade() {
        initMemory();

        $("#memoryReset")?.addEventListener(
            "click",
            () => {
                initMemory();
                toast("RESET!");
            }
        );

        $("#memoryGrid")?.addEventListener(
            "click",
            (event) => {
                const card =
                    event.target.closest(
                        "[data-memory]"
                    );

                if (card) {
                    flipMemory(card);
                }
            }
        );

        $("#rouletteSpin")?.addEventListener(
            "click",
            spinRoulette
        );
    }

    /* =====================================
       18. WALL DEFAULT DATA
    ===================================== */

    const defaultPhotos = [
        { id: "p0", photo: 0, x: 14, y: 20, a: -11 },
        { id: "p1", photo: 7, x: 39, y: 27, a: 8 },
        { id: "p2", photo: 3, x: 72, y: 23, a: -9 },
        { id: "p3", photo: 12, x: 22, y: 65, a: 5 },
        { id: "p4", photo: 10, x: 57, y: 60, a: -8 },
        { id: "p5", photo: 16, x: 84, y: 68, a: 9 }
    ];

    const defaultNotes = [
        {
            id: "n1",
            text: "INI YANG FOTO SIAPA?",
            x: 48,
            y: 88,
            a: 6
        },
        {
            id: "n2",
            text: "YA UDAH LAH YA",
            x: 83,
            y: 44,
            a: -7
        }
    ];

    let boardPhotos = storage.get(
        "bising.board.photos",
        defaultPhotos.map((item) => ({ ...item }))
    );

    let boardNotes = storage.get(
        "bising.board.notes",
        defaultNotes.map((item) => ({ ...item }))
    );

    let boardZ = 10;

    function saveBoard() {
        storage.set(
            "bising.board.photos",
            boardPhotos
        );

        storage.set(
            "bising.board.notes",
            boardNotes
        );
    }

    /* =====================================
       19. RENDER WALL
    ===================================== */

    function drawBoard() {
        const root = $("#boardObjects");

        if (!root) return;

        root.innerHTML = "";

        boardPhotos.forEach((item) => {
            const photo = PHOTOS[item.photo];

            if (!photo) return;

            const element =
                document.createElement("div");

            element.className =
                "board-item board-polaroid";

            element.dataset.id = item.id;

            element.style.cssText = `
                left: ${item.x}%;
                top: ${item.y}%;
                --angle: ${item.a}deg;
            `;

            element.innerHTML = `
                <span class="board-pin"></span>

                <img
                    src="${photo.src}"
                    alt="${photo.title}"
                    draggable="false"
                >

                <div class="board-caption">
                    #${String(
                        photo.id + 1
                    ).padStart(2, "0")} / B!
                </div>
            `;

            root.append(element);
        });

        boardNotes.forEach((item) => {
            const element =
                document.createElement("div");

            element.className =
                "board-item board-note";

            element.dataset.id = item.id;

            element.style.cssText = `
                left: ${item.x}%;
                top: ${item.y}%;
                --angle: ${item.a}deg;
            `;

            const text =
                document.createElement("span");

            text.textContent = item.text;

            const remove =
                document.createElement("button");

            remove.className = "note-remove";
            remove.type = "button";
            remove.textContent = "×";

            remove.setAttribute(
                "aria-label",
                "Hapus catatan"
            );

            remove.addEventListener(
                "click",
                (event) => {
                    event.stopPropagation();

                    boardNotes = boardNotes.filter(
                        (note) => note.id !== item.id
                    );

                    saveBoard();
                    drawBoard();

                    toast("NOTE DIHAPUS");
                }
            );

            element.append(text, remove);

            root.append(element);
        });
    }

    /* =====================================
       20. WALL INTERACTIONS
    ===================================== */

    function initWall() {
        drawBoard();

        const board = $("#wallBoard");
        const objects = $("#boardObjects");

        let dragging = null;

        objects.addEventListener(
            "pointerdown",
            (event) => {
                if (
                    event.target.closest(".note-remove")
                ) {
                    return;
                }

                const element =
                    event.target.closest(".board-item");

                if (!element) return;

                const item = [
                    ...boardPhotos,
                    ...boardNotes
                ].find(
                    (value) =>
                        value.id === element.dataset.id
                );

                if (!item) return;

                element.setPointerCapture(
                    event.pointerId
                );

                element.style.zIndex = ++boardZ;

                dragging = {
                    item,
                    element,
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    x: item.x,
                    y: item.y,
                    moved: false
                };
            }
        );

        objects.addEventListener(
            "pointermove",
            (event) => {
                if (
                    !dragging ||
                    dragging.pointerId !== event.pointerId
                ) {
                    return;
                }

                const {
                    item,
                    element,
                    startX,
                    startY,
                    x,
                    y
                } = dragging;

                const dx =
                    event.clientX - startX;

                const dy =
                    event.clientY - startY;

                if (Math.abs(dx) + Math.abs(dy) > 5) {
                    dragging.moved = true;
                }

                if (!dragging.moved) return;

                const box =
                    board.getBoundingClientRect();

                item.x = clamp(
                    x + dx / box.width * 100,
                    8,
                    92
                );

                item.y = clamp(
                    y + dy / box.height * 100,
                    10,
                    90
                );

                element.style.left = `${item.x}%`;
                element.style.top = `${item.y}%`;

                event.preventDefault();
            }
        );

        objects.addEventListener(
            "pointerup",
            (event) => {
                if (
                    !dragging ||
                    dragging.pointerId !== event.pointerId
                ) {
                    return;
                }

                const moved = dragging.moved;
                const id = dragging.item.id;

                dragging = null;

                saveBoard();

                if (!moved && id.startsWith("p")) {
                    const photo = boardPhotos.find(
                        (item) => item.id === id
                    );

                    if (photo) {
                        openViewer(photo.photo);
                    }
                }
            }
        );

        objects.addEventListener(
            "pointercancel",
            () => {
                dragging = null;
                saveBoard();
            }
        );

        /* ADD NOTE */

        $("#wallForm")?.addEventListener(
            "submit",
            (event) => {
                event.preventDefault();

                const input = $("#wallNote");
                const value = input.value.trim();

                if (!value) return;

                boardNotes.push({
                    id:
                        "n" +
                        Date.now() +
                        "-" +
                        rand(10000),

                    text: value,

                    x: clamp(
                        28 + Math.random() * 42,
                        15,
                        80
                    ),

                    y: clamp(
                        30 + Math.random() * 32,
                        20,
                        75
                    ),

                    a: Math.round(
                        (Math.random() - 0.5) * 19
                    )
                });

                saveBoard();
                drawBoard();

                input.value = "";

                toast("DITEMPEL!");
                burst(15);
            }
        );

        /* SCATTER */

        $("#wallScatter")?.addEventListener(
            "click",
            () => {
                [
                    ...boardPhotos,
                    ...boardNotes
                ].forEach((item) => {
                    item.x =
                        12 + Math.random() * 76;

                    item.y =
                        14 + Math.random() * 72;

                    item.a = Math.round(
                        (Math.random() - 0.5) * 35
                    );
                });

                saveBoard();
                drawBoard();

                toast("KOCOK PAPAN!");
            }
        );

        /* RESET */

        $("#wallReset")?.addEventListener(
            "click",
            () => {
                if (
                    !confirm(
                        "Balikin papan ke posisi awal? Note tambahan bakal hilang."
                    )
                ) {
                    return;
                }

                boardPhotos = defaultPhotos.map(
                    (item) => ({ ...item })
                );

                boardNotes = defaultNotes.map(
                    (item) => ({ ...item })
                );

                saveBoard();
                drawBoard();

                toast("BALIK KE AWAL");
            }
        );
    }

    /* =====================================
       21. INITIALIZE CURRENT PAGE
    ===================================== */

    function initCurrentPage() {
        page = document.body.dataset.page;

        switch (page) {
            case "home":
                initHome();
                break;

            case "album":
                initAlbum();
                break;

            case "booth":
                initBooth();
                break;

            case "arcade":
                initArcade();
                break;

            case "wall":
                initWall();
                break;

            default:
                console.warn(
                    "Halaman tidak dikenali:",
                    page
                );
        }
    }

    /* =====================================
       22. BEFORE SPA NAVIGATION
    ===================================== */

    window.BisingBeforeNavigate = () => {
        closeViewer();

        clearInterval(memoryTimer);
        clearTimeout(memoryFlipTimeout);

        memoryTimer = null;
        memoryFlipTimeout = null;
        memoryLocked = false;
        memoryFlipped = [];

        clearInterval(spinInterval);
        spinInterval = null;

        clearInterval(boothShuffleInterval);
        boothShuffleInterval = null;
        boothBusy = false;

        if (page === "wall") {
            saveBoard();
        }

        /*
           Musik tidak dihentikan.
           Elemen audio berada di luar <main>.
        */
    };

    /* =====================================
       23. AFTER SPA NAVIGATION
    ===================================== */

    window.BisingAfterNavigate = () => {
        if (
            document.body.dataset.page === "album"
        ) {
            albumFilter = "all";
            albumFilm = false;
            albumLimit = 24;
        }

        initCurrentPage();

        /*
           Jangan memanggil initMusicPlayer()
           lagi di sini.
        */
    };

    /* =====================================
       24. INITIALIZE APPLICATION
    ===================================== */

    initViewer();

    initMusicPlayer();

    initCurrentPage();

})();
