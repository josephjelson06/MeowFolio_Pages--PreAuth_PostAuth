(function () {
    function createMeowFolioPublicContentModule(runtime) {
        const {
            Store,
            UI,
            CHAPTER_METADATA,
            getCurrentPage
        } = runtime;

        function replaceTextNodes(matcher, replacer) {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const nodes = [];
            while (walker.nextNode()) nodes.push(walker.currentNode);
            nodes.forEach((node) => {
                const value = node.nodeValue || '';
                if (matcher(value)) node.nodeValue = replacer(value);
            });
        }

        function replaceTextContent(selector, matcher, replacement) {
            document.querySelectorAll(selector).forEach((node) => {
                const text = node.textContent?.trim();
                if (text && matcher(text)) node.textContent = replacement(text);
            });
        }

        function injectLearningNav(meta) {
            const main = document.querySelector('main');
            if (!main || document.getElementById('meowfolio-learning-nav')) return;
            const wrapper = document.createElement('section');
            wrapper.id = 'meowfolio-learning-nav';
            wrapper.className = 'mt-16 pt-10 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-4';
            wrapper.innerHTML = `
                <a class="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-surface-container-low text-on-surface font-headline font-bold no-underline" href="${meta.previous}">
                    <span class="material-symbols-outlined">arrow_back</span>
                    ${meta.previous === 'learn.html' ? 'Back to Curriculum' : 'Previous Chapter'}
                </a>
                <a class="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-on-primary font-headline font-bold no-underline" href="${meta.next}">
                    ${meta.next === 'editor-content.html' ? 'Start Building' : 'Next Chapter'}
                    <span class="material-symbols-outlined">arrow_forward</span>
                </a>
            `;
            main.appendChild(wrapper);
        }

        function updateLegalBranding() {
            const page = getCurrentPage();
            if (page === 'privacy') document.title = 'Privacy Policy | MeowFolio';
            if (page === 'terms') document.title = 'Terms of Service | MeowFolio';
            if (page === 'about' && !document.title) document.title = 'MeowFolio | About';

            if (page === 'privacy' || page === 'terms') {
                replaceTextNodes((value) => value.includes('DreamResume'), (value) => value.replace(/DreamResume/g, 'MeowFolio'));
            }
        }

        function initLandingLikePages() {
            const page = getCurrentPage();
            if (page === 'landing') {
                document.querySelectorAll('a[href="choose-path.html"], button[onclick*="choose-path.html"]').forEach((node) => {
                    node.removeAttribute('onclick');
                    node.setAttribute('data-action', 'start-building');
                    if (node.tagName === 'A') node.setAttribute('href', Store.isAuthenticated() ? 'editor-content.html' : 'signup.html');
                });
                Array.from(document.querySelectorAll('button')).slice(0, 2).forEach((button) => button.setAttribute('data-action', 'start-building'));
            }

            if (['about', 'privacy', 'terms', 'learn'].includes(page)) {
                document.querySelectorAll('button').forEach((button) => {
                    const label = button.textContent.trim().toLowerCase();
                    if (label.includes('get started') || label.includes('build my resume') || label.includes('create resume') || label.includes("let's build") || label.includes('contact me') || label.includes('contact mochii support') || label.includes('try the editor') || label.includes('download guide') || label.includes("i've completed")) {
                        button.setAttribute('data-action', 'start-building');
                    }
                    if (label === 'login') button.setAttribute('data-action', 'go-login');
                });
            }
        }

        function initLearnPage() {
            if (getCurrentPage() !== 'learn') return;
            let chapterNumber = 1;
            document.querySelectorAll('a[href="landing.html"]').forEach((link) => {
                if (chapterNumber <= 7 && link.textContent.toLowerCase().includes('read chapter')) {
                    link.href = `chapter-${chapterNumber}.html`;
                    chapterNumber += 1;
                }
            });
        }

        function initChapterPage() {
            const meta = CHAPTER_METADATA[getCurrentPage()];
            if (!meta) return;

            document.title = `Learn with Mochii | ${meta.title}`;
            replaceTextContent('span, p, h1, h2, h3, h4, a', (text) => text === 'The Impact Formula', () => meta.title);
            replaceTextContent('span, p, h1, h2, h3, h4', (text) => text === 'Chapter 5 of 7', () => meta.progressLabel);
            replaceTextContent('span, p, h1, h2, h3, h4', (text) => text === '75%', () => `${meta.percent}%`);

            document.querySelectorAll('[style*="width: 75%"], [class*="w-[75%]"]').forEach((node) => {
                if (node instanceof HTMLElement) node.style.width = `${meta.percent}%`;
            });

            document.querySelectorAll('a[href="landing.html"]').forEach((link) => {
                const label = link.textContent.trim().toLowerCase();
                if (label.includes('continue to chapter')) link.href = meta.next;
                if (label === 'the resume mythos' || label === 'previous') link.href = meta.previous;
                if (label.includes('sectioning for impact')) link.href = meta.next;
            });

            injectLearningNav(meta);
        }

        function initErrorPages() {
            const page = getCurrentPage();
            if (page === '404') {
                document.querySelectorAll('a[href="choose-path.html"]').forEach((link) => {
                    link.href = Store.isAuthenticated() ? 'editor-content.html' : 'signup.html';
                });
            }

            if (page === '500') {
                const retry = document.getElementById('btn-try-again');
                const back = document.getElementById('btn-back-editor');
                retry?.addEventListener('click', () => window.location.reload());
                back?.addEventListener('click', () => UI.navigate(Store.isAuthenticated() ? 'editor-content.html' : 'login.html'));
            }
        }

        return {
            updateLegalBranding,
            initLandingLikePages,
            initLearnPage,
            initChapterPage,
            initErrorPages
        };
    }

    window.createMeowFolioPublicContentModule = createMeowFolioPublicContentModule;
})();
