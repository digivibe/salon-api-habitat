// Configuration
const API_BASE = '/api/v1';
const AUTH_API_BASE = '/api/v1/auth';
const MANAGE_API_BASE = '/api/v1/manage';

// State
let token = localStorage.getItem('adminToken');
let currentPage = 1;
let allExposants = [];
let categories = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }

    // Event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('createForm').addEventListener('submit', handleCreate);
    document.getElementById('editForm').addEventListener('submit', handleEdit);
});

// Navigation
function showLogin() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('dashboardScreen').classList.remove('active');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.add('active');

    loadCategories();
    loadStats();
    showTab('stats');
}

function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tabs .tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');

    // Load data for specific tabs
    if (tabName === 'list') {
        loadExposants();
    }
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
        // First, create a visitor token
        const visitorRes = await fetch(`${API_BASE}/user/new`, {
            method: 'GET'
        });
        const visitorData = await visitorRes.json();
        const visitorToken = visitorData.token;

        // Then login
        const loginRes = await fetch(`${AUTH_API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: visitorToken,
                email: username,
                password
            })
        });

        const loginData = await loginRes.json();

        if (loginData.status === 200) {
            token = visitorToken;
            localStorage.setItem('adminToken', token);

            // Check if user is admin
            const statsRes = await fetch(`${MANAGE_API_BASE}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (statsRes.status === 403) {
                errorDiv.textContent = "Accès refusé. Droits d'administrateur requis.";
                errorDiv.style.display = 'block';
                localStorage.removeItem('adminToken');
                token = null;
                return;
            }

            if (!statsRes.ok) {
                throw new Error('Erreur de connexion');
            }

            // Success - get admin info
            document.getElementById('adminName').textContent = loginData.expo?.nom || username;
            showDashboard();
        } else {
            errorDiv.textContent = loginData.message || 'Identifiants incorrects';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Erreur de connexion: ' + error.message;
        errorDiv.style.display = 'block';
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

// Categories
async function loadCategories() {
    try {
        const data = await apiRequest(`${API_BASE}/app/categories`);
        categories = data;

        // Populate category selects
        const createSelect = document.getElementById('createCategorie');
        createSelect.innerHTML = '<option value="">Sélectionner...</option>';

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat._id;
            option.textContent = cat.label;
            createSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Statistics
async function loadStats() {
    try {
        const data = await apiRequest(`${MANAGE_API_BASE}/stats`);

        // Update main stats
        document.getElementById('totalExposants').textContent = data.data.exposants.total;
        document.getElementById('activeExposants').textContent = data.data.exposants.active;
        document.getElementById('inactiveExposants').textContent = data.data.exposants.inactive;
        document.getElementById('adminCount').textContent = data.data.byValidation.administrator;

        // Validation stats
        const validationLabels = {
            simpleExposant: 'Simple exposant',
            valideNoPublication: 'Validé sans publication',
            valideWithPublication: 'Validé avec publication',
            administrator: 'Administrateur'
        };

        const validationContainer = document.getElementById('validationStats');
        validationContainer.innerHTML = '';

        Object.entries(data.data.byValidation).forEach(([key, value]) => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `
                <div class="stat-item-label">${validationLabels[key]}</div>
                <div class="stat-item-value">${value}</div>
            `;
            validationContainer.appendChild(div);
        });

        // Category stats
        const categoryContainer = document.getElementById('categoryStats');
        categoryContainer.innerHTML = '';

        data.data.byCategory.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `
                <div class="stat-item-label">${cat.label}</div>
                <div class="stat-item-value">${cat.count}</div>
            `;
            categoryContainer.appendChild(div);
        });

        // Content stats
        document.getElementById('videoCount').textContent = data.data.content.videos;
        document.getElementById('bondealCount').textContent = data.data.content.bondeals;
        document.getElementById('commentCount').textContent = data.data.content.comments;
        document.getElementById('likeCount').textContent = data.data.content.likes;
    } catch (error) {
        console.error('Error loading stats:', error);
        showMessage('statsTab', 'Erreur lors du chargement des statistiques', 'error');
    }
}

// Exposants List
async function loadExposants(page = 1) {
    try {
        currentPage = page;
        const data = await apiRequest(`${MANAGE_API_BASE}/exposants?page=${page}&limit=20`);
        allExposants = data.data;

        renderExposantsTable(allExposants);
        renderPagination(data.pagination);
    } catch (error) {
        console.error('Error loading exposants:', error);
        document.getElementById('exposantsTable').innerHTML = `
            <tr><td colspan="6" class="loading">Erreur: ${error.message}</td></tr>
        `;
    }
}

function renderExposantsTable(exposants) {
    const tbody = document.getElementById('exposantsTable');

    if (exposants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Aucun exposant trouvé</td></tr>';
        return;
    }

    tbody.innerHTML = exposants.map(expo => `
        <tr>
            <td><strong>${expo.nom}</strong></td>
            <td>${expo.email}</td>
            <td>${expo.categorie?.label || 'N/A'}</td>
            <td>${getValidationBadge(expo.isValid)}</td>
            <td>${getStatusBadge(expo.statut)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon" onclick="openEditModal('${expo._id}')" title="Modifier">
                        ✏️
                    </button>
                    <button class="btn-icon ${expo.statut === 1 ? 'warning' : 'success'}"
                            onclick="toggleStatus('${expo._id}', ${expo.statut})"
                            title="${expo.statut === 1 ? 'Désactiver' : 'Activer'}">
                        ${expo.statut === 1 ? '⏸️' : '▶️'}
                    </button>
                    <button class="btn-icon danger" onclick="deleteExposant('${expo._id}', '${expo.nom}')" title="Supprimer">
                        🗑️
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
    container.innerHTML = '';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Précédent';
    prevBtn.disabled = pagination.page === 1;
    prevBtn.onclick = () => loadExposants(pagination.page - 1);
    container.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= pagination.pages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === pagination.page ? 'active' : '';
        pageBtn.onclick = () => loadExposants(i);
        container.appendChild(pageBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Suivant →';
    nextBtn.disabled = pagination.page === pagination.pages;
    nextBtn.onclick = () => loadExposants(pagination.page + 1);
    container.appendChild(nextBtn);
}

// Filters
function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const isValid = document.getElementById('filterValid').value;
    const statut = document.getElementById('filterStatus').value;

    const filtered = allExposants.filter(expo => {
        const matchSearch = !search ||
            expo.nom.toLowerCase().includes(search) ||
            expo.email.toLowerCase().includes(search) ||
            expo.username.toLowerCase().includes(search);

        const matchValid = !isValid || expo.isValid === parseInt(isValid);
        const matchStatus = !statut || expo.statut === parseInt(statut);

        return matchSearch && matchValid && matchStatus;
    });

    renderExposantsTable(filtered);
}

// Create Exposant
async function handleCreate(e) {
    e.preventDefault();
    const messageDiv = document.getElementById('createMessage');

    try {
        const data = {
            nom: document.getElementById('createNom').value,
            username: document.getElementById('createUsername').value,
            email: document.getElementById('createEmail').value,
            password: document.getElementById('createPassword').value,
            categorie: document.getElementById('createCategorie').value,
            location: document.getElementById('createLocation').value,
            bio: document.getElementById('createBio').value,
            phoneNumber: document.getElementById('createPhone').value,
            weblink: document.getElementById('createWeblink').value,
            linkedinLink: document.getElementById('createLinkedin').value,
            facebookLink: document.getElementById('createFacebook').value,
            instaLink: document.getElementById('createInstagram').value,
            isValid: parseInt(document.getElementById('createIsValid').value)
        };

        await apiRequest(`${MANAGE_API_BASE}/exposants`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        messageDiv.textContent = 'Exposant créé avec succès!';
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';

        document.getElementById('createForm').reset();

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);

        // Reload stats
        loadStats();
    } catch (error) {
        messageDiv.textContent = 'Erreur: ' + error.message;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
}

// Edit Exposant
async function openEditModal(id) {
    try {
        const data = await apiRequest(`${MANAGE_API_BASE}/exposants/${id}`);
        const expo = data.data;

        document.getElementById('editId').value = expo._id;
        document.getElementById('editNom').value = expo.nom;
        document.getElementById('editEmail').value = expo.email;
        document.getElementById('editLocation').value = expo.location;
        document.getElementById('editBio').value = expo.bio;
        document.getElementById('editPhone').value = expo.phoneNumber || '';
        document.getElementById('editIsValid').value = expo.isValid;
        document.getElementById('editStatut').value = expo.statut;

        document.getElementById('editModal').classList.add('active');
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    document.getElementById('editMessage').style.display = 'none';
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
            phoneNumber: document.getElementById('editPhone').value,
            isValid: parseInt(document.getElementById('editIsValid').value),
            statut: parseInt(document.getElementById('editStatut').value)
        };

        await apiRequest(`${MANAGE_API_BASE}/exposants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        messageDiv.textContent = 'Exposant mis à jour avec succès!';
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';

        setTimeout(() => {
            closeEditModal();
            loadExposants(currentPage);
        }, 1500);
    } catch (error) {
        messageDiv.textContent = 'Erreur: ' + error.message;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
}

// Toggle Status
async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
        await apiRequest(`${MANAGE_API_BASE}/exposants/${id}/status`, {
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
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?\n\nCette action supprimera également toutes les données associées (vidéos, bondeals, comments, likes, logins).`)) {
        return;
    }

    try {
        await apiRequest(`${MANAGE_API_BASE}/exposants/${id}`, {
            method: 'DELETE'
        });

        loadExposants(currentPage);
        loadStats();
    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

// Close modal on outside click
document.getElementById('editModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});
