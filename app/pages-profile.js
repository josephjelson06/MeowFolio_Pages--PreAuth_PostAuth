(function () {
    function createMeowFolioProfileModule(runtime) {
        const { Store, UI, initials } = runtime;

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

        return {
            initProfilePage,
            saveProfileFromForm
        };
    }

    window.createMeowFolioProfileModule = createMeowFolioProfileModule;
})();
