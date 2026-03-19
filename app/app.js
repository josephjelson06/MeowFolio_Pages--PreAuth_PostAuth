/**
 * MeowFolio - Static-first application runtime
 * Local-first state, deterministic page bootstrapping, and shared UI helpers.
 */
(function () {
    window.__MEOWFOLIO_V2__ = true;

    const STORAGE_KEYS = {
        session: 'meowfolio_session',
        profile: 'meowfolio_profile',
        resumeIndex: 'meowfolio_resume_index',
        resumeDrafts: 'meowfolio_resume_drafts',
        analyses: 'meowfolio_resume_analyses',
        activeResumeId: 'meowfolio_active_resume'
    };

    const LEGACY_KEYS = {
        user: 'meowfolio_user',
        resumes: 'meowfolio_resumes'
    };

    const APP_PAGES = new Set([
        'dashboard',
        'resumes',
        'profile',
        'editor-content',
        'editor-templates',
        'editor-customize',
        'jd-analyzer',
        'jd-results',
        'ats-scorer',
        'ats-report'
    ]);

    const AUTH_PAGES = new Set(['login', 'signup']);
    const RETIRED_REDIRECTS = {
        'choose-path': 'signup.html',
        'pick-template': 'editor-templates.html',
        'editor-preview': 'editor-content.html'
    };

    const DEFAULT_CUSTOMIZE = {
        fontType: 'sans',
        fontSize: 'medium',
        margins: 24,
        sectionSpacing: 16,
        lineHeight: 1.5,
        align: 'left'
    };

    const TEMPLATE_FAMILIES = {
        minimal: 'Minimal',
        'two-column': 'Two-column',
        compact: 'Compact',
        modern: 'Modern'
    };

    const CHAPTER_METADATA = {
        'chapter-1': { title: 'First Impressions', progressLabel: 'Chapter 1 of 7', percent: 14, next: 'chapter-2.html', previous: 'learn.html' },
        'chapter-2': { title: 'The LaTeX Advantage', progressLabel: 'Chapter 2 of 7', percent: 29, next: 'chapter-3.html', previous: 'chapter-1.html' },
        'chapter-3': { title: 'Action Verbs', progressLabel: 'Chapter 3 of 7', percent: 43, next: 'chapter-4.html', previous: 'chapter-2.html' },
        'chapter-4': { title: 'Beating the ATS', progressLabel: 'Chapter 4 of 7', percent: 57, next: 'chapter-5.html', previous: 'chapter-3.html' },
        'chapter-5': { title: 'Project Storytelling', progressLabel: 'Chapter 5 of 7', percent: 71, next: 'chapter-6.html', previous: 'chapter-4.html' },
        'chapter-6': { title: 'Proofing & Polish', progressLabel: 'Chapter 6 of 7', percent: 86, next: 'chapter-7.html', previous: 'chapter-5.html' },
        'chapter-7': { title: 'Submission Strategy', progressLabel: 'Chapter 7 of 7', percent: 100, next: 'editor-content.html', previous: 'chapter-6.html' }
    };

    const STOP_WORDS = new Set([
        'about', 'after', 'again', 'against', 'also', 'among', 'because', 'between', 'build',
        'candidate', 'company', 'could', 'degree', 'details', 'drive', 'each', 'experience',
        'from', 'have', 'having', 'into', 'just', 'more', 'must', 'need', 'needs', 'our',
        'role', 'roles', 'should', 'skills', 'some', 'than', 'that', 'their', 'them', 'they',
        'this', 'those', 'using', 'will', 'with', 'your', 'you', 'able', 'across', 'including',
        'work', 'team', 'teams', 'years', 'year', 'responsible', 'preferred', 'strong',
        'excellent', 'knowledge', 'ability', 'required', 'requirements', 'position', 'resume',
        'looking', 'seeking', 'seeks', 'description', 'ideal', 'plus', 'candidate', 'job'
    ]);

    let resumesView = 'grid';
    let templatesFilter = 'All';

    function readJSON(key, fallback) {
        try {
            const value = window.localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    function removeKeys() {
        Array.from(arguments).forEach((key) => window.localStorage.removeItem(key));
    }

    function getPageFromLocation() {
        const filename = window.location.pathname.split('/').pop() || 'landing.html';
        return filename.replace(/\.html$/, '') || 'landing';
    }

    function getCurrentPage() {
        return document.body?.dataset.page || getPageFromLocation();
    }

    function uniqueId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function initials(name) {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'MF';
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    function titleCase(value) {
        return String(value || '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    function formatDate(dateLike) {
        const date = new Date(dateLike);
        if (Number.isNaN(date.getTime())) return 'Recently';
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function relativeTime(dateLike) {
        const date = new Date(dateLike);
        if (Number.isNaN(date.getTime())) return 'just now';
        const seconds = Math.round((Date.now() - date.getTime()) / 1000);
        const absolute = Math.abs(seconds);
        if (absolute < 60) return 'just now';
        if (absolute < 3600) return `${Math.round(absolute / 60)} min ago`;
        if (absolute < 86400) return `${Math.round(absolute / 3600)} hours ago`;
        if (absolute < 604800) return `${Math.round(absolute / 86400)} days ago`;
        return formatDate(date);
    }

    function greetingForTime() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    }

    function mergeDeep(target, source) {
        if (Array.isArray(source)) return clone(source);
        if (!source || typeof source !== 'object') return source;
        const output = Array.isArray(target) ? target.slice() : { ...(target || {}) };
        Object.keys(source).forEach((key) => {
            const sourceValue = source[key];
            if (Array.isArray(sourceValue)) {
                output[key] = clone(sourceValue);
            } else if (sourceValue && typeof sourceValue === 'object') {
                output[key] = mergeDeep(output[key] || {}, sourceValue);
            } else {
                output[key] = sourceValue;
            }
        });
        return output;
    }

    function setByPath(object, path, value) {
        const segments = path.split('.');
        const copy = clone(object);
        let cursor = copy;
        segments.forEach((segment, index) => {
            if (index === segments.length - 1) {
                cursor[segment] = value;
                return;
            }
            cursor[segment] = cursor[segment] && typeof cursor[segment] === 'object' ? clone(cursor[segment]) : {};
            cursor = cursor[segment];
        });
        return copy;
    }

    function getByPath(object, path, fallback) {
        return path.split('.').reduce((current, segment) => {
            if (current && typeof current === 'object' && segment in current) return current[segment];
            return fallback;
        }, object);
    }

    function tokenize(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/[^a-z0-9+\-#/.\s]/g, ' ')
            .split(/\s+/)
            .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
    }

    function stem(token) {
        return token.replace(/ing$|ed$|ion$|ions$|ment$|ments$|ers$|er$|ies$|s$/g, '').slice(0, 12);
    }

    function getResumeText(draft) {
        return [
            draft.personal.name,
            draft.personal.title,
            draft.personal.email,
            draft.personal.phone,
            draft.personal.location,
            draft.summary,
            (draft.education || []).map((item) => `${item.degree} ${item.school} ${item.period} ${item.detail || ''}`).join(' '),
            (draft.experience || []).map((item) => `${item.role} ${item.company} ${item.period} ${item.bullets.join(' ')}`).join(' '),
            (draft.projects || []).map((item) => `${item.name} ${item.period} ${item.detail}`).join(' '),
            (draft.skills || []).join(' ')
        ].join(' ');
    }

    function topKeywords(text, limit) {
        const scores = new Map();
        tokenize(text).forEach((token) => {
            scores.set(token, (scores.get(token) || 0) + 1);
        });
        return Array.from(scores.entries())
            .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
            .slice(0, limit)
            .map((entry) => entry[0]);
    }

    function getActionVerbCount(text) {
        return (String(text || '').match(/\b(led|built|launched|designed|created|improved|optimized|shipped|owned|developed|scaled|architected|mentored|delivered|boosted|drove)\b/gi) || []).length;
    }

    function calculateCompletion(draft) {
        let score = 0;
        const personal = draft.personal || {};
        if (personal.name) score += 12;
        if (personal.title) score += 8;
        if (personal.email) score += 6;
        if (personal.phone) score += 6;
        if (personal.location) score += 6;
        if (draft.summary) score += 16;
        if ((draft.education || []).length) score += 14;
        if ((draft.experience || []).length) score += 16;
        if ((draft.projects || []).length) score += 10;
        if ((draft.skills || []).length >= 3) score += 6;
        return clamp(Math.round(score), 0, 100);
    }

    function calculateStrength(draft) {
        const completion = calculateCompletion(draft);
        const resumeText = getResumeText(draft);
        const actionVerbBoost = clamp(getActionVerbCount(resumeText) * 3, 0, 18);
        const keywordBoost = clamp((draft.skills || []).length * 2, 0, 14);
        const summaryBoost = clamp(String(draft.summary || '').split(/\s+/).filter(Boolean).length / 4, 0, 12);
        const experienceBoost = clamp((draft.experience || []).length * 6, 0, 18);
        return clamp(Math.round(completion * 0.45 + actionVerbBoost + keywordBoost + summaryBoost + experienceBoost), 18, 99);
    }

    function buildDefaultProfile(overrides) {
        return mergeDeep({
            id: 'local-user',
            name: 'Alexander Thompson',
            title: 'Senior Product Designer',
            email: 'alex@meowfolio.dev',
            phone: '+1 (555) 000-0000',
            location: 'San Francisco, CA',
            college: 'National Institute of Technology',
            degree: 'B.Tech',
            branch: 'Computer Science & Engineering',
            year: '4th Year',
            bio: 'Product designer who likes systems, storytelling, and ATS-safe structure.',
            avatar: '',
            memberSince: new Date().toISOString()
        }, overrides || {});
    }

    function buildStarterDraft(profile, resumeId) {
        return {
            id: resumeId,
            personal: {
                name: profile.name,
                title: profile.title,
                email: profile.email,
                phone: profile.phone,
                location: profile.location
            },
            summary: profile.bio,
            education: [
                {
                    school: profile.college,
                    degree: `${profile.degree} in ${profile.branch}`,
                    period: `Class of ${new Date().getFullYear()}`,
                    detail: `${profile.year} candidate focused on design systems, frontend craft, and product strategy.`
                }
            ],
            experience: [
                {
                    role: 'Product Design Intern',
                    company: 'Dreamscape Labs',
                    period: '2024 - Present',
                    bullets: [
                        'Led a mobile onboarding refresh that improved activation by 24%.',
                        'Built reusable UI patterns with designers and engineers across 3 product squads.',
                        'Documented accessibility patterns that cut QA regressions during launch.'
                    ]
                }
            ],
            projects: [
                {
                    name: 'MeowBoard',
                    period: '2024',
                    detail: 'Designed and shipped a collaborative campus task board with role-based dashboards and clean responsive layouts.'
                }
            ],
            skills: ['Design Systems', 'Figma', 'Tailwind CSS', 'Product Thinking', 'User Research'],
            templateId: 'minimal',
            customize: clone(DEFAULT_CUSTOMIZE),
            lastJobDescription: ''
        };
    }

    function buildResumeMeta(resumeId, draft, existingCount) {
        const title = draft.personal.title || `Resume ${existingCount + 1}`;
        const baseName = title.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 40) || `resume_${existingCount + 1}`;
        return {
            id: resumeId,
            name: `${baseName}.pdf`,
            role: title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            templateId: draft.templateId || 'minimal',
            completion: calculateCompletion(draft),
            strengthScore: calculateStrength(draft),
            jdScore: null,
            atsScore: null
        };
    }

    function migrateLegacyData() {
        const legacyUser = readJSON(LEGACY_KEYS.user, null);
        const legacyResumes = readJSON(LEGACY_KEYS.resumes, null);
        const profile = readJSON(STORAGE_KEYS.profile, null);
        const resumeIndex = readJSON(STORAGE_KEYS.resumeIndex, null);
        const drafts = readJSON(STORAGE_KEYS.resumeDrafts, null);
        const session = readJSON(STORAGE_KEYS.session, null);

        if (!profile && legacyUser) {
            writeJSON(STORAGE_KEYS.profile, buildDefaultProfile({
                name: legacyUser.name || 'Alexander Thompson',
                title: legacyUser.title || 'Senior Product Designer',
                email: legacyUser.email || 'alex@meowfolio.dev',
                location: legacyUser.location || 'San Francisco, CA',
                bio: legacyUser.bio || buildDefaultProfile().bio,
                avatar: legacyUser.avatar || ''
            }));
        }

        if (!resumeIndex && Array.isArray(legacyResumes)) {
            const nextProfile = readJSON(STORAGE_KEYS.profile, buildDefaultProfile());
            const nextDrafts = {};
            const nextResumeIndex = legacyResumes.map((legacyResume, index) => {
                const resumeId = String(legacyResume.id || uniqueId('resume'));
                const draft = buildStarterDraft(mergeDeep(nextProfile, {
                    title: legacyResume.role || nextProfile.title
                }), resumeId);
                nextDrafts[resumeId] = draft;
                return mergeDeep(buildResumeMeta(resumeId, draft, index), {
                    updatedAt: legacyResume.updatedAt || new Date().toISOString(),
                    completion: legacyResume.completion || calculateCompletion(draft),
                    strengthScore: legacyResume.score || calculateStrength(draft)
                });
            });

            writeJSON(STORAGE_KEYS.resumeDrafts, nextDrafts);
            writeJSON(STORAGE_KEYS.resumeIndex, nextResumeIndex);
            if (nextResumeIndex[0]) {
                window.localStorage.setItem(STORAGE_KEYS.activeResumeId, nextResumeIndex[0].id);
            }
        }

        if (!drafts) writeJSON(STORAGE_KEYS.resumeDrafts, {});
        if (!readJSON(STORAGE_KEYS.analyses, null)) writeJSON(STORAGE_KEYS.analyses, {});
        if (!readJSON(STORAGE_KEYS.resumeIndex, null)) writeJSON(STORAGE_KEYS.resumeIndex, []);
        if (!session && legacyUser) {
            const nextProfile = readJSON(STORAGE_KEYS.profile, buildDefaultProfile());
            writeJSON(STORAGE_KEYS.session, {
                userId: nextProfile.id,
                name: nextProfile.name,
                email: nextProfile.email,
                loggedInAt: new Date().toISOString()
            });
        }
    }

    const Store = {
        getSession() {
            return readJSON(STORAGE_KEYS.session, null);
        },
        isAuthenticated() {
            return Boolean(this.getSession());
        },
        setSession(session) {
            writeJSON(STORAGE_KEYS.session, session);
            return session;
        },
        clearSession() {
            removeKeys(STORAGE_KEYS.session, LEGACY_KEYS.user, LEGACY_KEYS.resumes);
        },
        getProfile() {
            return readJSON(STORAGE_KEYS.profile, null);
        },
        ensureProfile() {
            const existing = this.getProfile();
            if (existing) return existing;
            const profile = buildDefaultProfile();
            writeJSON(STORAGE_KEYS.profile, profile);
            return profile;
        },
        updateProfile(patch) {
            const previous = this.ensureProfile();
            const next = mergeDeep(previous, patch || {});
            writeJSON(STORAGE_KEYS.profile, next);

            const session = this.getSession();
            if (session) {
                this.setSession(mergeDeep(session, {
                    name: next.name,
                    email: next.email
                }));
            }

            const draftsMap = this.getDraftsMap();
            let changed = false;
            Object.keys(draftsMap).forEach((resumeId) => {
                const draft = clone(draftsMap[resumeId]);
                const personal = draft.personal || {};
                if (!personal.name || personal.name === previous.name) personal.name = next.name;
                if (!personal.title || personal.title === previous.title) personal.title = next.title;
                if (!personal.email || personal.email === previous.email) personal.email = next.email;
                if (!personal.phone || personal.phone === previous.phone) personal.phone = next.phone;
                if (!personal.location || personal.location === previous.location) personal.location = next.location;
                draft.personal = personal;
                draftsMap[resumeId] = draft;
                changed = true;
            });

            if (changed) {
                this.saveDraftsMap(draftsMap);
                this.listResumes().forEach((resume) => this.syncResumeMeta(resume.id));
            }

            return next;
        },
        signInLocal(source) {
            const profile = this.ensureProfile();
            const session = {
                userId: profile.id,
                name: profile.name,
                email: profile.email,
                source: source,
                loggedInAt: new Date().toISOString()
            };
            this.setSession(session);
            return session;
        },
        logout() {
            this.clearSession();
            window.location.href = 'landing.html';
        },
        listResumes() {
            return readJSON(STORAGE_KEYS.resumeIndex, []);
        },
        saveResumes(resumes) {
            writeJSON(STORAGE_KEYS.resumeIndex, resumes);
            return resumes;
        },
        getDraftsMap() {
            return readJSON(STORAGE_KEYS.resumeDrafts, {});
        },
        saveDraftsMap(drafts) {
            writeJSON(STORAGE_KEYS.resumeDrafts, drafts);
            return drafts;
        },
        getAnalysesMap() {
            return readJSON(STORAGE_KEYS.analyses, {});
        },
        saveAnalysesMap(analyses) {
            writeJSON(STORAGE_KEYS.analyses, analyses);
            return analyses;
        },
        getActiveResumeId() {
            return window.localStorage.getItem(STORAGE_KEYS.activeResumeId);
        },
        setActiveResumeId(resumeId) {
            if (resumeId) {
                window.localStorage.setItem(STORAGE_KEYS.activeResumeId, resumeId);
            } else {
                window.localStorage.removeItem(STORAGE_KEYS.activeResumeId);
            }
            return resumeId;
        },
        getDraft(resumeId) {
            return this.getDraftsMap()[resumeId] || null;
        },
        saveDraft(resumeId, draft) {
            const drafts = this.getDraftsMap();
            drafts[resumeId] = draft;
            this.saveDraftsMap(drafts);
            this.syncResumeMeta(resumeId);
            return draft;
        },
        updateDraft(resumeId, updater) {
            const current = this.getDraft(resumeId) || buildStarterDraft(this.ensureProfile(), resumeId);
            const next = typeof updater === 'function' ? updater(clone(current)) : mergeDeep(current, updater || {});
            return this.saveDraft(resumeId, next);
        },
        createResume(options) {
            const profile = this.ensureProfile();
            const resumes = this.listResumes();
            const resumeId = uniqueId('resume');
            const draft = buildStarterDraft(profile, resumeId);
            const meta = buildResumeMeta(resumeId, draft, resumes.length);
            this.saveDraft(resumeId, draft);
            this.saveResumes([meta, ...resumes]);
            if (!options || options.activate !== false) {
                this.setActiveResumeId(resumeId);
            }
            return meta;
        },
        deleteResume(resumeId) {
            const nextResumes = this.listResumes().filter((resume) => resume.id !== resumeId);
            this.saveResumes(nextResumes);

            const drafts = this.getDraftsMap();
            delete drafts[resumeId];
            this.saveDraftsMap(drafts);

            const analyses = this.getAnalysesMap();
            delete analyses[resumeId];
            this.saveAnalysesMap(analyses);

            if (this.getActiveResumeId() === resumeId) {
                this.setActiveResumeId(nextResumes[0]?.id || '');
            }
        },
        ensureActiveResume(options) {
            const resumes = this.listResumes();
            const activeResumeId = this.getActiveResumeId();
            if (activeResumeId && resumes.some((resume) => resume.id === activeResumeId)) {
                return activeResumeId;
            }
            if (resumes[0]) {
                this.setActiveResumeId(resumes[0].id);
                return resumes[0].id;
            }
            if (options && options.createIfMissing) {
                return this.createResume({ activate: true }).id;
            }
            return null;
        },
        cycleActiveResume(options) {
            const resumes = this.listResumes();
            if (!resumes.length) {
                if (options && options.createIfMissing) {
                    return this.createResume({ activate: true }).id;
                }
                return null;
            }

            const activeResumeId = this.ensureActiveResume();
            const currentIndex = resumes.findIndex((resume) => resume.id === activeResumeId);
            const nextResume = resumes[(currentIndex + 1) % resumes.length];
            this.setActiveResumeId(nextResume.id);
            return nextResume.id;
        },
        getActiveResume() {
            const activeResumeId = this.ensureActiveResume();
            return this.listResumes().find((resume) => resume.id === activeResumeId) || null;
        },
        syncResumeMeta(resumeId) {
            const resumes = this.listResumes();
            const draft = this.getDraft(resumeId);
            if (!draft) return;

            const nextResumes = resumes.map((resume) => {
                if (resume.id !== resumeId) return resume;
                return mergeDeep(resume, {
                    name: `${(draft.personal.title || 'Untitled Resume').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'untitled_resume'}.pdf`,
                    role: draft.personal.title || 'Untitled Resume',
                    updatedAt: new Date().toISOString(),
                    templateId: draft.templateId || 'minimal',
                    completion: calculateCompletion(draft),
                    strengthScore: calculateStrength(draft)
                });
            });

            this.saveResumes(nextResumes);
        },
        saveAnalysis(resumeId, type, payload) {
            const analyses = this.getAnalysesMap();
            analyses[resumeId] = analyses[resumeId] || {};
            analyses[resumeId][type] = payload;
            this.saveAnalysesMap(analyses);

            const resumes = this.listResumes().map((resume) => {
                if (resume.id !== resumeId) return resume;
                if (type === 'jd') return mergeDeep(resume, { jdScore: payload.score, updatedAt: new Date().toISOString() });
                if (type === 'ats') return mergeDeep(resume, { atsScore: payload.score, updatedAt: new Date().toISOString() });
                return resume;
            });
            this.saveResumes(resumes);

            return payload;
        },
        getAnalysis(resumeId, type) {
            return this.getAnalysesMap()[resumeId]?.[type] || null;
        }
    };

    const UI = {
        ensureToastContainer() {
            let container = document.getElementById('meowfolio-toast-root');
            if (!container) {
                container = document.createElement('div');
                container.id = 'meowfolio-toast-root';
                container.style.position = 'fixed';
                container.style.right = '24px';
                container.style.bottom = '24px';
                container.style.zIndex = '9999';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '12px';
                document.body.appendChild(container);
            }
            return container;
        },
        showToast(message, tone) {
            const palette = {
                success: { background: '#1f7a4c', color: '#ffffff' },
                error: { background: '#a23c2e', color: '#ffffff' },
                info: { background: '#f4e1d8', color: '#1c1c18' }
            };
            const colors = palette[tone] || palette.success;
            const container = this.ensureToastContainer();
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.background = colors.background;
            toast.style.color = colors.color;
            toast.style.padding = '14px 18px';
            toast.style.borderRadius = '18px';
            toast.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
            toast.style.fontWeight = '700';
            toast.style.boxShadow = '0 12px 32px rgba(28, 28, 24, 0.14)';
            toast.style.border = '2px solid rgba(28, 28, 24, 0.1)';
            toast.style.maxWidth = '320px';
            toast.style.transform = 'translateY(12px)';
            toast.style.opacity = '0';
            toast.style.transition = 'all 180ms ease';
            container.appendChild(toast);

            requestAnimationFrame(() => {
                toast.style.transform = 'translateY(0)';
                toast.style.opacity = '1';
            });

            window.setTimeout(() => {
                toast.style.transform = 'translateY(12px)';
                toast.style.opacity = '0';
                window.setTimeout(() => toast.remove(), 180);
            }, 2600);
        },
        navigate(url) {
            window.location.href = url;
        }
    };

    function buildPreviewMarkup(draft) {
        const customize = mergeDeep(DEFAULT_CUSTOMIZE, draft.customize || {});
        const baseFontSize = { small: 12, medium: 13, large: 14 }[customize.fontSize] || 13;
        const fontFamily = {
            sans: "'Inter', sans-serif",
            serif: "Georgia, 'Times New Roman', serif",
            mono: "'Courier New', monospace"
        }[customize.fontType] || "'Inter', sans-serif";

        const sectionLabelStyle = `font-size:${baseFontSize - 2}px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#71717a;border-bottom:1px solid #d4d4d8;padding-bottom:6px;margin-bottom:10px;`;
        const contactBits = [draft.personal.email, draft.personal.phone, draft.personal.location].filter(Boolean).map(escapeHtml).join(' • ');
        const summary = draft.summary ? `<section style="margin-bottom:${customize.sectionSpacing}px;"><div style="${sectionLabelStyle}">Professional Summary</div><p style="margin:0;font-size:${baseFontSize}px;line-height:${customize.lineHeight};color:#27272a;">${escapeHtml(draft.summary)}</p></section>` : '';

        const experience = (draft.experience || []).map((item) => `
            <article style="margin-bottom:${Math.max(customize.sectionSpacing - 4, 10)}px;">
                <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
                    <div style="font-size:${baseFontSize + 1}px;font-weight:700;color:#18181b;">${escapeHtml(item.role)}${item.company ? ` • ${escapeHtml(item.company)}` : ''}</div>
                    <div style="font-size:${baseFontSize - 2}px;font-weight:700;color:#52525b;white-space:nowrap;">${escapeHtml(item.period || '')}</div>
                </div>
                <ul style="margin:8px 0 0 18px;padding:0;font-size:${baseFontSize - 1}px;line-height:${customize.lineHeight};color:#3f3f46;">
                    ${(item.bullets || []).map((bullet) => `<li style="margin-bottom:4px;">${escapeHtml(bullet)}</li>`).join('')}
                </ul>
            </article>
        `).join('');

        const education = (draft.education || []).map((item) => `
            <article style="margin-bottom:${Math.max(customize.sectionSpacing - 6, 8)}px;">
                <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
                    <div style="font-size:${baseFontSize}px;font-weight:700;color:#18181b;">${escapeHtml(item.degree)}</div>
                    <div style="font-size:${baseFontSize - 2}px;font-weight:700;color:#52525b;">${escapeHtml(item.period || '')}</div>
                </div>
                <div style="font-size:${baseFontSize - 1}px;color:#3f3f46;margin-top:2px;">${escapeHtml(item.school)}</div>
                ${item.detail ? `<div style="font-size:${baseFontSize - 1}px;color:#52525b;margin-top:4px;">${escapeHtml(item.detail)}</div>` : ''}
            </article>
        `).join('');

        const projects = (draft.projects || []).map((item) => `
            <article style="margin-bottom:${Math.max(customize.sectionSpacing - 6, 8)}px;">
                <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
                    <div style="font-size:${baseFontSize}px;font-weight:700;color:#18181b;">${escapeHtml(item.name)}</div>
                    <div style="font-size:${baseFontSize - 2}px;font-weight:700;color:#52525b;">${escapeHtml(item.period || '')}</div>
                </div>
                <div style="font-size:${baseFontSize - 1}px;line-height:${customize.lineHeight};color:#3f3f46;margin-top:6px;">${escapeHtml(item.detail)}</div>
            </article>
        `).join('');

        const skills = (draft.skills || []).map((skill) => `<span style="display:inline-block;margin:0 10px 8px 0;padding:5px 10px;border-radius:999px;background:#f4f4f5;color:#27272a;font-size:${baseFontSize - 2}px;font-weight:700;">${escapeHtml(skill)}</span>`).join('');

        if ((draft.templateId || 'minimal') === 'two-column') {
            return `
                <div style="display:grid;grid-template-columns:1.2fr 2.1fr;height:100%;font-family:${fontFamily};font-size:${baseFontSize}px;line-height:${customize.lineHeight};text-align:${customize.align};">
                    <aside style="padding-right:20px;border-right:1px solid #e4e4e7;">
                        <div style="font-size:${baseFontSize + 9}px;font-weight:800;letter-spacing:-0.03em;color:#18181b;line-height:1.05;margin-bottom:6px;">${escapeHtml(draft.personal.name || 'Untitled Resume')}</div>
                        <div style="font-size:${baseFontSize}px;font-weight:700;color:#9d4223;margin-bottom:12px;text-transform:uppercase;">${escapeHtml(draft.personal.title || 'Add a title')}</div>
                        <div style="font-size:${baseFontSize - 1}px;color:#52525b;line-height:${customize.lineHeight};margin-bottom:${customize.sectionSpacing}px;">${contactBits || 'Add your contact details'}</div>
                        ${skills ? `<section style="margin-bottom:${customize.sectionSpacing}px;"><div style="${sectionLabelStyle}">Skills</div>${skills}</section>` : ''}
                        ${education ? `<section style="margin-bottom:${customize.sectionSpacing}px;"><div style="${sectionLabelStyle}">Education</div>${education}</section>` : ''}
                    </aside>
                    <section style="padding-left:22px;">
                        ${summary}
                        ${experience ? `<section style="margin-bottom:${customize.sectionSpacing}px;"><div style="${sectionLabelStyle}">Experience</div>${experience}</section>` : ''}
                        ${projects ? `<section><div style="${sectionLabelStyle}">Projects</div>${projects}</section>` : ''}
                    </section>
                </div>
            `;
        }

        if ((draft.templateId || 'minimal') === 'compact') {
            return `
                <div style="font-family:${fontFamily};font-size:${baseFontSize}px;line-height:${customize.lineHeight};text-align:${customize.align};">
                    <header style="margin-bottom:${customize.sectionSpacing}px;">
                        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-end;border-bottom:2px solid #18181b;padding-bottom:10px;">
                            <div>
                                <div style="font-size:${baseFontSize + 8}px;font-weight:800;letter-spacing:-0.03em;color:#18181b;line-height:1;">${escapeHtml(draft.personal.name || 'Untitled Resume')}</div>
                                <div style="font-size:${baseFontSize - 1}px;font-weight:700;color:#9d4223;text-transform:uppercase;margin-top:6px;">${escapeHtml(draft.personal.title || 'Add a title')}</div>
                            </div>
                            <div style="font-size:${baseFontSize - 2}px;color:#52525b;text-align:right;">${contactBits || 'Add your contact details'}</div>
                        </div>
                    </header>
                    ${summary}
                    ${experience ? `<section style="margin-bottom:${customize.sectionSpacing}px;"><div style="${sectionLabelStyle}">Experience</div>${experience}</section>` : ''}
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
                        <section>${education ? `<div style="${sectionLabelStyle}">Education</div>${education}` : ''}</section>
                        <section>${projects ? `<div style="${sectionLabelStyle}">Projects</div>${projects}` : ''}</section>
                    </div>
                    ${skills ? `<section style="margin-top:${customize.sectionSpacing}px;"><div style="${sectionLabelStyle}">Skills</div>${skills}</section>` : ''}
                </div>
            `;
        }

        if ((draft.templateId || 'minimal') === 'modern') {
            return `
                <div style="font-family:${fontFamily};font-size:${baseFontSize}px;line-height:${customize.lineHeight};text-align:${customize.align};">
                    <header style="margin-bottom:${customize.sectionSpacing}px;padding:18px;border-radius:18px;background:#fff7f4;border:1px solid #f4d8c7;">
                        <div style="font-size:${baseFontSize + 10}px;font-weight:800;letter-spacing:-0.03em;color:#18181b;line-height:1;">${escapeHtml(draft.personal.name || 'Untitled Resume')}</div>
                        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-top:10px;">
                            <div style="font-size:${baseFontSize}px;font-weight:700;color:#9d4223;">${escapeHtml(draft.personal.title || 'Add a title')}</div>
                            <div style="font-size:${baseFontSize - 1}px;color:#52525b;">${contactBits || 'Add your contact details'}</div>
                        </div>
                    </header>
                    ${summary}
                    ${experience ? `<section style="margin-bottom:${customize.sectionSpacing}px;"><div style="${sectionLabelStyle}">Selected Experience</div>${experience}</section>` : ''}
                    ${projects ? `<section style="margin-bottom:${customize.sectionSpacing}px;"><div style="${sectionLabelStyle}">Projects</div>${projects}</section>` : ''}
                    <div style="display:grid;grid-template-columns:1.2fr 1.8fr;gap:18px;">
                        <section>${education ? `<div style="${sectionLabelStyle}">Education</div>${education}` : ''}</section>
                        <section>${skills ? `<div style="${sectionLabelStyle}">Skills</div>${skills}` : ''}</section>
                    </div>
                </div>
            `;
        }

        return `
            <div style="font-family:${fontFamily};font-size:${baseFontSize}px;line-height:${customize.lineHeight};text-align:${customize.align};">
                <header style="border-bottom:2px solid #18181b;padding-bottom:12px;margin-bottom:${customize.sectionSpacing}px;">
                    <div style="font-size:${baseFontSize + 10}px;font-weight:800;letter-spacing:-0.03em;color:#18181b;line-height:1;">${escapeHtml(draft.personal.name || 'Untitled Resume')}</div>
                    <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-top:8px;">
                        <div style="font-size:${baseFontSize}px;font-weight:700;color:#3f3f46;text-transform:uppercase;">${escapeHtml(draft.personal.title || 'Add a title')}</div>
                        <div style="font-size:${baseFontSize - 1}px;color:#52525b;">${contactBits || 'Add your contact details'}</div>
                    </div>
                </header>
                ${summary}
                ${experience ? `<section style="margin-bottom:${customize.sectionSpacing}px;"><div style="${sectionLabelStyle}">Experience</div>${experience}</section>` : ''}
                ${education ? `<section style="margin-bottom:${customize.sectionSpacing}px;"><div style="${sectionLabelStyle}">Education</div>${education}</section>` : ''}
                ${projects ? `<section style="margin-bottom:${customize.sectionSpacing}px;"><div style="${sectionLabelStyle}">Projects</div>${projects}</section>` : ''}
                ${skills ? `<section><div style="${sectionLabelStyle}">Skills</div>${skills}</section>` : ''}
            </div>
        `;
    }

    function buildPrintableHtml(draft) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(draft.personal.name || 'MeowFolio Resume')}</title>
    <style>
        body { margin: 0; background: #f5f2ec; font-family: Inter, system-ui, sans-serif; }
        .page { width: 794px; min-height: 1123px; margin: 24px auto; background: #ffffff; box-shadow: 0 18px 48px rgba(28, 28, 24, 0.12); padding: 42px; box-sizing: border-box; }
        @media print {
            body { background: #ffffff; }
            .page { box-shadow: none; width: auto; min-height: auto; margin: 0; }
        }
    </style>
</head>
<body>
    <div class="page">${buildPreviewMarkup(draft)}</div>
</body>
</html>`;
    }

    function exportResume(resumeId) {
        const activeResumeId = resumeId || Store.ensureActiveResume({ createIfMissing: true });
        const draft = Store.getDraft(activeResumeId);
        if (!draft) {
            UI.showToast('Create a resume before exporting it.', 'error');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=960,height=1200');
        if (!printWindow) {
            UI.showToast('Popup blocked. Please allow popups to export.', 'error');
            return;
        }

        printWindow.document.open();
        printWindow.document.write(buildPrintableHtml(draft));
        printWindow.document.close();
        printWindow.focus();
        window.setTimeout(() => printWindow.print(), 350);
    }

    function computeJDAnalysis(draft, jdText) {
        const keywords = topKeywords(jdText, 18);
        const resumeTokens = tokenize(getResumeText(draft));
        const resumeText = resumeTokens.join(' ');
        const resumeStems = new Set(resumeTokens.map(stem));
        const matched = [];
        const partial = [];
        const missing = [];

        keywords.forEach((keyword) => {
            if (resumeText.includes(keyword)) {
                matched.push(keyword);
            } else if (resumeStems.has(stem(keyword))) {
                partial.push(keyword);
            } else {
                missing.push(keyword);
            }
        });

        const total = Math.max(keywords.length, 1);
        const score = clamp(Math.round(((matched.length + partial.length * 0.5) / total) * 100), 18, 98);
        const summaryTitle = score >= 80 ? 'Great Match!' : score >= 60 ? 'Strong Foundation' : 'Plenty of Room to Tune';
        const summaryCopy = score >= 80
            ? 'Your resume already covers most of the job language. Small edits could make it sharper.'
            : score >= 60
                ? 'The role is within reach, but a few missing themes are holding the score back.'
                : 'The job description is asking for language your resume barely surfaces today.';
        const suggestions = missing.slice(0, 4).map((keyword) => ({
            keyword: keyword,
            detail: `Add a concrete example that shows ${titleCase(keyword)} in action within your summary, experience, or projects.`
        }));

        return {
            jdText: jdText,
            score: score,
            summaryTitle: summaryTitle,
            summaryCopy: summaryCopy,
            matchedKeywords: matched,
            partialKeywords: partial,
            missingKeywords: missing,
            suggestions: suggestions,
            tags: [
                matched[0] ? `#${matched[0].replace(/[^a-z0-9]/gi, '')}` : '#resume',
                missing[0] ? `#${missing[0].replace(/[^a-z0-9]/gi, '')}` : '#tuning',
                '#ATSFriendly'
            ],
            analyzedAt: new Date().toISOString()
        };
    }

    function computeATSAnalysis(draft) {
        const customize = mergeDeep(DEFAULT_CUSTOMIZE, draft.customize || {});
        const text = getResumeText(draft);
        const actionVerbCount = getActionVerbCount(text);
        const sectionCount = ['summary', 'education', 'experience', 'projects', 'skills']
            .filter((section) => Array.isArray(draft[section]) ? draft[section].length : Boolean(draft[section]))
            .length;
        const formatting = clamp(
            72 +
            (draft.templateId === 'minimal' ? 10 : draft.templateId === 'two-column' ? 6 : draft.templateId === 'compact' ? 8 : 5) +
            (customize.align === 'left' ? 6 : 2) +
            (customize.margins >= 16 && customize.margins <= 30 ? 6 : 2),
            40,
            98
        );
        const keywords = clamp(42 + actionVerbCount * 4 + (draft.skills || []).length * 3 + Math.min(tokenize(text).length / 4, 18), 24, 96);
        const structure = clamp(38 + sectionCount * 12 + ((draft.experience || []).length ? 6 : 0), 20, 96);
        const readability = clamp(
            54 +
            (customize.fontSize === 'medium' ? 10 : 6) +
            (customize.lineHeight >= 1.3 && customize.lineHeight <= 1.6 ? 10 : 4) +
            (String(draft.summary || '').split(/\s+/).filter(Boolean).length <= 60 ? 8 : 4),
            30,
            96
        );

        const score = Math.round((formatting + keywords + structure + readability) / 4);
        const rating = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Needs Work' : 'Risky';
        const issues = [];

        if ((draft.skills || []).length < 5) {
            issues.push({ title: 'Expand your keyword coverage', detail: 'Add more role-specific skills so scanners can match more requirements.', severity: 'Moderate' });
        }
        if (!draft.summary) {
            issues.push({ title: 'Missing professional summary', detail: 'A short summary helps scanners and recruiters understand fit quickly.', severity: 'Critical' });
        }
        if ((draft.experience || []).every((item) => (item.bullets || []).length < 2)) {
            issues.push({ title: 'Add stronger achievement bullets', detail: 'Most ATS-friendly resumes use concise, action-led bullet points with outcomes.', severity: 'Critical' });
        }
        if (draft.templateId === 'modern' || customize.align === 'center') {
            issues.push({ title: 'Reduce decorative layout choices', detail: 'A simpler left-aligned structure is usually safer across older applicant tracking systems.', severity: 'Low' });
        }
        if (!(draft.projects || []).length) {
            issues.push({ title: 'Projects section is empty', detail: 'Projects often carry important technical keywords for early-career candidates.', severity: 'Moderate' });
        }

        while (issues.length < 3) {
            issues.push({ title: 'Tighten your contact and header formatting', detail: 'Keep the top of the page clean, readable, and easy for scanners to parse.', severity: 'Low' });
        }

        return {
            score: score,
            rating: rating,
            categories: {
                formatting: formatting,
                keywords: keywords,
                structure: structure,
                readability: readability
            },
            issues: issues.slice(0, 4),
            analyzedAt: new Date().toISOString()
        };
    }

    function buildItemCard(title, body, listName, index) {
        return `
            <div class="bg-surface-container-highest rounded-xl p-4 border border-outline-variant/10">
                <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                        <p class="font-headline font-bold text-on-surface">${escapeHtml(title)}</p>
                        <p class="text-sm text-on-surface-variant mt-1 leading-relaxed">${escapeHtml(body)}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <button type="button" class="w-9 h-9 rounded-full bg-surface-container-lowest hover:bg-surface-container transition-colors" data-action="edit-item" data-list="${listName}" data-index="${index}">
                            <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button type="button" class="w-9 h-9 rounded-full bg-surface-container-lowest hover:bg-error-container transition-colors" data-action="delete-item" data-list="${listName}" data-index="${index}">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderRepeatableLists(draft) {
        const educationRoot = document.querySelector('[data-list="education"]');
        const experienceRoot = document.querySelector('[data-list="experience"]');
        const projectsRoot = document.querySelector('[data-list="projects"]');
        const skillsRoot = document.querySelector('[data-list="skills"]');

        if (educationRoot) {
            educationRoot.innerHTML = (draft.education || []).length
                ? draft.education.map((item, index) => buildItemCard(item.degree, `${item.school} • ${item.period}`, 'education', index)).join('')
                : '<div class="text-sm text-on-surface-variant px-1">No education entries yet.</div>';
        }

        if (experienceRoot) {
            experienceRoot.innerHTML = (draft.experience || []).length
                ? draft.experience.map((item, index) => buildItemCard(item.role, `${item.company} • ${item.period}`, 'experience', index)).join('')
                : '<div class="text-sm text-on-surface-variant px-1">No experience entries yet.</div>';
        }

        if (projectsRoot) {
            projectsRoot.innerHTML = (draft.projects || []).length
                ? draft.projects.map((item, index) => buildItemCard(item.name, `${item.period} • ${item.detail}`, 'projects', index)).join('')
                : '<div class="text-sm text-on-surface-variant px-1">No project entries yet.</div>';
        }

        if (skillsRoot) {
            skillsRoot.innerHTML = (draft.skills || []).length
                ? `<div class="flex flex-wrap gap-3">${draft.skills.map((skill, index) => `
                    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-highest border border-outline-variant/10">
                        <span class="text-sm font-bold text-on-surface">${escapeHtml(skill)}</span>
                        <button type="button" class="w-6 h-6 rounded-full hover:bg-surface-container" data-action="delete-item" data-list="skills" data-index="${index}">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                `).join('')}</div>`
                : '<div class="text-sm text-on-surface-variant px-1">Add the keywords you want recruiters and ATS tools to notice.</div>';
        }
    }

    function renderPreview() {
        const activeResumeId = Store.ensureActiveResume({ createIfMissing: true });
        const draft = Store.getDraft(activeResumeId);
        document.querySelectorAll('[data-preview-root]').forEach((root) => {
            root.innerHTML = buildPreviewMarkup(draft);
        });
    }

    function updateActiveResumeLabels() {
        const activeResume = Store.getActiveResume();
        const profile = Store.getProfile() || buildDefaultProfile();
        const displayName = activeResume ? activeResume.name : `${(profile.title || 'New Resume').replace(/[^a-z0-9]+/gi, '_')}.pdf`;
        document.querySelectorAll('[data-active-resume-name]').forEach((node) => {
            node.textContent = displayName;
        });
    }

    function setResumeHeaderContext() {
        const activeResume = Store.getActiveResume();
        const profile = Store.getProfile() || buildDefaultProfile();
        document.querySelectorAll('[data-profile-name]').forEach((node) => { node.textContent = profile.name; });
        document.querySelectorAll('[data-profile-initials]').forEach((node) => { node.textContent = initials(profile.name); });
        document.querySelectorAll('[data-active-resume-role]').forEach((node) => { node.textContent = activeResume?.role || profile.title; });
    }

    function hydrateEditorBindings(draft) {
        document.querySelectorAll('[data-bind]').forEach((input) => {
            input.value = getByPath(draft, input.dataset.bind, '') || '';
        });
    }

    function initDashboardPage() {
        const profile = Store.ensureProfile();
        const resumes = Store.listResumes();
        const greeting = document.querySelector('[data-dashboard-greeting]');
        const cardsRoot = document.querySelector('[data-dashboard-resumes]');
        const atsMetric = document.querySelector('[data-metric="ats"]');
        const strengthMetric = document.querySelector('[data-metric="strength"]');
        const jdMetric = document.querySelector('[data-metric="jd"]');

        if (greeting) greeting.innerHTML = `${greetingForTime()}, <br class="md:hidden"/> ${escapeHtml(profile.name)}!`;
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
                <button type="button" class="group relative flex flex-col items-center justify-center p-12 border-4 border-dashed border-outline-variant/30 rounded-lg hover:border-primary/40 hover:bg-primary-fixed/20 transition-all gap-4 bg-transparent min-h-[300px]" data-action="create-resume">
                    <div class="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-lg shadow-primary/10">
                        <span class="material-symbols-outlined text-4xl">add</span>
                    </div>
                    <span class="text-xl font-extrabold text-primary">Start Fresh Resume</span>
                    <p class="text-sm text-on-surface-variant font-medium text-center">Use the editor, templates, and ATS tools together.</p>
                </button>
                <div class="col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-3 bg-surface-container-lowest p-6 rounded-lg shadow-xl shadow-surface-dim/40 border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
                    <div class="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center">
                        <span class="material-symbols-outlined text-3xl text-on-primary-container" style="font-variation-settings: 'FILL' 1;">pets</span>
                    </div>
                    <h3 class="text-xl font-extrabold text-on-surface">Your workspace is ready</h3>
                    <p class="text-sm text-on-surface-variant font-medium max-w-xs">Create a resume and MeowFolio will persist its content, template, customization, and analysis results locally.</p>
                </div>
            `;
            return;
        }

        if (resumesView === 'list') {
            container.className = 'grid grid-cols-1 gap-5';
            container.innerHTML = `
                <button type="button" class="group relative flex items-center p-6 border-2 border-dashed border-outline-variant/30 rounded-lg hover:border-primary/40 hover:bg-primary-fixed/20 transition-all gap-6 bg-surface-container-lowest" data-action="create-resume">
                    <div class="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-lg shadow-primary/10 shrink-0">
                        <span class="material-symbols-outlined text-2xl">add</span>
                    </div>
                    <div>
                        <span class="text-lg font-extrabold text-primary block">Start Fresh Resume</span>
                        <p class="text-sm text-on-surface-variant font-medium mt-1">Keep everything in the same local-first flow.</p>
                    </div>
                </button>
                ${resumes.map((resume) => `
                    <div class="bg-surface-container-lowest p-6 rounded-lg shadow-xl shadow-surface-dim/40 border border-outline-variant/10 flex items-center gap-6">
                        <div class="w-40 aspect-[4/3] rounded-md border border-outline-variant/20 bg-surface-container flex items-center justify-center shrink-0">
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
            <button type="button" class="group relative flex flex-col items-center justify-center p-12 border-4 border-dashed border-outline-variant/30 rounded-lg hover:border-primary/40 hover:bg-primary-fixed/20 transition-all gap-4 bg-transparent min-h-[300px]" data-action="create-resume">
                <div class="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-lg shadow-primary/10">
                    <span class="material-symbols-outlined text-4xl">add</span>
                </div>
                <span class="text-xl font-extrabold text-primary">Start Fresh Resume</span>
                <p class="text-sm text-on-surface-variant font-medium">Use the smart local-first builder</p>
            </button>
            ${resumes.map((resume) => `
                <div class="bg-surface-container-lowest p-6 rounded-lg shadow-xl shadow-surface-dim/40 border border-outline-variant/10 flex flex-col gap-6 group hover:-translate-y-2 transition-transform">
                    <div class="relative w-full aspect-[4/3] bg-surface-container rounded-md overflow-hidden border border-outline-variant/20 flex items-center justify-center">
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
                resumesView = 'grid';
                gridButton.classList.add('bg-surface-container-lowest', 'shadow-sm', 'text-primary');
                listButton?.classList.remove('bg-surface-container-lowest', 'shadow-sm', 'text-primary');
                renderResumesPage();
            });
        }
        if (listButton) {
            listButton.addEventListener('click', () => {
                resumesView = 'list';
                listButton.classList.add('bg-surface-container-lowest', 'shadow-sm', 'text-primary');
                gridButton?.classList.remove('bg-surface-container-lowest', 'shadow-sm', 'text-primary');
                renderResumesPage();
            });
        }
        renderResumesPage();
    }

    function initProfilePage() {
        const profile = Store.ensureProfile();
        const bindings = {
            fullName: profile.name,
            email: profile.email,
            phone: profile.phone,
            college: profile.college,
            degree: profile.degree,
            branch: profile.branch,
            year: profile.year
        };

        Object.keys(bindings).forEach((name) => {
            const input = document.querySelector(`[name="${name}"]`);
            if (input) input.value = bindings[name] || '';
        });

        const headerName = document.querySelector('[data-profile-header-name]');
        const initialsNode = document.querySelector('[data-profile-initials]');
        const avatarPreview = document.getElementById('avatarPreview');
        if (headerName) headerName.textContent = profile.name;
        if (initialsNode) initialsNode.textContent = initials(profile.name);

        if (profile.avatar && avatarPreview) {
            avatarPreview.src = profile.avatar;
            avatarPreview.classList.remove('hidden');
            initialsNode?.classList.add('hidden');
        }

        const avatarUpload = document.getElementById('avatarUpload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (event) => {
                const file = event.target.files && event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const result = String(reader.result || '');
                    Store.updateProfile({ avatar: result });
                    if (avatarPreview) {
                        avatarPreview.src = result;
                        avatarPreview.classList.remove('hidden');
                    }
                    initialsNode?.classList.add('hidden');
                    UI.showToast('Avatar updated locally.', 'success');
                };
                reader.readAsDataURL(file);
            });
        }
    }

    function saveProfileFromForm() {
        const patch = {
            name: document.querySelector('[name="fullName"]')?.value?.trim() || '',
            email: document.querySelector('[name="email"]')?.value?.trim() || '',
            phone: document.querySelector('[name="phone"]')?.value?.trim() || '',
            college: document.querySelector('[name="college"]')?.value?.trim() || '',
            degree: document.querySelector('[name="degree"]')?.value?.trim() || '',
            branch: document.querySelector('[name="branch"]')?.value?.trim() || '',
            year: document.querySelector('[name="year"]')?.value || ''
        };
        if (!patch.name || !patch.email) {
            UI.showToast('Name and email are required.', 'error');
            return;
        }
        Store.updateProfile(patch);
        initProfilePage();
        UI.showToast('Profile updated successfully.', 'success');
    }

    function initEditorContentPage() {
        const resumeId = Store.ensureActiveResume({ createIfMissing: true });
        const draft = Store.getDraft(resumeId);
        hydrateEditorBindings(draft);
        renderRepeatableLists(draft);
        renderPreview();
        updateActiveResumeLabels();
        setResumeHeaderContext();
    }

    function initEditorTemplatesPage() {
        Store.ensureActiveResume({ createIfMissing: true });
        const draft = Store.getDraft(Store.ensureActiveResume({ createIfMissing: true }));
        templatesFilter = templatesFilter || 'All';

        document.querySelectorAll('[data-template-filter]').forEach((button) => {
            const active = button.dataset.templateFilter === templatesFilter;
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
            const visible = templatesFilter === 'All' || TEMPLATE_FAMILIES[card.dataset.templateId] === templatesFilter;
            card.classList.toggle('active', active);
            card.style.display = visible ? '' : 'none';
        });

        renderPreview();
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

    function promptForEducation(existing) {
        const school = window.prompt('School or university', existing?.school || '');
        if (!school) return null;
        const degree = window.prompt('Degree or credential', existing?.degree || '');
        if (!degree) return null;
        const period = window.prompt('Year or date range', existing?.period || '');
        const detail = window.prompt('Optional supporting detail', existing?.detail || '') || '';
        return { school, degree, period, detail };
    }

    function promptForExperience(existing) {
        const role = window.prompt('Role title', existing?.role || '');
        if (!role) return null;
        const company = window.prompt('Company or team', existing?.company || '');
        if (!company) return null;
        const period = window.prompt('Date range', existing?.period || '');
        const bulletsRaw = window.prompt('Achievements, separated by |', existing ? existing.bullets.join(' | ') : '');
        const bullets = String(bulletsRaw || '').split('|').map((item) => item.trim()).filter(Boolean);
        return { role, company, period, bullets: bullets.length ? bullets : ['Describe a measurable outcome here.'] };
    }

    function promptForProject(existing) {
        const name = window.prompt('Project name', existing?.name || '');
        if (!name) return null;
        const period = window.prompt('Date or timeframe', existing?.period || '');
        const detail = window.prompt('Project description', existing?.detail || '');
        if (!detail) return null;
        return { name, period, detail };
    }

    function promptForSkill(existing) {
        const skill = window.prompt('Skill or keyword', existing || '');
        return skill ? skill.trim() : null;
    }

    function updateCustomizeSetting(setting, value) {
        const resumeId = Store.ensureActiveResume({ createIfMissing: true });
        Store.updateDraft(resumeId, (draft) => {
            draft.customize = mergeDeep(draft.customize || {}, { [setting]: value });
            return draft;
        });
        initEditorCustomizePage();
    }

    function handleClickAction(event) {
        const trigger = event.target.closest('[data-action]');
        if (!trigger) return;

        const action = trigger.dataset.action;
        const resumeId = trigger.dataset.resumeId;
        const listName = trigger.dataset.list;
        const itemIndex = Number(trigger.dataset.index);

        switch (action) {
            case 'start-building':
                event.preventDefault();
                UI.navigate(Store.isAuthenticated() ? 'editor-content.html' : 'signup.html');
                return;
            case 'go-login':
                event.preventDefault();
                UI.navigate('login.html');
                return;
            case 'login-local':
                event.preventDefault();
                Store.signInLocal('login');
                UI.showToast('You are signed in locally.', 'success');
                UI.navigate('index.html');
                return;
            case 'signup-local':
                event.preventDefault();
                Store.signInLocal('signup');
                UI.showToast('Your local MeowFolio workspace is ready.', 'success');
                UI.navigate('index.html');
                return;
            case 'logout':
                event.preventDefault();
                Store.logout();
                return;
            case 'create-resume':
                event.preventDefault();
                Store.createResume({ activate: true });
                UI.showToast('Started a new resume.', 'success');
                UI.navigate('editor-content.html');
                return;
            case 'edit-resume':
                event.preventDefault();
                if (resumeId) Store.setActiveResumeId(resumeId);
                UI.navigate('editor-content.html');
                return;
            case 'delete-resume':
                event.preventDefault();
                if (!resumeId) return;
                if (window.confirm('Delete this resume and its saved analysis results?')) {
                    Store.deleteResume(resumeId);
                    UI.showToast('Resume deleted.', 'success');
                    initDashboardPage();
                    initResumesPage();
                    updateActiveResumeLabels();
                }
                return;
            case 'export-resume':
            case 'export-active-resume':
                event.preventDefault();
                exportResume(resumeId);
                return;
            case 'share-page':
                event.preventDefault();
                if (navigator.share) {
                    navigator.share({ title: document.title, url: window.location.href }).catch(() => {});
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href).then(() => UI.showToast('Page link copied.', 'success')).catch(() => UI.showToast('Could not copy the page link.', 'error'));
                }
                return;
            case 'save-profile':
                event.preventDefault();
                saveProfileFromForm();
                return;
            case 'reset-profile':
                event.preventDefault();
                initProfilePage();
                UI.showToast('Profile reset to the saved version.', 'info');
                return;
            case 'save-draft':
                event.preventDefault();
                Store.syncResumeMeta(Store.ensureActiveResume({ createIfMissing: true }));
                UI.showToast('Draft saved locally.', 'success');
                return;
            case 'add-education':
            case 'add-experience':
            case 'add-project':
            case 'add-skill': {
                event.preventDefault();
                const resumeIdToEdit = Store.ensureActiveResume({ createIfMissing: true });
                let item = null;
                let key = '';
                if (action === 'add-education') { item = promptForEducation(); key = 'education'; }
                if (action === 'add-experience') { item = promptForExperience(); key = 'experience'; }
                if (action === 'add-project') { item = promptForProject(); key = 'projects'; }
                if (action === 'add-skill') { item = promptForSkill(); key = 'skills'; }
                if (!item) return;
                Store.updateDraft(resumeIdToEdit, (draft) => {
                    draft[key] = draft[key] || [];
                    draft[key].push(item);
                    return draft;
                });
                initEditorContentPage();
                UI.showToast('Section updated.', 'success');
                return;
            }
            case 'edit-item': {
                event.preventDefault();
                const resumeIdToEdit = Store.ensureActiveResume({ createIfMissing: true });
                const draft = Store.getDraft(resumeIdToEdit);
                if (!draft || !listName || Number.isNaN(itemIndex)) return;
                let nextItem = null;
                if (listName === 'education') nextItem = promptForEducation(draft.education[itemIndex]);
                if (listName === 'experience') nextItem = promptForExperience(draft.experience[itemIndex]);
                if (listName === 'projects') nextItem = promptForProject(draft.projects[itemIndex]);
                if (listName === 'skills') nextItem = promptForSkill(draft.skills[itemIndex]);
                if (!nextItem) return;
                Store.updateDraft(resumeIdToEdit, (current) => {
                    current[listName][itemIndex] = nextItem;
                    return current;
                });
                initEditorContentPage();
                UI.showToast('Item updated.', 'success');
                return;
            }
            case 'delete-item': {
                event.preventDefault();
                const resumeIdToEdit = Store.ensureActiveResume({ createIfMissing: true });
                Store.updateDraft(resumeIdToEdit, (draft) => {
                    draft[listName].splice(itemIndex, 1);
                    return draft;
                });
                initEditorContentPage();
                UI.showToast('Item removed.', 'success');
                return;
            }
            case 'rewrite-summary':
                event.preventDefault();
                Store.updateDraft(Store.ensureActiveResume({ createIfMissing: true }), (draft) => {
                    const skillPhrase = (draft.skills || []).slice(0, 3).join(', ');
                    draft.summary = `${draft.personal.title || 'Candidate'} with a track record of shipping thoughtful work across ${skillPhrase || 'design, product, and delivery'}. Known for turning ambiguous problems into clear, measurable outcomes.`;
                    return draft;
                });
                initEditorContentPage();
                UI.showToast('Summary refreshed with a stronger lead.', 'success');
                return;
            case 'confirm-template':
                event.preventDefault();
                UI.navigate('editor-customize.html');
                return;
            case 'reset-customize':
                event.preventDefault();
                Store.updateDraft(Store.ensureActiveResume({ createIfMissing: true }), (draft) => {
                    draft.customize = clone(DEFAULT_CUSTOMIZE);
                    return draft;
                });
                initEditorCustomizePage();
                UI.showToast('Customization reset to defaults.', 'info');
                return;
            case 'apply-customize':
                event.preventDefault();
                Store.syncResumeMeta(Store.ensureActiveResume({ createIfMissing: true }));
                UI.showToast('Customization applied.', 'success');
                UI.navigate('editor-content.html');
                return;
            case 'run-jd-analysis':
                event.preventDefault();
                runJDAnalysis();
                return;
            case 'run-ats-scan':
                event.preventDefault();
                runATSAnalysis();
                return;
            case 'cycle-active-resume':
                event.preventDefault();
                Store.cycleActiveResume({ createIfMissing: true });
                updateActiveResumeLabels();
                renderPreview();
                if (getCurrentPage() === 'jd-results') renderJDResultsPage();
                if (getCurrentPage() === 'ats-report') renderATSReportPage();
                UI.showToast('Active resume switched.', 'info');
                return;
            case 'open-jd-suggestions':
            case 'open-ats-suggestions':
                event.preventDefault();
                UI.showToast('Opening the editor so you can apply the suggestions.', 'info');
                UI.navigate('editor-content.html');
                return;
            default:
                return;
        }
    }

    function handleInputBinding(event) {
        const input = event.target.closest('[data-bind]');
        if (!input) return;
        const resumeId = Store.ensureActiveResume({ createIfMissing: true });
        Store.updateDraft(resumeId, (draft) => setByPath(draft, input.dataset.bind, input.value));
        renderPreview();
        Store.syncResumeMeta(resumeId);
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
        templatesFilter = button.dataset.templateFilter;
        initEditorTemplatesPage();
    }

    function replaceTextNodes(matcher, replacer) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach((node) => {
            const value = node.nodeValue || '';
            if (matcher(value)) node.nodeValue = replacer(value);
        });
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

    function applyRouteGuards() {
        const page = getCurrentPage();
        if (page in RETIRED_REDIRECTS) {
            UI.navigate(RETIRED_REDIRECTS[page]);
            return false;
        }
        if (APP_PAGES.has(page) && !Store.isAuthenticated()) {
            UI.navigate('login.html');
            return false;
        }
        if (AUTH_PAGES.has(page) && Store.isAuthenticated()) {
            UI.navigate('index.html');
            return false;
        }
        return true;
    }

    function bootstrapCorePage() {
        switch (getCurrentPage()) {
            case 'index':
            case 'dashboard':
                initDashboardPage();
                break;
            case 'resumes':
                initResumesPage();
                break;
            case 'profile':
                initProfilePage();
                break;
            case 'editor-content':
                initEditorContentPage();
                break;
            case 'editor-templates':
                initEditorTemplatesPage();
                break;
            case 'editor-customize':
                initEditorCustomizePage();
                break;
            case 'jd-analyzer':
                initJDAnalyzerPage();
                break;
            case 'jd-results':
                renderJDResultsPage();
                break;
            case 'ats-scorer':
                initAtsScorerPage();
                break;
            case 'ats-report':
                renderATSReportPage();
                break;
            default:
                break;
        }
    }

    function initSharedBehaviors() {
        document.addEventListener('click', handleClickAction);
        document.addEventListener('click', handleCustomizeInteraction);
        document.addEventListener('click', handleTemplateSelection);
        document.addEventListener('click', handleTemplateFilter);
        document.addEventListener('input', handleInputBinding);
        document.addEventListener('input', handleCustomizeRange);
        document.addEventListener('change', handleCustomizeRange);
    }

    function initPage() {
        migrateLegacyData();
        UI.ensureToastContainer();
        initSharedBehaviors();
        if (!applyRouteGuards()) return;

        updateLegalBranding();
        initLandingLikePages();
        initLearnPage();
        initChapterPage();
        initErrorPages();
        bootstrapCorePage();
        updateActiveResumeLabels();
        setResumeHeaderContext();
    }

    window.AppState = {
        init: initPage,
        getUser: () => Store.getProfile() || buildDefaultProfile(),
        updateUser: (patch) => Store.updateProfile(patch),
        getResumes: () => Store.listResumes(),
        addResume: () => Store.createResume({ activate: true }),
        deleteResume: (id) => Store.deleteResume(String(id)),
        getActiveResume: () => Store.getActiveResume(),
        getDraft: (id) => Store.getDraft(String(id)),
        updateDraft: (id, updater) => Store.updateDraft(String(id), updater),
        ensureActiveResume: (options) => Store.ensureActiveResume(options),
        logout: () => Store.logout()
    };

    window.UI = UI;
    window.deleteResumeUI = function deleteResumeUI(resumeId) {
        Store.deleteResume(String(resumeId));
        initDashboardPage();
        initResumesPage();
        UI.showToast('Resume deleted.', 'success');
    };

    document.addEventListener('DOMContentLoaded', initPage);
})();
