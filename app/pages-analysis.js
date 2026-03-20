(function () {
    function createMeowFolioAnalysisModule(runtime) {
        const {
            Store,
            UI,
            titleCase,
            escapeHtml,
            updateActiveResumeLabels,
            computeJDAnalysis,
            computeATSAnalysis
        } = runtime;

        function updateQueryParam(key, value) {
            try {
                const url = new URL(window.location.href);
                if (value == null || value === '') {
                    url.searchParams.delete(key);
                } else {
                    url.searchParams.set(key, value);
                }
                window.history.replaceState({}, '', url.toString());
            } catch (_) {
                // Ignore URL update errors in constrained environments.
            }
        }

        function toggleView(inputSelector, reportSelector, showReport) {
            const inputView = document.querySelector(inputSelector);
            const reportView = document.querySelector(reportSelector);
            if (!inputView || !reportView) return;
            inputView.classList.toggle('hidden', showReport);
            reportView.classList.toggle('hidden', !showReport);
        }

        function setJdView(showReport) {
            toggleView('[data-jd-input-view]', '[data-jd-results-view]', showReport);
            document.querySelectorAll('[data-jd-view-toggle]').forEach((button) => {
                const active = button.dataset.jdViewToggle === (showReport ? 'report' : 'input');
                button.classList.toggle('bg-primary', active);
                button.classList.toggle('text-on-primary', active);
                button.classList.toggle('bg-surface-container-lowest', !active);
                button.classList.toggle('text-on-surface-variant', !active);
            });
        }

        function setAtsView(showReport) {
            toggleView('[data-ats-input-view]', '[data-ats-results-view]', showReport);
            document.querySelectorAll('[data-ats-view-toggle]').forEach((button) => {
                const active = button.dataset.atsViewToggle === (showReport ? 'report' : 'input');
                button.classList.toggle('bg-primary', active);
                button.classList.toggle('text-on-primary', active);
                button.classList.toggle('bg-surface-container-lowest', !active);
                button.classList.toggle('text-on-surface-variant', !active);
            });
        }

        function wireJdViewToggles() {
            document.querySelectorAll('[data-jd-view-toggle]').forEach((button) => {
                button.addEventListener('click', () => {
                    const showReport = button.dataset.jdViewToggle === 'report';
                    setJdView(showReport);
                    updateQueryParam('view', showReport ? 'results' : 'input');
                    if (showReport) renderJDResultsPage();
                });
            });
        }

        function wireAtsViewToggles() {
            document.querySelectorAll('[data-ats-view-toggle]').forEach((button) => {
                button.addEventListener('click', () => {
                    const showReport = button.dataset.atsViewToggle === 'report';
                    setAtsView(showReport);
                    updateQueryParam('view', showReport ? 'report' : 'input');
                    if (showReport) renderATSReportPage();
                });
            });
        }

        async function extractTextFromPdf(file) {
            if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument !== 'function') {
                throw new Error('PDF parser unavailable');
            }

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            const pages = [];

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
                const page = await pdf.getPage(pageNumber);
                const content = await page.getTextContent();
                const text = content.items.map((item) => item.str || '').join(' ').trim();
                if (text) pages.push(text);
            }

            return pages.join('\n\n').trim();
        }

        async function extractTextFromDocx(file) {
            if (!window.mammoth || typeof window.mammoth.extractRawText !== 'function') {
                throw new Error('DOCX parser unavailable');
            }

            const arrayBuffer = await file.arrayBuffer();
            const result = await window.mammoth.extractRawText({ arrayBuffer });
            return String(result?.value || '').trim();
        }

        async function extractJDTextFromFile(file) {
            const name = String(file.name || '').toLowerCase();
            if (name.endsWith('.txt')) return (await file.text()).trim();
            if (name.endsWith('.pdf')) return extractTextFromPdf(file);
            if (name.endsWith('.docx')) return extractTextFromDocx(file);
            throw new Error('Unsupported JD format');
        }

        function wireJDUpload() {
            const trigger = document.querySelector('[data-jd-upload-trigger]');
            const input = document.querySelector('[data-jd-upload-input]');
            const textInput = document.querySelector('[name="jdText"]');
            if (!trigger || !input || !textInput) return;

            trigger.addEventListener('click', () => input.click());
            input.addEventListener('change', async () => {
                const file = input.files && input.files[0];
                if (!file) return;

                try {
                    const content = await extractJDTextFromFile(file);
                    if (!content) {
                        UI.showToast('No readable text found in that file.', 'error');
                        return;
                    }
                    textInput.value = content;
                    UI.showToast('Job description loaded from file.', 'success');
                } catch (error) {
                    const message = String(error?.message || '');
                    if (message.includes('Unsupported JD format')) {
                        UI.showToast('Upload a .txt, .pdf, or .docx file.', 'info');
                    } else if (message.includes('PDF parser unavailable')) {
                        UI.showToast('PDF support is not available right now. Refresh and try again.', 'error');
                    } else if (message.includes('DOCX parser unavailable')) {
                        UI.showToast('DOCX support is not available right now. Refresh and try again.', 'error');
                    } else {
                        UI.showToast('Could not read the selected file.', 'error');
                    }
                } finally {
                    input.value = '';
                }
            });
        }

        function initJDAnalyzerPage() {
            Store.ensureActiveResume({ createIfMissing: true });
            updateActiveResumeLabels();
            const draft = Store.getDraft(Store.ensureActiveResume({ createIfMissing: true }));
            const input = document.querySelector('[name="jdText"]');
            if (input && !input.value && draft.lastJobDescription) input.value = draft.lastJobDescription;

            wireJdViewToggles();
            wireJDUpload();

            const view = new URLSearchParams(window.location.search).get('view');
            if (view === 'results' && Store.getAnalysis(Store.ensureActiveResume({ createIfMissing: true }), 'jd')) {
                renderJDResultsPage();
            } else {
                setJdView(false);
            }
        }

        function renderJDResultsPage() {
            const resumeId = Store.ensureActiveResume({ createIfMissing: true });
            const analysis = Store.getAnalysis(resumeId, 'jd');
            if (!analysis) {
                setJdView(false);
                return;
            }

            updateActiveResumeLabels();
            const input = document.querySelector('[name="jdText"]');
            if (input) input.value = analysis.jdText || '';
            const scoreNode = document.querySelector('[data-jd-score]');
            if (scoreNode) scoreNode.textContent = `${analysis.score}%`;
            const summaryTitle = document.querySelector('[data-jd-summary-title]');
            if (summaryTitle) summaryTitle.textContent = analysis.summaryTitle;
            const summaryCopy = document.querySelector('[data-jd-summary-copy]');
            if (summaryCopy) summaryCopy.textContent = analysis.summaryCopy;
            const matchedCount = document.querySelector('[data-jd-matched-count]');
            if (matchedCount) matchedCount.textContent = String(analysis.matchedKeywords.length).padStart(2, '0');
            const missingCount = document.querySelector('[data-jd-missing-count]');
            if (missingCount) missingCount.textContent = String(analysis.missingKeywords.length).padStart(2, '0');
            const partialCount = document.querySelector('[data-jd-partial-count]');
            if (partialCount) partialCount.textContent = String(analysis.partialKeywords.length).padStart(2, '0');

            const missingList = document.querySelector('[data-jd-missing-list]');
            if (missingList) {
                missingList.innerHTML = analysis.suggestions.map((suggestion, index) => `
                    <div class="bg-surface-container-lowest p-5 rounded-xl border-l-8 ${index % 2 === 0 ? 'border-error' : 'border-primary'} flex items-start gap-4 custom-shadow">
                        <div class="w-12 h-12 rounded-full ${index % 2 === 0 ? 'bg-error-container' : 'bg-primary-fixed'} flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined ${index % 2 === 0 ? 'text-on-error-container' : 'text-on-primary-fixed-variant'}">${index % 2 === 0 ? 'leaderboard' : 'brush'}</span>
                        </div>
                        <div>
                            <h4 class="font-headline font-bold text-on-surface">${escapeHtml(titleCase(suggestion.keyword))}</h4>
                            <p class="text-sm text-on-surface-variant leading-relaxed mt-1">${escapeHtml(suggestion.detail)}</p>
                        </div>
                    </div>
                `).join('');
            }

            const tags = document.querySelector('[data-jd-tags]');
            if (tags) {
                tags.innerHTML = analysis.tags.map((tag, index) => `
                    <span class="px-4 py-2 ${index === 0 ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' : index === 1 ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-primary-fixed text-on-primary-fixed-variant'} text-sm font-bold rounded-full shadow-sm">${escapeHtml(tag)}</span>
                `).join('');
            }

            setJdView(true);
            updateQueryParam('view', 'results');
        }

        function initAtsScorerPage() {
            Store.ensureActiveResume({ createIfMissing: true });
            updateActiveResumeLabels();

            wireAtsViewToggles();

            const view = new URLSearchParams(window.location.search).get('view');
            if (view === 'report' && Store.getAnalysis(Store.ensureActiveResume({ createIfMissing: true }), 'ats')) {
                renderATSReportPage();
            } else {
                setAtsView(false);
            }
        }

        function renderATSReportPage() {
            const resumeId = Store.ensureActiveResume({ createIfMissing: true });
            const analysis = Store.getAnalysis(resumeId, 'ats');
            if (!analysis) {
                setAtsView(false);
                return;
            }

            updateActiveResumeLabels();
            const scoreNode = document.querySelector('[data-ats-score]');
            if (scoreNode) scoreNode.textContent = `${analysis.score}%`;
            const ratingNode = document.querySelector('[data-ats-rating]');
            if (ratingNode) ratingNode.textContent = analysis.rating;
            ['formatting', 'keywords', 'structure', 'readability'].forEach((key) => {
                const node = document.querySelector(`[data-ats-category="${key}"]`);
                if (node) node.textContent = `${analysis.categories[key]}/100`;
            });

            const issuesRoot = document.querySelector('[data-ats-issues]');
            if (issuesRoot) {
                issuesRoot.innerHTML = analysis.issues.map((issue) => {
                    const severity = issue.severity.toLowerCase();
                    const palette = severity === 'critical'
                        ? { border: 'border-error', badge: 'bg-error-container text-on-error-container', icon: 'warning', fill: 'bg-error-container text-error' }
                        : severity === 'moderate'
                            ? { border: 'border-primary-container', badge: 'bg-primary-fixed text-on-primary-fixed-variant', icon: 'error', fill: 'bg-primary-fixed text-primary' }
                            : { border: 'border-secondary-fixed', badge: 'bg-secondary-fixed text-on-secondary-fixed-variant', icon: 'info', fill: 'bg-secondary-fixed text-secondary' };

                    return `
                        <div class="flex items-center gap-4 p-5 rounded-2xl bg-surface-container-lowest border-l-8 ${palette.border}">
                            <div class="w-10 h-10 rounded-full ${palette.fill} flex items-center justify-center">
                                <span class="material-symbols-outlined">${palette.icon}</span>
                            </div>
                            <div class="flex-1">
                                <p class="font-bold text-on-surface">${escapeHtml(issue.title)}</p>
                                <p class="text-xs text-on-surface-variant">${escapeHtml(issue.detail)}</p>
                            </div>
                            <span class="px-3 py-1 rounded-full ${palette.badge} text-[10px] font-bold uppercase">${escapeHtml(issue.severity)}</span>
                        </div>
                    `;
                }).join('');
            }

            setAtsView(true);
            updateQueryParam('view', 'report');
        }

        function runJDAnalysis() {
            const resumeId = Store.ensureActiveResume({ createIfMissing: true });
            const input = document.querySelector('[name="jdText"]');
            const jdText = input?.value?.trim() || '';
            if (!jdText) {
                UI.showToast('Paste a job description first.', 'error');
                return;
            }

            Store.updateDraft(resumeId, (draft) => {
                draft.lastJobDescription = jdText;
                return draft;
            });
            Store.saveAnalysis(resumeId, 'jd', computeJDAnalysis(Store.getDraft(resumeId), jdText));
            UI.showToast('JD analysis complete.', 'success');
            renderJDResultsPage();
        }

        function runATSAnalysis() {
            const resumeId = Store.ensureActiveResume({ createIfMissing: true });
            Store.saveAnalysis(resumeId, 'ats', computeATSAnalysis(Store.getDraft(resumeId)));
            UI.showToast('ATS scan finished.', 'success');
            renderATSReportPage();
        }

        return {
            initJDAnalyzerPage,
            renderJDResultsPage,
            initAtsScorerPage,
            renderATSReportPage,
            runJDAnalysis,
            runATSAnalysis
        };
    }

    window.createMeowFolioAnalysisModule = createMeowFolioAnalysisModule;
})();
