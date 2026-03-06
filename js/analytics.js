/**
 * SISTEMA DE ANALYTICS UNIVERSAL - PROGRESSIVE
 * Rastreia TODOS os visitantes (cadastrados ou não)
 * 
 * Funcionalidades:
 * - Tracking de visitantes anônimos
 * - Vinculação com leads após cadastro
 * - Rastreamento de todas as interações
 * - Métricas de engajamento e conversão
 */

const AnalyticsTracker = {
    sessionId: null,
    leadId: null,
    startTime: Date.now(),
    lastAction: null,
    scrollMilestones: [25, 50, 75, 100],
    timeUpdateInterval: null,
    
    /**
     * Inicializa o sistema de tracking
     */
    init() {
        this.sessionId = this.getOrCreateSessionId();
        this.checkLeadId();
        this.trackPageView();
        this.setupEventListeners();
        this.trackScrollDepth();
        this.trackTimeOnPage();
        this.trackScreenInfo();
        
        console.log('🔍 Analytics Progressive iniciado');
        console.log('📊 Session ID:', this.sessionId);
        if (this.leadId) {
            console.log('👤 Lead identificado:', this.leadId);
        } else {
            console.log('👻 Visitante anônimo');
        }
    },
    
    /**
     * Gera ou recupera Session ID único
     */
    getOrCreateSessionId() {
        let sid = sessionStorage.getItem('prog_session_id');
        if (!sid) {
            sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('prog_session_id', sid);
        }
        return sid;
    },
    
    /**
     * Verifica se é um lead já cadastrado
     */
    checkLeadId() {
        this.leadId = localStorage.getItem('prog_lead_id');
    },
    
    /**
     * Define o Lead ID após cadastro (chamado pelo cadastro.php)
     */
    setLeadId(leadId) {
        this.leadId = leadId;
        localStorage.setItem('prog_lead_id', leadId);
        this.track('lead_identified', leadId, 'conversion');
        console.log('✅ Lead vinculado ao session:', leadId);
    },
    
    /**
     * Função principal de tracking
     */
    track(actionType, actionDetail, pageSection = '', duration = 0) {
        // Detecta o tema atual do body
        const currentTheme = $('body').attr('class').split(' ').find(c => c.startsWith('theme-')) || 'theme-bright';
        const themeName = currentTheme.replace('theme-', '').toUpperCase();
        
        const data = {
            session_id: this.sessionId,
            lead_id: this.leadId || '',
            action_type: actionType,
            action_detail: actionDetail,
            page_section: pageSection,
            duration: duration,
            screen_resolution: screen.width + 'x' + screen.height,
            current_theme: themeName
        };
        
        // Envia para o backend de forma assíncrona
        $.ajax({
            url: 'track_analytics.php',
            method: 'POST',
            data: data,
            async: true,
            error: function(xhr, status, error) {
                console.warn('⚠️ Erro ao enviar analytics:', error);
            }
        });
        
        this.lastAction = {
            type: actionType,
            detail: actionDetail,
            timestamp: Date.now()
        };
    },
    
    /**
     * Rastreia visualização inicial da página
     */
    trackPageView() {
        this.track('page_view', window.location.pathname, 'home');
    },
    
    /**
     * Captura informações técnicas do dispositivo
     */
    trackScreenInfo() {
        const screenInfo = {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: screen.orientation?.type || 'unknown'
        };
        this.track('device_info', JSON.stringify(screenInfo), 'technical');
    },
    
    /**
     * Configura listeners para todas as interações
     */
    setupEventListeners() {
        const self = this;
        
        // === NAVEGAÇÃO SUPERIOR ===
        $('#fotosLink, #fotosLink2').on('click', function() {
            self.track('click', 'Botão Galeria Fotos', 'navigation');
        });
        
        $('#videosLink').on('click', function() {
            self.track('click', 'Botão Vídeos', 'navigation');
        });
        
        $('#regrasLink, #regrasLinkFooter, #regrasLinkFooter2').on('click', function() {
            self.track('modal_open', 'Regras (Pode/Não Pode)', 'navigation');
        });
        
        $('#contatoLink').on('click', function() {
            self.track('modal_open', 'Contato WhatsApp', 'navigation');
        });
        
        // === REDES SOCIAIS ===
        $('a[href*="instagram.com/progressive"]').on('click', function() {
            self.track('click', 'Instagram Progressive', 'social');
        });
        
        $('a[href*="spotify.com"]').on('click', function() {
            self.track('click', 'Spotify Playlist', 'social');
        });
        
        $('a[href*="facebook.com"]').on('click', function() {
            self.track('click', 'Facebook', 'social');
        });
        
        // === MUDANÇA DE TEMA ===
        // Nota: O tracking de tema é feito diretamente na função changeTheme() do index.php
        // para garantir que sempre seja registrado, mesmo quando o tema é carregado do localStorage
        
        // === LINK DA STORE ===
        $('a[href*="store.progressive"]').on('click', function() {
            self.track('external_link', 'Progressive Store', 'shop');
        });
        
        // === COMPRAR INGRESSO (CTA Principal) ===
        $('a[href*="ticketdigitall"]').on('click', function() {
            self.track('conversion_intent', 'Clique Comprar Ingresso - TicketDigitall', 'cta');
        });
        
        // === MODAL DE CADASTRO ===
        $('#CONTATOModal').on('shown.bs.modal', function() {
            self.track('modal_open', 'Modal Cadastro Grupo VIP', 'conversion');
        });
        
        $('#CONTATOModal').on('hidden.bs.modal', function() {
            // Se fechou sem cadastrar
            if (!self.leadId) {
                self.track('modal_close', 'Fechou modal sem cadastrar', 'conversion_lost');
            }
        });
        
        // === GALERIA DE FOTOS ===
        $(document).on('click', '.gallery-trigger-link, .gallery-item', function() {
            self.track('gallery_open', 'Galeria Principal Aberta', 'gallery');
        });
        
        // === LINKS EXTERNOS GENÉRICOS ===
        $('a[target="_blank"]').on('click', function() {
            const href = $(this).attr('href');
            const title = $(this).attr('title') || $(this).text().trim() || 'Link Externo';
            self.track('external_link', title, 'link');
        });
        
        // === LINKS DO RODAPÉ ===
        $('.footer-column-parallax a').on('click', function() {
            const text = $(this).text().trim();
            self.track('footer_link', text, 'footer');
        });
    },
    
    /**
     * Rastreia profundidade de scroll (engajamento)
     */
    trackScrollDepth() {
        const self = this;
        let maxScroll = 0;
        
        $(window).on('scroll', function() {
            const scrollTop = $(window).scrollTop();
            const docHeight = $(document).height() - $(window).height();
            const scrollPercent = Math.round((scrollTop / docHeight) * 100);
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                // Rastreia cada milestone uma única vez
                self.scrollMilestones.forEach((milestone, index) => {
                    if (scrollPercent >= milestone && maxScroll >= milestone) {
                        self.track('scroll_depth', `${milestone}%`, 'engagement');
                        self.scrollMilestones.splice(index, 1);
                    }
                });
            }
        });
    },
    
    /**
     * Rastreia tempo na página
     */
    trackTimeOnPage() {
        const self = this;
        
        // Atualiza a cada 30 segundos
        this.timeUpdateInterval = setInterval(function() {
            const timeSpent = Math.round((Date.now() - self.startTime) / 1000);
            self.track('time_update', `${timeSpent}s na página`, 'engagement', timeSpent);
        }, 30000);
        
        // Rastreia saída da página
        window.addEventListener('beforeunload', function() {
            const timeSpent = Math.round((Date.now() - self.startTime) / 1000);
            self.track('page_exit', `Total: ${timeSpent}s`, 'engagement', timeSpent);
        });
        
        // Rastreia troca de aba (usuário distração)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                self.track('tab_hidden', 'Usuário trocou de aba/minimizou', 'engagement');
            } else {
                self.track('tab_visible', 'Usuário voltou para a aba', 'engagement');
            }
        });
    }
};

/**
 * Função auxiliar para ser chamada após cadastro bem-sucedido
 * Usar no callback de sucesso do cadastro.php
 */
function vincularLeadComSession(leadId) {
    if (window.AnalyticsTracker) {
        window.AnalyticsTracker.setLeadId(leadId);
    }
}

// === INICIALIZAÇÃO AUTOMÁTICA ===
$(document).ready(function() {
    AnalyticsTracker.init();
    
    // Expõe globalmente
    window.AnalyticsTracker = AnalyticsTracker;
    window.vincularLeadComSession = vincularLeadComSession;
});

