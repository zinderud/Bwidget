// Blicence Customer Dashboard Widget
// Producer sitesinde müşterilerin plan yönetimi için

class BlicenceCustomerDashboard {
    constructor(options = {}) {
        this.config = {
            container: options.container || '#blicence-customer-dashboard',
            producerAddress: options.producerAddress,
            customerAddress: options.customerAddress, // Connected wallet
            
            // Feature flags
            showActivePlans: options.showActivePlans !== false,
            showUsageStats: options.showUsageStats !== false,
            showNFTCollection: options.showNFTCollection !== false,
            enableAPIAccess: options.enableAPIAccess !== false,
            showTransactionHistory: options.showTransactionHistory !== false,
            
            // Customization
            theme: options.theme || 'light',
            brandColor: options.brandColor || '#3B82F6',
            title: options.title || 'My Plans',
            
            // Callbacks
            onPlanActivated: options.onPlanActivated || null,
            onAPIKeyGenerated: options.onAPIKeyGenerated || null,
            onUsageLimitReached: options.onUsageLimitReached || null,
            
            // Integration
            apiEndpoint: options.apiEndpoint || null,
            customSections: options.customSections || {}
        };

        this.state = {
            loading: false,
            customerPlans: [],
            nftCollection: [],
            usageStats: {},
            apiCredentials: null,
            transactions: []
        };

        this.blockchain = new BlicenceBlockchainManager(this.config);
        this.serviceAccess = new BlicenceServiceAccess(this.config);
        this.analytics = new WidgetAnalytics(this.config);

        this.init();
    }

    async init() {
        try {
            console.log('🏠 Initializing Customer Dashboard...');
            
            // Container setup
            this.container = this.findContainer();
            
            // Show loading
            this.showLoading('Loading your plans...');
            
            // Initialize blockchain connection
            await this.blockchain.initialize();
            
            // Load customer data
            await this.loadCustomerData();
            
            // Render dashboard
            this.render();
            
            // Setup event listeners
            this.bindEvents();
            
            console.log('✅ Customer Dashboard initialized');
            
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showError(error.message);
        }
    }

    findContainer() {
        const container = typeof this.config.container === 'string' 
            ? document.querySelector(this.config.container)
            : this.config.container;

        if (!container) {
            throw new Error(`Container not found: ${this.config.container}`);
        }

        return container;
    }

    async loadCustomerData() {
        try {
            console.log('📊 Loading customer data...');
            
            // Load customer plans
            if (this.config.showActivePlans) {
                await this.loadCustomerPlans();
            }
            
            // Load NFT collection
            if (this.config.showNFTCollection) {
                await this.loadNFTCollection();
            }
            
            // Load usage statistics
            if (this.config.showUsageStats) {
                await this.loadUsageStats();
            }
            
            // Load transaction history
            if (this.config.showTransactionHistory) {
                await this.loadTransactionHistory();
            }
            
            console.log('✅ Customer data loaded');
            
        } catch (error) {
            console.error('❌ Failed to load customer data:', error);
            throw error;
        }
    }

    async loadCustomerPlans() {
        try {
            // Get customer plan IDs from blockchain
            const planIds = await this.blockchain.getCustomerSubscriptions(
                this.config.customerAddress, 
                this.config.producerAddress
            );
            
            // Get detailed plan information
            const plans = [];
            for (const planId of planIds) {
                try {
                    const plan = await this.blockchain.getPlanDetails(planId, this.config.producerAddress);
                    const enrichedPlan = await this.enrichPlanData(plan);
                    plans.push(enrichedPlan);
                } catch (error) {
                    console.warn(`Failed to load plan ${planId}:`, error);
                }
            }
            
            this.state.customerPlans = plans;
            console.log(`📋 Loaded ${plans.length} customer plans`);
            
        } catch (error) {
            console.error('❌ Failed to load customer plans:', error);
            this.state.customerPlans = [];
        }
    }

    async enrichPlanData(plan) {
        // Add usage data, expiration info, etc.
        const enriched = { ...plan };
        
        try {
            // Get usage statistics for this plan
            enriched.usage = await this.getUsageForPlan(plan.id);
            
            // Calculate expiration date
            enriched.expiresAt = this.calculateExpirationDate(plan);
            
            // Check if plan is active
            enriched.isActive = await this.isPlanActive(plan.id);
            
            // Get generated credentials
            enriched.credentials = await this.getCredentialsForPlan(plan.id);
            
        } catch (error) {
            console.warn(`Failed to enrich plan ${plan.id}:`, error);
        }
        
        return enriched;
    }

    async loadNFTCollection() {
        try {
            // Mock NFT collection - in real implementation, query NFT contracts
            this.state.nftCollection = [
                {
                    id: '1',
                    name: 'Premium Access NFT',
                    image: 'https://example.com/nft1.png',
                    planId: '67',
                    attributes: {
                        tier: 'Premium',
                        validUntil: '2024-12-31',
                        usageType: 'API Access'
                    }
                }
            ];
            
            console.log(`🎨 Loaded ${this.state.nftCollection.length} NFTs`);
            
        } catch (error) {
            console.error('❌ Failed to load NFT collection:', error);
            this.state.nftCollection = [];
        }
    }

    async loadUsageStats() {
        try {
            // Mock usage statistics - in real implementation, query usage API
            this.state.usageStats = {
                totalRequests: 150,
                remainingRequests: 850,
                dailyAverage: 12,
                peakUsage: '14:00 - 16:00',
                lastActivity: new Date().toISOString()
            };
            
            console.log('📈 Usage statistics loaded');
            
        } catch (error) {
            console.error('❌ Failed to load usage stats:', error);
            this.state.usageStats = {};
        }
    }

    async loadTransactionHistory() {
        try {
            // Mock transaction history
            this.state.transactions = [
                {
                    id: '0x123...',
                    type: 'subscription',
                    planName: 'Premium API Access',
                    amount: '10 USDC',
                    date: new Date(Date.now() - 86400000).toISOString(),
                    status: 'confirmed'
                }
            ];
            
            console.log(`💳 Loaded ${this.state.transactions.length} transactions`);
            
        } catch (error) {
            console.error('❌ Failed to load transactions:', error);
            this.state.transactions = [];
        }
    }

    render() {
        this.container.innerHTML = this.generateHTML();
        this.applyTheme();
    }

    generateHTML() {
        return `
            <div class="blicence-dashboard" data-theme="${this.config.theme}">
                ${this.getHeaderHTML()}
                
                <div class="dashboard-grid">
                    ${this.config.showActivePlans ? this.getActivePlansHTML() : ''}
                    ${this.config.showUsageStats ? this.getUsageStatsHTML() : ''}
                    ${this.config.showNFTCollection ? this.getNFTCollectionHTML() : ''}
                    ${this.config.enableAPIAccess ? this.getAPIAccessHTML() : ''}
                    ${this.config.showTransactionHistory ? this.getTransactionHistoryHTML() : ''}
                </div>
            </div>
        `;
    }

    getHeaderHTML() {
        return `
            <div class="dashboard-header">
                <h2>${this.config.title}</h2>
                <div class="customer-info">
                    <span class="customer-address">${this.formatAddress(this.config.customerAddress)}</span>
                    <div class="connection-status connected">Connected</div>
                </div>
            </div>
        `;
    }

    getActivePlansHTML() {
        if (this.state.customerPlans.length === 0) {
            return `
                <div class="dashboard-section">
                    <h3>Active Plans</h3>
                    <div class="empty-state">
                        <p>No active plans found</p>
                        <a href="#plans" class="btn-primary">Browse Plans</a>
                    </div>
                </div>
            `;
        }

        return `
            <div class="dashboard-section">
                <h3>Active Plans (${this.state.customerPlans.length})</h3>
                <div class="plans-grid">
                    ${this.state.customerPlans.map(plan => this.getPlanCardHTML(plan)).join('')}
                </div>
            </div>
        `;
    }

    getPlanCardHTML(plan) {
        const statusClass = plan.isActive ? 'active' : 'expired';
        const progressPercentage = this.calculateUsageProgress(plan);
        
        return `
            <div class="plan-card ${statusClass}" data-plan-id="${plan.id}">
                <div class="plan-header">
                    <h4>${plan.name}</h4>
                    <span class="plan-status ${statusClass}">${plan.isActive ? 'Active' : 'Expired'}</span>
                </div>
                
                <div class="plan-details">
                    <p class="plan-type">${plan.planTypeLabel}</p>
                    ${plan.expiresAt ? `<p class="expires">Expires: ${new Date(plan.expiresAt).toLocaleDateString()}</p>` : ''}
                </div>
                
                ${plan.usage ? `
                    <div class="usage-progress">
                        <div class="progress-label">Usage: ${plan.usage.used}/${plan.usage.limit}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="plan-actions">
                    ${plan.credentials ? 
                        `<button class="btn-secondary" data-action="view-credentials" data-plan-id="${plan.id}">
                            🔑 View Credentials
                        </button>` : 
                        `<button class="btn-primary" data-action="generate-credentials" data-plan-id="${plan.id}">
                            🚀 Activate Plan
                        </button>`
                    }
                    
                    ${plan.isActive ? 
                        `<button class="btn-outline" data-action="manage-plan" data-plan-id="${plan.id}">
                            ⚙️ Manage
                        </button>` : ''
                    }
                </div>
            </div>
        `;
    }

    getUsageStatsHTML() {
        const stats = this.state.usageStats;
        
        return `
            <div class="dashboard-section">
                <h3>Usage Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${stats.totalRequests || 0}</div>
                        <div class="stat-label">Total Requests</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.remainingRequests || 0}</div>
                        <div class="stat-label">Remaining</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.dailyAverage || 0}</div>
                        <div class="stat-label">Daily Average</div>
                    </div>
                </div>
                
                ${stats.lastActivity ? 
                    `<p class="last-activity">Last activity: ${new Date(stats.lastActivity).toLocaleString()}</p>` : 
                    ''
                }
            </div>
        `;
    }

    getAPIAccessHTML() {
        return `
            <div class="dashboard-section">
                <h3>API Access</h3>
                <div class="api-access-panel">
                    <div class="api-status">
                        <span class="status-indicator active"></span>
                        <span>API Access Active</span>
                    </div>
                    
                    <div class="api-actions">
                        <button class="btn-primary" data-action="generate-api-key">
                            🔑 Generate API Key
                        </button>
                        <button class="btn-secondary" data-action="view-docs">
                            📚 View Documentation
                        </button>
                    </div>
                    
                    <div class="api-info">
                        <p><strong>Base URL:</strong> ${this.config.apiEndpoint || 'https://api.producer.com'}</p>
                        <p><strong>Rate Limit:</strong> 1000 requests/hour</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Event Handling, Utility Methods, etc...
    
    bindEvents() {
        this.container.addEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const action = event.target.dataset.action;
        const planId = event.target.dataset.planId;
        
        switch (action) {
            case 'view-credentials':
                this.showCredentials(planId);
                break;
            case 'generate-credentials':
                this.generateCredentials(planId);
                break;
            case 'generate-api-key':
                this.generateAPIKey();
                break;
            case 'manage-plan':
                this.showPlanManagement(planId);
                break;
        }
    }

    async generateCredentials(planId) {
        try {
            const credentials = await this.serviceAccess.generateCredentials(
                this.config.customerAddress, 
                planId
            );
            
            this.showCredentialsModal(credentials);
            
            if (this.config.onAPIKeyGenerated) {
                this.config.onAPIKeyGenerated(credentials);
            }
            
        } catch (error) {
            console.error('Failed to generate credentials:', error);
            this.showError('Failed to generate credentials');
        }
    }

    showCredentialsModal(credentials) {
        // Modal implementation for showing API credentials
        console.log('🔑 Showing credentials modal:', credentials);
    }

    formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    calculateUsageProgress(plan) {
        if (!plan.usage) return 0;
        return (plan.usage.used / plan.usage.limit) * 100;
    }

    showLoading(message) {
        this.container.innerHTML = `
            <div class="dashboard-loading">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="dashboard-error">
                <p>❌ ${message}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    applyTheme() {
        this.container.style.setProperty('--brand-color', this.config.brandColor);
    }
}

// Export
window.BlicenceCustomerDashboard = BlicenceCustomerDashboard;
