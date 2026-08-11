/* ===========================================================
   THEME ENGINE
   Loaded SYNCHRONOUSLY in <head> (no defer / async) so the right
   theme is on <html> before the first paint — no white flash on
   a dark-mode load.

   Three explicit choices in a menu (no cycling):
     light  = forced day
     dark   = forced night
     system = follows the OS setting  (the default)
   =========================================================== */
(function () {
    var MODES  = ['light', 'dark', 'system'];
    var LABELS = { light: 'Light', dark: 'Dark', system: 'System' };
    var STORE_KEY = 'sk-theme-mode';

    var mode = 'system';
    try {
        var saved = localStorage.getItem(STORE_KEY);
        if (saved && MODES.indexOf(saved) !== -1) mode = saved;
    } catch (e) { /* private mode / storage blocked — stay on system */ }

    function prefersDark() {
        return !!(window.matchMedia &&
                  window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    function resolve(m) {
        if (m === 'light') return 'light';
        if (m === 'dark')  return 'dark';
        return prefersDark() ? 'dark' : 'light';
    }

    function apply() {
        var theme = resolve(mode);
        document.documentElement.setAttribute('data-theme', theme);

        var meta = document.getElementById('themeColorMeta');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#181818' : '#FCFCFB');

        var btn = document.getElementById('themeBtn');
        if (btn) {
            btn.setAttribute('data-mode', mode);
            btn.setAttribute('title', 'Theme: ' + LABELS[mode]);
            btn.setAttribute('aria-label', 'Theme: ' + LABELS[mode] + '. Change theme.');
        }

        var items = document.querySelectorAll('.theme-item');
        for (var i = 0; i < items.length; i++) {
            items[i].setAttribute('aria-checked',
                items[i].getAttribute('data-set') === mode ? 'true' : 'false');
        }
    }

    apply();   /* before first paint */

    /* System mode flips live when the OS switches. */
    if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var onOS = function () { if (mode === 'system') apply(); };
        if (mq.addEventListener) mq.addEventListener('change', onOS);
        else if (mq.addListener) mq.addListener(onOS);
    }

    document.addEventListener('DOMContentLoaded', function () {
        var btn  = document.getElementById('themeBtn');
        var menu = document.getElementById('themeMenu');
        if (!btn || !menu) return;

        var items = menu.querySelectorAll('.theme-item');

        function open() {
            menu.hidden = false;
            btn.setAttribute('aria-expanded', 'true');
            var checked = menu.querySelector('.theme-item[aria-checked="true"]');
            (checked || items[0]).focus();
        }
        function close(returnFocus) {
            menu.hidden = true;
            btn.setAttribute('aria-expanded', 'false');
            if (returnFocus) btn.focus();
        }
        function isOpen() { return !menu.hidden; }

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (isOpen()) { close(false); } else { open(); }
        });

        for (var i = 0; i < items.length; i++) {
            (function (item, idx) {
                item.addEventListener('click', function () {
                    mode = item.getAttribute('data-set');
                    try { localStorage.setItem(STORE_KEY, mode); } catch (e) {}
                    apply();
                    close(true);
                });
                item.addEventListener('keydown', function (e) {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        var n = (e.key === 'ArrowDown') ? idx + 1 : idx - 1;
                        items[(n + items.length) % items.length].focus();
                    }
                });
            })(items[i], i);
        }

        /* clicks inside the panel must not bubble to the document
           handler that closes it */
        menu.addEventListener('click', function (e) { e.stopPropagation(); });

        document.addEventListener('click', function () { if (isOpen()) close(false); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen()) close(true);
        });

        apply();
    });
})();
