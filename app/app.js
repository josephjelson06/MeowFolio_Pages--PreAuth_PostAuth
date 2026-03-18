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
    }
};

// --- UI INTERACTIONS ---
const UI = {
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
});
