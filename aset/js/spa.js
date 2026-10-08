
/* =========================================
   BISING! CLUB
   SPA NAVIGATION
========================================= */

(() => {
    "use strict";

    const PAGES = [
        "home.html",
    "album.html",
    "booth.html",
    "arcade.html",
    "wall.html"
    ];

    let loading = false;

function getFilename(url) {
    const parsed = new URL(
        url,
        window.location.href
    );

    return (
        parsed.pathname.split("/").pop() ||
        "home.html"
    );
}
    function updateNavigation(filename) {
        document.querySelectorAll(
            ".topnav .navlink, .mobile-nav .navlink"
        ).forEach((link) => {
            const active =
                getFilename(link.href) === filename;

            link.classList.toggle(
                "active",
                active
            );

            if (active) {
                link.setAttribute(
                    "aria-current",
                    "page"
                );
            } else {
                link.removeAttribute(
                    "aria-current"
                );
            }
        });
    }

    async function navigate(url, push = true) {
        if (loading) return;

        const target = new URL(
            url,
            window.location.href
        );

        const filename = getFilename(
            target.href
        );

        if (
            target.origin !== window.location.origin ||
            !PAGES.includes(filename)
        ) {
            window.location.href = target.href;
            return;
        }

        loading = true;

        try {
            const response = await fetch(
                target.href
            );

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const html = await response.text();

            const parser = new DOMParser();

            const nextDocument =
                parser.parseFromString(
                    html,
                    "text/html"
                );

            const newMain =
                nextDocument.querySelector("main");

            const currentMain =
                document.querySelector("main");

            if (!newMain || !currentMain) {
                throw new Error(
                    "Konten halaman tidak ditemukan"
                );
            }

            if (
                typeof window.BisingBeforeNavigate ===
                "function"
            ) {
                window.BisingBeforeNavigate();
            }

            currentMain.replaceWith(
                document.importNode(
                    newMain,
                    true
                )
            );

            document.body.dataset.page =
                nextDocument.body.dataset.page;

            document.title =
                nextDocument.title;

            updateNavigation(filename);

            if (push) {
                history.pushState(
                    { spa: true },
                    "",
                    target.href
                );
            }

            if (
                typeof window.BisingAfterNavigate ===
                "function"
            ) {
                window.BisingAfterNavigate();
            }

            window.scrollTo(0, 0);

        } catch (error) {
            console.error(
                "Navigasi SPA gagal:",
                error
            );

            window.location.href =
                target.href;

        } finally {
            loading = false;
        }
    }

    document.addEventListener(
        "click",
        (event) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            const link =
                event.target.closest("a[href]");

            if (!link) return;

            if (
                link.hasAttribute("download") ||
                (link.target && link.target !== "_self")
            ) {
                return;
            }

            const url = new URL(
                link.href,
                window.location.href
            );

            const filename = getFilename(
                url.href
            );

            if (
                url.origin !== window.location.origin ||
                !PAGES.includes(filename)
            ) {
                return;
            }

            event.preventDefault();

            if (
                url.href === window.location.href
            ) {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                return;
            }

            navigate(url.href);
        }
    );

    window.addEventListener(
        "popstate",
        () => {
            navigate(
                window.location.href,
                false
            );
        }
    );

})();
