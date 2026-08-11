/* ===========================================================
   SHARED BEHAVIOR — loaded at the end of <body> on every page.
   Every block below checks for its own elements first, so the
   same file works on the home page (hero + cards) and on the
   subpages (sections only) with nothing to configure.
   =========================================================== */
(function () {
    'use strict';

    /* -------------------------------------------------------
       EMAIL — assembled at runtime so there's no harvestable
       address in the source. The data- attributes are removed
       afterwards, so the pattern isn't left behind either.
       ------------------------------------------------------- */
    (function () {
        var a = document.getElementById('emailLink');
        if (!a) return;
        var addr = a.getAttribute('data-u')
                 + String.fromCharCode(64)
                 + a.getAttribute('data-d') + '.' + a.getAttribute('data-t');
        a.href = 'mailto:' + addr;
        a.setAttribute('aria-label', 'Email ' + addr);
        a.removeAttribute('data-u');
        a.removeAttribute('data-d');
        a.removeAttribute('data-t');
    })();

    /* -------------------------------------------------------
       NAV — hairline on scroll, collapse under 860px
       ------------------------------------------------------- */
    (function () {
        var nav = document.getElementById('nav');
        if (!nav) return;

        function onScroll() {
            if (window.scrollY > 8) nav.classList.add('is-stuck');
            else nav.classList.remove('is-stuck');
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        var burger = document.getElementById('navBurger');
        var links  = document.getElementById('navLinks');
        if (!burger || !links) return;

        function isMobileNav() { return window.innerWidth <= 860; }
        function sync() {
            if (isMobileNav()) {
                links.hidden = burger.getAttribute('aria-expanded') !== 'true';
            } else {
                links.hidden = false;
                burger.setAttribute('aria-expanded', 'false');
            }
        }

        burger.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = burger.getAttribute('aria-expanded') === 'true';
            burger.setAttribute('aria-expanded', open ? 'false' : 'true');
            sync();
        });
        links.addEventListener('click', function (e) { e.stopPropagation(); });
        document.addEventListener('click', function () {
            if (isMobileNav() && burger.getAttribute('aria-expanded') === 'true') {
                burger.setAttribute('aria-expanded', 'false');
                sync();
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
                burger.setAttribute('aria-expanded', 'false');
                sync();
                burger.focus();
            }
        });
        window.addEventListener('resize', sync);
        sync();
    })();

    /* -------------------------------------------------------
       HOME LAYOUT
       Everything below is the home page's hero fitting, unchanged.
       Each function bails out if its elements aren't present, so
       the subpages run none of it.
       ------------------------------------------------------- */
    var MIN_PAGE_SCALE = 0.72;   // readability floor — never shrink past this

    /* Scale the ASCII name down if it's wider than its column. */
    function fitName() {
        var box = document.getElementById('artFit');
        var block = document.getElementById('nameBlock');
        if (!box || !block) return;

        block.style.transform = 'none';
        box.style.height = 'auto';

        var available = box.clientWidth;
        var natural = block.scrollWidth;
        if (!available || !natural) return;

        var scale = Math.min(1, available / natural);
        block.style.transform = 'scale(' + scale + ')';
        box.style.height = Math.ceil(block.offsetHeight * scale) + 'px';
    }

    /* Size the photo to the EXACT height of the name block, so the
       circle's top edge meets the top of the ASCII art and its
       bottom edge meets the bottom of the icon row. */
    function fitPhoto() {
        var nameWrap = document.getElementById('nameWrap');
        var photo = document.querySelector('.photo-frame');
        if (!nameWrap || !photo) return;

        if (window.innerWidth <= 640) {   // stacked layout: keep the clamp
            photo.style.width = '';
            photo.style.height = '';
            return;
        }

        var h = nameWrap.getBoundingClientRect().height;
        if (!h) return;

        var size = Math.round(Math.max(150, Math.min(320, h)));
        photo.style.width = size + 'px';
        photo.style.height = size + 'px';
    }

    /* Match the terminal width to the hero: LEFT edge of the name
       through RIGHT edge of the photo. Handles the mobile column
       layout too, since it takes the outer bounds of both. */
    function fitBio() {
        var nameWrap = document.getElementById('nameWrap');
        var photo = document.querySelector('.photo-frame');
        var bio = document.getElementById('bio');
        var page = document.getElementById('page');
        if (!nameWrap || !photo || !bio || !page) return;

        bio.style.width = 'auto';

        var a = nameWrap.getBoundingClientRect();
        var b = photo.getBoundingClientRect();
        var p = page.getBoundingClientRect();

        var left = Math.min(a.left, b.left);
        var width = Math.max(a.right, b.right) - left;
        if (width <= 0) return;

        /* Pin to the measured left edge rather than centering with
           `margin: auto`, so the terminal tracks the name even when
           the hero isn't perfectly centered in the page. */
        bio.style.marginLeft = Math.round(left - p.left) + 'px';
        bio.style.marginRight = '0';
        bio.style.width = Math.round(width) + 'px';
    }

    /* Pin the card grid to the terminal's RENDERED bounds.

       #page is scaled with transform: scale() + transform-origin:
       top center, so its on-screen left edge sits inboard of its
       layout position. .hub is never scaled, so matching CSS widths
       does NOT align them. Measure the terminal's real rect instead
       (it already spans name-left -> photo-right) and copy it.
       Must run AFTER fitBio() and fitViewport(). */
    function fitHub() {
        var hub = document.getElementById('hub');
        var bio = document.getElementById('bio');
        if (!hub || !bio) return;

        hub.style.alignSelf = '';
        hub.style.marginLeft = '';
        hub.style.width = '';

        var b = bio.getBoundingClientRect();
        if (!b.width) return;

        var body = document.body;
        var padLeft = parseFloat(getComputedStyle(body).paddingLeft) || 0;
        var bodyLeft = body.getBoundingClientRect().left + padLeft;

        hub.style.alignSelf = 'flex-start';
        hub.style.marginLeft = Math.round(b.left - bodyLeft) + 'px';
        hub.style.width = Math.round(b.width) + 'px';
    }

    /* Shrink the hero column just enough to clear the fold. */
    function fitViewport() {
        var page = document.getElementById('page');
        if (!page) return;

        if (window.innerWidth <= 640) {   // mobile scrolls, by design
            page.style.transform = '';
            page.style.height = '';
            return;
        }

        var cs = getComputedStyle(document.body);
        var chrome = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        var natural = page.scrollHeight;
        var available = window.innerHeight - chrome;
        if (!natural || available <= 0) return;

        var scale = Math.max(MIN_PAGE_SCALE, Math.min(1, available / natural));
        page.style.transform = 'scale(' + scale + ')';
        page.style.height = Math.ceil(natural * scale) + 'px';
    }

    function relayout() {
        var page = document.getElementById('page');
        if (!page) return;              // subpage — nothing to fit

        page.style.transform = 'none';  // measure unscaled
        page.style.height = 'auto';

        /* Two passes: the photo's width changes how much room the
           name has, which changes the name's height, which changes
           the photo. Two rounds is plenty for it to settle. */
        fitName();
        fitPhoto();
        fitName();
        fitPhoto();

        fitBio();
        fitViewport();
        fitHub();      /* last: needs the post-scale rendered rect */
    }

    document.addEventListener('DOMContentLoaded', relayout);
    window.addEventListener('load', relayout);
    window.addEventListener('resize', relayout);

    /* -------------------------------------------------------
       BINARY BACKGROUND
       ------------------------------------------------------- */
    function measureSlot(container) {
        var probe = document.createElement('div');
        probe.className = 'bin-row';
        probe.style.animation = 'none';
        probe.style.visibility = 'hidden';
        probe.style.top = '0';

        var probeHalf = document.createElement('span');
        probeHalf.className = 'half';
        probeHalf.textContent = '0101010101';
        probe.appendChild(probeHalf);
        container.appendChild(probe);

        var slot = probeHalf.getBoundingClientRect().width / 10;
        container.removeChild(probe);

        return (slot && slot > 1) ? slot : 71;
    }

    function buildBinaryRows() {
        var container = document.getElementById('binRows');
        if (!container) return;
        container.innerHTML = '';

        var speeds = [28, 18, 38, 22, 32, 16];
        var tops = [6, 20, 38, 55, 72, 88];
        var slot = measureSlot(container);
        var digitsPerHalf = Math.ceil(window.innerWidth / slot) + 2;

        for (var i = 0; i < speeds.length; i++) {
            var row = document.createElement('div');
            row.className = 'bin-row';
            row.style.top = tops[i] + '%';
            row.style.animationDuration = speeds[i] + 's';
            row.style.transform = 'translateX(-50%)';

            var str = '';
            for (var j = 0; j < digitsPerHalf; j++) str += Math.round(Math.random());

            var half1 = document.createElement('span');
            half1.className = 'half';
            half1.textContent = str;

            row.appendChild(half1);
            row.appendChild(half1.cloneNode(true));
            container.appendChild(row);
        }
    }

    buildBinaryRows();

    var binResizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(binResizeTimer);
        binResizeTimer = setTimeout(buildBinaryRows, 200);
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            buildBinaryRows();
            relayout();
        });
    }
})();
