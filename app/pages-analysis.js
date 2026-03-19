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

        function initJDAnalyzerPage() {
            Store.ensureActiveResume({ createIfMissing: true });
            updateActiveResumeLabels();
            const draft = Store.getDraft(Store.ensureActiveResume({ createIfMissing: true }));
            const input = document.querySelector('[name="jdText"]');
            if (input && !input.value && draft.lastJobDescription) input.value = draft.lastJobDescription;
        }

        function renderJDResultsPage() {
            const resumeId = Store.ensureActiveResume({ createIfMissing: true });
            const analysis = Store.getAnalysis(resumeId, 'jd');
            if (!analysis) {
                UI.navigate('jd-analyzer.html');
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
        }

        function initAtsScorerPage() {
            Store.ensureActiveResume({ createIfMissing: true });
            updateActiveResumeLabels();
        }

        function renderATSReportPage() {
            const resumeId = Store.ensureActiveResume({ createIfMissing: true });
            const analysis = Store.getAnalysis(resumeId, 'ats');
            if (!analysis) {
                UI.navigate('ats-scorer.html');
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
            UI.navigate('jd-results.html');
        }

        function runATSAnalysis() {
            const resumeId = Store.ensureActiveResume({ createIfMissing: true });
            Store.saveAnalysis(resumeId, 'ats', computeATSAnalysis(Store.getDraft(resumeId)));
            UI.showToast('ATS scan finished.', 'success');
            UI.navigate('ats-report.html');
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
