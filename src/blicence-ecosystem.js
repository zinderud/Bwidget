// Blicence Ecosystem - Main Entry Point
// Unified initialization and management for all widgets

class BlicenceEcosystem {
    constructor(config) {
        this.config = {
            producerAddress: config.producerAddress,
            network: config.network || 'polygon',
            theme: config.theme || 'light',
            language: config.language || 'tr',
            debug: config.debug || false,
            ...config
        };

        // Component instances
        this.components = {
            blockchain: null,
            salesWidget: null,
            customerDashboard: null,
            serviceAccess: null,
            analytics: null,
            planManagement: null
        };

        // Global event emitter
        this.eventEmitter = new EventTarget();

        console.log('🚀 Blicence Ecosystem initialized');
    }

    async initialize() {
        try {
            console.log('🔧 Initializing Blicence Ecosystem...');

            // Initialize blockchain manager first
            this.components.blockchain = new BlicenceBlockchainManager(this.config);
            await this.components.blockchain.initialize();

            // Initialize service access layer
            this.components.serviceAccess = new BlicenceServiceAccess(this.config);
            await this.components.serviceAccess.initialize();

            console.log('✅ Blicence Ecosystem ready');
            this.emit('ecosystem:ready', { config: this.config });

            return this;

        } catch (error) {
            console.error('❌ Ecosystem initialization failed:', error);
            this.emit('ecosystem:error', { error: error.message });
            throw error;
        }
    }

    // Quick initialization for sales widget only
    async createSalesWidget(containerId, options = {}) {
        try {
            if (!this.components.blockchain) {
                await this.initialize();
            }

            this.components.salesWidget = new BlicenceWidgetSDK(this.config);
            await this.components.salesWidget.createWidget(containerId, {
                showHeader: true,
                showPlanComparison: true,
                enablePurchase: true,
                ...options
            });

            console.log('🛒 Sales widget created');
            return this.components.salesWidget;

        } catch (error) {
            console.error('❌ Sales widget creation failed:', error);
            throw error;
        }
    }

    // Create customer dashboard
    async createCustomerDashboard(containerId, customerAddress, options = {}) {
        try {
            if (!this.components.blockchain) {
                await this.initialize();
            }

            const dashboardConfig = {
                ...this.config,
                customerAddress: customerAddress
            };

            this.components.customerDashboard = new BlicenceCustomerDashboard(dashboardConfig);
            await this.components.customerDashboard.createWidget(containerId, {
                mode: 'full',
                showNFTs: true,
                showUsageStats: true,
                showApiAccess: true,
                ...options
            });

            console.log('👥 Customer dashboard created');
            return this.components.customerDashboard;

        } catch (error) {
            console.error('❌ Customer dashboard creation failed:', error);
            throw error;
        }
    }

    // Create producer analytics
    async createAnalytics(containerId, options = {}) {
        try {
            if (!this.components.blockchain) {
                await this.initialize();
            }

            this.components.analytics = new BlicenceProducerAnalytics(this.config);
            await this.components.analytics.createWidget(containerId, {
                sections: ['overview', 'sales', 'customers', 'usage'],
                timeRange: '30d',
                realTimeAnalytics: true,
                ...options
            });

            console.log('📊 Analytics dashboard created');
            return this.components.analytics;

        } catch (error) {
            console.error('❌ Analytics creation failed:', error);
            throw error;
        }
    }

    // Create plan management
    async createPlanManagement(containerId, options = {}) {
        try {
            if (!this.components.blockchain) {
                await this.initialize();
            }

            this.components.planManagement = new BlicencePlanManagement(this.config);
            await this.components.planManagement.createWidget(containerId, {
                mode: 'manage',
                allowBulkOperations: true,
                useTemplates: true,
                ...options
            });

            console.log('📋 Plan management created');
            return this.components.planManagement;

        } catch (error) {
            console.error('❌ Plan management creation failed:', error);
            throw error;
        }
    }

    // Complete ecosystem setup
    async createCompleteEcosystem(containers, customerAddress = null) {
        try {
            await this.initialize();

            const promises = [];

            // Sales widget
            if (containers.sales) {
                promises.push(this.createSalesWidget(containers.sales));
            }

            // Customer dashboard (if customer address provided)
            if (containers.dashboard && customerAddress) {
                promises.push(this.createCustomerDashboard(containers.dashboard, customerAddress));
            }

            // Analytics (producer only)
            if (containers.analytics) {
                promises.push(this.createAnalytics(containers.analytics));
            }

            // Plan management (producer only)
            if (containers.plans) {
                promises.push(this.createPlanManagement(containers.plans));
            }

            await Promise.all(promises);

            console.log('🎉 Complete ecosystem created successfully');
            this.emit('ecosystem:complete', { containers, customerAddress });

            return this;

        } catch (error) {
            console.error('❌ Complete ecosystem creation failed:', error);
            throw error;
        }
    }

    // Event handling
    on(event, callback) {
        this.eventEmitter.addEventListener(event, callback);
    }

    off(event, callback) {
        this.eventEmitter.removeEventListener(event, callback);
    }

    emit(event, data) {
        this.eventEmitter.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    // Get component references
    getSalesWidget() {
        return this.components.salesWidget;
    }

    getCustomerDashboard() {
        return this.components.customerDashboard;
    }

    getAnalytics() {
        return this.components.analytics;
    }

    getPlanManagement() {
        return this.components.planManagement;
    }

    getServiceAccess() {
        return this.components.serviceAccess;
    }

    getBlockchainManager() {
        return this.components.blockchain;
    }

    // Utility methods
    async verifyProducerAccess(address) {
        if (!this.components.blockchain) {
            await this.initialize();
        }
        return await this.components.blockchain.verifyProducerContract(address);
    }

    async getProducerPlans() {
        if (!this.components.blockchain) {
            await this.initialize();
        }
        return await this.components.blockchain.getProducerPlans(this.config.producerAddress);
    }

    async getCustomerSubscriptions(customerAddress) {
        if (!this.components.blockchain) {
            await this.initialize();
        }
        return await this.components.blockchain.getCustomerSubscriptions(
            this.config.producerAddress, 
            customerAddress
        );
    }

    // Configuration updates
    updateTheme(theme) {
        this.config.theme = theme;
        Object.values(this.components).forEach(component => {
            if (component && typeof component.updateTheme === 'function') {
                component.updateTheme(theme);
            }
        });
    }

    updateLanguage(language) {
        this.config.language = language;
        Object.values(this.components).forEach(component => {
            if (component && typeof component.updateLanguage === 'function') {
                component.updateLanguage(language);
            }
        });
    }

    // Cleanup
    destroy() {
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        
        this.components = {};
        console.log('🧹 Ecosystem destroyed');
    }
}

// Static factory methods
BlicenceEcosystem.createSimple = async function(producerAddress, containerId, options = {}) {
    const ecosystem = new BlicenceEcosystem({
        producerAddress: producerAddress,
        network: options.network || 'polygon',
        theme: options.theme || 'light',
        language: options.language || 'tr'
    });

    await ecosystem.createSalesWidget(containerId, options);
    return ecosystem;
};

BlicenceEcosystem.createComplete = async function(producerAddress, containers, options = {}) {
    const ecosystem = new BlicenceEcosystem({
        producerAddress: producerAddress,
        network: options.network || 'polygon',
        theme: options.theme || 'light',
        language: options.language || 'tr'
    });

    await ecosystem.createCompleteEcosystem(containers, options.customerAddress);
    return ecosystem;
};

// Export
if (typeof window !== 'undefined') {
    window.BlicenceEcosystem = BlicenceEcosystem;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlicenceEcosystem;
}
