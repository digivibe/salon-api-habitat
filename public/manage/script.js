// Configuration API v2
const API_BASE = '/api/v2';
const AUTH_API_BASE = '/api/v2/auth';
const ADMIN_API_BASE = '/api/v2/admin';
const SALON_API_BASE = '/api/v2/salons';
const APP_API_BASE = '/api/v2/app';
const QRCODE_API_BASE = '/api/v2/qrcode';

// State
let token = localStorage.getItem('adminToken');
let currentPage = 1;
let allExposants = [];
let categories = [];
let salons = [];
let currentPageName = 'dashboard';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }

    // Event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('editForm').addEventListener('submit', handleEdit);
    
    // Navigation menu
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.querySelector('aside').classList.toggle('open');
        });
    }

    // Filters
    const searchInput = document.getElementById('searchInput');
    const filterValid = document.getElementById('filterValid');
    const filterStatus = document.getElementById('filterStatus');
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterValid) filterValid.addEventListener('change', applyFilters);
    if (filterStatus) filterStatus.addEventListener('change', applyFilters);

    // Toggle password visibility
    const togglePasswordBtn = document.getElementById('togglePassword');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eyeIcon');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            }
        });
    }

    // Category salon filter
    const categorySalonFilter = document.getElementById('categorySalonFilter');
    if (categorySalonFilter) {
        categorySalonFilter.addEventListener('change', loadCategoriesList);
    }

    // Create category form
    const createCategoryForm = document.getElementById('createCategoryForm');
    if (createCategoryForm) {
        createCategoryForm.addEventListener('submit', handleCreateCategory);
    }

    // Color picker sync
    const createCategoryColor = document.getElementById('createCategoryColor');
    const createCategoryColorHex = document.getElementById('createCategoryColorHex');
    const createCategoryBorderColor = document.getElementById('createCategoryBorderColor');
    const createCategoryBorderColorHex = document.getElementById('createCategoryBorderColorHex');

    if (createCategoryColor && createCategoryColorHex) {
        createCategoryColor.addEventListener('input', (e) => {
            createCategoryColorHex.value = e.target.value.toUpperCase();
        });
        createCategoryColorHex.addEventListener('input', (e) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                createCategoryColor.value = e.target.value;
            }
        });
    }

    if (createCategoryBorderColor && createCategoryBorderColorHex) {
        createCategoryBorderColor.addEventListener('input', (e) => {
            createCategoryBorderColorHex.value = e.target.value.toUpperCase();
        });
        createCategoryBorderColorHex.addEventListener('input', (e) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                createCategoryBorderColor.value = e.target.value;
            }
        });
    }

    // Create event form
    const createEventForm = document.getElementById('createEventForm');
    if (createEventForm) {
        createEventForm.addEventListener('submit', handleCreateEvent);
    }

    // Edit event form
    const editEventForm = document.getElementById('editEventForm');
    if (editEventForm) {
        editEventForm.addEventListener('submit', handleEditEvent);
    }

    // Create salon form
    const createSalonForm = document.getElementById('createSalonForm');
    if (createSalonForm) {
        createSalonForm.addEventListener('submit', handleCreateSalon);
    }

    // Edit salon form
    const editSalonForm = document.getElementById('editSalonForm');
    if (editSalonForm) {
        editSalonForm.addEventListener('submit', handleEditSalon);
    }

    // Salon description character counters
    const createSalonDescription = document.getElementById('createSalonDescription');
    if (createSalonDescription) {
        createSalonDescription.addEventListener('input', (e) => {
            const count = document.getElementById('createSalonDescriptionCount');
            if (count) count.textContent = e.target.value.length;
        });
    }

    const editSalonDescription = document.getElementById('editSalonDescription');
    if (editSalonDescription) {
        editSalonDescription.addEventListener('input', (e) => {
            const count = document.getElementById('editSalonDescriptionCount');
            if (count) count.textContent = e.target.value.length;
        });
    }

    // Description character counters
    const createEventDescription = document.getElementById('createEventDescription');
    if (createEventDescription) {
        createEventDescription.addEventListener('input', (e) => {
            const count = document.getElementById('createEventDescriptionCount');
            if (count) count.textContent = e.target.value.length;
        });
    }

    const editEventDescription = document.getElementById('editEventDescription');
    if (editEventDescription) {
        editEventDescription.addEventListener('input', (e) => {
            const count = document.getElementById('editEventDescriptionCount');
            if (count) count.textContent = e.target.value.length;
        });
    }

    // Close modals on outside click
    document.getElementById('createEventModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'createEventModal') {
            closeCreateEventModal();
        }
    });

    document.getElementById('editEventModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'editEventModal') {
            closeEditEventModal();
        }
    });

    // Create invite form
    const createInviteForm = document.getElementById('createInviteForm');
    if (createInviteForm) {
        createInviteForm.addEventListener('submit', handleCreateInvite);
    }

    // Edit invite form
    const editInviteForm = document.getElementById('editInviteForm');
    if (editInviteForm) {
        editInviteForm.addEventListener('submit', handleEditInvite);
    }

    // Invite filters
    const inviteSearchInput = document.getElementById('inviteSearchInput');
    const inviteFilterStatus = document.getElementById('inviteFilterStatus');
    if (inviteSearchInput) inviteSearchInput.addEventListener('input', applyInviteFilters);
    if (inviteFilterStatus) inviteFilterStatus.addEventListener('change', applyInviteFilters);

    // Close invite modals on outside click
    document.getElementById('createInviteModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'createInviteModal') {
            closeCreateInviteModal();
        }
    });

    document.getElementById('editInviteModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'editInviteModal') {
            closeEditInviteModal();
        }
    });
});

// Navigation
function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('dashboardScreen').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.remove('hidden');
    
    loadSalons();
    loadCategories();
    navigateToPage('dashboard');
}

function navigateToPage(pageName) {
    currentPageName = pageName;
    
    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        }
    });

    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });

    // Show selected page
    const pageElement = document.getElementById(`page-${pageName}`);
    if (pageElement) {
        pageElement.classList.remove('hidden');
    }

    // Update page title
    const titles = {
        dashboard: 'Tableau de bord',
        exposants: 'Exposants',
        salons: 'Salons',
        categories: 'Catégories',
        events: 'Événements',
        invites: 'Invités'
    };
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[pageName] || 'Administration';
    }

    // Load page-specific data
    switch(pageName) {
        case 'dashboard':
            loadStats();
            break;
        case 'exposants':
            loadExposants();
            break;
        case 'salons':
            loadSalonsList();
            break;
        case 'categories':
            loadCategoriesList();
            break;
        case 'events':
            loadEventsList();
            break;
        case 'invites':
            loadInvitesList();
            break;
    }
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const loginRes = await fetch(`${AUTH_API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email.trim().toLowerCase(),
                password
            })
        });

        const loginData = await loginRes.json();

        if (loginData.success && loginData.data && loginData.data.token) {
            token = loginData.data.token;
            localStorage.setItem('adminToken', token);

            // Check if user is admin
            const statsRes = await fetch(`${ADMIN_API_BASE}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (statsRes.status === 403 || statsRes.status === 401) {
                showError("Accès refusé. Droits d'administrateur requis.");
                localStorage.removeItem('adminToken');
                token = null;
                return;
            }

            if (!statsRes.ok) {
                throw new Error('Erreur de connexion');
            }

            // Success
            const adminNameEl = document.getElementById('adminName');
            if (adminNameEl) {
                adminNameEl.textContent = loginData.data.exposant?.nom || email;
            }
            showDashboard();
        } else {
            showError(loginData.message || 'Identifiants incorrects');
        }
    } catch (error) {
        showError('Erreur de connexion: ' + error.message);
    }
}

// Helper function to show error messages
function showError(message) {
    const errorDiv = document.getElementById('loginError');
    const errorMessage = document.getElementById('errorMessage');
    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.classList.remove('hidden');
        errorDiv.classList.add('animate-shake');
        
        // Remove shake animation after it completes
        setTimeout(() => {
            errorDiv.classList.remove('animate-shake');
        }, 500);
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    token = null;
    showLogin();
}

// API Helpers
async function apiRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Session expirée');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Erreur API');
    }

    return data;
}

// Salons
async function loadSalons() {
    try {
        const data = await apiRequest(`${SALON_API_BASE}`);
        salons = data.data || [];
    } catch (error) {
        console.error('Error loading salons:', error);
    }
}

async function loadSalonsList() {
    try {
        await loadSalons();
        const container = document.getElementById('salonsList');
        if (!container) return;

        if (salons.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Aucun salon trouvé</p>';
            return;
        }

        container.innerHTML = salons.map(salon => `
            <div class="bg-white rounded-lg p-4 border-2 ${salon.isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} hover:border-blue-300 transition">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <h3 class="text-lg font-bold text-gray-900">${salon.nom}</h3>
                            ${salon.isActive ? '<span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><i class="fas fa-star mr-1"></i>Actif</span>' : ''}
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${salon.statut === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                ${salon.statut === 1 ? 'Visible' : 'Masqué'}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 mb-3">${salon.description || 'Aucune description'}</p>
                        <div class="flex items-center gap-4 text-xs text-gray-500">
                            <span><i class="fas fa-calendar mr-1"></i>Créé le ${new Date(salon.createdAt).toLocaleDateString('fr-FR')}</span>
                            ${salon.updatedAt ? `<span><i class="fas fa-edit mr-1"></i>Modifié le ${new Date(salon.updatedAt).toLocaleDateString('fr-FR')}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-2 ml-4">
                        ${!salon.isActive ? `
                            <button onclick="activateSalon('${salon._id}', '${salon.nom.replace(/'/g, "\\'")}')" 
                                class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                                title="Activer ce salon">
                                <i class="fas fa-star mr-1"></i>Activer
                            </button>
                        ` : ''}
                        <button onclick="openEditSalonModal('${salon._id}')" 
                            class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                            title="Modifier">
                            <i class="fas fa-edit mr-1"></i>Modifier
                        </button>
                        <button onclick="deleteSalon('${salon._id}', '${salon.nom.replace(/'/g, "\\'")}')" 
                            class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                            title="Supprimer">
                            <i class="fas fa-trash mr-1"></i>Supprimer
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading salons list:', error);
        const container = document.getElementById('salonsList');
        if (container) {
            container.innerHTML = `<p class="text-red-500 text-center py-8">Erreur: ${error.message}</p>`;
        }
    }
}

// Categories
async function loadCategories() {
    try {
        // Load all categories by loading from each salon
        await loadSalons();
        categories = [];
        
        for (const salon of salons) {
            try {
                const data = await apiRequest(`${APP_API_BASE}/categories?salon=${salon._id}`);
                if (Array.isArray(data.data)) {
                    categories.push(...data.data);
                }
            } catch (error) {
                console.error(`Error loading categories for salon ${salon.nom}:`, error);
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadCategoriesList() {
    try {
        await loadCategories();
        await loadSalons();
        
        const container = document.getElementById('categoriesList');
        const filterSelect = document.getElementById('categorySalonFilter');
        if (!container) return;

        // Populate salon filter
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Tous les salons</option>';
            salons.forEach(salon => {
                const option = document.createElement('option');
                option.value = salon._id;
                option.textContent = salon.nom;
                filterSelect.appendChild(option);
            });
        }

        // Get selected salon filter
        const selectedSalonId = filterSelect?.value || '';

        // Filter categories by salon if a salon is selected
        let filteredCategories = categories;
        if (selectedSalonId) {
            filteredCategories = categories.filter(cat => cat.salon?._id === selectedSalonId || cat.salon?.toString() === selectedSalonId);
        }

        if (filteredCategories.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Aucune catégorie trouvée</p>';
            return;
        }

        // Group categories by salon
        const categoriesBySalon = {};
        filteredCategories.forEach(cat => {
            // Get salon ID (could be ObjectId or string)
            let salonId = cat.salon?._id || cat.salon || 'unknown';
            if (typeof salonId === 'object' && salonId.toString) {
                salonId = salonId.toString();
            }
            
            // Get salon name - try populated salon first, then find in salons array
            let salonName = cat.salon?.nom;
            if (!salonName && salonId !== 'unknown') {
                const salon = salons.find(s => s._id === salonId || s._id?.toString() === salonId);
                salonName = salon?.nom || 'Salon inconnu';
            } else if (!salonName) {
                salonName = 'Salon inconnu';
            }
            
            if (!categoriesBySalon[salonId]) {
                categoriesBySalon[salonId] = {
                    salonName,
                    categories: []
                };
            }
            categoriesBySalon[salonId].categories.push(cat);
        });

        // Render categories grouped by salon
        container.innerHTML = Object.entries(categoriesBySalon).map(([salonId, data]) => `
            <div class="mb-6">
                <div class="flex items-center space-x-2 mb-4 pb-2 border-b border-gray-200">
                    <i class="fas fa-building text-indigo-600"></i>
                    <h3 class="text-lg font-semibold text-gray-900">${data.salonName}</h3>
                    <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                        ${data.categories.length} catégorie${data.categories.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${data.categories.map(cat => `
                        <div class="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-indigo-300 transition-all duration-200 shadow-sm hover:shadow-md">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center space-x-3 flex-1">
                                    <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" 
                                         style="background-color: ${cat.color}; border: 2px solid ${cat.borderColor};">
                                        <i class="fas fa-tag text-white text-xs"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <h4 class="font-semibold text-gray-900 truncate">${cat.label}</h4>
                                        <p class="text-xs text-gray-500 mt-1">Créé le ${new Date(cat.createdAt).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                                <span class="px-2 py-1 rounded-full text-xs font-medium ${cat.statut === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                                    ${cat.statut === 1 ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <div class="flex items-center space-x-2 text-xs text-gray-600">
                                <div class="flex items-center space-x-1">
                                    <span class="w-3 h-3 rounded-full" style="background-color: ${cat.color};"></span>
                                    <span>Couleur</span>
                                </div>
                                <span>•</span>
                                <div class="flex items-center space-x-1">
                                    <span class="w-3 h-3 rounded-full border-2" style="border-color: ${cat.borderColor};"></span>
                                    <span>Bordure</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories list:', error);
        const container = document.getElementById('categoriesList');
        if (container) {
            container.innerHTML = `<p class="text-red-500 text-center py-8">Erreur: ${error.message}</p>`;
        }
    }
}

// Events
async function loadEventsList() {
    try {
        const data = await apiRequest(`${APP_API_BASE}/events`);
        const events = Array.isArray(data.data) ? data.data : [];
        const container = document.getElementById('eventsList');
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Aucun événement trouvé</p>';
            return;
        }

        container.innerHTML = events.map(event => {
            const eventDate = event.fullEventDate ? new Date(event.fullEventDate) : (event.eventDate ? new Date(event.eventDate) : null);
            const formattedDate = eventDate ? eventDate.toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Date non définie';
            const isPast = eventDate && eventDate < new Date();
            
            return `
                <div class="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-300 transition">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-bold text-gray-900">${event.titre || 'Événement sans titre'}</h3>
                                <span class="px-2 py-1 rounded-full text-xs font-medium ${event.statut === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                    ${event.statut === 1 ? 'Actif' : 'Inactif'}
                                </span>
                                ${isPast ? '<span class="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Passé</span>' : ''}
                            </div>
                            <p class="text-sm text-gray-600 mb-3">${event.description || 'Aucune description'}</p>
                            <div class="flex items-center gap-4 text-sm text-gray-500">
                                <span><i class="fas fa-calendar mr-1"></i>${formattedDate}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 ml-4">
                            <button onclick="openEditEventModal('${event._id}')" 
                                class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                                <i class="fas fa-edit mr-1"></i>Modifier
                            </button>
                            <button onclick="confirmDeleteEvent('${event._id}')" 
                                class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                                <i class="fas fa-trash mr-1"></i>Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading events list:', error);
        const container = document.getElementById('eventsList');
        if (container) {
            container.innerHTML = `<p class="text-red-500 text-center py-8">Erreur: ${error.message}</p>`;
        }
    }
}

// Statistics
async function loadStats() {
    try {
        const data = await apiRequest(`${ADMIN_API_BASE}/stats`);

        // Update main stats
        document.getElementById('stat-total').textContent = data.data.exposants.total || 0;
        document.getElementById('stat-active').textContent = data.data.exposants.active || 0;
        document.getElementById('stat-inactive').textContent = data.data.exposants.inactive || 0;
        document.getElementById('stat-admin').textContent = data.data.byValidation.administrator || 0;

        // Validation stats
        const validationLabels = {
            simpleExposant: 'Simple exposant',
            valideNoPublication: 'Validé sans publication',
            valideWithPublication: 'Validé avec publication',
            administrator: 'Administrateur'
        };

        const validationContainer = document.getElementById('validationStats');
        if (validationContainer) {
            validationContainer.innerHTML = Object.entries(data.data.byValidation || {}).map(([key, value]) => `
                <div class="stat-item">
                    <span class="stat-item-label">${validationLabels[key] || key}</span>
                    <span class="stat-item-value">${value}</span>
                </div>
            `).join('');
        }

        // Category stats
        const categoryContainer = document.getElementById('categoryStats');
        if (categoryContainer) {
            categoryContainer.innerHTML = (data.data.byCategory || []).map(cat => `
                <div class="stat-item">
                    <span class="stat-item-label">${cat.label}</span>
                    <span class="stat-item-value">${cat.count}</span>
                </div>
            `).join('');
        }

        // Content stats
        document.getElementById('stat-videos').textContent = data.data.content?.videos || 0;
        document.getElementById('stat-bondeals').textContent = data.data.content?.bondeals || 0;
        document.getElementById('stat-comments').textContent = data.data.content?.comments || 0;
        document.getElementById('stat-likes').textContent = data.data.content?.likes || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Exposants List
async function loadExposants(page = 1) {
    try {
        currentPage = page;
        const data = await apiRequest(`${ADMIN_API_BASE}/exposants?page=${page}&limit=20`);
        allExposants = data.data || [];

        renderExposantsTable(allExposants);
        renderPagination(data.pagination || {});
    } catch (error) {
        console.error('Error loading exposants:', error);
        const tbody = document.getElementById('exposantsTable');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-red-500">Erreur: ${error.message}</td></tr>`;
        }
    }
}

function renderExposantsTable(exposants) {
    const tbody = document.getElementById('exposantsTable');
    if (!tbody) return;

    if (exposants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">Aucun exposant trouvé</td></tr>';
        return;
    }

    tbody.innerHTML = exposants.map(expo => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-medium text-gray-900">${expo.nom}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${expo.email}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${expo.categorie?.label || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${expo.salon?.nom || 'N/A'}</td>
            <td class="px-4 py-3 text-sm">${getValidationBadge(expo.isValid)}</td>
            <td class="px-4 py-3 text-sm">${getStatusBadge(expo.statut)}</td>
            <td class="px-4 py-3 text-sm">
                <div class="flex items-center space-x-2">
                    <button onclick="openExposantDetailsModal('${expo._id}')" 
                        class="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Voir détails">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="openEditModal('${expo._id}')" 
                        class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleStatus('${expo._id}', ${expo.statut})" 
                        class="p-2 ${expo.statut === 1 ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition" 
                        title="${expo.statut === 1 ? 'Désactiver' : 'Activer'}">
                        <i class="fas ${expo.statut === 1 ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button onclick="deleteExposant('${expo._id}', '${expo.nom.replace(/'/g, "\\'")}')" 
                        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getValidationBadge(isValid) {
    const badges = {
        0: '<span class="badge badge-secondary">Simple</span>',
        1: '<span class="badge badge-warning">Validé sans pub</span>',
        2: '<span class="badge badge-success">Validé avec pub</span>',
        3: '<span class="badge badge-info">Administrateur</span>'
    };
    return badges[isValid] || '';
}

function getStatusBadge(statut) {
    return statut === 1
        ? '<span class="badge badge-success">Actif</span>'
        : '<span class="badge badge-danger">Inactif</span>';
}

function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container || !pagination || !pagination.pages) {
        if (container) container.innerHTML = '';
        return;
    }

    container.innerHTML = '';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Précédent';
    prevBtn.disabled = pagination.page === 1;
    prevBtn.className = `px-4 py-2 border border-gray-300 rounded-lg ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`;
    prevBtn.onclick = () => loadExposants(pagination.page - 1);
    container.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= pagination.pages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = `px-4 py-2 border border-gray-300 rounded-lg ${i === pagination.page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`;
        pageBtn.onclick = () => loadExposants(i);
        container.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Suivant →';
    nextBtn.disabled = pagination.page === pagination.pages;
    nextBtn.className = `px-4 py-2 border border-gray-300 rounded-lg ${pagination.page === pagination.pages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`;
    nextBtn.onclick = () => loadExposants(pagination.page + 1);
    container.appendChild(nextBtn);
}

// Filters
function applyFilters() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const isValid = document.getElementById('filterValid')?.value || '';
    const statut = document.getElementById('filterStatus')?.value || '';

    const filtered = allExposants.filter(expo => {
        const matchSearch = !search ||
            expo.nom.toLowerCase().includes(search) ||
            expo.email.toLowerCase().includes(search) ||
            (expo.username && expo.username.toLowerCase().includes(search));

        const matchValid = !isValid || expo.isValid === parseInt(isValid);
        const matchStatus = !statut || expo.statut === parseInt(statut);

        return matchSearch && matchValid && matchStatus;
    });

    renderExposantsTable(filtered);
}

// Edit Exposant
async function openEditModal(id) {
    try {
        const data = await apiRequest(`${ADMIN_API_BASE}/exposants/${id}`);
        const expo = data.data;

        document.getElementById('editId').value = expo._id;
        document.getElementById('editNom').value = expo.nom;
        document.getElementById('editEmail').value = expo.email;
        document.getElementById('editLocation').value = expo.location || '';
        document.getElementById('editBio').value = expo.bio || '';
        document.getElementById('editIsValid').value = expo.isValid;
        document.getElementById('editStatut').value = expo.statut;

        document.getElementById('editExposantModal').classList.remove('hidden');
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

function closeEditModal() {
    document.getElementById('editExposantModal').classList.add('hidden');
    const messageDiv = document.getElementById('editMessage');
    if (messageDiv) {
        messageDiv.classList.add('hidden');
    }
}

async function handleEdit(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('editMessage');
    const id = document.getElementById('editId').value;

    try {
        const data = {
            nom: document.getElementById('editNom').value,
            email: document.getElementById('editEmail').value,
            location: document.getElementById('editLocation').value,
            bio: document.getElementById('editBio').value,
            isValid: parseInt(document.getElementById('editIsValid').value),
            statut: parseInt(document.getElementById('editStatut').value)
        };

        await apiRequest(`${ADMIN_API_BASE}/exposants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        messageDiv.textContent = 'Exposant mis à jour avec succès!';
        messageDiv.className = 'message success';
        messageDiv.classList.remove('hidden');

        setTimeout(() => {
            closeEditModal();
            loadExposants(currentPage);
        }, 1500);
    } catch (error) {
        messageDiv.textContent = 'Erreur: ' + error.message;
        messageDiv.className = 'message error';
        messageDiv.classList.remove('hidden');
    }
}

// Toggle Status
async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
        await apiRequest(`${ADMIN_API_BASE}/exposants/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ statut: newStatus })
        });

        loadExposants(currentPage);
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

// Delete Exposant
async function deleteExposant(id, nom) {
    const hardDelete = confirm(`Voulez-vous supprimer définitivement "${nom}" ?\n\nOK = Suppression définitive (irréversible)\nAnnuler = Désactiver seulement`);
    
    try {
        const url = hardDelete 
            ? `${ADMIN_API_BASE}/exposants/${id}?hard=true`
            : `${ADMIN_API_BASE}/exposants/${id}`;
            
        await apiRequest(url, {
            method: 'DELETE'
        });

        loadExposants(currentPage);
        if (currentPageName === 'dashboard') {
            loadStats();
        }
        // Fermer le modal de détails si ouvert
        closeExposantDetailsModal();
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

// Category Modal Functions
function openCreateCategoryModal() {
    const modal = document.getElementById('createCategoryModal');
    const salonSelect = document.getElementById('createCategorySalon');
    
    if (!modal || !salonSelect) return;

    // Populate salon select
    salonSelect.innerHTML = '<option value="">Sélectionner un salon...</option>';
    salons.forEach(salon => {
        const option = document.createElement('option');
        option.value = salon._id;
        option.textContent = salon.nom;
        salonSelect.appendChild(option);
    });

    // Reset form
    document.getElementById('createCategoryForm').reset();
    document.getElementById('createCategoryColor').value = '#3B82F6';
    document.getElementById('createCategoryColorHex').value = '#3B82F6';
    document.getElementById('createCategoryBorderColor').value = '#1E40AF';
    document.getElementById('createCategoryBorderColorHex').value = '#1E40AF';
    
    const messageDiv = document.getElementById('createCategoryMessage');
    if (messageDiv) {
        messageDiv.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeCreateCategoryModal() {
    const modal = document.getElementById('createCategoryModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function handleCreateCategory(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('createCategoryMessage');
    
    try {
        const salon = document.getElementById('createCategorySalon').value;
        const label = document.getElementById('createCategoryLabel').value.trim();
        const color = document.getElementById('createCategoryColorHex').value.trim();
        const borderColor = document.getElementById('createCategoryBorderColorHex').value.trim();

        if (!salon || !label || !color || !borderColor) {
            throw new Error('Tous les champs sont requis');
        }

        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
            throw new Error('Format de couleur invalide (format hexadécimal requis: #RRGGBB)');
        }

        if (!/^#[0-9A-Fa-f]{6}$/.test(borderColor)) {
            throw new Error('Format de couleur de bordure invalide (format hexadécimal requis: #RRGGBB)');
        }

        await apiRequest(`${APP_API_BASE}/categories`, {
            method: 'POST',
            body: JSON.stringify({
                salon,
                label,
                color,
                borderColor
            })
        });

        messageDiv.textContent = 'Catégorie créée avec succès!';
        messageDiv.className = 'message success';
        messageDiv.classList.remove('hidden');

        setTimeout(() => {
            closeCreateCategoryModal();
            loadCategoriesList();
        }, 1500);
    } catch (error) {
        messageDiv.textContent = 'Erreur: ' + error.message;
        messageDiv.className = 'message error';
        messageDiv.classList.remove('hidden');
    }
}

// Modal functions (placeholders)
function openCreateExposantModal() {
    alert('Fonctionnalité de création à implémenter');
}

// Salon Management Functions
function openCreateSalonModal() {
    const modal = document.getElementById('createSalonModal');
    if (!modal) return;
    
    // Reset form
    document.getElementById('createSalonForm').reset();
    document.getElementById('createSalonIsActive').checked = false;
    document.getElementById('createSalonDescriptionCount').textContent = '0';
    document.getElementById('createSalonMessage').classList.add('hidden');
    
    modal.classList.remove('hidden');
}

function closeCreateSalonModal() {
    const modal = document.getElementById('createSalonModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function handleCreateSalon(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('createSalonMessage');
    messageDiv.classList.add('hidden');
    
    try {
        const nom = document.getElementById('createSalonNom').value.trim();
        const description = document.getElementById('createSalonDescription').value.trim();
        const isActive = document.getElementById('createSalonIsActive').checked;
        
        if (!nom) {
            throw new Error('Le nom du salon est requis');
        }
        
        const salonData = {
            nom,
            description: description || '',
            isActive: isActive
        };
        
        await apiRequest(`${SALON_API_BASE}`, {
            method: 'POST',
            body: JSON.stringify(salonData)
        });
        
        // Si le salon doit être activé, l'activer
        if (isActive) {
            // Recharger les salons pour obtenir le nouvel ID
            await loadSalons();
            const newSalon = salons.find(s => s.nom === nom);
            if (newSalon) {
                await apiRequest(`${SALON_API_BASE}/set-active`, {
                    method: 'POST',
                    body: JSON.stringify({ salonId: newSalon._id })
                });
            }
        }
        
        messageDiv.className = 'mt-4 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg';
        messageDiv.textContent = 'Salon créé avec succès !';
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            closeCreateSalonModal();
            loadSalonsList();
        }, 1500);
    } catch (error) {
        console.error('Error creating salon:', error);
        messageDiv.className = 'mt-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg';
        messageDiv.textContent = 'Erreur: ' + (error.message || 'Impossible de créer le salon');
        messageDiv.classList.remove('hidden');
    }
}

async function openEditSalonModal(salonId) {
    try {
        const data = await apiRequest(`${SALON_API_BASE}/${salonId}`);
        const salon = data.data;
        
        if (!salon) {
            alert('Salon non trouvé');
            return;
        }
        
        const modal = document.getElementById('editSalonModal');
        if (!modal) return;
        
        // Fill form
        document.getElementById('editSalonId').value = salon._id;
        document.getElementById('editSalonNom').value = salon.nom || '';
        document.getElementById('editSalonDescription').value = salon.description || '';
        document.getElementById('editSalonIsActive').checked = salon.isActive || false;
        document.getElementById('editSalonStatut').value = salon.statut || 1;
        
        // Update description count
        const descCount = document.getElementById('editSalonDescriptionCount');
        if (descCount) {
            descCount.textContent = (salon.description || '').length;
        }
        
        document.getElementById('editSalonMessage').classList.add('hidden');
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading salon:', error);
        alert('Erreur lors du chargement du salon: ' + error.message);
    }
}

function closeEditSalonModal() {
    const modal = document.getElementById('editSalonModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function handleEditSalon(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('editSalonMessage');
    messageDiv.classList.add('hidden');
    
    try {
        const salonId = document.getElementById('editSalonId').value;
        const nom = document.getElementById('editSalonNom').value.trim();
        const description = document.getElementById('editSalonDescription').value.trim();
        const isActive = document.getElementById('editSalonIsActive').checked;
        const statut = parseInt(document.getElementById('editSalonStatut').value) || 1;
        
        if (!salonId || !nom) {
            throw new Error('Tous les champs requis doivent être remplis');
        }
        
        const salonData = {
            nom,
            description: description || '',
            isActive: isActive,
            statut
        };
        
        await apiRequest(`${SALON_API_BASE}/${salonId}`, {
            method: 'PUT',
            body: JSON.stringify(salonData)
        });
        
        // Si le salon doit être activé, l'activer
        if (isActive) {
            await apiRequest(`${SALON_API_BASE}/set-active`, {
                method: 'POST',
                body: JSON.stringify({ salonId })
            });
        }
        
        messageDiv.className = 'mt-4 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg';
        messageDiv.textContent = 'Salon mis à jour avec succès !';
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            closeEditSalonModal();
            loadSalonsList();
        }, 1500);
    } catch (error) {
        console.error('Error updating salon:', error);
        messageDiv.className = 'mt-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg';
        messageDiv.textContent = 'Erreur: ' + (error.message || 'Impossible de mettre à jour le salon');
        messageDiv.classList.remove('hidden');
    }
}

async function activateSalon(salonId, salonNom) {
    if (!confirm(`Voulez-vous activer le salon "${salonNom}" ?\n\nCela désactivera automatiquement tous les autres salons.`)) {
        return;
    }
    
    try {
        await apiRequest(`${SALON_API_BASE}/set-active`, {
            method: 'POST',
            body: JSON.stringify({ salonId })
        });
        
        alert('Salon activé avec succès !');
        loadSalonsList();
    } catch (error) {
        console.error('Error activating salon:', error);
        alert('Erreur: ' + error.message);
    }
}

async function deleteSalon(salonId, salonNom) {
    if (!confirm(`Voulez-vous supprimer le salon "${salonNom}" ?\n\nCette action masquera le salon (soft delete).`)) {
        return;
    }
    
    try {
        await apiRequest(`${SALON_API_BASE}/${salonId}`, {
            method: 'DELETE'
        });
        
        alert('Salon supprimé avec succès !');
        loadSalonsList();
    } catch (error) {
        console.error('Error deleting salon:', error);
        alert('Erreur: ' + error.message);
    }
}

// Event Management Functions
function openCreateEventModal() {
    const modal = document.getElementById('createEventModal');
    if (!modal) return;
    
    // Reset form
    document.getElementById('createEventForm').reset();
    document.getElementById('createEventDescriptionCount').textContent = '0';
    document.getElementById('createEventMessage').classList.add('hidden');
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('createEventDate').value = today;
    
    modal.classList.remove('hidden');
}

function closeCreateEventModal() {
    const modal = document.getElementById('createEventModal');
    if (modal) modal.classList.add('hidden');
}

async function openEditEventModal(eventId) {
    try {
        const data = await apiRequest(`${APP_API_BASE}/events/${eventId}`);
        const event = data.data;
        
        if (!event) {
            alert('Événement non trouvé');
            return;
        }
        
        const modal = document.getElementById('editEventModal');
        if (!modal) return;
        
        // Fill form
        document.getElementById('editEventId').value = event._id;
        document.getElementById('editEventTitre').value = event.titre || '';
        document.getElementById('editEventDescription').value = event.description || '';
        document.getElementById('editEventStatut').value = event.statut || 1;
        
        // Update description count
        const descCount = document.getElementById('editEventDescriptionCount');
        if (descCount) {
            descCount.textContent = (event.description || '').length;
        }
        
        // Set date and time
        const eventDate = event.fullEventDate ? new Date(event.fullEventDate) : (event.eventDate ? new Date(event.eventDate) : null);
        if (eventDate) {
            document.getElementById('editEventDate').value = eventDate.toISOString().split('T')[0];
            const hours = String(eventDate.getHours()).padStart(2, '0');
            const minutes = String(eventDate.getMinutes()).padStart(2, '0');
            document.getElementById('editEventTime').value = `${hours}:${minutes}`;
        }
        
        document.getElementById('editEventMessage').classList.add('hidden');
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading event:', error);
        alert('Erreur lors du chargement de l\'événement: ' + error.message);
    }
}

function closeEditEventModal() {
    const modal = document.getElementById('editEventModal');
    if (modal) modal.classList.add('hidden');
}

async function confirmDeleteEvent(eventId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.')) {
        return;
    }
    
    try {
        await apiRequest(`${APP_API_BASE}/events/${eventId}`, {
            method: 'DELETE'
        });
        
        alert('Événement supprimé avec succès');
        loadEventsList();
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Erreur lors de la suppression: ' + error.message);
    }
}

async function loadSalonsForSelect(selectId) {
    try {
        const data = await apiRequest(`${SALON_API_BASE}`);
        const salonsList = Array.isArray(data.data) ? data.data : [];
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">Sélectionner un salon...</option>';
        
        salonsList.forEach(salon => {
            const option = document.createElement('option');
            option.value = salon._id;
            option.textContent = salon.nom || 'Salon sans nom';
            select.appendChild(option);
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
    } catch (error) {
        console.error('Error loading salons:', error);
    }
}

async function handleCreateEvent(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('createEventMessage');
    messageDiv.classList.add('hidden');
    
    try {
        const titre = document.getElementById('createEventTitre').value.trim();
        const description = document.getElementById('createEventDescription').value.trim();
        const eventDate = document.getElementById('createEventDate').value;
        const eventTime = document.getElementById('createEventTime').value;
        const statut = parseInt(document.getElementById('createEventStatut').value) || 1;
        
        if (!titre || !description || !eventDate || !eventTime) {
            throw new Error('Tous les champs sont requis');
        }
        
        // Combine date and time
        const fullEventDate = new Date(`${eventDate}T${eventTime}`);
        if (isNaN(fullEventDate.getTime())) {
            throw new Error('Date ou heure invalide');
        }
        
        const eventData = {
            titre,
            description,
            eventDate: eventDate,
            fullEventDate: fullEventDate.toISOString(),
            statut
        };
        
        await apiRequest(`${APP_API_BASE}/events`, {
            method: 'POST',
            body: JSON.stringify(eventData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        messageDiv.className = 'mt-4 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg';
        messageDiv.textContent = 'Événement créé avec succès !';
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            closeCreateEventModal();
            loadEventsList();
        }, 1500);
    } catch (error) {
        console.error('Error creating event:', error);
        messageDiv.className = 'mt-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg';
        messageDiv.textContent = 'Erreur: ' + (error.message || 'Impossible de créer l\'événement');
        messageDiv.classList.remove('hidden');
    }
}

async function handleEditEvent(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('editEventMessage');
    messageDiv.classList.add('hidden');
    
    try {
        const eventId = document.getElementById('editEventId').value;
        const titre = document.getElementById('editEventTitre').value.trim();
        const description = document.getElementById('editEventDescription').value.trim();
        const eventDate = document.getElementById('editEventDate').value;
        const eventTime = document.getElementById('editEventTime').value;
        const statut = parseInt(document.getElementById('editEventStatut').value) || 1;
        
        if (!eventId || !titre || !description || !eventDate || !eventTime) {
            throw new Error('Tous les champs sont requis');
        }
        
        // Combine date and time
        const fullEventDate = new Date(`${eventDate}T${eventTime}`);
        if (isNaN(fullEventDate.getTime())) {
            throw new Error('Date ou heure invalide');
        }
        
        const eventData = {
            titre,
            description,
            eventDate: eventDate,
            fullEventDate: fullEventDate.toISOString(),
            statut
        };
        
        await apiRequest(`${APP_API_BASE}/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(eventData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        messageDiv.className = 'mt-4 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg';
        messageDiv.textContent = 'Événement mis à jour avec succès !';
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            closeEditEventModal();
            loadEventsList();
        }, 1500);
    } catch (error) {
        console.error('Error updating event:', error);
        messageDiv.className = 'mt-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg';
        messageDiv.textContent = 'Erreur: ' + (error.message || 'Impossible de mettre à jour l\'événement');
        messageDiv.classList.remove('hidden');
    }
}

// Close modal on outside click
document.getElementById('editExposantModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'editExposantModal') {
        closeEditModal();
    }
});

document.getElementById('createCategoryModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'createCategoryModal') {
        closeCreateCategoryModal();
    }
});

document.getElementById('createSalonModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'createSalonModal') {
        closeCreateSalonModal();
    }
});

document.getElementById('editSalonModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'editSalonModal') {
        closeEditSalonModal();
    }
});

// Exposant Details Modal Functions
let currentExposantId = null;
let currentExposantTab = 'videos';

async function openExposantDetailsModal(exposantId) {
    try {
        currentExposantId = exposantId;
        currentExposantTab = 'videos';
        
        // Load exposant details
        const data = await apiRequest(`${ADMIN_API_BASE}/exposants/${exposantId}`);
        const exposant = data.data;
        
        if (!exposant) {
            alert('Exposant non trouvé');
            return;
        }
        
        const modal = document.getElementById('exposantDetailsModal');
        if (!modal) return;
        
        // Set title
        const titleEl = document.getElementById('exposantDetailsTitle');
        if (titleEl) {
            titleEl.textContent = `Détails - ${exposant.nom || 'Exposant'}`;
        }
        
        // Display exposant info
        const infoEl = document.getElementById('exposantDetailsInfo');
        if (infoEl) {
            infoEl.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="font-semibold text-gray-900 mb-3">Informations personnelles</h3>
                        <div class="space-y-2 text-sm">
                            <p><span class="font-medium text-gray-700">Nom:</span> <span class="text-gray-600">${exposant.nom || 'N/A'}</span></p>
                            <p><span class="font-medium text-gray-700">Email:</span> <span class="text-gray-600">${exposant.email || 'N/A'}</span></p>
                            <p><span class="font-medium text-gray-700">Username:</span> <span class="text-gray-600">${exposant.username || 'N/A'}</span></p>
                            <p><span class="font-medium text-gray-700">Localisation:</span> <span class="text-gray-600">${exposant.location || 'N/A'}</span></p>
                            <p><span class="font-medium text-gray-700">Bio:</span> <span class="text-gray-600">${exposant.bio || 'N/A'}</span></p>
                        </div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="font-semibold text-gray-900 mb-3">Informations professionnelles</h3>
                        <div class="space-y-2 text-sm">
                            <p><span class="font-medium text-gray-700">Salon:</span> <span class="text-gray-600">${exposant.salon?.nom || 'N/A'}</span></p>
                            <p><span class="font-medium text-gray-700">Catégorie:</span> <span class="text-gray-600">${exposant.categorie?.label || 'N/A'}</span></p>
                            <p><span class="font-medium text-gray-700">Validation:</span> ${getValidationBadge(exposant.isValid)}</p>
                            <p><span class="font-medium text-gray-700">Statut:</span> ${getStatusBadge(exposant.statut)}</p>
                            <p><span class="font-medium text-gray-700">Créé le:</span> <span class="text-gray-600">${new Date(exposant.createdAt).toLocaleDateString('fr-FR')}</span></p>
                        </div>
                    </div>
                </div>
                <div class="bg-blue-50 rounded-lg p-4 mb-4">
                    <h3 class="font-semibold text-gray-900 mb-2">Statistiques</h3>
                    <div class="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <p class="text-gray-600">Vidéos</p>
                            <p class="text-2xl font-bold text-blue-600" id="exposantStatsVideos">${exposant.stats?.videos || 0}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Bon Deals</p>
                            <p class="text-2xl font-bold text-pink-600" id="exposantStatsBondeals">${exposant.stats?.bondeals || 0}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Commentaires</p>
                            <p class="text-2xl font-bold text-green-600" id="exposantStatsComments">${exposant.stats?.comments || 0}</p>
                        </div>
                        <div>
                            <p class="text-gray-600">Likes</p>
                            <p class="text-2xl font-bold text-red-600" id="exposantStatsLikes">${exposant.stats?.likes || 0}</p>
                        </div>
                    </div>
                </div>
                <div class="flex items-center justify-end space-x-2 mb-4">
                    <button onclick="openEditModal('${exposant._id}')" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                        <i class="fas fa-edit mr-2"></i>Modifier
                    </button>
                    <button onclick="deleteExposant('${exposant._id}', '${(exposant.nom || '').replace(/'/g, "\\'")}')" 
                        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                        <i class="fas fa-trash mr-2"></i>Supprimer
                    </button>
                </div>
            `;
        }
        
        // Update tab counts
        const videosCountEl = document.getElementById('videosCount');
        const bondealsCountEl = document.getElementById('bondealsCount');
        if (videosCountEl) videosCountEl.textContent = exposant.stats?.videos || 0;
        if (bondealsCountEl) bondealsCountEl.textContent = exposant.stats?.bondeals || 0;
        
        // Load initial tab content
        await switchExposantTab('videos');
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading exposant details:', error);
        alert('Erreur lors du chargement des détails: ' + error.message);
    }
}

function closeExposantDetailsModal() {
    const modal = document.getElementById('exposantDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentExposantId = null;
    currentExposantTab = 'videos';
}

async function switchExposantTab(tab) {
    currentExposantTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.exposant-tab-btn').forEach(btn => {
        const btnTab = btn.getAttribute('data-tab');
        if (btnTab === tab) {
            btn.classList.add('active', 'text-gray-700', 'border-blue-600');
            btn.classList.remove('text-gray-500', 'border-transparent');
        } else {
            btn.classList.remove('active', 'text-gray-700', 'border-blue-600');
            btn.classList.add('text-gray-500', 'border-transparent');
        }
    });
    
    // Show/hide tab content
    const videosTab = document.getElementById('exposantVideosTab');
    const bondealsTab = document.getElementById('exposantBondealsTab');
    const qrCodeTab = document.getElementById('exposantQRCodeTab');
    
    if (tab === 'videos') {
        if (videosTab) videosTab.classList.remove('hidden');
        if (bondealsTab) bondealsTab.classList.add('hidden');
        if (qrCodeTab) qrCodeTab.classList.add('hidden');
        await loadExposantVideos();
    } else if (tab === 'bondeals') {
        if (videosTab) videosTab.classList.add('hidden');
        if (bondealsTab) bondealsTab.classList.remove('hidden');
        if (qrCodeTab) qrCodeTab.classList.add('hidden');
        await loadExposantBondeals();
    } else if (tab === 'qrcode') {
        if (videosTab) videosTab.classList.add('hidden');
        if (bondealsTab) bondealsTab.classList.add('hidden');
        if (qrCodeTab) qrCodeTab.classList.remove('hidden');
        await loadExposantQRCode();
    }
}

async function loadExposantVideos() {
    if (!currentExposantId) return;
    
    const container = document.getElementById('exposantVideosList');
    if (!container) return;
    
    try {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Chargement...</p>';
        
        const data = await apiRequest(`${ADMIN_API_BASE}/exposants/${currentExposantId}/videos`);
        const videos = Array.isArray(data.data) ? data.data : [];
        
        if (videos.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Aucune vidéo trouvée</p>';
            return;
        }
        
        container.innerHTML = videos.map(video => {
            const createdAt = new Date(video.createdAt).toLocaleDateString('fr-FR');
            const isActive = video.statut === 1;
            
            return `
                <div class="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-300 transition">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h4 class="font-semibold text-gray-900">${video.name || 'Vidéo sans nom'}</h4>
                                <span class="px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                    ${isActive ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            ${video.description ? `<p class="text-sm text-gray-600 mb-2">${video.description}</p>` : ''}
                            <div class="flex items-center gap-4 text-xs text-gray-500">
                                <span><i class="fas fa-calendar mr-1"></i>${createdAt}</span>
                                ${video.videoUrl ? `<a href="${video.videoUrl}" target="_blank" class="text-blue-600 hover:underline">
                                    <i class="fas fa-external-link-alt mr-1"></i>Voir la vidéo
                                </a>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-2 ml-4">
                            <button onclick="toggleVideoStatus('${video._id}', ${video.statut})" 
                                class="px-3 py-2 ${isActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition text-sm"
                                title="${isActive ? 'Désactiver' : 'Activer'}">
                                <i class="fas ${isActive ? 'fa-pause' : 'fa-play'}"></i>
                            </button>
                            <button onclick="deleteVideo('${video._id}', '${(video.name || 'cette vidéo').replace(/'/g, "\\'")}')" 
                                class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                                title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading videos:', error);
        container.innerHTML = `<p class="text-red-500 text-center py-8">Erreur: ${error.message}</p>`;
    }
}

async function loadExposantBondeals() {
    if (!currentExposantId) return;
    
    const container = document.getElementById('exposantBondealsList');
    if (!container) return;
    
    try {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Chargement...</p>';
        
        const data = await apiRequest(`${ADMIN_API_BASE}/exposants/${currentExposantId}/bondeals`);
        const bondeals = Array.isArray(data.data) ? data.data : [];
        
        if (bondeals.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Aucun bon deal trouvé</p>';
            return;
        }
        
        container.innerHTML = bondeals.map(bondeal => {
            const createdAt = new Date(bondeal.createdAt).toLocaleDateString('fr-FR');
            
            return `
                <div class="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-pink-300 transition">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h4 class="font-semibold text-gray-900">${bondeal.titre || 'Bon deal sans titre'}</h4>
                            </div>
                            ${bondeal.description ? `<p class="text-sm text-gray-600 mb-2">${bondeal.description}</p>` : ''}
                            ${bondeal.prix ? `<p class="text-sm font-semibold text-green-600 mb-2">${bondeal.prix} €</p>` : ''}
                            <div class="flex items-center gap-4 text-xs text-gray-500">
                                <span><i class="fas fa-calendar mr-1"></i>${createdAt}</span>
                                ${bondeal.image ? `<a href="${bondeal.image}" target="_blank" class="text-blue-600 hover:underline">
                                    <i class="fas fa-image mr-1"></i>Voir l'image
                                </a>` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-2 ml-4">
                            <button onclick="deleteBondeal('${bondeal._id}', '${(bondeal.titre || 'ce bon deal').replace(/'/g, "\\'")}')" 
                                class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                                title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading bondeals:', error);
        container.innerHTML = `<p class="text-red-500 text-center py-8">Erreur: ${error.message}</p>`;
    }
}

async function toggleVideoStatus(videoId, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    if (!confirm(`Voulez-vous ${newStatus === 1 ? 'activer' : 'désactiver'} cette vidéo ?`)) {
        return;
    }
    
    try {
        await apiRequest(`${ADMIN_API_BASE}/videos/${videoId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ statut: newStatus })
        });
        
        // Reload videos
        await loadExposantVideos();
        
        // Reload exposant details to update stats
        if (currentExposantId) {
            const data = await apiRequest(`${ADMIN_API_BASE}/exposants/${currentExposantId}`);
            const exposant = data.data;
            if (exposant && exposant.stats) {
                const videosCountEl = document.getElementById('exposantStatsVideos');
                if (videosCountEl) videosCountEl.textContent = exposant.stats.videos || 0;
            }
        }
    } catch (error) {
        console.error('Error toggling video status:', error);
        alert('Erreur: ' + error.message);
    }
}

async function deleteVideo(videoId, videoName) {
    if (!confirm(`Voulez-vous supprimer définitivement "${videoName}" ?\n\nCette action est irréversible et supprimera également tous les commentaires et likes associés.`)) {
        return;
    }
    
    try {
        await apiRequest(`${ADMIN_API_BASE}/videos/${videoId}`, {
            method: 'DELETE'
        });
        
        // Reload videos
        await loadExposantVideos();
        
        // Reload exposant details to update stats
        if (currentExposantId) {
            const data = await apiRequest(`${ADMIN_API_BASE}/exposants/${currentExposantId}`);
            const exposant = data.data;
            if (exposant && exposant.stats) {
                const videosCountEl = document.getElementById('exposantStatsVideos');
                const commentsCountEl = document.getElementById('exposantStatsComments');
                const likesCountEl = document.getElementById('exposantStatsLikes');
                if (videosCountEl) videosCountEl.textContent = exposant.stats.videos || 0;
                if (commentsCountEl) commentsCountEl.textContent = exposant.stats.comments || 0;
                if (likesCountEl) likesCountEl.textContent = exposant.stats.likes || 0;
            }
            
            // Update tab count
            const videosCountEl = document.getElementById('videosCount');
            if (videosCountEl) videosCountEl.textContent = exposant.stats?.videos || 0;
        }
    } catch (error) {
        console.error('Error deleting video:', error);
        alert('Erreur: ' + error.message);
    }
}

async function deleteBondeal(bondealId, bondealName) {
    if (!confirm(`Voulez-vous supprimer définitivement "${bondealName}" ?\n\nCette action est irréversible.`)) {
        return;
    }
    
    try {
        await apiRequest(`${ADMIN_API_BASE}/bondeals/${bondealId}`, {
            method: 'DELETE'
        });
        
        // Reload bondeals
        await loadExposantBondeals();
        
        // Reload exposant details to update stats
        if (currentExposantId) {
            const data = await apiRequest(`${ADMIN_API_BASE}/exposants/${currentExposantId}`);
            const exposant = data.data;
            if (exposant && exposant.stats) {
                const bondealsCountEl = document.getElementById('exposantStatsBondeals');
                if (bondealsCountEl) bondealsCountEl.textContent = exposant.stats.bondeals || 0;
            }
            
            // Update tab count
            const bondealsCountEl = document.getElementById('bondealsCount');
            if (bondealsCountEl) bondealsCountEl.textContent = exposant.stats?.bondeals || 0;
        }
    } catch (error) {
        console.error('Error deleting bondeal:', error);
        alert('Erreur: ' + error.message);
    }
}

async function loadExposantQRCode() {
    if (!currentExposantId) return;
    
    const container = document.getElementById('exposantQRCodeContent');
    if (!container) return;
    
    try {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Chargement...</p>';
        
        // Try to get existing QR code
        let qrCode = null;
        try {
            const data = await apiRequest(`${QRCODE_API_BASE}/exposant/${currentExposantId}`);
            qrCode = data.data;
        } catch (error) {
            // QR code doesn't exist yet, will show generate button
            console.log('No QR code found for this exposant');
        }
        
        if (qrCode && qrCode.isActive) {
            // Check if expired
            const expiresAt = new Date(qrCode.expiresAt);
            const now = new Date();
            const isExpired = now >= expiresAt;
            const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            
            // Generate QR code image using external API (more reliable)
            // Utiliser une API externe pour générer le QR code
            const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=2&data=${encodeURIComponent(qrCode.token)}`;
            
            container.innerHTML = `
                <div class="bg-white rounded-lg p-6 border-2 border-gray-200">
                    <div class="text-center mb-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">QR Code de connexion</h3>
                        <p class="text-sm text-gray-600">Scannez ce code pour vous connecter à l'application</p>
                    </div>
                    
                    <div class="flex justify-center mb-6">
                        <div class="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-lg">
                            <img src="${qrCodeDataUrl}" alt="QR Code" class="w-64 h-64 mx-auto">
                        </div>
                    </div>
                    
                    <div class="space-y-3 mb-6">
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span class="text-sm font-medium text-gray-700">Durée de validité:</span>
                            <span class="text-sm text-gray-600">${qrCode.durationDays} jour(s)</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span class="text-sm font-medium text-gray-700">Expire le:</span>
                            <span class="text-sm ${isExpired ? 'text-red-600' : 'text-gray-600'}">${expiresAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span class="text-sm font-medium text-gray-700">Statut:</span>
                            <span class="px-3 py-1 rounded-full text-xs font-medium ${isExpired ? 'bg-red-100 text-red-800' : daysRemaining <= 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                                ${isExpired ? 'Expiré' : daysRemaining <= 7 ? `${daysRemaining} jour(s) restant(s)` : 'Actif'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="regenerateQRCode(${qrCode.durationDays})" 
                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                            <i class="fas fa-sync-alt mr-2"></i>Régénérer
                        </button>
                        <button onclick="generateQRCodeWithDuration()" 
                            class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                            <i class="fas fa-plus mr-2"></i>Nouveau (durée custom)
                        </button>
                        <button onclick="deactivateQRCode()" 
                            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
                            <i class="fas fa-ban mr-2"></i>Désactiver
                        </button>
                    </div>
                </div>
            `;
        } else {
            // No QR code, show generate button
            container.innerHTML = `
                <div class="bg-white rounded-lg p-6 border-2 border-gray-200 text-center">
                    <div class="mb-6">
                        <i class="fas fa-qrcode text-6xl text-gray-300 mb-4"></i>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Aucun QR code généré</h3>
                        <p class="text-sm text-gray-600 mb-4">Générez un QR code pour permettre à cet exposant de se connecter rapidement</p>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="flex items-center justify-center space-x-4">
                            <label class="text-sm font-medium text-gray-700">Durée de validité:</label>
                            <select id="qrCodeDuration" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                                <option value="1">1 jour</option>
                                <option value="7" selected>7 jours</option>
                                <option value="30">30 jours (1 mois)</option>
                                <option value="60">60 jours (2 mois)</option>
                                <option value="90">90 jours (3 mois)</option>
                            </select>
                        </div>
                        
                        <button onclick="generateQRCodeWithDuration()" 
                            class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                            <i class="fas fa-qrcode mr-2"></i>Générer le QR Code
                        </button>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading QR code:', error);
        container.innerHTML = `<p class="text-red-500 text-center py-8">Erreur: ${error.message}</p>`;
    }
}

async function generateQRCodeWithDuration() {
    if (!currentExposantId) return;
    
    const durationSelect = document.getElementById('qrCodeDuration');
    const durationDays = durationSelect ? parseInt(durationSelect.value) : 30;
    
    try {
        const response = await apiRequest(`${QRCODE_API_BASE}/generate/${currentExposantId}`, {
            method: 'POST',
            body: JSON.stringify({ durationDays }),
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.success) {
            alert('QR code généré avec succès!');
            await loadExposantQRCode();
        } else {
            alert('Erreur: ' + (response.message || 'Impossible de générer le QR code'));
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Erreur: ' + error.message);
    }
}

async function regenerateQRCode(durationDays = 30) {
    if (!currentExposantId) return;
    
    if (!confirm(`Voulez-vous régénérer le QR code avec une durée de ${durationDays} jour(s) ?`)) {
        return;
    }
    
    try {
        const response = await apiRequest(`${QRCODE_API_BASE}/generate/${currentExposantId}`, {
            method: 'POST',
            body: JSON.stringify({ durationDays }),
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.success) {
            alert('QR code régénéré avec succès!');
            await loadExposantQRCode();
        } else {
            alert('Erreur: ' + (response.message || 'Impossible de régénérer le QR code'));
        }
    } catch (error) {
        console.error('Error regenerating QR code:', error);
        alert('Erreur: ' + error.message);
    }
}

async function deactivateQRCode() {
    if (!currentExposantId) return;
    
    if (!confirm('Voulez-vous désactiver ce QR code ?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`${QRCODE_API_BASE}/deactivate/${currentExposantId}`, {
            method: 'POST'
        });
        
        if (response.success) {
            alert('QR code désactivé avec succès!');
            await loadExposantQRCode();
        } else {
            alert('Erreur: ' + (response.message || 'Impossible de désactiver le QR code'));
        }
    } catch (error) {
        console.error('Error deactivating QR code:', error);
        alert('Erreur: ' + error.message);
    }
}

// Close exposant details modal on outside click
document.getElementById('exposantDetailsModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'exposantDetailsModal') {
        closeExposantDetailsModal();
    }
});

// Invites Management
let currentInvitePage = 1;
let inviteFilters = {
    search: '',
    statut: ''
};

async function loadInvitesList(page = 1) {
    try {
        currentInvitePage = page;
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20'
        });

        if (inviteFilters.search) {
            params.append('search', inviteFilters.search);
        }
        if (inviteFilters.statut !== '') {
            params.append('statut', inviteFilters.statut);
        }

        const data = await apiRequest(`${ADMIN_API_BASE}/invites?${params.toString()}`);
        const invites = Array.isArray(data.data) ? data.data : [];
        
        renderInvitesTable(invites);
        renderInvitePagination(data.pagination || {});
    } catch (error) {
        console.error('Error loading invites:', error);
        const tbody = document.getElementById('invitesTable');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-red-500">Erreur: ${error.message}</td></tr>`;
        }
    }
}

function renderInvitesTable(invites) {
    const tbody = document.getElementById('invitesTable');
    if (!tbody) return;

    if (invites.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">Aucun invité trouvé</td></tr>';
        return;
    }

    tbody.innerHTML = invites.map(invite => {
        const createdAt = new Date(invite.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${invite.nom}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${invite.email}</td>
                <td class="px-4 py-3 text-sm">${getStatusBadge(invite.statut)}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${createdAt}</td>
                <td class="px-4 py-3 text-sm">
                    <div class="flex items-center space-x-2">
                        <button onclick="openEditInviteModal('${invite._id}')" 
                            class="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs">
                            <i class="fas fa-edit mr-1"></i>Modifier
                        </button>
                        <button onclick="toggleInviteStatus('${invite._id}', ${invite.statut})" 
                            class="px-3 py-1 ${invite.statut === 1 ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition text-xs">
                            <i class="fas ${invite.statut === 1 ? 'fa-ban' : 'fa-check'} mr-1"></i>${invite.statut === 1 ? 'Désactiver' : 'Activer'}
                        </button>
                        <button onclick="confirmDeleteInvite('${invite._id}', '${(invite.nom || '').replace(/'/g, "\\'")}')" 
                            class="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs">
                            <i class="fas fa-trash mr-1"></i>Supprimer
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderInvitePagination(pagination) {
    const container = document.getElementById('invitePagination');
    if (!container) return;

    if (!pagination || pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="flex items-center space-x-2">';
    
    // Previous button
    if (pagination.page > 1) {
        html += `<button onclick="loadInvitesList(${pagination.page - 1})" 
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    }

    // Page numbers
    for (let i = 1; i <= pagination.pages; i++) {
        if (i === 1 || i === pagination.pages || (i >= pagination.page - 2 && i <= pagination.page + 2)) {
            html += `<button onclick="loadInvitesList(${i})" 
                class="px-4 py-2 border border-gray-300 rounded-lg transition ${i === pagination.page ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}">
                ${i}
            </button>`;
        } else if (i === pagination.page - 3 || i === pagination.page + 3) {
            html += `<span class="px-4 py-2">...</span>`;
        }
    }

    // Next button
    if (pagination.page < pagination.pages) {
        html += `<button onclick="loadInvitesList(${pagination.page + 1})" 
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

function applyInviteFilters() {
    const searchInput = document.getElementById('inviteSearchInput');
    const filterStatus = document.getElementById('inviteFilterStatus');

    inviteFilters.search = searchInput ? searchInput.value.trim() : '';
    inviteFilters.statut = filterStatus ? filterStatus.value : '';

    loadInvitesList(1);
}

function openCreateInviteModal() {
    const modal = document.getElementById('createInviteModal');
    if (!modal) return;

    // Reset form
    document.getElementById('createInviteForm').reset();
    document.getElementById('createInviteStatut').value = '1';
    document.getElementById('createInviteMessage').classList.add('hidden');

    modal.classList.remove('hidden');
}

function closeCreateInviteModal() {
    const modal = document.getElementById('createInviteModal');
    if (modal) modal.classList.add('hidden');
}

async function openEditInviteModal(inviteId) {
    try {
        const data = await apiRequest(`${ADMIN_API_BASE}/invites/${inviteId}`);
        const invite = data.data;

        if (!invite) {
            alert('Invité non trouvé');
            return;
        }

        const modal = document.getElementById('editInviteModal');
        if (!modal) return;

        // Fill form
        document.getElementById('editInviteId').value = invite._id;
        document.getElementById('editInviteNom').value = invite.nom || '';
        document.getElementById('editInviteEmail').value = invite.email || '';
        document.getElementById('editInvitePassword').value = '';
        document.getElementById('editInviteStatut').value = invite.statut || 1;

        document.getElementById('editInviteMessage').classList.add('hidden');
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading invite:', error);
        alert('Erreur lors du chargement de l\'invité: ' + error.message);
    }
}

function closeEditInviteModal() {
    const modal = document.getElementById('editInviteModal');
    if (modal) modal.classList.add('hidden');
}

async function handleCreateInvite(e) {
    e.preventDefault();

    const messageDiv = document.getElementById('createInviteMessage');
    messageDiv.classList.add('hidden');

    try {
        const nom = document.getElementById('createInviteNom').value.trim();
        const email = document.getElementById('createInviteEmail').value.trim();
        const password = document.getElementById('createInvitePassword').value;
        const statut = parseInt(document.getElementById('createInviteStatut').value) || 1;

        if (!nom || !email || !password) {
            throw new Error('Tous les champs sont requis');
        }

        if (password.length < 5) {
            throw new Error('Le mot de passe doit contenir au moins 5 caractères');
        }

        const inviteData = {
            nom,
            email,
            password,
            statut
        };

        await apiRequest(`${ADMIN_API_BASE}/invites`, {
            method: 'POST',
            body: JSON.stringify(inviteData),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        messageDiv.className = 'mt-4 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg';
        messageDiv.textContent = 'Invité créé avec succès !';
        messageDiv.classList.remove('hidden');

        setTimeout(() => {
            closeCreateInviteModal();
            loadInvitesList(currentInvitePage);
        }, 1500);
    } catch (error) {
        console.error('Error creating invite:', error);
        messageDiv.className = 'mt-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg';
        messageDiv.textContent = 'Erreur: ' + (error.message || 'Impossible de créer l\'invité');
        messageDiv.classList.remove('hidden');
    }
}

async function handleEditInvite(e) {
    e.preventDefault();

    const messageDiv = document.getElementById('editInviteMessage');
    messageDiv.classList.add('hidden');

    try {
        const inviteId = document.getElementById('editInviteId').value;
        const nom = document.getElementById('editInviteNom').value.trim();
        const email = document.getElementById('editInviteEmail').value.trim();
        const password = document.getElementById('editInvitePassword').value;
        const statut = parseInt(document.getElementById('editInviteStatut').value) || 1;

        if (!inviteId || !nom || !email) {
            throw new Error('Tous les champs sont requis (sauf le mot de passe)');
        }

        if (password && password.length < 5) {
            throw new Error('Le mot de passe doit contenir au moins 5 caractères');
        }

        const inviteData = {
            nom,
            email,
            statut
        };

        // Only include password if provided
        if (password) {
            inviteData.password = password;
        }

        await apiRequest(`${ADMIN_API_BASE}/invites/${inviteId}`, {
            method: 'PUT',
            body: JSON.stringify(inviteData),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        messageDiv.className = 'mt-4 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg';
        messageDiv.textContent = 'Invité mis à jour avec succès !';
        messageDiv.classList.remove('hidden');

        setTimeout(() => {
            closeEditInviteModal();
            loadInvitesList(currentInvitePage);
        }, 1500);
    } catch (error) {
        console.error('Error updating invite:', error);
        messageDiv.className = 'mt-4 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg';
        messageDiv.textContent = 'Erreur: ' + (error.message || 'Impossible de mettre à jour l\'invité');
        messageDiv.classList.remove('hidden');
    }
}

async function toggleInviteStatus(inviteId, currentStatus) {
    try {
        const newStatus = currentStatus === 1 ? 0 : 1;
        const action = newStatus === 1 ? 'activer' : 'désactiver';

        if (!confirm(`Êtes-vous sûr de vouloir ${action} cet invité ?`)) {
            return;
        }

        await apiRequest(`${ADMIN_API_BASE}/invites/${inviteId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ statut: newStatus }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        alert(`Invité ${action === 'activer' ? 'activé' : 'désactivé'} avec succès`);
        loadInvitesList(currentInvitePage);
    } catch (error) {
        console.error('Error toggling invite status:', error);
        alert('Erreur lors de la modification du statut: ' + error.message);
    }
}

async function confirmDeleteInvite(inviteId, inviteName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'invité "${inviteName}" ? Cette action est irréversible.`)) {
        return;
    }

    try {
        await apiRequest(`${ADMIN_API_BASE}/invites/${inviteId}`, {
            method: 'DELETE'
        });

        alert('Invité supprimé avec succès');
        loadInvitesList(currentInvitePage);
    } catch (error) {
        console.error('Error deleting invite:', error);
        alert('Erreur lors de la suppression: ' + error.message);
    }
}
