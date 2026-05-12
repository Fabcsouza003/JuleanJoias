/**
 * ========================================
 * JULEAN JOIAS - MAIN JAVASCRIPT
 * GSAP + Lenis + ScrollTrigger Integration
 * ========================================
 */

// Registro dos Plugins GSAP
gsap.registerPlugin(ScrollTrigger);

// VARIÁVEIS GLOBAIS (MODULARES)
let lenis = null;
let ctx = gsap.context(() => {}); // Context para performance

/**
 * ========================================
 * 1. INICIALIZAÇÃO LENIS (ROBUSTA)
 * ========================================
 */
function initLenis() {
    // Tenta encontrar a classe Lenis de duas formas diferentes
    const LenisClass = window.Lenis || window.default?.Lenis;

    if (LenisClass) {
        lenis = new LenisClass({
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            // ... resto das suas configurações
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        console.log("✅ Lenis iniciado com sucesso!");
    } else {
        console.error("❌ Classe Lenis não encontrada. O site carregará sem scroll suave.");
        // Força a exibição do conteúdo se o Lenis falhar
        document.body.classList.add('loaded'); 
        gsap.to(".reveal", { opacity: 1, y: 0, stagger: 0.1 });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Definimos o tempo aqui (3000ms = 3 segundos)
    const tempoDeEspera = 1200; 

    setTimeout(() => {
        document.body.classList.add('ready');
        document.body.classList.add('loaded');
        
        // Se usar Lenis, AOS ou GSAP, inicie-os aqui:
        // lenis.scrollTo(0, { immediate: true });
        // AOS.refresh();
    }, tempoDeEspera);
});


window.addEventListener('load', function() {
    // Inicializa o Lenis primeiro
    initLenis();
    syncLenisGSAP();

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Inicializa os componentes visuais
    initHeaderScroll();
    initMobileNav();

    // No mobile, reduz efeitos pesados (parallax) por performance
    if (!isMobile) {
        initParallax();
        initParallaxHeranca();
    }

    initRevealAnimations();
    initSmoothScroll();
    if (!isMobile) initCardHovers();

    // ANIMAÇÃO DO HERO: Só começa depois que o site está pronto
    initHeroAnimation();

    // Garantir recálculo após layout pronto
    requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        document.body.classList.add('loaded');
    });
});



/**
 * ========================================
 * 2. SINCRONIZAÇÃO LENIS + GSAP (CRÍTICA)
 * ========================================
 */
function syncLenisGSAP() {
    if (!lenis) return;

    // SINCRONIZAÇÃO OBRIGATÓRIA
    lenis.on('scroll', () => {
    ScrollTrigger.update();
});
    
    // GSAP TICKER INTEGRATION (Ajustado para evitar conflito de loops)
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    
    // PERFORMANCE: Remove lag
    gsap.ticker.lagSmoothing(0);
}

/**
 * ========================================
 * 3. HEADER SCROLL EFFECT
 * ========================================
 */
function initHeaderScroll() {
    let header = document.querySelector('.header');
    if (!header) return; // Segurança contra erros de seleção
    
    ScrollTrigger.create({
        start: 'top top',
        onUpdate: (self) => {
            if (self.progress > 0) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });
}

function initMobileNav() {
    const header = document.querySelector('.header');
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('#mobile-nav');

    if (!header || !toggle || !nav) return;

    toggle.addEventListener('click', () => {
        const open = header.classList.toggle('mobile-nav-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });

    // Fecha ao clicar em um link de navegação
    nav.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', () => {
            header.classList.remove('mobile-nav-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Abrir menu');
        });
    });
}


/**
 * ========================================
 * 4. PARALLAX EFFECT (Scrub: true)
 * ========================================
 */
function initParallax() {
    // Limpa registros antigos
    ScrollTrigger.getAll().forEach(st => st.kill());

    gsap.utils.toArray('.card-image').forEach((container) => {
        const img = container.querySelector('img');
        const speed = parseFloat(container.getAttribute('data-parallax-speed')) || 0.15;
        
        // Calculamos o deslocamento: 15% da altura do container
        const movement = container.offsetHeight * speed;

        gsap.fromTo(img, {
            y: movement // Começa "caído" para baixo
        }, {
            y: -movement, // Termina "subindo"
            ease: "none",
            scrollTrigger: {
                trigger: container, // O movimento acontece enquanto o container cruza a tela
                start: "top bottom", // Começa quando o card surge na base
                end: "bottom top",   // Termina quando o card some no topo
                scrub: 1.2,          // Deixa o movimento "amanteigado"
                invalidateOnRefresh: true
            }
        });
    });
}

function initParallaxHeranca() {
    const img = document.querySelector('.img-heranca');
    const container = document.querySelector('.image-placeholder-history');

    if (img && container) {
        // Criamos a animação
        gsap.fromTo(img, {
            y: "-10%" // Começa um pouco subida
        }, {
            y: "10%",  // Termina um pouco descida
            ease: "none",
            scrollTrigger: {
                trigger: container,    // O gatilho é o quadrado
                start: "top bottom",   // Começa quando o quadrado entra na tela
                end: "bottom top",     // Termina quando o quadrado sai da tela
                scrub: true,           // Segue o dedo/scroll exatamente
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    // Debug log opcional para você ver no console se está rodando
                    // console.log("Parallax Herança rodando:", self.progress);
                }
            }
        });
    } else {
        console.error("Erro: .img-heranca ou .image-placeholder não encontrados!");
    }
}

/**
 * ========================================
 * 5. REVEAL ANIMATIONS (Fade-in + Slide-up)
 * ========================================
 */
function initRevealAnimations() {
    gsap.utils.toArray('.reveal').forEach((element, index) => {
        ScrollTrigger.create({
            trigger: element,
            start: 'top 85%',
            onEnter: () => {
                gsap.to(element, {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    delay: index * 0.1
                });
            }
        });
    });
}

/**
 * ========================================
 * 6. SMOOTH SCROLL PARA LINKS INTERNOS
 * ========================================
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target && lenis) {
                lenis.scrollTo(target, {
                    duration: 1.8,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    offset: -100
                });
            }
        });
    });
}

/**
 * ========================================
 * 7. HERO TITLE STAGGER ANIMATION
 * ========================================
 */
function initHeroAnimation() {
    // Adicionado check de existência para evitar erros de console
    if (!document.querySelector('.hero-title')) return;

    gsap.timeline()
        .from('.hero-title .title-line:nth-child(1)', {
            y: 100,
            opacity: 0,
            duration: 1.2,
            ease: 'power3.out'
        })
        .from('.hero-title .title-line:nth-child(2)', {
            y: 100,
            opacity: 0,
            duration: 1.2,
            ease: 'power3.out'
        }, '-=0.8')
        .from('.hero-subtitle', {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power2.out'
        }, '-=0.6')
        .from('.hero-cta', {
            scale: 0.9,
            opacity: 0,
            duration: 0.8,
            ease: 'back.out(1.7)'
        }, '-=0.4');
}

/**
 * ========================================
 * 8. COLEÇÃO CARDS HOVER EFFECTS
 * ========================================
 */
function initCardHovers() {
    gsap.utils.toArray('.colecao-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                scale: 1.02,
                y: -20,
                duration: 0.4,
                ease: 'power2.out'
            });
        });
        
        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                scale: 1,
                y: 0,
                duration: 0.4,
                ease: 'power2.out'
            });
        });
    });
}

/**
 * ========================================
 * 9. INICIALIZAÇÃO PRINCIPAL (DOMContentLoaded)
 * ========================================
 */
// Função para forçar o refresh total
function forceScrollRefresh() {
    if (lenis) lenis.resize();
    ScrollTrigger.refresh();
    console.log("⚡ Parallax sincronizado!");
}

document.addEventListener('DOMContentLoaded', function() {
    // Inicializações principais já ocorrem no `window.load`.
});

// Atualiza depois que tudo carregou (imagens, layout, etc.)
window.addEventListener('load', forceScrollRefresh);

/**
 * ========================================
 * 10. WINDOW RESIZE & REFRESH
 * ========================================
 */
window.addEventListener('resize', () => {
    if (lenis) lenis.resize();
    ScrollTrigger.refresh();
});

// Preload crítico para performance
window.addEventListener('load', () => {
    // Dá um tempo para o navegador renderizar tudo
    setTimeout(() => {
        if (lenis) lenis.resize();
        ScrollTrigger.refresh();
        console.log('🚀 ScrollTrigger recalculado após carregamento de imagens');
    }, 500);
});

