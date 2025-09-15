// Blicence Service Access Layer
// NFT & Signature-based authentication for Producer services

class BlicenceServiceAccess {
    constructor(config) {
        this.config = config;
        this.blockchain = new BlicenceBlockchainManager(config);
        this.cache = new Map();
        
        // Access method configurations
        this.accessMethods = {
            nftVerification: config.nftVerification !== false,
            signatureAuth: config.signatureAuth !== false, 
            tokenGating: config.tokenGating !== false
        };
        
        // Credentials store
        this.credentials = new Map();
    }

    async initialize() {
        await this.blockchain.initialize();
        console.log('🔑 Service Access Layer initialized');
    }

    async verifyAccess(customerAddress, planId, accessType = 'api') {
        try {
            console.log(`🔍 Verifying access for ${customerAddress} to plan ${planId}`);
            
            const verification = {
                customer: customerAddress,
                plan: planId,
                accessType: accessType,
                timestamp: Date.now(),
                methods: {}
            };

            // 1. NFT Ownership Verification
            if (this.accessMethods.nftVerification) {
                verification.methods.nft = await this.verifyNFTOwnership(customerAddress, planId);
            }

            // 2. Subscription Status Check
            verification.methods.subscription = await this.verifySubscription(customerAddress, planId);

            // 3. Usage Limits Check
            verification.methods.usage = await this.verifyUsageLimits(customerAddress, planId);

            // 4. Token Gating (if configured)
            if (this.accessMethods.tokenGating) {
                verification.methods.tokenGating = await this.verifyTokenRequirements(customerAddress, planId);
            }

            // Evaluate overall access
            const hasAccess = this.evaluateAccess(verification);
            
            if (hasAccess) {
                console.log('✅ Access granted');
                return {
                    granted: true,
                    verification: verification,
                    credentials: await this.generateAccessCredentials(customerAddress, planId, accessType)
                };
            } else {
                console.log('❌ Access denied');
                return {
                    granted: false,
                    verification: verification,
                    reason: this.getAccessDenialReason(verification)
                };
            }

        } catch (error) {
            console.error('❌ Access verification failed:', error);
            throw new Error(`Access verification failed: ${error.message}`);
        }
    }

    async verifyNFTOwnership(customerAddress, planId) {
        try {
            // In real implementation, query NFT contract for ownership
            // Mock implementation for now
            
            const nftContract = await this.getNFTContract(planId);
            if (!nftContract) {
                return { valid: false, reason: 'No NFT contract for this plan' };
            }

            // Check if customer owns required NFT
            const balance = await nftContract.balanceOf(customerAddress);
            const tokenId = await this.getTokenIdForPlan(planId);
            const ownsToken = await nftContract.ownerOf(tokenId) === customerAddress;

            return {
                valid: ownsToken && balance.gt(0),
                contract: nftContract.address,
                tokenId: tokenId,
                balance: balance.toString(),
                metadata: await this.getNFTMetadata(tokenId)
            };

        } catch (error) {
            console.error('NFT verification failed:', error);
            return { valid: false, error: error.message };
        }
    }

    async verifySubscription(customerAddress, planId) {
        try {
            const producerContract = await this.blockchain.getProducerContract(this.config.producerAddress);
            const isSubscribed = await producerContract.isCustomerSubscribed(customerAddress, planId);
            
            if (isSubscribed) {
                // Get subscription details
                const subscriptionDetails = await this.getSubscriptionDetails(customerAddress, planId);
                
                return {
                    valid: true,
                    subscribed: isSubscribed,
                    startDate: subscriptionDetails.startDate,
                    endDate: subscriptionDetails.endDate,
                    status: subscriptionDetails.status
                };
            } else {
                return {
                    valid: false,
                    reason: 'No active subscription found'
                };
            }

        } catch (error) {
            console.error('Subscription verification failed:', error);
            return { valid: false, error: error.message };
        }
    }

    async verifyUsageLimits(customerAddress, planId) {
        try {
            // Get usage statistics
            const usage = await this.getUsageStats(customerAddress, planId);
            const limits = await this.getPlanLimits(planId);

            const withinLimits = {
                requests: usage.requests < limits.maxRequests,
                bandwidth: usage.bandwidth < limits.maxBandwidth,
                rateLimit: usage.currentRate < limits.rateLimit
            };

            const allWithinLimits = Object.values(withinLimits).every(Boolean);

            return {
                valid: allWithinLimits,
                usage: usage,
                limits: limits,
                withinLimits: withinLimits,
                nextReset: this.getNextResetTime(limits.resetPeriod)
            };

        } catch (error) {
            console.error('Usage verification failed:', error);
            return { valid: false, error: error.message };
        }
    }

    async verifyTokenRequirements(customerAddress, planId) {
        try {
            // Check if customer holds required tokens for this plan
            const requirements = await this.getTokenRequirements(planId);
            
            const balances = {};
            for (const token of requirements.tokens) {
                const balance = await this.getTokenBalance(customerAddress, token.address);
                balances[token.symbol] = balance;
            }

            const meetsRequirements = requirements.tokens.every(token => 
                balances[token.symbol] >= token.minimumBalance
            );

            return {
                valid: meetsRequirements,
                requirements: requirements,
                balances: balances
            };

        } catch (error) {
            console.error('Token gating verification failed:', error);
            return { valid: false, error: error.message };
        }
    }

    evaluateAccess(verification) {
        const methods = verification.methods;
        
        // Core requirement: must have valid subscription
        if (!methods.subscription?.valid) {
            return false;
        }

        // Usage limits must be within bounds
        if (!methods.usage?.valid) {
            return false;
        }

        // NFT verification (if enabled)
        if (this.accessMethods.nftVerification && !methods.nft?.valid) {
            return false;
        }

        // Token gating (if enabled)
        if (this.accessMethods.tokenGating && !methods.tokenGating?.valid) {
            return false;
        }

        return true;
    }

    async generateAccessCredentials(customerAddress, planId, accessType) {
        try {
            const credentialId = this.generateCredentialId(customerAddress, planId);
            
            // Generate different types of credentials based on access type
            const credentials = {
                id: credentialId,
                customerAddress: customerAddress,
                planId: planId,
                accessType: accessType,
                issuedAt: Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            };

            switch (accessType) {
                case 'api':
                    credentials.apiKey = await this.generateAPIKey(customerAddress, planId);
                    credentials.jwt = await this.generateJWT(customerAddress, planId);
                    break;
                    
                case 'offline':
                    credentials.signature = await this.generateOfflineSignature(customerAddress, planId);
                    credentials.message = this.createSignatureMessage(customerAddress, planId);
                    break;
                    
                case 'session':
                    credentials.sessionToken = await this.generateSessionToken(customerAddress, planId);
                    credentials.refreshToken = await this.generateRefreshToken(customerAddress, planId);
                    break;
            }

            // Store credentials for later verification
            this.credentials.set(credentialId, credentials);
            
            console.log(`🔑 Generated ${accessType} credentials for ${customerAddress}`);
            return credentials;

        } catch (error) {
            console.error('Credential generation failed:', error);
            throw new Error(`Failed to generate credentials: ${error.message}`);
        }
    }

    async generateAPIKey(customerAddress, planId) {
        // Generate a secure API key
        const keyData = `${customerAddress}:${planId}:${Date.now()}:${Math.random()}`;
        const hash = await this.hashData(keyData);
        return `blc_${hash.substring(0, 32)}`;
    }

    async generateJWT(customerAddress, planId) {
        // Mock JWT generation - in real implementation use proper JWT library
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            customer: customerAddress,
            plan: planId,
            producer: this.config.producerAddress,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }));
        
        const signature = await this.signData(`${header}.${payload}`);
        return `${header}.${payload}.${signature}`;
    }

    async generateOfflineSignature(customerAddress, planId) {
        // Generate signature for offline verification
        const message = this.createSignatureMessage(customerAddress, planId);
        return await this.signMessage(message);
    }

    createSignatureMessage(customerAddress, planId) {
        return `Blicence Access Grant\nCustomer: ${customerAddress}\nPlan: ${planId}\nTimestamp: ${Date.now()}`;
    }

    async validateCredentials(credentials) {
        try {
            const stored = this.credentials.get(credentials.id);
            
            if (!stored) {
                return { valid: false, reason: 'Credentials not found' };
            }

            if (stored.expiresAt < Date.now()) {
                return { valid: false, reason: 'Credentials expired' };
            }

            // Additional validation based on credential type
            switch (credentials.accessType) {
                case 'api':
                    return await this.validateAPICredentials(credentials);
                case 'offline':
                    return await this.validateOfflineSignature(credentials);
                case 'session':
                    return await this.validateSessionToken(credentials);
                default:
                    return { valid: false, reason: 'Unknown credential type' };
            }

        } catch (error) {
            console.error('Credential validation failed:', error);
            return { valid: false, error: error.message };
        }
    }

    // Mock implementations - replace with real crypto functions
    async hashData(data) {
        return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
    }

    async signData(data) {
        return btoa(data + 'secret').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    }

    async signMessage(message) {
        // In real implementation, use web3 provider to sign message
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                const signature = await window.ethereum.request({
                    method: 'personal_sign',
                    params: [message, accounts[0]]
                });
                return signature;
            } catch (error) {
                console.error('Message signing failed:', error);
                return null;
            }
        }
        return null;
    }

    generateCredentialId(customerAddress, planId) {
        return `cred_${customerAddress.substring(0, 8)}_${planId}_${Date.now()}`;
    }

    getAccessDenialReason(verification) {
        const methods = verification.methods;
        
        if (!methods.subscription?.valid) {
            return 'No valid subscription found';
        }
        
        if (!methods.usage?.valid) {
            return 'Usage limits exceeded';
        }
        
        if (this.accessMethods.nftVerification && !methods.nft?.valid) {
            return 'Required NFT not found';
        }
        
        if (this.accessMethods.tokenGating && !methods.tokenGating?.valid) {
            return 'Token requirements not met';
        }
        
        return 'Access denied for unknown reason';
    }

    // Mock helper methods - implement with real data sources
    async getNFTContract(planId) {
        // Return mock NFT contract for plan
        return null; // No NFT contract for this demo
    }

    async getSubscriptionDetails(customerAddress, planId) {
        return {
            startDate: new Date(Date.now() - 86400000), // Yesterday
            endDate: new Date(Date.now() + 30 * 86400000), // 30 days from now
            status: 'active'
        };
    }

    async getUsageStats(customerAddress, planId) {
        return {
            requests: 150,
            bandwidth: 1024 * 1024 * 50, // 50MB
            currentRate: 10 // requests per minute
        };
    }

    async getPlanLimits(planId) {
        return {
            maxRequests: 1000,
            maxBandwidth: 1024 * 1024 * 100, // 100MB
            rateLimit: 60, // requests per minute
            resetPeriod: 'daily'
        };
    }

    getNextResetTime(resetPeriod) {
        const now = new Date();
        switch (resetPeriod) {
            case 'daily':
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                return tomorrow.getTime();
            case 'monthly':
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                return nextMonth.getTime();
            default:
                return Date.now() + 24 * 60 * 60 * 1000;
        }
    }
}

// Export
window.BlicenceServiceAccess = BlicenceServiceAccess;
