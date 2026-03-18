/**
 * MeowFolio - Primary Application Logic
 * Handles state management, UI interactions, mock data, and navigation.
 */

// --- STATE MANAGEMENT ---
const AppState = {
    MOCK_RESUMES: [
        { id: 1, name: "Senior_UX_Designer.pdf", role: "Senior UX Designer", updated: "2 hours ago", completion: 85, score: 92 },
        { id: 2, name: "Product_Manager_Tech.pdf", role: "Product Manager", updated: "1 day ago", completion: 100, score: 88 }
    ],
    
    init() {
        if (!localStorage.getItem('meowfolio_user')) {
            localStorage.setItem('meowfolio_user', JSON.stringify({
                name: "Alexander Thompson",
                title: "Senior Product Designer",
                email: "alex@dreamscape.io",
                location: "San Francisco, CA",
                bio: "Passionate Product Designer with 8+ years of experience in building scalable design systems."
            }));
        }
        
        if (!localStorage.getItem('meowfolio_resumes')) {
            localStorage.setItem('meowfolio_resumes', JSON.stringify(this.MOCK_RESUMES));
        }
    },
    
    getUser() { return JSON.parse(localStorage.getItem('meowfolio_user') || '{}'); },
    updateUser(data) {
        const user = { ...this.getUser(), ...data };
        localStorage.setItem('meowfolio_user', JSON.stringify(user));
        return user;
    },
    
    getResumes() { return JSON.parse(localStorage.getItem('meowfolio_resumes') || '[]'); },
    addResume(resume) {
        const resumes = this.getResumes();
        resume.id = Date.now();
        resumes.push(resume);
        localStorage.setItem('meowfolio_resumes', JSON.stringify(resumes));
        return resume;
    },
    deleteResume(id) {
        let resumes = this.getResumes();
        resumes = resumes.filter(r => r.id !== id);
        localStorage.setItem('meowfolio_resumes', JSON.stringify(resumes));
    },
    
    logout() {
        localStorage.removeItem('meowfolio_user');
        localStorage.removeItem('meowfolio_resumes'); // Or keep them, but clearing simulates full logout
        window.location.href = 'editor-preview.html'; // Fallback to landing/preview
    }
};

// --- UI INTERACTIONS ---
const UI = {
    // 0. Componentize Top Nav
    injectNavbar() {
        // Skip for editor-preview as it has a custom pre-auth nav
        if (window.location.pathname.includes('editor-preview.html')) return;

        const user = AppState.getUser();
        // Fallback initials if no avatar
        const initials = user.name ? user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'U';
        
        const avatarContent = user.avatar 
            ? `<img alt="User avatar" src="${user.avatar}" class="w-full h-full object-cover" />`
            : `<div class="w-full h-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-headline font-extrabold text-sm">${initials}</div>`;

        const navHtml = `
<!-- Mobile Sidebar Overlay -->
<div id="mobile-sidebar-overlay" class="fixed inset-0 bg-black/50 z-[60] opacity-0 pointer-events-none transition-opacity duration-300"></div>

<!-- Mobile Sidebar -->
<div id="mobile-sidebar" class="fixed top-0 left-0 h-full w-64 bg-surface-container-lowest shadow-2xl z-[70] transform -translate-x-full transition-transform duration-300 flex flex-col">
    <div class="p-6 border-b border-outline-variant/20 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-2xl" style="font-variation-settings: 'FILL' 1;">pets</span>
            <span class="font-headline font-bold text-lg">MeowFolio</span>
        </div>
        <button id="mobile-close-btn" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
            <span class="material-symbols-outlined">close</span>
        </button>
    </div>
    <div class="flex flex-col py-2 overflow-y-auto">
        <a class="mobile-nav-link flex items-center gap-4 px-6 py-4 font-label font-bold text-on-surface-variant hover:bg-surface-container transition-colors" href="index.html">
            <span class="material-symbols-outlined text-xl">dashboard</span> Dashboard
        </a>
        <a class="mobile-nav-link flex items-center gap-4 px-6 py-4 font-label font-bold text-on-surface-variant hover:bg-surface-container transition-colors" href="resumes.html">
            <span class="material-symbols-outlined text-xl">description</span> Resumes
        </a>
        <a class="mobile-nav-link flex items-center gap-4 px-6 py-4 font-label font-bold text-on-surface-variant hover:bg-surface-container transition-colors" href="jd-analyzer.html">
            <span class="material-symbols-outlined text-xl">troubleshoot</span> JD Analyzer
        </a>
        <a class="mobile-nav-link flex items-center gap-4 px-6 py-4 font-label font-bold text-on-surface-variant hover:bg-surface-container transition-colors" href="ats-scorer.html">
            <span class="material-symbols-outlined text-xl">fact_check</span> ATS Scorer
        </a>
    </div>
</div>

<nav class="sticky top-0 z-[50] bg-background/80 backdrop-blur-xl border-b-2 border-on-surface/10 px-4 md:px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-2 md:gap-4">
        <!-- Hamburger Button (Mobile Only) -->
        <button id="mobile-menu-btn" class="lg:hidden w-10 h-10 flex items-center justify-center text-on-surface hover:bg-surface-container rounded-full transition-colors">
            <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center tactile-card cursor-pointer" onclick="window.location.href='index.html'">
            <span class="material-symbols-outlined text-on-primary-container" style="font-variation-settings: 'FILL' 1;">pets</span>
        </div>
        <span class="font-headline font-bold text-xl tracking-tight cursor-pointer hidden sm:block" onclick="window.location.href='index.html'">MeowFolio</span>
    </div>
    <!-- Center Navigation Links -->
    <div class="hidden lg:flex items-center gap-8">
        <a class="font-label text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors" href="index.html">Dashboard</a>
        <a class="font-label text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors" href="resumes.html">Resumes</a>
        <a class="font-label text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors" href="jd-analyzer.html">JD Analyzer</a>
        <a class="font-label text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors" href="ats-scorer.html">ATS Scorer</a>
    </div>
    <div class="flex items-center gap-2 md:gap-6">
        <a href="editor-content.html" class="chunky-button bg-primary text-on-primary px-5 py-2 rounded-full font-label font-bold text-sm hidden sm:block text-center no-underline">
            Create New
        </a>
        <div class="flex items-center gap-1 md:gap-4">
            <button class="hidden md:flex w-10 h-10 items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors rounded-full">
                <span class="material-symbols-outlined">notifications</span>
            </button>
            <button class="hidden md:flex w-10 h-10 items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors rounded-full">
                <span class="material-symbols-outlined">settings</span>
            </button>
            <!-- User Avatar with Dropdown -->
            <div class="relative group">
                <button class="flex items-center gap-1 p-1 rounded-full border-2 border-on-surface hover:ring-4 ring-primary/20 transition-all">
                    <div class="w-8 h-8 rounded-full overflow-hidden">
                        ${avatarContent}
                    </div>
                    <span class="material-symbols-outlined text-sm hidden sm:block">arrow_drop_down</span>
                </button>
                <!-- Dropdown Menu -->
                <div class="dropdown-menu hidden absolute right-0 mt-2 w-48 bg-white border-2 border-on-surface rounded-xl shadow-[4px_4px_0px_0px_rgba(28,28,24,1)] overflow-hidden">
                    <a class="flex items-center gap-3 px-4 py-3 text-sm font-label font-bold text-on-surface hover:bg-surface-container transition-colors" href="profile.html">
                        <span class="material-symbols-outlined text-lg">person</span>
                        My Profile
                    </a>
                    <div class="h-[1px] bg-on-surface/10"></div>
                    <a class="flex items-center gap-3 px-4 py-3 text-sm font-label font-bold text-error hover:bg-error-container transition-colors" href="index.html" id="global-logout">
                        <span class="material-symbols-outlined text-lg">logout</span>
                        Logout
                    </a>
                </div>
            </div>
        </div>
    </div>
</nav>`;

        // Remove existing nav if present
        const existingNav = document.querySelector('nav');
        if (existingNav) {
            existingNav.remove();
        }
        
        // Inject new nav
        document.body.insertAdjacentHTML('afterbegin', navHtml);
    },

    initMobileNav() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const closeBtn = document.getElementById('mobile-close-btn');
        const sidebar = document.getElementById('mobile-sidebar');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        
        if (!menuBtn || !sidebar || !overlay) return;

        function toggleMenu() {
            const isOpen = sidebar.classList.contains('translate-x-0');
            if (isOpen) {
                sidebar.classList.remove('translate-x-0');
                sidebar.classList.add('-translate-x-full');
                overlay.classList.remove('opacity-100', 'pointer-events-auto');
                overlay.classList.add('opacity-0', 'pointer-events-none');
            } else {
                sidebar.classList.remove('-translate-x-full');
                sidebar.classList.add('translate-x-0');
                overlay.classList.remove('opacity-0', 'pointer-events-none');
                overlay.classList.add('opacity-100', 'pointer-events-auto');
            }
        }

        menuBtn.addEventListener('click', toggleMenu);
        closeBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
    },

    // 1. Page Transitions
    initPageTransition() {
        document.body.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        // Small timeout ensures styles are calculated before fading in
        setTimeout(() => document.body.classList.remove('opacity-0'), 50);
    },
    
    // 2. Auto-magical Active Nav highlighting
    initActiveNav() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        
        // Strip hardcoded active classes first
        document.querySelectorAll('nav a, nav button').forEach(el => {
            el.classList.remove('nav-link-active', 'active', 'text-primary', 'border-primary', 'border-b-2');
            if (el.classList.contains('text-primary') && el.closest('.bg-white')) {
                // Keep the pill style on editor-content mostly intact, just strip specific text classes if needed
            } else {
                el.classList.add('text-on-surface-variant'); // Reset to default
            }
        });

        // Find and highlight correct link
        let targetHrefs = [];
        if (page.includes('index')) targetHrefs = ['index.html'];
        else if (page.includes('resume')) targetHrefs = ['resumes.html'];
        else if (page.includes('editor')) targetHrefs = ['resumes.html', 'editor-content.html'];
        else if (page.includes('jd')) targetHrefs = ['jd-analyzer.html', 'jd-results.html'];
        else if (page.includes('ats')) targetHrefs = ['ats-scorer.html', 'ats-report.html'];
        else if (page.includes('profile')) targetHrefs = ['profile.html'];

        targetHrefs.forEach(href => {
            const link = document.querySelector(`nav a[href="${href}"]`);
            if (link) {
                link.classList.remove('text-on-surface-variant');
                link.classList.add('text-primary');
                
                // Add correct underline based on page layout
                if (link.classList.contains('nav-link')) {
                    link.classList.add('active');
                } else {
                    link.classList.add('font-bold');
                    // Avoid adding underline to the pill style on editor-content
                    if (!link.closest('.bg-white')) {
                         link.classList.add('border-b-2', 'border-primary'); // Fallback style if nav-link-active is removed from page CSS
                         // Add the specific class from shared.css if available
                         link.classList.add('nav-link-active');
                    }
                }
            }
        });
    },

    // 3. Toast Notifications
    showToast(message, type = 'success') {
        const icon = type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'info');
        const colorClass = type === 'success' ? 'bg-tertiary text-on-tertiary' : 
                          (type === 'error' ? 'bg-error text-on-error' : 'bg-primary-container text-on-primary-container');
        
        const toast = document.createElement('div');
        toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 ${colorClass} px-6 py-3 rounded-full paper-shadow flex items-center gap-3 z-[100] transform translate-y-10 opacity-0 transition-all duration-300`;
        toast.innerHTML = `
            <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">${icon}</span>
            <span class="font-label font-bold text-sm tracking-wide">${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-10', 'opacity-0');
        });
        
        // Remove after 3s
        setTimeout(() => {
            toast.classList.add('translate-y-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // 4. Mochii Mascot Tips
    initMochiiTips() {
        const mochiBubble = document.querySelector('.group .absolute.opacity-0 p');
        if (!mochiBubble) return;
        
        const tips = [
            "Use action verbs to start bullets! ✨",
            "Keep it under 2 pages if possible! 🐾",
            "Numbers help prove your impact! 📈",
            "Match keywords from the JD! 🎯",
            "I'm keeping an eye out for typos! 👀"
        ];
        
        const mochiContainer = mochiBubble.closest('.group');
        
        // On hover, pick a random tip
        mochiContainer.addEventListener('mouseenter', () => {
            mochiBubble.textContent = tips[Math.floor(Math.random() * tips.length)];
        });
        
        // Interactive click
        mochiContainer.addEventListener('click', () => {
            UI.showToast("Mochii says you're doing great! 🐾", "info");
        });
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
    
    // Inject global navbar before highlighting active links
    UI.injectNavbar();
    UI.initMobileNav();
    
    UI.initPageTransition();
    
    // We delay nav highlighting slightly to let any framework/inline scripts finish, 
    // though not strictly necessary in pure HTML. Let's do it immediately.
    UI.initActiveNav();
    UI.initMochiiTips();
    
    // Global Event Listeners for common buttons
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.trim().toLowerCase();
        
        if (text.includes('save draft') || text.includes('apply changes')) {
            btn.addEventListener('click', (e) => {
                if(btn.tagName === 'BUTTON') {
                    UI.showToast("Changes saved successfully!");
                }
            });
        }
        else if (text.includes('copy link') || text.includes('share')) {
            btn.addEventListener('click', () => {
                UI.showToast("Link copied to clipboard!");
            });
        }
    });

    // Global Logout Listener for dropdown items
    document.querySelectorAll('a').forEach(link => {
        if (link.textContent.toLowerCase().includes('logout')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                UI.showToast("Logging out...", "info");
                setTimeout(() => AppState.logout(), 800);
            });
        }
    });

    // Intercept "Create New" or "Start Fresh"
    document.querySelectorAll('a[href="editor-content.html"]').forEach(btn => {
        if (btn.textContent.toLowerCase().includes('create new') || btn.textContent.toLowerCase().includes('start fresh')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                AppState.addResume({
                    name: "Untitled_Resume.pdf",
                    role: "New Role",
                    updated: "Just now",
                    completion: 10,
                    score: 0
                });
                window.location.href = 'editor-content.html';
            });
        }
    });
});

// Global helper for inline onclick handlers
window.deleteResumeUI = function(id) {
    if(confirm("Are you sure you want to delete this resume?")) {
        AppState.deleteResume(id);
        UI.showToast("Resume deleted", "success");
        setTimeout(() => window.location.reload(), 1000);
    }
};
