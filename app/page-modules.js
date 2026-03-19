(function () {
    function createMeowFolioPageModules(runtime) {
        const {
            Store,
            escapeHtml,
            relativeTime,
            getResumesView,
            setResumesView
        } = runtime;

        function initDashboardPage() {
            const profile = Store.ensureProfile();
            const resumes = Store.listResumes();
            const greeting = document.querySelector('[data-dashboard-greeting]');
            const cardsRoot = document.querySelector('[data-dashboard-resumes]');
            const atsMetric = document.querySelector('[data-metric="ats"]');
            const strengthMetric = document.querySelector('[data-metric="strength"]');
            const jdMetric = document.querySelector('[data-metric="jd"]');

            if (greeting) {
                const hour = new Date().getHours();
                const greetingText = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                greeting.innerHTML = `${greetingText}, <br class="md:hidden"/> ${escapeHtml(profile.name)}!`;
            }
            if (atsMetric) {
                const values = resumes.map((resume) => resume.atsScore || 0).filter(Boolean);
                atsMetric.textContent = `${values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0}%`;
            }
            if (strengthMetric) {
                const values = resumes.map((resume) => resume.strengthScore || 0);
                strengthMetric.textContent = `${values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0}%`;
            }
            if (jdMetric) {
                const values = resumes.map((resume) => resume.jdScore || 0).filter(Boolean);
                jdMetric.textContent = `${values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0}%`;
            }

            if (!cardsRoot) return;
            if (!resumes.length) {
                cardsRoot.innerHTML = `
                    <div class="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-16 bg-surface-container-lowest border border-dashed border-outline-variant/30 rounded-2xl text-center">
                        <div class="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-4">
                            <span class="material-symbols-outlined text-on-primary-container text-4xl" style="font-variation-settings: 'FILL' 1;">pets</span>
                        </div>
                        <h3 class="font-headline font-extrabold text-2xl mb-2">No resumes yet</h3>
                        <p class="text-on-surface-variant font-medium mb-8 max-w-md mx-auto leading-relaxed">Start your first draft and MeowFolio will keep the editor, templates, customization, and analysis tools in sync.</p>
                        <button type="button" class="bg-primary text-on-primary px-8 py-4 rounded-full font-label font-bold text-lg flex items-center gap-3 hover:shadow-lg hover:scale-105 transition-all" data-action="create-resume">
                            <span class="material-symbols-outlined">add_circle</span> Start Fresh Resume
                        </button>
                    </div>
                `;
                return;
            }

            cardsRoot.innerHTML = resumes.slice(0, 2).map((resume) => `
                <div class="tactile-card overflow-hidden group">
                    <div class="h-48 bg-surface-container-highest relative overflow-hidden flex items-center justify-center">
                        <span class="material-symbols-outlined text-outline text-8xl opacity-20">contract</span>
                        <div class="absolute top-4 right-4 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold px-2 py-1 rounded-full border border-on-surface shadow-sm">
                            ATS ${resume.atsScore || '--'}%
                        </div>
                    </div>
                    <div class="p-5 flex flex-col gap-4">
                        <div>
                            <h4 class="font-headline font-bold text-lg">${escapeHtml(resume.role)}</h4>
                            <p class="font-body text-xs text-on-surface-variant flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">schedule</span>
                                Last edited ${relativeTime(resume.updatedAt)}
                            </p>
                        </div>
                        <div class="flex gap-3">
                            <button type="button" class="chunky-button bg-primary text-on-primary flex-1 py-3 rounded-xl font-label font-bold text-sm" data-action="edit-resume" data-resume-id="${resume.id}">
                                Continue Editing
                            </button>
                            <button type="button" class="px-4 py-3 rounded-xl bg-surface-container-highest font-label font-bold text-sm" data-action="export-resume" data-resume-id="${resume.id}">
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            `).join('') + `
                <button type="button" class="border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-surface-container-low transition-colors group p-8" data-action="create-resume">
                    <div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center border-2 border-outline-variant group-hover:border-primary group-hover:bg-primary-fixed transition-all">
                        <span class="material-symbols-outlined text-3xl text-outline group-hover:text-primary">add</span>
                    </div>
                    <p class="font-label font-bold text-on-surface-variant group-hover:text-primary">Create New Resume</p>
                </button>
            `;
        }

        function renderResumesPage() {
            const container = document.getElementById('resume-container');
            const counter = document.querySelector('[data-resume-counter]');
            const resumes = Store.listResumes();
            const activeResumeId = Store.ensureActiveResume();
            if (!container) return;

            if (counter) {
                counter.textContent = resumes.length ? `Showing ${resumes.length} resume${resumes.length === 1 ? '' : 's'}` : 'No resumes yet';
            }

            if (!resumes.length) {
                container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8';
                container.innerHTML = `
                    <button type="button" class="tactile-card group relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-outline-variant rounded-2xl hover:bg-surface-container-low transition-colors gap-4 bg-transparent min-h-[300px]" data-action="create-resume">
                        <div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center border-2 border-outline-variant group-hover:border-primary group-hover:bg-primary-fixed transition-all">
                            <span class="material-symbols-outlined text-4xl">add</span>
                        </div>
                        <span class="text-xl font-extrabold text-primary">Start Fresh Resume</span>
                        <p class="text-sm text-on-surface-variant font-medium text-center">Use the editor, templates, and ATS tools together.</p>
                    </button>
                    <div class="col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-3 tactile-card p-6 bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
                        <div class="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center">
                            <span class="material-symbols-outlined text-3xl text-on-primary-container" style="font-variation-settings: 'FILL' 1;">pets</span>
                        </div>
                        <h3 class="text-xl font-extrabold text-on-surface">Your workspace is ready</h3>
                        <p class="text-sm text-on-surface-variant font-medium max-w-xs">Create a resume and MeowFolio will persist its content, template, customization, and analysis results locally.</p>
                    </div>
                `;
                return;
            }

            if (getResumesView() === 'list') {
                container.className = 'grid grid-cols-1 gap-5';
                container.innerHTML = `
                    <button type="button" class="tactile-card group relative flex items-center p-6 border-2 border-dashed border-outline-variant rounded-2xl hover:bg-surface-container-low transition-colors gap-6 bg-surface-container-lowest" data-action="create-resume">
                        <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border-2 border-outline-variant group-hover:border-primary group-hover:bg-primary-fixed transition-all shrink-0">
                            <span class="material-symbols-outlined text-2xl">add</span>
                        </div>
                        <div>
                            <span class="text-lg font-extrabold text-primary block">Start Fresh Resume</span>
                            <p class="text-sm text-on-surface-variant font-medium mt-1">Keep everything in the same local-first flow.</p>
                        </div>
                    </button>
                    ${resumes.map((resume) => `
                        <div class="tactile-card bg-surface-container-lowest p-6 rounded-xl border-2 border-on-surface flex items-center gap-6">
                            <div class="w-40 aspect-[4/3] rounded-md border-2 border-on-surface bg-surface-container flex items-center justify-center shrink-0">
                                <span class="material-symbols-outlined text-outline text-6xl opacity-30">description</span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-3 mb-2">
                                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${resume.id === activeResumeId ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container-highest text-on-surface-variant'}">${resume.id === activeResumeId ? 'Active' : 'Saved'}</span>
                                    <span class="text-xs font-bold text-on-surface-variant">Updated ${relativeTime(resume.updatedAt)}</span>
                                </div>
                                <h3 class="text-xl font-extrabold text-on-surface leading-tight">${escapeHtml(resume.role)}</h3>
                                <p class="text-sm text-on-surface-variant font-medium mt-1">${escapeHtml(resume.name)}</p>
                                <div class="flex flex-wrap gap-3 mt-4 text-xs font-bold text-on-surface-variant">
                                    <span>Completion ${resume.completion}%</span>
                                    <span>Strength ${resume.strengthScore}%</span>
                                    <span>ATS ${resume.atsScore || '--'}%</span>
                                </div>
                            </div>
                            <div class="flex gap-2 shrink-0">
                                <button type="button" class="p-2.5 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors" data-action="edit-resume" data-resume-id="${resume.id}"><span class="material-symbols-outlined text-xl">edit</span></button>
                                <button type="button" class="p-2.5 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors" data-action="export-resume" data-resume-id="${resume.id}"><span class="material-symbols-outlined text-xl">download</span></button>
                                <button type="button" class="p-2.5 rounded-full hover:bg-error-container text-on-surface-variant transition-colors" data-action="delete-resume" data-resume-id="${resume.id}"><span class="material-symbols-outlined text-xl">delete</span></button>
                            </div>
                        </div>
                    `).join('')}
                `;
                return;
            }

            container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8';
            container.innerHTML = `
                <button type="button" class="tactile-card group relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-outline-variant rounded-2xl hover:bg-surface-container-low transition-colors gap-4 bg-transparent min-h-[300px]" data-action="create-resume">
                    <div class="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center border-2 border-outline-variant group-hover:border-primary group-hover:bg-primary-fixed transition-all">
                        <span class="material-symbols-outlined text-4xl">add</span>
                    </div>
                    <span class="text-xl font-extrabold text-primary">Start Fresh Resume</span>
                    <p class="text-sm text-on-surface-variant font-medium">Use the smart local-first builder</p>
                </button>
                ${resumes.map((resume) => `
                    <div class="tactile-card bg-surface-container-lowest p-6 rounded-xl border-2 border-on-surface flex flex-col gap-6 group">
                        <div class="relative w-full aspect-[4/3] bg-surface-container rounded-md overflow-hidden border-2 border-on-surface flex items-center justify-center">
                            <span class="material-symbols-outlined text-outline text-8xl opacity-20">contract</span>
                            <div class="absolute top-4 right-4 ${resume.id === activeResumeId ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-primary-fixed text-on-primary-fixed'} px-3 py-1.5 rounded-full text-xs font-black shadow-lg">
                                ${resume.strengthScore}% STRENGTH
                            </div>
                        </div>
                        <div class="flex justify-between items-start">
                            <div class="min-w-0 pr-2">
                                <h3 class="text-xl font-extrabold text-on-surface leading-tight truncate">${escapeHtml(resume.role)}</h3>
                                <p class="text-sm text-on-surface-variant font-medium mt-1">Modified ${relativeTime(resume.updatedAt)}</p>
                            </div>
                            <div class="flex gap-1 shrink-0">
                                <button type="button" class="p-2.5 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors" data-action="edit-resume" data-resume-id="${resume.id}"><span class="material-symbols-outlined text-xl">edit</span></button>
                                <button type="button" class="p-2.5 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors" data-action="export-resume" data-resume-id="${resume.id}"><span class="material-symbols-outlined text-xl">download</span></button>
                                <button type="button" class="p-2.5 rounded-full hover:bg-error-container text-on-surface-variant transition-colors" data-action="delete-resume" data-resume-id="${resume.id}"><span class="material-symbols-outlined text-xl">delete</span></button>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 pt-2 border-t border-outline-variant/10">
                            <span class="bg-surface-container-highest px-3 py-1 rounded-full text-[10px] font-black uppercase text-on-surface-variant">${resume.id === activeResumeId ? 'Active Resume' : 'Saved Draft'}</span>
                            <span class="text-xs font-bold text-on-surface-variant ml-auto italic">ATS ${resume.atsScore || '--'}%</span>
                        </div>
                    </div>
                `).join('')}
            `;
        }

        function initResumesPage() {
            const gridButton = document.getElementById('btn-grid-view');
            const listButton = document.getElementById('btn-list-view');
            if (gridButton) {
                gridButton.addEventListener('click', () => {
                    setResumesView('grid');
                    gridButton.classList.add('bg-surface-container-lowest', 'shadow-sm', 'text-primary');
                    listButton?.classList.remove('bg-surface-container-lowest', 'shadow-sm', 'text-primary');
                    renderResumesPage();
                });
            }
            if (listButton) {
                listButton.addEventListener('click', () => {
                    setResumesView('list');
                    listButton.classList.add('bg-surface-container-lowest', 'shadow-sm', 'text-primary');
                    gridButton?.classList.remove('bg-surface-container-lowest', 'shadow-sm', 'text-primary');
                    renderResumesPage();
                });
            }
            renderResumesPage();
        }

        return {
            initDashboardPage,
            renderResumesPage,
            initResumesPage
        };
    }

    window.createMeowFolioPageModules = createMeowFolioPageModules;
})();
