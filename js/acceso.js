// ============================================
// CONFIGURACIÓN
// ============================================

// URL de tu Google Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw98RVq5j1uaDXhzjbFZlgV3tYRv9FPdLSVL7aEElTZYbTT860lulXyL_w1lRHDkm_5zA/exec';

// Configuración LinkedIn OAuth (REEMPLAZAR CON TUS CREDENCIALES REALES)
const LINKEDIN_CONFIG = {
    clientId: '78dtq4astfn7fg',  // 🔑 Reemplazar con tu Client ID
    redirectUri: 'https://script.google.com/macros/s/AKfycbw98RVq5j1uaDXhzjbFZlgV3tYRv9FPdLSVL7aEElTZYbTT860lulXyL_w1lRHDkm_5zA/exec',

    scope: 'openid profile email',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization'
};

// ============================================
// ELEMENTOS DEL DOM
// ============================================

const linkedinBtn = document.getElementById('linkedin-btn');
const loadingEl = document.getElementById('loading');
const logoutBtn = document.getElementById('logout-btn');

// ============================================
// DETECTAR ORIGEN DEL TRÁFICO
// ============================================

function detectTrafficSource() {
    const referrer = document.referrer;
    const urlParams = new URLSearchParams(window.location.search);
    
    let source = 'Directo';
    
    // Detectar desde URL params
    if (urlParams.has('utm_source')) {
        source = urlParams.get('utm_source');
    } 
    // Detectar desde referrer
    else if (referrer.includes('linkedin.com')) {
        source = 'LinkedIn';
    } else if (referrer.includes('facebook.com')) {
        source = 'Facebook';
    } else if (referrer.includes('instagram.com')) {
        source = 'Instagram';
    } else if (referrer.includes('google.com')) {
        source = 'Google';
    } else if (referrer) {
        source = 'Referencia: ' + new URL(referrer).hostname;
    }
    
    return {
        source: source,
        referrer: referrer,
        campaign: urlParams.get('utm_campaign') || 'N/A',
        medium: urlParams.get('utm_medium') || 'N/A'
    };
}

// ============================================
// CAPTURAR INFORMACIÓN DEL DISPOSITIVO
// ============================================

function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform
    };
}

// ============================================
// GUARDAR EN GOOGLE SHEETS
// ============================================

async function saveToGoogleSheets(userData) {
    const trafficSource = detectTrafficSource();
    const deviceInfo = getDeviceInfo();
    
    const data = {
        // Datos de LinkedIn
        name: userData.name || 'N/A',
        email: userData.email || 'N/A',
        linkedin: userData.linkedin || 'N/A',
        company: userData.company || 'N/A',
        position: userData.position || 'N/A',
        picture: userData.picture || 'N/A',
        
        // Datos de tracking
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('es-CO'),
        time: new Date().toLocaleTimeString('es-CO'),
        
        // Origen
        source: trafficSource.source,
        referrer: trafficSource.referrer,
        campaign: trafficSource.campaign,
        medium: trafficSource.medium,
        
        // Dispositivo
        device: deviceInfo.userAgent,
        language: deviceInfo.language,
        screen: deviceInfo.screenResolution,
        timezone: deviceInfo.timezone
    };
    
    try {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
        
        console.log('✅ Datos guardados en Google Sheets:', data);
        return true;
    } catch (error) {
        console.error('❌ Error al guardar en Google Sheets:', error);
        return false;
    }
}

// ============================================
// GENERAR STATE ALEATORIO (Seguridad CSRF)
// ============================================

function generarStateAleatorio() {
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

// ============================================
// LOGIN CON LINKEDIN (OAUTH REAL)
// ============================================

function loginWithLinkedIn() {
    console.log('🔐 Iniciando autenticación con LinkedIn OAuth...');
    
    // Mostrar loading
    if (loadingEl) {
        loadingEl.classList.add('active');
    }
    if (linkedinBtn) {
        linkedinBtn.disabled = true;
    }
    
    // Generar state aleatorio para seguridad
    const state = generarStateAleatorio();
    localStorage.setItem('oauth_state', state);
    
    // Guardar origen del tráfico antes de salir
    const trafficSource = detectTrafficSource();
    localStorage.setItem('traffic_source', JSON.stringify(trafficSource));
    
    // Construir URL de autorización OAuth
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: LINKEDIN_CONFIG.clientId,
        redirect_uri: LINKEDIN_CONFIG.redirectUri,
        scope: LINKEDIN_CONFIG.scope,
        state: state
        
    });
    
    const authUrl = `${LINKEDIN_CONFIG.authUrl}?${params.toString()}`;
    
    console.log('🔗 Redirigiendo a LinkedIn para autenticación...');
    
    // Redirigir a LinkedIn
    window.location.href = authUrl;
}

// ============================================
// VERIFICAR AUTENTICACIÓN (Para acceso.html)
// ============================================

function verificarAutenticacion() {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('linkedinUser');
    
    if (!isAuthenticated || !userData) {
        console.log('❌ Usuario no autenticado, redirigiendo...');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        mostrarDatosUsuario(user);
        console.log('✅ Usuario autenticado:', user.name);
    } catch (error) {
        console.error('❌ Error al leer datos del usuario:', error);
        cerrarSesion();
    }
}

// ============================================
// MOSTRAR DATOS DEL USUARIO EN LA UI
// ============================================

function mostrarDatosUsuario(user) {
    // Actualizar nombre
    const nombreElement = document.getElementById('usuario-nombre');
    if (nombreElement) {
        nombreElement.textContent = user.name;
    }
    
    // Actualizar email
    const emailElement = document.getElementById('usuario-email');
    if (emailElement) {
        emailElement.textContent = user.email || 'Email no disponible';
    }
    
    // Actualizar foto de perfil
    const fotoElement = document.getElementById('usuario-foto');
    if (fotoElement && user.picture) {
        fotoElement.src = user.picture;
        fotoElement.alt = user.name;
    }
    
    // Actualizar link de LinkedIn
    const linkedinLink = document.getElementById('linkedin-profile');
    if (linkedinLink && user.linkedin) {
        linkedinLink.href = user.linkedin;
    }
    
    console.log('✅ Datos del usuario mostrados en la interfaz');
}

// ============================================
// CERRAR SESIÓN
// ============================================

function cerrarSesion() {
    console.log('👋 Cerrando sesión...');
    
    // Limpiar localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('linkedinUser');
    localStorage.removeItem('oauth_state');
    localStorage.removeItem('traffic_source');
    
    // Redirigir al inicio
    window.location.href = 'index.html';
}

// ============================================
// EVENT LISTENERS
// ============================================

// Botón de login con LinkedIn
if (linkedinBtn) {
    linkedinBtn.addEventListener('click', loginWithLinkedIn);
}

// Botón de cerrar sesión
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            cerrarSesion();
        }
    });
}

// Verificar autenticación si estamos en acceso.html
if (window.location.pathname.includes('acceso.html')) {
    verificarAutenticacion();
}

// Detectar origen al cargar la página
window.addEventListener('load', () => {
    const source = detectTrafficSource();
    console.log('📊 Origen detectado:', source);
    
    // Mensaje personalizado según origen
    if (source.source === 'LinkedIn') {
        console.log('💼 Visitante desde LinkedIn detectado');
    }
});

// Prevenir salida accidental durante loading
window.addEventListener('beforeunload', (e) => {
    if (loadingEl && loadingEl.classList.contains('active')) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ============================================
// DEBUGGING
// ============================================

console.log('📱 Sistema de acceso LinkedIn OAuth + Google Sheets cargado');
console.log('🔑 Client ID:', LINKEDIN_CONFIG.clientId.substring(0, 15) + '...');
console.log('🔗 Redirect URI:', LINKEDIN_CONFIG.redirectUri);