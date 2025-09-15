// Blicence Widget SDK - Core Implementation
// Versiyon: 1.0.0-beta - Faz 1 Production Ready

(function(window, document) {
    'use strict';

    // Global Widget Registry & Error Handling
    window.BlicenceWidgets = window.BlicenceWidgets || [];
    window.BlicenceErrors = window.BlicenceErrors || [];

    /**
     * Blicence Widget SDK - Faz 1
     * Producer'ların web sitelerinde plan satışı yapabilmesi için optimized widget sistemi
     */
    class BlicenceWidget {
        constructor(options = {}) {
            // Enhanced configuration with validation
            this.config = this.validateAndSetConfig(options);
            
            // Optimized state management
            this.state = {
                initialized: false,
                loading: false,
                plans: [],
                selectedPlan: null,
                web3Provider: null,
                userAddress: null,
                networkConnected: false,
                error: null,
                retryCount: 0,
                lastUpdate: null
            };

            // Enhanced event system
            this.events = new EventTarget();
            
            // Initialize core modules
            this.analytics = new WidgetAnalytics(this.config);
            this.security = new SecurityManager(this.config);
            this.blockchain = new BlicenceBlockchainManager(this.config);
            this.ui = new WidgetUI(this.config);
            
            // Auto-init with error handling
            this.init().catch(error => this.handleError(error));
        }

        validateAndSetConfig(options) {
            // Validate required fields
            if (!options.producerAddress) {
                throw new Error('producerAddress is required');
            }

            return {
                // Temel ayarlar (required)
                container: options.container || '#blicence-widget',
                producerAddress: options.producerAddress,
                network: options.network || 'polygon',
                
                // Görünüm ayarları
                theme: options.theme || 'light',
                layout: options.layout || 'grid',
                primaryColor: options.primaryColor || '#3B82F6',
                secondaryColor: options.secondaryColor || '#F8FAFC',
                
                // Özellik ayarları
                showDescription: options.showDescription !== false,
                showFeatures: options.showFeatures !== false,
                showPricing: options.showPricing !== false,
                enablePurchase: options.enablePurchase !== false,
                autoConnect: options.autoConnect !== false,
                
                // Güvenlik ayarları
                allowedDomains: options.allowedDomains || [],
                requireHttps: options.requireHttps !== false,
                enableCORS: options.enableCORS !== false,
                
                // Performance ayarları
                cacheDuration: options.cacheDuration || 300000, // 5 dakika
                retryAttempts: options.retryAttempts || 3,
                loadTimeout: options.loadTimeout || 10000, // 10 saniye
                
                // Event callbacks
                onReady: options.onReady || null,
                onPlanSelected: options.onPlanSelected || null,
                onPurchaseStart: options.onPurchaseStart || null,
                onPurchaseComplete: options.onPurchaseComplete || null,
                onError: options.onError || null,
                onNetworkChange: options.onNetworkChange || null,
                
                // Analytics & Debug
                trackingEnabled: options.trackingEnabled !== false,
                googleAnalytics: options.googleAnalytics || null,
                debug: options.debug || false,
                
                ...options
            };
        }

        async init() {
            try {
                this.log('🚀 Initializing Blicence Widget v1.0.0-beta...');
                
                // 1. Güvenlik kontrolleri
                await this.security.validateEnvironment();
                this.log('✅ Security validation passed');
                
                // 2. Container validation
                this.container = this.findContainer();
                
                // 3. Widget registration
                window.BlicenceWidgets.push(this);
                this.log('📝 Widget registered globally');
                
                // 4. Core styles injection
                await this.injectStyles();
                this.log('🎨 Core styles injected');
                
                // 5. Loading state
                this.showLoading('Initializing blockchain connection...');
                
                // 6. Blockchain initialization (with retry)
                await this.initializeBlockchain();
                this.log('🔗 Blockchain connection established');
                
                // 7. Load producer plans
                await this.loadPlans();
                this.log('📋 Producer plans loaded');
                
                // 8. Render widget UI
                this.render();
                this.log('🎯 Widget UI rendered');
                
                // 9. Setup event listeners
                this.setupEventListeners();
                
                // 10. Analytics tracking
                this.analytics.track('widget_initialized', {
                    producer: this.config.producerAddress,
                    network: this.config.network,
                    theme: this.config.theme
                });
                
                // 11. Mark as ready
                this.state.initialized = true;
                this.state.loading = false;
                this.state.lastUpdate = Date.now();
                
                this.fireEvent('ready', { widget: this });
                this.log('🎉 Widget initialization completed successfully');
                
                // Callback execution
                if (typeof this.config.onReady === 'function') {
                    this.config.onReady(this);
                }
                
                return this;
                
            } catch (error) {
                this.log('❌ Widget initialization failed:', error);
                await this.handleError(error);
                throw error;
            }
        }

        findContainer() {
            let container;
            
            if (typeof this.config.container === 'string') {
                container = document.querySelector(this.config.container);
            } else if (this.config.container instanceof HTMLElement) {
                container = this.config.container;
            }

            if (!container) {
                throw new Error(`Container not found: ${this.config.container}`);
            }

            // Container'a widget identifier ekle
            container.setAttribute('data-blicence-widget', 'initialized');
            container.setAttribute('data-producer', this.config.producerAddress);
            
            return container;
        }

        async initializeBlockchain() {
            try {
                await this.blockchain.initialize();
                this.state.networkConnected = true;
                
                // Provider change listener
                if (window.ethereum) {
                    window.ethereum.on('accountsChanged', (accounts) => {
                        this.handleAccountChange(accounts);
                    });
                    
                    window.ethereum.on('chainChanged', (chainId) => {
                        this.handleNetworkChange(chainId);
                    });
                }
                
            } catch (error) {
                // Retry mechanism
                if (this.state.retryCount < this.config.retryAttempts) {
                    this.state.retryCount++;
                    this.log(`🔄 Retrying blockchain connection... (${this.state.retryCount}/${this.config.retryAttempts})`);
                    
                    await new Promise(resolve => setTimeout(resolve, 2000 * this.state.retryCount));
                    return this.initializeBlockchain();
                }
                
                throw new Error(`Blockchain connection failed after ${this.config.retryAttempts} attempts: ${error.message}`);
            }
        }

        async injectStyles() {
            // Check if styles already injected
            if (document.getElementById('blicence-widget-styles')) {
                return;
            }

            const styleElement = document.createElement('link');
            styleElement.id = 'blicence-widget-styles';
            styleElement.rel = 'stylesheet';
            styleElement.href = './blicence-widget-styles.css';
            
            // Fallback to inline styles if CSS file not available
            styleElement.onerror = () => {
                this.injectInlineStyles();
            };

            document.head.appendChild(styleElement);
            this.log('🎨 Widget styles injected');
        }

        injectInlineStyles() {
            if (document.getElementById('blicence-widget-inline-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'blicence-widget-inline-styles';
            style.textContent = this.getMinimalStyles();
            document.head.appendChild(style);
            this.log('🎨 Fallback inline styles injected');
        }

        getMinimalStyles() {
            return `
                .blicence-widget { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    border: 1px solid #e5e7eb; border-radius: 12px; background: white; 
                }
                .bw-header { 
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
                    color: white; padding: 24px; text-align: center; 
                }
                .bw-plans-grid { 
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
                    gap: 24px; padding: 32px; 
                }
                .bw-plan-card { 
                    border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; 
                    transition: all 0.2s; cursor: pointer; 
                }
                .bw-plan-card:hover { 
                    transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); 
                    border-color: #3b82f6; 
                }
                .bw-btn { 
                    padding: 12px 24px; border: none; border-radius: 8px; 
                    font-weight: 600; cursor: pointer; width: 100%; 
                }
                .bw-btn-primary { background: #3b82f6; color: white; }
                .bw-spinner { 
                    width: 32px; height: 32px; border: 3px solid #e5e7eb; 
                    border-top-color: #3b82f6; border-radius: 50%; 
                    animation: spin 1s linear infinite; 
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `;
        }

        showLoading(message = 'Loading...') {
            this.container.innerHTML = `
                <div class="blicence-widget" data-theme="${this.config.theme}">
                    <div class="bw-loading">
                        <div class="bw-spinner"></div>
                        <div class="bw-loading-text">${message}</div>
                    </div>
                </div>
            `;
        }

        showError(message) {
            this.container.innerHTML = `
                <div class="blicence-widget" data-theme="${this.config.theme}">
                    <div class="bw-error">
                        <div class="bw-error-icon">⚠️</div>
                        <div class="bw-error-message">${message}</div>
                        <button class="bw-btn bw-btn-secondary" onclick="location.reload()">
                            🔄 Retry
                        </button>
                    </div>
                </div>
            `;
        }
        
        log(...messages) {
            if (this.config.debug) {
                console.log(`[BlicenceWidget:${this.config.producerAddress.slice(0,6)}...]`, ...messages);
            }
        }

        fireEvent(eventName, data = {}) {
            const event = new CustomEvent(`blicence:${eventName}`, { detail: data });
            this.events.dispatchEvent(event);
            
            // Global event
            window.dispatchEvent(new CustomEvent(`blicence:widget:${eventName}`, { 
                detail: { ...data, widget: this } 
            }));
        }

        async handleError(error) {
            this.log('❌ Error occurred:', error);
            this.state.error = error;
            
            // Store error globally for debugging
            window.BlicenceErrors.push({
                timestamp: Date.now(),
                producer: this.config.producerAddress,
                error: error.message,
                stack: error.stack
            });

            // Callback execution
            if (typeof this.config.onError === 'function') {
                this.config.onError(error, this);
            }

            // Show error in UI
            this.showError(error.message);
            
            // Analytics
            this.analytics.track('widget_error', {
                error: error.message,
                producer: this.config.producerAddress
            });
        }

        handleAccountChange(accounts) {
            this.log('👛 Account changed:', accounts);
            this.state.userAddress = accounts[0] || null;
            this.fireEvent('accountChanged', { address: this.state.userAddress });
        }

        handleNetworkChange(chainId) {
            this.log('🌐 Network changed:', chainId);
            this.fireEvent('networkChanged', { chainId });
            
            if (typeof this.config.onNetworkChange === 'function') {
                this.config.onNetworkChange(parseInt(chainId, 16), this);
            }
        }

        setupEventListeners() {
            // Global error handler
            window.addEventListener('error', (event) => {
                if (event.error && event.error.toString().includes('Blicence')) {
                    this.handleError(event.error);
                }
            });

            // Resize handler for responsive
            window.addEventListener('resize', () => {
                this.handleResize();
            });
        }

        handleResize() {
            // Responsive adjustments
            const containerWidth = this.container.offsetWidth;
            
            if (containerWidth < 480) {
                this.container.setAttribute('data-responsive', 'mobile');
            } else if (containerWidth < 768) {
                this.container.setAttribute('data-responsive', 'tablet');
            } else {
                this.container.setAttribute('data-responsive', 'desktop');
            }
        }

        async loadPlans() {
            try {
                this.state.loading = true;
                this.showLoading('Loading plans...');
                
                // Producer kontratından planları al
                const plans = await this.blockchain.getProducerPlans(this.config.producerAddress);
                
                // Plans formatting ve validation
                this.state.plans = plans.map(plan => this.formatPlan(plan)).filter(plan => plan.status === 1);
                
                this.log(`📋 Loaded ${this.state.plans.length} active plans`);
                
                // Analytics
                this.analytics.track('plans_loaded', {
                    producer: this.config.producerAddress,
                    planCount: this.state.plans.length
                });
                
                this.state.loading = false;
                return this.state.plans;
                
            } catch (error) {
                this.state.loading = false;
                this.log('❌ Failed to load plans:', error);
                throw new Error(`Plan loading failed: ${error.message}`);
            }
        }

        formatPlan(rawPlan) {
            return {
                id: rawPlan.planId,
                name: rawPlan.name,
                description: rawPlan.description,
                type: this.getPlanTypeLabel(rawPlan.planType),
                price: rawPlan.price,
                currency: rawPlan.currency,
                period: rawPlan.period,
                features: rawPlan.features || [],
                popular: rawPlan.popular || false,
                image: rawPlan.image,
                externalLink: rawPlan.externalLink,
                backgroundColor: rawPlan.backgroundColor || this.config.primaryColor,
                // Blockchain specific
                contractAddress: rawPlan.contractAddress,
                planId: rawPlan.planId,
                priceAddress: rawPlan.priceAddress,
                flowRate: rawPlan.flowRate
            };
        }

        getPlanTypeLabel(planType) {
            const types = {
                0: 'API Subscription',
                1: 'Usage Based',
                2: 'Vesting API'
            };
            return types[planType] || 'Unknown';
        }

        render() {
            const html = this.generateHTML();
            this.container.innerHTML = html;
            this.bindEvents();
            this.applyTheme();
        }

        generateHTML() {
            if (this.state.loading) {
                return this.getLoadingHTML();
            }

            if (this.state.plans.length === 0) {
                return this.getEmptyStateHTML();
            }

            return `
                <div class="blicence-widget" data-theme="${this.config.theme}" data-layout="${this.config.layout}">
                    ${this.getHeaderHTML()}
                    ${this.getPlansHTML()}
                    ${this.getModalHTML()}
                </div>
            `;
        }

        getHeaderHTML() {
            if (!this.config.showHeader) return '';
            
            return `
                <div class="bw-header">
                    <h2 class="bw-title">${this.config.title || 'Available Plans'}</h2>
                    <p class="bw-subtitle">${this.config.subtitle || 'Choose the perfect plan for your needs'}</p>
                    <div class="bw-producer-info">
                        <div class="bw-producer-avatar">
                            ${this.config.producerName ? this.config.producerName.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <span class="bw-producer-name">${this.config.producerName || 'Producer'}</span>
                    </div>
                </div>
            `;
        }

        getPlansHTML() {
            const layoutClass = `bw-plans-${this.config.layout}`;
            
            return `
                <div class="bw-plans-container">
                    <div class="${layoutClass}">
                        ${this.state.plans.map(plan => this.getPlanCardHTML(plan)).join('')}
                    </div>
                </div>
            `;
        }

        getPlanCardHTML(plan) {
            const isPopular = this.isPopularPlan(plan);
            const isDisabled = !plan.available || plan.soldOut;
            
            return `
                <div class="bw-plan-card ${isPopular ? 'featured' : ''} ${isDisabled ? 'disabled' : ''}" 
                     data-plan-id="${plan.id}"
                     tabindex="0"
                     role="button"
                     aria-label="Select ${plan.name} plan">
                    
                    ${plan.image ? `<img src="${plan.image}" alt="${plan.name}" class="bw-plan-image" />` : ''}
                    
                    <div class="bw-plan-header">
                        <h3 class="bw-plan-name">${plan.name}</h3>
                        <span class="bw-plan-type">${plan.planTypeLabel}</span>
                    </div>
                    
                    ${this.config.showDescription && plan.description ? 
                        `<p class="bw-plan-description">${plan.description}</p>` : ''}
                    
                    ${this.config.showFeatures && this.getPlanFeaturesHTML(plan)}
                    
                    ${this.config.showPricing && this.getPlanPricingHTML(plan)}
                    
                    ${this.getPlanSupplyHTML(plan)}
                    
                    <div class="bw-plan-actions">
                        ${this.getPlanActionHTML(plan)}
                    </div>
                    
                    ${plan.externalLink ? 
                        `<a href="${plan.externalLink}" target="_blank" class="bw-plan-link" rel="noopener">
                            📄 Learn More
                        </a>` : ''}
                </div>
            `;
        }

        isPopularPlan(plan) {
            // Logic to determine if plan should be marked as popular
            if (this.config.popularPlanId && plan.id === this.config.popularPlanId.toString()) {
                return true;
            }
            
            // Auto-detect popular plan (highest current supply)
            const maxSupply = Math.max(...this.state.plans.map(p => p.currentSupply));
            return plan.currentSupply === maxSupply && maxSupply > 0;
        }

        getPlanFeaturesHTML(plan) {
            // Generate features based on plan type
            const features = this.getPlanFeatures(plan);
            if (!features.length) return '';
            
            return `
                <ul class="bw-plan-features">
                    ${features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            `;
        }

        getPlanFeatures(plan) {
            const features = [];
            
            // Type-specific features
            switch (plan.planType) {
                case 0: // API Subscription
                    features.push('Unlimited API access');
                    features.push('Real-time data streaming');
                    features.push('24/7 support');
                    break;
                case 1: // Usage Based
                    features.push('Pay per usage');
                    features.push('No monthly commitment');
                    features.push('Flexible scaling');
                    break;
                case 2: // Vesting API
                    features.push('Vested token rewards');
                    features.push('Long-term benefits');
                    features.push('Premium access');
                    break;
            }
            
            // Supply-based features
            if (plan.totalSupply > 0) {
                features.push(`Limited to ${plan.totalSupply} subscribers`);
            } else {
                features.push('Unlimited supply');
            }
            
            return features;
        }

        getPlanPricingHTML(plan) {
            const pricing = this.formatPlanPricing(plan);
            
            return `
                <div class="bw-plan-pricing">
                    <div class="bw-plan-price">${pricing.amount}</div>
                    <div class="bw-plan-period">${pricing.period}</div>
                </div>
            `;
        }

        formatPlanPricing(plan) {
            // Mock pricing - in real implementation, fetch from contract or API
            const mockPricing = {
                0: { amount: '10 USDC', period: '/month' }, // API
                1: { amount: '0.1 USDC', period: '/request' }, // Usage
                2: { amount: '100 USDC', period: '/year' } // Vesting
            };
            
            return mockPricing[plan.planType] || { amount: 'TBD', period: '' };
        }

        getPlanSupplyHTML(plan) {
            if (plan.totalSupply <= 0) return ''; // Unlimited supply
            
            const percentage = (plan.currentSupply / plan.totalSupply) * 100;
            const remaining = plan.available;
            
            let supplyClass = 'bw-plan-supply';
            if (remaining === 0) {
                supplyClass += ' sold-out';
            } else if (remaining <= 5) {
                supplyClass += ' limited';
            }
            
            return `
                <div class="${supplyClass}">
                    <span class="bw-supply-label">Available:</span>
                    <span class="bw-supply-count">${remaining}/${plan.totalSupply}</span>
                </div>
            `;
        }

        getModalHTML() {
            return `
                <div class="bw-modal-overlay" id="bw-modal-overlay" style="display: none;">
                    <div class="bw-modal" id="bw-modal">
                        <div class="bw-modal-header">
                            <h3 class="bw-modal-title" id="bw-modal-title">Plan Details</h3>
                            <button class="bw-modal-close" id="bw-modal-close" aria-label="Close modal">×</button>
                        </div>
                        <div class="bw-modal-body" id="bw-modal-body">
                            <!-- Dynamic content -->
                        </div>
                        <div class="bw-modal-footer" id="bw-modal-footer">
                            <button class="bw-btn bw-btn-secondary" id="bw-modal-cancel">Cancel</button>
                            <button class="bw-btn bw-btn-primary" id="bw-modal-confirm">Confirm</button>
                        </div>
                    </div>
                </div>
            `;
        }

        getLoadingHTML() {
            return `
                <div class="blicence-widget" data-theme="${this.config.theme}">
                    <div class="bw-loading">
                        <div class="bw-spinner"></div>
                        <div class="bw-loading-text">Loading plans...</div>
                    </div>
                </div>
            `;
        }

        getEmptyStateHTML() {
            return `
                <div class="blicence-widget" data-theme="${this.config.theme}">
                    <div class="bw-empty">
                        <div class="bw-empty-icon">📋</div>
                        <h3>No Plans Available</h3>
                        <p>This producer hasn't created any plans yet.</p>
                        <button class="bw-btn bw-btn-secondary" onclick="location.reload()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            `;
        }

        // Event Handling System

        bindEvents() {
            this.unbindEvents(); // Clean up existing events
            
            // Plan card clicks
            this.container.addEventListener('click', this.handleContainerClick.bind(this));
            this.container.addEventListener('keydown', this.handleContainerKeydown.bind(this));
            
            // Modal events
            const modal = this.container.querySelector('#bw-modal-overlay');
            if (modal) {
                modal.addEventListener('click', this.handleModalClick.bind(this));
                
                const closeBtn = modal.querySelector('#bw-modal-close');
                const cancelBtn = modal.querySelector('#bw-modal-cancel');
                const confirmBtn = modal.querySelector('#bw-modal-confirm');
                
                if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
                if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
                if (confirmBtn) confirmBtn.addEventListener('click', this.handleModalConfirm.bind(this));
            }
            
            this.log('🎯 Event handlers bound');
        }

        unbindEvents() {
            // Clean up existing event listeners to prevent memory leaks
            this.container.removeEventListener('click', this.handleContainerClick);
            this.container.removeEventListener('keydown', this.handleContainerKeydown);
        }

        handleContainerClick(event) {
            const target = event.target;
            
            // Plan card selection
            const planCard = target.closest('.bw-plan-card');
            if (planCard && !planCard.classList.contains('disabled')) {
                const planId = planCard.dataset.planId;
                this.selectPlan(planId);
                return;
            }
            
            // Action button clicks
            if (target.dataset.action === 'select-plan') {
                event.stopPropagation();
                const planId = target.dataset.planId;
                this.showPurchaseModal(planId);
                return;
            }
        }

        handleContainerKeydown(event) {
            // Accessibility: handle Enter and Space for plan cards
            if (event.key === 'Enter' || event.key === ' ') {
                const planCard = event.target.closest('.bw-plan-card');
                if (planCard && !planCard.classList.contains('disabled')) {
                    event.preventDefault();
                    const planId = planCard.dataset.planId;
                    this.selectPlan(planId);
                }
            }
        }

        handleModalClick(event) {
            // Close modal when clicking overlay
            if (event.target.id === 'bw-modal-overlay') {
                this.closeModal();
            }
        }

        async handleModalConfirm() {
            if (!this.state.selectedPlan) return;
            
            try {
                await this.processPurchase();
            } catch (error) {
                this.log('❌ Purchase failed:', error);
                this.showModalError(error.message);
            }
        }

        // Plan Selection & Purchase Flow

        selectPlan(planId) {
            const plan = this.state.plans.find(p => p.id === planId);
            if (!plan) {
                this.log('❌ Plan not found:', planId);
                return;
            }
            
            this.state.selectedPlan = plan;
            this.log('📋 Plan selected:', plan.name);
            
            // Fire event
            this.fireEvent('planSelected', { plan });
            
            // Callback
            if (typeof this.config.onPlanSelected === 'function') {
                this.config.onPlanSelected(plan, this);
            }
            
            // Analytics
            this.analytics.track('plan_selected', {
                planId: plan.id,
                planName: plan.name,
                planType: plan.planType
            });
        }

        showPurchaseModal(planId) {
            const plan = this.state.plans.find(p => p.id === planId);
            if (!plan) return;
            
            this.state.selectedPlan = plan;
            
            const modal = this.container.querySelector('#bw-modal-overlay');
            const title = modal.querySelector('#bw-modal-title');
            const body = modal.querySelector('#bw-modal-body');
            const confirmBtn = modal.querySelector('#bw-modal-confirm');
            
            // Update modal content
            title.textContent = `Subscribe to ${plan.name}`;
            body.innerHTML = this.getPurchaseModalContent(plan);
            confirmBtn.textContent = 'Subscribe Now';
            confirmBtn.disabled = false;
            
            // Show modal
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
            
            // Focus trap
            const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) firstFocusable.focus();
            
            // Analytics
            this.analytics.track('purchase_modal_opened', {
                planId: plan.id,
                planName: plan.name
            });
            
            this.log('💳 Purchase modal opened for:', plan.name);
        }

        getPurchaseModalContent(plan) {
            const pricing = this.formatPlanPricing(plan);
            
            return `
                <div class="bw-purchase-summary">
                    <div class="bw-plan-summary">
                        ${plan.image ? `<img src="${plan.image}" alt="${plan.name}" class="bw-modal-plan-image" />` : ''}
                        <h4>${plan.name}</h4>
                        <p class="bw-plan-type">${plan.planTypeLabel}</p>
                        <div class="bw-modal-pricing">
                            <span class="bw-modal-price">${pricing.amount}</span>
                            <span class="bw-modal-period">${pricing.period}</span>
                        </div>
                    </div>
                    
                    <div class="bw-purchase-details">
                        <p><strong>What you get:</strong></p>
                        <ul>
                            ${this.getPlanFeatures(plan).map(feature => `<li>${feature}</li>`).join('')}
                        </ul>
                        
                        ${plan.description ? `<p class="bw-modal-description">${plan.description}</p>` : ''}
                        
                        <div class="bw-wallet-info">
                            <p><strong>Payment will be processed through your connected wallet.</strong></p>
                            ${this.state.userAddress ? 
                                `<p class="bw-wallet-address">Connected: ${this.blockchain.formatAddress(this.state.userAddress)}</p>` :
                                `<p class="bw-wallet-warning">⚠️ Please connect your wallet first</p>`
                            }
                        </div>
                    </div>
                </div>
            `;
        }

        closeModal() {
            const modal = this.container.querySelector('#bw-modal-overlay');
            if (modal) {
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
            }
            
            this.state.selectedPlan = null;
            this.log('🚪 Modal closed');
        }

        showModalError(message) {
            const body = this.container.querySelector('#bw-modal-body');
            const errorHtml = `
                <div class="bw-modal-error">
                    <div class="bw-error-icon">⚠️</div>
                    <p>${message}</p>
                </div>
            `;
            body.innerHTML = errorHtml;
        }

        // Purchase Processing

        async processPurchase() {
            if (!this.state.selectedPlan) {
                throw new Error('No plan selected');
            }

            const plan = this.state.selectedPlan;
            
            try {
                this.log('💳 Starting purchase process for:', plan.name);
                
                // Fire purchase start event
                this.fireEvent('purchaseStart', { plan });
                if (typeof this.config.onPurchaseStart === 'function') {
                    this.config.onPurchaseStart(plan, this);
                }
                
                // Update modal to show loading
                this.showModalLoading('Processing transaction...');
                
                // Analytics
                this.analytics.track('purchase_started', {
                    planId: plan.id,
                    planName: plan.name,
                    planType: plan.planType
                });
                
                // Execute blockchain transaction
                const result = await this.blockchain.subscribeToPlan(
                    plan.id,
                    this.config.producerAddress,
                    { value: '0' } // Mock payment data
                );
                
                this.log('✅ Purchase successful:', result);
                
                // Update modal to show success
                this.showModalSuccess(result);
                
                // Fire purchase complete event
                this.fireEvent('purchaseComplete', { plan, transaction: result });
                if (typeof this.config.onPurchaseComplete === 'function') {
                    this.config.onPurchaseComplete(result, plan, this);
                }
                
                // Analytics
                this.analytics.track('purchase_completed', {
                    planId: plan.id,
                    planName: plan.name,
                    transactionHash: result.transactionHash,
                    blockNumber: result.blockNumber
                });
                
                // Auto-close modal after delay
                setTimeout(() => {
                    this.closeModal();
                    this.refreshPlans(); // Reload plans to update supply
                }, 3000);
                
                return result;
                
            } catch (error) {
                this.log('❌ Purchase failed:', error);
                
                // Analytics
                this.analytics.track('purchase_failed', {
                    planId: plan.id,
                    error: error.message
                });
                
                throw error;
            }
        }

        showModalLoading(message) {
            const body = this.container.querySelector('#bw-modal-body');
            const confirmBtn = this.container.querySelector('#bw-modal-confirm');
            
            body.innerHTML = `
                <div class="bw-modal-loading">
                    <div class="bw-spinner"></div>
                    <p>${message}</p>
                </div>
            `;
            
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Processing...';
            }
        }

        showModalSuccess(result) {
            const body = this.container.querySelector('#bw-modal-body');
            const confirmBtn = this.container.querySelector('#bw-modal-confirm');
            
            body.innerHTML = `
                <div class="bw-modal-success">
                    <div class="bw-success-icon">✅</div>
                    <h4>Subscription Successful!</h4>
                    <p>Your transaction has been confirmed on the blockchain.</p>
                    <div class="bw-transaction-details">
                        <p><strong>Transaction Hash:</strong></p>
                        <p class="bw-tx-hash">${result.transactionHash}</p>
                        <p><strong>Block Number:</strong> ${result.blockNumber}</p>
                    </div>
                </div>
            `;
            
            if (confirmBtn) {
                confirmBtn.textContent = 'Done';
                confirmBtn.disabled = false;
            }
        }

        async refreshPlans() {
            try {
                this.log('🔄 Refreshing plans...');
                await this.loadPlans();
                this.render();
            } catch (error) {
                this.log('❌ Failed to refresh plans:', error);
            }
        }

        // Theme & Customization

        applyTheme() {
            if (this.config.primaryColor) {
                this.container.style.setProperty('--bw-primary', this.config.primaryColor);
            }
            
            if (this.config.secondaryColor) {
                this.container.style.setProperty('--bw-secondary', this.config.secondaryColor);
            }
            
            // Apply responsive class
            this.handleResize();
        }

        // Widget Lifecycle

        destroy() {
            this.log('🗑️ Destroying widget...');
            
            // Unbind events
            this.unbindEvents();
            
            // Remove from global registry
            const index = window.BlicenceWidgets.indexOf(this);
            if (index > -1) {
                window.BlicenceWidgets.splice(index, 1);
            }
            
            // Clear container
            this.container.innerHTML = '';
            this.container.removeAttribute('data-blicence-widget');
            
            // Clear state
            this.state = null;
            this.config = null;
            
            this.log('✅ Widget destroyed');
        }

        // Public API Methods

        async reload() {
            this.log('🔄 Reloading widget...');
            return this.init();
        }

        getState() {
            return { ...this.state };
        }

        getConfig() {
            return { ...this.config };
        }

        updateConfig(newConfig) {
            this.config = { ...this.config, ...newConfig };
            this.applyTheme();
            this.log('⚙️ Configuration updated');
        }

        getSelectedPlan() {
            return this.state.selectedPlan;
        }

        // Static Methods
        static getAllWidgets() {
            return [...window.BlicenceWidgets];
        }

        static getWidget(container) {
            return window.BlicenceWidgets.find(w => w.container === container);
        }

        static destroyAll() {
            window.BlicenceWidgets.forEach(widget => widget.destroy());
        }
    }

    // Auto-initialization for data attributes
    document.addEventListener('DOMContentLoaded', function() {
        // Find all elements with data-blicence-widget attribute
        const widgetElements = document.querySelectorAll('[data-blicence-widget]:not([data-blicence-widget="initialized"])');
        
        widgetElements.forEach(element => {
            const config = {
                container: element,
                producerAddress: element.dataset.producer || element.dataset.producerAddress,
                network: element.dataset.network || 'polygon',
                theme: element.dataset.theme || 'light',
                layout: element.dataset.layout || 'grid',
                title: element.dataset.title,
                subtitle: element.dataset.subtitle,
                showHeader: element.dataset.showHeader !== 'false',
                enablePurchase: element.dataset.enablePurchase !== 'false'
            };
            
            // Auto-create widget if producer address is provided
            if (config.producerAddress) {
                console.log('🚀 Auto-initializing widget for:', config.producerAddress);
                new BlicenceWidget(config);
            }
        });
    });

    // Export for different module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BlicenceWidget;
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return BlicenceWidget; });
    } else {
        window.BlicenceWidget = BlicenceWidget;
    }

})(window, document);
