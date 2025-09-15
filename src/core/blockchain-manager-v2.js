// Blicence Widget - Enhanced Blockchain Integration
// Faz 1: Production Ready Factory Pattern Support

class BlicenceBlockchainManager {
    constructor(config) {
        this.config = config;
        this.provider = null;
        this.signer = null;
        
        // Contract instances cache
        this.factoryContract = null;
        this.producerContracts = new Map(); // producerAddress -> contract instance
        this.contractCache = new Map(); // address -> contract data
        
        // Enhanced network configuration
        this.networks = {
            polygon: {
                chainId: 137,
                name: 'Polygon',
                factoryAddress: '0x742d35Cc6634C0532925a3b8D75A4e7b9e3c5f4e', // Deployed factory address
                rpcUrl: 'https://polygon-rpc.com',
                explorer: 'https://polygonscan.com',
                nativeCurrency: 'MATIC'
            },
            ethereum: {
                chainId: 1,
                name: 'Ethereum',
                factoryAddress: '0x123...', // TODO: Deploy factory to mainnet
                rpcUrl: 'https://mainnet.infura.io/v3/YOUR_KEY',
                explorer: 'https://etherscan.io',
                nativeCurrency: 'ETH'
            },
            arbitrum: {
                chainId: 42161,
                name: 'Arbitrum',
                factoryAddress: '0x456...',  // TODO: Deploy factory to arbitrum
                rpcUrl: 'https://arb1.arbitrum.io/rpc',
                explorer: 'https://arbiscan.io',
                nativeCurrency: 'ETH'
            }
        };

        // Enhanced Contract ABIs
        this.factoryABI = [
            // Read functions
            'function getAllProducers() external view returns (tuple(uint256 producerId, address producerAddress, string name, string description, string image, string externalLink, address cloneAddress, bool exists)[] memory)',
            'function getProducerById(uint256 producerId) external view returns (tuple(uint256 producerId, address producerAddress, string name, string description, string image, string externalLink, address cloneAddress, bool exists))',
            'function getActiveProducers() external view returns (tuple(uint256 producerId, address producerAddress, string name, string description, string image, string externalLink, address cloneAddress, bool exists)[] memory)',
            'function getProducerByAddress(address producerAddress) external view returns (tuple(uint256 producerId, address producerAddress, string name, string description, string image, string externalLink, address cloneAddress, bool exists))',
            
            // Write functions
            'function newBcontract(tuple(uint256 producerId, address producerAddress, string name, string description, string image, string externalLink, address cloneAddress, bool exists)) external',
            
            // Events
            'event BcontractCreated(uint256 indexed producerId, string name, string description, string image, string externalLink, address indexed owner, address indexed cloneAddress)'
        ];

        this.producerABI = [
            // Plan management
            'function getPlans() external view returns (tuple(uint256 planId, address cloneAddress, uint256 producerId, string name, string description, string externalLink, int256 totalSupply, int256 currentSupply, string backgroundColor, string image, address priceAddress, uint32 startDate, uint8 status, uint8 planType, uint256[] custumerPlanIds)[] memory)',
            'function getPlan(uint256 planId) external view returns (tuple(uint256 planId, address cloneAddress, uint256 producerId, string name, string description, string externalLink, int256 totalSupply, int256 currentSupply, string backgroundColor, string image, address priceAddress, uint32 startDate, uint8 status, uint8 planType, uint256[] custumerPlanIds))',
            'function addPlan(tuple(uint256 planId, address cloneAddress, uint256 producerId, string name, string description, string externalLink, int256 totalSupply, int256 currentSupply, string backgroundColor, string image, address priceAddress, uint32 startDate, uint8 status, uint8 planType, uint256[] custumerPlanIds)) external returns (uint256)',
            
            // Subscription management  
            'function subscribeToPlan(uint256 planId) external payable',
            'function getCustomerPlans(address customer) external view returns (uint256[] memory)',
            'function isCustomerSubscribed(address customer, uint256 planId) external view returns (bool)',
            
            // Producer info
            'function getProducerInfo() external view returns (tuple(uint256 producerId, address producerAddress, string name, string description, string image, string externalLink, address cloneAddress, bool exists))',
            
            // Events
            'event LogAddPlan(uint256 indexed planId, address indexed producerAddress, string name, uint8 planType)',
            'event CustomerPlanWithStreamCreated(uint256 indexed customerPlanId, bytes32 indexed streamLockId, address indexed customer)',
            'event PlanPurchased(uint256 indexed planId, address indexed customer, uint256 amount)'
        ];

        // Error tracking
        this.errors = [];
        this.retryAttempts = 0;
        this.maxRetries = 3;
    }

    async initialize() {
        try {
            console.log('🔗 Initializing enhanced blockchain connection...');
            
            // 1. Web3 provider detection and validation
            await this.detectAndValidateProvider();
            
            // 2. Network detection, validation and switching if needed
            await this.detectAndValidateNetwork();
            
            // 3. Factory contract connection with retry mechanism
            await this.connectToFactory();
            
            // 4. Cache initialization
            this.initializeCache();
            
            // 5. Event listeners setup
            this.setupContractEventListeners();
            
            console.log('✅ Enhanced blockchain connection initialized successfully');
            return {
                success: true,
                network: this.currentNetwork.name,
                factoryAddress: this.factoryContract.address,
                blockNumber: await this.provider.getBlockNumber()
            };
            
        } catch (error) {
            console.error('❌ Enhanced blockchain initialization failed:', error);
            this.errors.push({
                timestamp: Date.now(),
                error: error.message,
                stack: error.stack
            });
            
            if (this.retryAttempts < this.maxRetries) {
                this.retryAttempts++;
                console.log(`🔄 Retrying initialization... (${this.retryAttempts}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 2000 * this.retryAttempts));
                return this.initialize();
            }
            
            throw new BlockchainError('Initialization failed after retries', error);
        }
    }

    async detectAndValidateProvider() {
        if (window.ethereum) {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            console.log('📱 MetaMask/Modern provider detected');
            
            // Request account access
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.signer = this.provider.getSigner();
                console.log('👛 Wallet connection successful');
            } catch (error) {
                if (error.code === 4001) {
                    throw new Error('User rejected wallet connection');
                }
                throw error;
            }
            
        } else if (window.web3) {
            this.provider = new ethers.providers.Web3Provider(window.web3.currentProvider);
            console.log('📱 Legacy Web3 provider detected');
        } else {
            throw new Error('No Web3 provider detected. Please install MetaMask or use a Web3-enabled browser.');
        }
    }

    async detectAndValidateNetwork() {
        const network = await this.provider.getNetwork();
        const networkConfig = Object.values(this.networks)
            .find(n => n.chainId === network.chainId);
            
        if (!networkConfig) {
            // Try to switch to supported network
            const supportedNetworks = Object.values(this.networks);
            const defaultNetwork = supportedNetworks.find(n => n.name.toLowerCase() === this.config.network.toLowerCase()) 
                                 || supportedNetworks[0];
            
            if (window.ethereum) {
                try {
                    await this.switchNetwork(defaultNetwork.chainId);
                    this.currentNetwork = defaultNetwork;
                    console.log(`🔄 Switched to ${defaultNetwork.name}`);
                } catch (switchError) {
                    throw new Error(`Please switch to a supported network: ${supportedNetworks.map(n => n.name).join(', ')}`);
                }
            } else {
                throw new Error(`Unsupported network: ${network.name} (${network.chainId}). Supported: ${supportedNetworks.map(n => n.name).join(', ')}`);
            }
        } else {
            this.currentNetwork = networkConfig;
            console.log(`🌐 Connected to ${network.name} (Chain ID: ${network.chainId})`);
        }
    }

    async switchNetwork(chainId) {
        const hexChainId = '0x' + chainId.toString(16);
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: hexChainId }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                // Network not added to wallet, try to add it
                const networkConfig = Object.values(this.networks).find(n => n.chainId === chainId);
                if (networkConfig) {
                    await this.addNetwork(networkConfig);
                }
            }
            throw switchError;
        }
    }

    async addNetwork(networkConfig) {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: '0x' + networkConfig.chainId.toString(16),
                chainName: networkConfig.name,
                rpcUrls: [networkConfig.rpcUrl],
                nativeCurrency: {
                    name: networkConfig.nativeCurrency,
                    symbol: networkConfig.nativeCurrency,
                    decimals: 18
                },
                blockExplorerUrls: [networkConfig.explorer]
            }]
        });
    }

    async connectToFactory() {
        try {
            const factoryAddress = this.currentNetwork.factoryAddress;
            if (!factoryAddress || factoryAddress === '0x...') {
                throw new Error(`Factory contract not deployed on ${this.currentNetwork.name}`);
            }
            
            this.factoryContract = new ethers.Contract(
                factoryAddress,
                this.factoryABI,
                this.signer || this.provider
            );
            
            // Test factory contract connection
            const allProducers = await this.factoryContract.getAllProducers();
            console.log(`🏭 Factory contract connected: ${allProducers.length} producers found`);
            
            return this.factoryContract;
            
        } catch (error) {
            console.error('❌ Factory connection failed:', error);
            throw new Error(`Factory connection failed: ${error.message}`);
        }
    }

    initializeCache() {
        // Cache for contract instances and data
        this.contractCache.clear();
        this.producerContracts.clear();
        
        console.log('💾 Contract cache initialized');
    }

    setupContractEventListeners() {
        if (!this.factoryContract) return;
        
        // Listen for new producer creation
        this.factoryContract.on('BcontractCreated', (producerId, name, description, image, externalLink, owner, cloneAddress) => {
            console.log(`🎉 New producer created: ${name} (${cloneAddress})`);
            
            // Clear cache for this producer
            this.contractCache.delete(owner);
            this.producerContracts.delete(owner);
            
            // Emit custom event
            window.dispatchEvent(new CustomEvent('blicence:producer:created', {
                detail: { producerId, name, owner, cloneAddress }
            }));
        });
        
        console.log('👂 Contract event listeners setup complete');
    }

    // Producer Clone Contract Detection & Management
    
    async getProducerContract(producerAddress) {
        try {
            // Check cache first
            if (this.producerContracts.has(producerAddress)) {
                console.log(`📦 Producer contract loaded from cache: ${producerAddress}`);
                return this.producerContracts.get(producerAddress);
            }
            
            console.log(`🔍 Detecting producer contract for: ${producerAddress}`);
            
            // Get producer info from factory
            const producerInfo = await this.factoryContract.getProducerByAddress(producerAddress);
            
            if (!producerInfo.exists) {
                throw new Error(`Producer not found in factory: ${producerAddress}`);
            }
            
            if (!producerInfo.cloneAddress || producerInfo.cloneAddress === ethers.constants.AddressZero) {
                throw new Error(`Producer clone contract not deployed: ${producerAddress}`);
            }
            
            // Create contract instance
            const producerContract = new ethers.Contract(
                producerInfo.cloneAddress,
                this.producerABI,
                this.signer || this.provider
            );
            
            // Validate contract by calling a read function
            await producerContract.getProducerInfo();
            
            // Cache the contract
            this.producerContracts.set(producerAddress, producerContract);
            this.contractCache.set(producerAddress, {
                producerInfo,
                contract: producerContract,
                lastUpdate: Date.now()
            });
            
            console.log(`✅ Producer contract detected and cached: ${producerInfo.cloneAddress}`);
            return producerContract;
            
        } catch (error) {
            console.error(`❌ Producer contract detection failed for ${producerAddress}:`, error);
            throw new Error(`Producer contract detection failed: ${error.message}`);
        }
    }

    async getProducerPlans(producerAddress) {
        try {
            console.log(`📋 Loading plans for producer: ${producerAddress}`);
            
            // Get producer contract
            const producerContract = await this.getProducerContract(producerAddress);
            
            // Get all plans from contract
            const rawPlans = await producerContract.getPlans();
            console.log(`📦 Raw plans loaded: ${rawPlans.length} plans found`);
            
            // Format and validate plans
            const formattedPlans = rawPlans.map((plan, index) => {
                try {
                    return this.formatPlanData(plan, producerAddress);
                } catch (formatError) {
                    console.warn(`⚠️ Plan formatting failed for index ${index}:`, formatError);
                    return null;
                }
            }).filter(plan => plan !== null);
            
            console.log(`✅ Successfully formatted ${formattedPlans.length} plans`);
            return formattedPlans;
            
        } catch (error) {
            console.error(`❌ Plan loading failed for ${producerAddress}:`, error);
            throw new Error(`Plan loading failed: ${error.message}`);
        }
    }

    formatPlanData(rawPlan, producerAddress) {
        // Robust plan data formatting with validation
        const plan = {
            id: rawPlan.planId ? rawPlan.planId.toString() : '0',
            cloneAddress: rawPlan.cloneAddress || '',
            producerId: rawPlan.producerId ? rawPlan.producerId.toString() : '0',
            producerAddress: producerAddress,
            name: rawPlan.name || 'Unnamed Plan',
            description: rawPlan.description || 'No description available',
            externalLink: rawPlan.externalLink || '',
            image: rawPlan.image || '',
            backgroundColor: rawPlan.backgroundColor || '#F8FAFC',
            
            // Supply management
            totalSupply: rawPlan.totalSupply ? parseInt(rawPlan.totalSupply.toString()) : -1,
            currentSupply: rawPlan.currentSupply ? parseInt(rawPlan.currentSupply.toString()) : 0,
            
            // Status and type
            status: rawPlan.status !== undefined ? parseInt(rawPlan.status.toString()) : 0,
            planType: rawPlan.planType !== undefined ? parseInt(rawPlan.planType.toString()) : 0,
            
            // Pricing
            priceAddress: rawPlan.priceAddress || ethers.constants.AddressZero,
            
            // Timing
            startDate: rawPlan.startDate ? new Date(parseInt(rawPlan.startDate.toString()) * 1000) : new Date(),
            
            // Customer data
            customerPlanIds: rawPlan.custumerPlanIds || []
        };
        
        // Additional computed fields
        plan.available = plan.totalSupply === -1 ? true : (plan.totalSupply - plan.currentSupply) > 0;
        plan.planTypeLabel = this.getPlanTypeLabel(plan.planType);
        plan.isActive = plan.status === 1;
        plan.soldOut = !plan.available && plan.totalSupply > 0;
        
        return plan;
    }

    getPlanTypeLabel(planType) {
        const types = {
            0: 'API Subscription',
            1: 'Usage Based Plan',
            2: 'Vesting API Plan',
            3: 'Custom Plan'
        };
        return types[planType] || `Unknown Type (${planType})`;
    }

    // Purchase and Subscription Management
    
    async subscribeToPlan(planId, producerAddress, paymentData = {}) {
        try {
            console.log(`💳 Starting plan subscription: Plan ${planId} for ${producerAddress}`);
            
            // Get producer contract
            const producerContract = await this.getProducerContract(producerAddress);
            
            // Get plan details for validation
            const plan = await producerContract.getPlan(planId);
            if (!plan || plan.status !== 1) {
                throw new Error('Plan not available for subscription');
            }
            
            // Check if user is already subscribed
            if (this.signer) {
                const userAddress = await this.signer.getAddress();
                const isSubscribed = await producerContract.isCustomerSubscribed(userAddress, planId);
                if (isSubscribed) {
                    throw new Error('User already subscribed to this plan');
                }
            }
            
            // Estimate gas
            const gasEstimate = await producerContract.estimateGas.subscribeToPlan(planId, {
                value: paymentData.value || '0'
            });
            
            // Execute transaction
            const tx = await producerContract.subscribeToPlan(planId, {
                value: paymentData.value || '0',
                gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
            });
            
            console.log(`📝 Transaction submitted: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`✅ Subscription successful: Block ${receipt.blockNumber}`);
            
            return {
                success: true,
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString()
            };
            
        } catch (error) {
            console.error(`❌ Subscription failed:`, error);
            throw new Error(`Subscription failed: ${error.message}`);
        }
    }

    async getCustomerSubscriptions(customerAddress, producerAddress) {
        try {
            const producerContract = await this.getProducerContract(producerAddress);
            const customerPlanIds = await producerContract.getCustomerPlans(customerAddress);
            
            return customerPlanIds.map(id => id.toString());
            
        } catch (error) {
            console.error(`❌ Failed to get customer subscriptions:`, error);
            return [];
        }
    }

    // Utility Methods
    
    isValidAddress(address) {
        return ethers.utils.isAddress(address);
    }

    formatAddress(address) {
        if (!this.isValidAddress(address)) return 'Invalid Address';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    async getBlockchainInfo() {
        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            const gasPrice = await this.provider.getGasPrice();
            
            return {
                network: network.name,
                chainId: network.chainId,
                blockNumber,
                gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei') + ' gwei'
            };
        } catch (error) {
            console.error('Failed to get blockchain info:', error);
            return null;
        }
    }
}

// Error classes
class BlockchainError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = 'BlockchainError';
        this.originalError = originalError;
    }
}

// Security Manager Class
class SecurityManager {
    constructor(config) {
        this.config = config;
    }

    async validateEnvironment() {
        // HTTPS check
        if (this.config.requireHttps && location.protocol !== 'https:' && location.hostname !== 'localhost') {
            throw new Error('HTTPS required for secure widget operation');
        }

        // Domain whitelist check
        if (this.config.allowedDomains && this.config.allowedDomains.length > 0) {
            const currentDomain = location.hostname;
            const isAllowed = this.config.allowedDomains.some(domain => 
                currentDomain === domain || currentDomain.endsWith('.' + domain)
            );
            
            if (!isAllowed) {
                throw new Error(`Domain not authorized: ${currentDomain}`);
            }
        }

        console.log('✅ Security validation passed');
        return true;
    }
}

// Analytics Manager Class
class WidgetAnalytics {
    constructor(config) {
        this.config = config;
        this.events = [];
    }

    track(eventName, eventData = {}) {
        if (!this.config.trackingEnabled) return;

        const event = {
            name: eventName,
            data: eventData,
            timestamp: Date.now(),
            url: location.href,
            userAgent: navigator.userAgent
        };

        this.events.push(event);

        // Google Analytics integration
        if (this.config.googleAnalytics && typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }

        console.log(`📊 Analytics: ${eventName}`, eventData);
    }

    getEvents() {
        return this.events;
    }
}

// UI Manager Class  
class WidgetUI {
    constructor(config) {
        this.config = config;
    }

    showLoading(message = 'Loading...') {
        return `
            <div class="blicence-loading">
                <div class="blicence-spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }

    showError(message) {
        return `
            <div class="blicence-error">
                <div class="blicence-error-icon">⚠️</div>
                <p>${message}</p>
            </div>
        `;
    }
}
