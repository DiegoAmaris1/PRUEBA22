// ========================================
// HEADER FIJO Y VISIBLE - VERSIÓN MEJORADA
// Reemplazar el bloque "HEADER SCROLL EFFECT" y "HEADER INICIAL"
// ========================================

(function() {
  'use strict';
  
  const header = document.querySelector('.u-header');
  if (!header) return;
  
  let lastScrollTop = 0;
  let ticking = false;
  
  // Configurar header inicial
  function initHeader() {
    header.style.position = 'fixed';
    header.style.top = '0';
    header.style.left = '0';
    header.style.right = '0';
    header.style.width = '100%';
    header.style.zIndex = '9999';
  }
  
  // Actualizar estado del header según scroll
  function updateHeaderOnScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Agregar/quitar clase 'scrolled' para efectos
    if (scrollTop > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    // Header SIEMPRE visible (sin ocultar)
    header.style.transform = 'translateY(0)';
    header.style.opacity = '1';
    
    lastScrollTop = scrollTop;
  }
  
  // Optimización con requestAnimationFrame
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateHeaderOnScroll();
        ticking = false;
      });
      ticking = true;
    }
  }
  
  // Event listeners
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', initHeader);
  
  // Inicializar inmediatamente
  initHeader();
  
  // Smooth scroll mejorado para navegación
  const menuLinks = document.querySelectorAll('.u-nav-link[href^="#"], a[href^="#"]');
  
  menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      if (href && href.startsWith('#') && href !== '#' && href !== '#0') {
        e.preventDefault();
        
        const targetId = href;
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          const headerHeight = header.offsetHeight || 80;
          const additionalOffset = 20;
          const targetPosition = targetElement.getBoundingClientRect().top + 
                                window.pageYOffset - 
                                headerHeight - 
                                additionalOffset;
          
          // Cerrar menú móvil si está abierto
          const mobileMenu = document.querySelector('.u-sidenav');
          const menuClose = document.querySelector('.u-menu-close');
          if (mobileMenu && mobileMenu.style.transform === 'translateX(0px)' && menuClose) {
            menuClose.click();
          }
          
          // Scroll suave
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Actualizar URL
          if (history.pushState) {
            history.pushState(null, null, targetId);
          }
        }
      }
    });
  });
  
  // Manejar hash en URL al cargar
  if (window.location.hash) {
    setTimeout(() => {
      const targetElement = document.querySelector(window.location.hash);
      if (targetElement) {
        const headerHeight = header.offsetHeight || 80;
        const targetPosition = targetElement.getBoundingClientRect().top + 
                              window.pageYOffset - 
                              headerHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }, 300);
  }
  
  console.log('✅ Header fijo inicializado correctamente');
  
})();