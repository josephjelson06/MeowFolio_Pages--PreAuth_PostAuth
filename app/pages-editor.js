(function () {
    function createMeowFolioEditorModule(runtime) {
        const {
            Store,
            UI,
            DEFAULT_CUSTOMIZE,
            TEMPLATE_FAMILIES,
            mergeDeep,
            clone,
            renderRepeatableLists,
            renderPreview,
            hydrateEditorBindings,
            updateActiveResumeLabels,
            setResumeHeaderContext,
            getTemplatesFilter,
            setTemplatesFilter
        } = runtime;

        function normalizeEditorTab(tab) {
            return tab === 'templates' || tab === 'customize' ? tab : 'content';
        }

        function getEditorTabFromUrl() {
            const tab = new URLSearchParams(window.location.search).get('tab');
            return normalizeEditorTab(tab);
        }

        function setEditorTabInUrl(tab) {
            const nextTab = normalizeEditorTab(tab);
            const url = new URL(window.location.href);
            if (nextTab === 'content') {
                url.searchParams.delete('tab');
            } else {
                url.searchParams.set('tab', nextTab);
            }
            window.history.replaceState({}, '', url.toString());
        }

        function setEditorTab(tab, options) {
            const nextTab = normalizeEditorTab(tab);
            const shouldSyncUrl = !(options && options.syncUrl === false);

            document.querySelectorAll('[data-editor-panel]').forEach((panel) => {
                panel.classList.toggle('hidden', panel.dataset.editorPanel !== nextTab);
            });

            document.querySelectorAll('[data-editor-tab]').forEach((button) => {
                const active = button.dataset.editorTab === nextTab;
                button.classList.toggle('bg-primary', active);
                button.classList.toggle('text-on-primary', active);
                button.classList.toggle('tactile-shadow', active);
                button.classList.toggle('text-on-surface-variant', !active);
                button.classList.toggle('hover:bg-surface-container-high', !active);
            });

            if (shouldSyncUrl) {
                setEditorTabInUrl(nextTab);
            }
        }

        function wireEditorTabs() {
            const root = document.querySelector('[data-editor-tabs]');
            if (!root || root.dataset.bound === 'true') return;
            root.dataset.bound = 'true';

            root.addEventListener('click', (event) => {
                const button = event.target.closest('[data-editor-tab]');
                if (!button) return;
                event.preventDefault();
                const nextTab = normalizeEditorTab(button.dataset.editorTab);
                setEditorTab(nextTab);
                if (nextTab === 'templates') initEditorTemplatesPage();
                if (nextTab === 'customize') initEditorCustomizePage();
                if (nextTab === 'content') renderPreview();
            });
        }

        function initEditorContentPage() {
            const resumeId = Store.ensureActiveResume({ createIfMissing: true });
            const draft = Store.getDraft(resumeId);
            hydrateEditorBindings(draft);
            renderRepeatableLists(draft);

            // Unified editor view: initialize all left-side panels once, then show active tab.
            initEditorTemplatesPage();
            initEditorCustomizePage();
            wireEditorTabs();
            setEditorTab(getEditorTabFromUrl(), { syncUrl: false });

            renderPreview();
            updateActiveResumeLabels();
            setResumeHeaderContext();
        }

        function initEditorTemplatesPage() {
            Store.ensureActiveResume({ createIfMissing: true });
            const draft = Store.getDraft(Store.ensureActiveResume({ createIfMissing: true }));
            const nextFilter = getTemplatesFilter() || 'All';
            setTemplatesFilter(nextFilter);

            document.querySelectorAll('[data-template-filter]').forEach((button) => {
                const active = button.dataset.templateFilter === nextFilter;
                button.classList.toggle('bg-primary', active);
                button.classList.toggle('text-on-primary', active);
                button.classList.toggle('shadow-sm', active);
                button.classList.toggle('bg-surface-container-lowest', !active);
                button.classList.toggle('text-on-surface-variant', !active);
                button.classList.toggle('border', !active);
                button.classList.toggle('border-outline-variant/20', !active);
            });

            document.querySelectorAll('[data-template-id]').forEach((card) => {
                const active = card.dataset.templateId === draft.templateId;
                const visible = nextFilter === 'All' || TEMPLATE_FAMILIES[card.dataset.templateId] === nextFilter;
                card.classList.toggle('active', active);
                card.style.display = visible ? '' : 'none';
            });

            renderPreview();
        }

        function updateCustomizeSetting(setting, value) {
            const resumeId = Store.ensureActiveResume({ createIfMissing: true });
            Store.updateDraft(resumeId, (draft) => {
                draft.customize = mergeDeep(draft.customize || {}, { [setting]: value });
                return draft;
            });
            initEditorCustomizePage();
        }

        function initEditorCustomizePage() {
            const draft = Store.getDraft(Store.ensureActiveResume({ createIfMissing: true }));
            const customize = mergeDeep(DEFAULT_CUSTOMIZE, draft.customize || {});

            document.querySelectorAll('[data-setting]').forEach((element) => {
                const setting = element.dataset.setting;
                const value = element.dataset.value;
                if (value) {
                    const active = customize[setting] === value;
                    element.classList.toggle('bg-white', active);
                    element.classList.toggle('tactile-shadow', active);
                    element.classList.toggle('text-on-surface', active);
                    element.classList.toggle('text-on-surface-variant', !active);
                } else if (element.type === 'range') {
                    element.value = String(customize[setting]);
                }
            });

            ['margins', 'sectionSpacing', 'lineHeight'].forEach((setting) => {
                const valueNode = document.querySelector(`[data-setting-value="${setting}"]`);
                if (valueNode) valueNode.textContent = setting === 'lineHeight' ? String(customize[setting]) : `${customize[setting]}px`;
            });

            renderPreview();
        }

        function handleCustomizeInteraction(event) {
            const button = event.target.closest('[data-setting][data-value]');
            if (!button) return;
            event.preventDefault();
            updateCustomizeSetting(button.dataset.setting, button.dataset.value);
        }

        function handleCustomizeRange(event) {
            const input = event.target.closest('input[data-setting]');
            if (!input) return;
            updateCustomizeSetting(input.dataset.setting, Number(input.value));
        }

        function handleTemplateSelection(event) {
            const card = event.target.closest('[data-template-id]');
            if (!card) return;
            Store.updateDraft(Store.ensureActiveResume({ createIfMissing: true }), (draft) => {
                draft.templateId = card.dataset.templateId;
                return draft;
            });
            initEditorTemplatesPage();
        }

        function handleTemplateFilter(event) {
            const button = event.target.closest('[data-template-filter]');
            if (!button) return;
            event.preventDefault();
            setTemplatesFilter(button.dataset.templateFilter);
            initEditorTemplatesPage();
        }

        function resetCustomize() {
            Store.updateDraft(Store.ensureActiveResume({ createIfMissing: true }), (draft) => {
                draft.customize = clone(DEFAULT_CUSTOMIZE);
                return draft;
            });
            initEditorCustomizePage();
            UI.showToast('Customization reset to defaults.', 'info');
        }

        return {
            initEditorContentPage,
            initEditorTemplatesPage,
            initEditorCustomizePage,
            setEditorTab,
            updateCustomizeSetting,
            handleCustomizeInteraction,
            handleCustomizeRange,
            handleTemplateSelection,
            handleTemplateFilter,
            resetCustomize
        };
    }

    window.createMeowFolioEditorModule = createMeowFolioEditorModule;
})();
