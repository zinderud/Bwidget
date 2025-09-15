// Plan Management Widget
// Advanced plan creation and management interface for Producers

class BlicencePlanManagement {
    constructor(config) {
        this.config = config;
        this.blockchain = new BlicenceBlockchainManager(config);
        
        // Plan templates
        this.templates = {
            basic: {
                name: 'Basic API Access',
                description: 'Essential API access for small projects',
                price: '29.99',
                features: ['1000 API calls/month', 'Email support', 'Basic analytics'],
                limits: { requests: 1000, bandwidth: '10GB', support: 'email' }
            },
            premium: {
                name: 'Premium API Access',
                description: 'Advanced features for growing businesses',
                price: '99.99',
                features: ['10000 API calls/month', 'Priority support', 'Advanced analytics', 'Custom webhooks'],
                limits: { requests: 10000, bandwidth: '100GB', support: 'priority' }
            },
            enterprise: {
                name: 'Enterprise Solution',
                description: 'Full-scale solution for large organizations',
                price: '299.99',
                features: ['Unlimited API calls', '24/7 support', 'Custom integrations', 'SLA guarantee'],
                limits: { requests: 'unlimited', bandwidth: 'unlimited', support: '24/7' }
            }
        };
        
        // Form validation rules
        this.validationRules = {
            name: { required: true, minLength: 3, maxLength: 50 },
            price: { required: true, min: 0, pattern: /^\d+(\.\d{1,2})?$/ },
            description: { required: true, minLength: 10, maxLength: 500 }
        };
    }

    async initialize() {
        await this.blockchain.initialize();
        console.log('📋 Plan Management initialized');
    }

    createWidget(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }

        const widgetConfig = {
            theme: options.theme || 'light',
            mode: options.mode || 'manage', // 'create', 'edit', 'manage'
            allowBulkOperations: options.allowBulkOperations !== false,
            templates: options.useTemplates !== false,
            ...options
        };

        container.innerHTML = this.generatePlanManagementHTML(widgetConfig);
        this.attachEventListeners(container, widgetConfig);
        this.loadExistingPlans();

        console.log('📋 Plan Management widget created');
        return this;
    }

    generatePlanManagementHTML(config) {
        return `
            <div class="blicence-plan-management" data-theme="${config.theme}">
                <!-- Header -->
                <div class="management-header">
                    <div class="header-content">
                        <h2>Plan Management</h2>
                        <div class="header-actions">
                            <button class="btn-secondary" id="importPlansBtn">Import Plans</button>
                            <button class="btn-primary" id="createPlanBtn">Create New Plan</button>
                        </div>
                    </div>
                </div>

                <!-- Plan Creation/Edit Form -->
                <div class="plan-form-container" id="planFormContainer" style="display: none;">
                    ${this.generatePlanForm(config)}
                </div>

                <!-- Plan Templates -->
                ${config.templates ? this.generateTemplatesSection() : ''}

                <!-- Existing Plans List -->
                <div class="plans-list-container">
                    ${this.generatePlansListSection(config)}
                </div>

                <!-- Bulk Operations -->
                ${config.allowBulkOperations ? this.generateBulkOperationsSection() : ''}
            </div>

            <style>
                .blicence-plan-management {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: var(--bg-primary);
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                .blicence-plan-management[data-theme="light"] {
                    --bg-primary: #ffffff;
                    --bg-secondary: #f8fafc;
                    --bg-tertiary: #e2e8f0;
                    --text-primary: #1a202c;
                    --text-secondary: #4a5568;
                    --border-color: #e2e8f0;
                    --accent-color: #667eea;
                    --success-color: #10b981;
                    --warning-color: #f59e0b;
                    --danger-color: #ef4444;
                }

                .blicence-plan-management[data-theme="dark"] {
                    --bg-primary: #1a202c;
                    --bg-secondary: #2d3748;
                    --bg-tertiary: #4a5568;
                    --text-primary: #f7fafc;
                    --text-secondary: #a0aec0;
                    --border-color: #4a5568;
                    --accent-color: #9f7aea;
                    --success-color: #10b981;
                    --warning-color: #f59e0b;
                    --danger-color: #ef4444;
                }

                .management-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid var(--border-color);
                }

                .header-content h2 {
                    margin: 0;
                    color: var(--text-primary);
                    font-size: 28px;
                    font-weight: 600;
                }

                .header-actions {
                    display: flex;
                    gap: 12px;
                }

                .btn-primary, .btn-secondary, .btn-danger, .btn-success {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-primary {
                    background: var(--accent-color);
                    color: white;
                }

                .btn-primary:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }

                .btn-secondary {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                }

                .btn-secondary:hover {
                    background: var(--bg-tertiary);
                }

                .btn-danger {
                    background: var(--danger-color);
                    color: white;
                }

                .btn-success {
                    background: var(--success-color);
                    color: white;
                }

                .plan-form-container {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 30px;
                    margin-bottom: 30px;
                }

                .form-section {
                    margin-bottom: 30px;
                }

                .section-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 15px;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-label {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 6px;
                }

                .form-input, .form-textarea, .form-select {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-size: 14px;
                    transition: border-color 0.2s ease;
                }

                .form-input:focus, .form-textarea:focus, .form-select:focus {
                    outline: none;
                    border-color: var(--accent-color);
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .form-textarea {
                    resize: vertical;
                    min-height: 80px;
                }

                .form-error {
                    color: var(--danger-color);
                    font-size: 12px;
                    margin-top: 4px;
                }

                .features-list {
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    background: var(--bg-primary);
                    padding: 12px;
                }

                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 0;
                    border-bottom: 1px solid var(--border-color);
                }

                .feature-item:last-child {
                    border-bottom: none;
                }

                .feature-input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    color: var(--text-primary);
                    font-size: 14px;
                }

                .remove-feature {
                    background: var(--danger-color);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    width: 24px;
                    height: 24px;
                    font-size: 12px;
                    cursor: pointer;
                }

                .add-feature {
                    margin-top: 10px;
                    background: var(--success-color);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 6px 12px;
                    font-size: 12px;
                    cursor: pointer;
                }

                .templates-section {
                    margin-bottom: 40px;
                }

                .templates-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                }

                .template-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .template-card:hover {
                    border-color: var(--accent-color);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .template-card.selected {
                    border-color: var(--accent-color);
                    background: rgba(102, 126, 234, 0.05);
                }

                .template-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                }

                .template-price {
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--accent-color);
                    margin-bottom: 10px;
                }

                .template-description {
                    color: var(--text-secondary);
                    font-size: 14px;
                    margin-bottom: 15px;
                }

                .template-features {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .template-features li {
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin-bottom: 4px;
                    padding-left: 16px;
                    position: relative;
                }

                .template-features li:before {
                    content: "✓";
                    color: var(--success-color);
                    position: absolute;
                    left: 0;
                }

                .plans-list {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .plans-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .plans-table th,
                .plans-table td {
                    padding: 16px;
                    text-align: left;
                    border-bottom: 1px solid var(--border-color);
                }

                .plans-table th {
                    background: var(--bg-primary);
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .plans-table td {
                    color: var(--text-secondary);
                }

                .plan-actions {
                    display: flex;
                    gap: 8px;
                }

                .action-btn {
                    padding: 4px 8px;
                    border: none;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: opacity 0.2s ease;
                }

                .action-btn:hover {
                    opacity: 0.8;
                }

                .plan-status {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .plan-status.active {
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--success-color);
                }

                .plan-status.inactive {
                    background: rgba(107, 114, 128, 0.1);
                    color: var(--text-secondary);
                }

                .bulk-operations {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 30px;
                }

                .bulk-actions {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .checkbox-all {
                    margin-right: 10px;
                }

                .selected-count {
                    color: var(--text-secondary);
                    font-size: 14px;
                }

                @media (max-width: 768px) {
                    .management-header {
                        flex-direction: column;
                        gap: 15px;
                        align-items: flex-start;
                    }

                    .header-actions {
                        width: 100%;
                        justify-content: stretch;
                    }

                    .header-actions button {
                        flex: 1;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                    }

                    .templates-grid {
                        grid-template-columns: 1fr;
                    }

                    .plans-table {
                        font-size: 12px;
                    }

                    .plans-table th,
                    .plans-table td {
                        padding: 8px;
                    }
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .plan-form-container {
                    animation: slideDown 0.3s ease;
                }
            </style>
        `;
    }

    generatePlanForm(config) {
        return `
            <div class="plan-form">
                <div class="form-header">
                    <h3 class="section-title">Create New Plan</h3>
                    <button class="btn-secondary" id="cancelFormBtn">Cancel</button>
                </div>

                <form id="planForm">
                    <!-- Basic Information -->
                    <div class="form-section">
                        <h4 class="section-title">Basic Information</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label" for="planName">Plan Name *</label>
                                <input type="text" id="planName" name="name" class="form-input" placeholder="e.g., Premium API Access" required>
                                <div class="form-error" id="nameError"></div>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="planPrice">Price (USD) *</label>
                                <input type="number" id="planPrice" name="price" class="form-input" step="0.01" min="0" placeholder="29.99" required>
                                <div class="form-error" id="priceError"></div>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="planCategory">Category</label>
                                <select id="planCategory" name="category" class="form-select">
                                    <option value="api">API Access</option>
                                    <option value="data">Data Service</option>
                                    <option value="storage">Storage</option>
                                    <option value="compute">Compute</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="planDuration">Billing Period</label>
                                <select id="planDuration" name="duration" class="form-select">
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                    <option value="one-time">One-time</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="planDescription">Description *</label>
                            <textarea id="planDescription" name="description" class="form-textarea" placeholder="Describe what this plan offers..." required></textarea>
                            <div class="form-error" id="descriptionError"></div>
                        </div>
                    </div>

                    <!-- Features -->
                    <div class="form-section">
                        <h4 class="section-title">Features</h4>
                        <div class="features-list" id="featuresList">
                            <div class="feature-item">
                                <input type="text" class="feature-input" placeholder="Enter a feature..." value="">
                                <button type="button" class="remove-feature">×</button>
                            </div>
                        </div>
                        <button type="button" class="add-feature" id="addFeatureBtn">+ Add Feature</button>
                    </div>

                    <!-- Limits & Quotas -->
                    <div class="form-section">
                        <h4 class="section-title">Limits & Quotas</h4>
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label" for="requestLimit">API Requests/Month</label>
                                <input type="number" id="requestLimit" name="requestLimit" class="form-input" placeholder="1000">
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="bandwidthLimit">Bandwidth Limit</label>
                                <input type="text" id="bandwidthLimit" name="bandwidthLimit" class="form-input" placeholder="10GB">
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="rateLimit">Rate Limit (req/min)</label>
                                <input type="number" id="rateLimit" name="rateLimit" class="form-input" placeholder="60">
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="supportLevel">Support Level</label>
                                <select id="supportLevel" name="supportLevel" class="form-select">
                                    <option value="email">Email Support</option>
                                    <option value="priority">Priority Support</option>
                                    <option value="24/7">24/7 Support</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Form Actions -->
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" id="saveDraftBtn">Save as Draft</button>
                        <button type="submit" class="btn-primary">Create Plan</button>
                    </div>
                </form>
            </div>
        `;
    }

    generateTemplatesSection() {
        return `
            <div class="templates-section">
                <div class="section-header">
                    <h3 class="section-title">Plan Templates</h3>
                    <p style="color: var(--text-secondary); margin: 0;">Start with a pre-configured template</p>
                </div>
                
                <div class="templates-grid" id="templatesGrid">
                    ${Object.entries(this.templates).map(([key, template]) => `
                        <div class="template-card" data-template="${key}">
                            <div class="template-name">${template.name}</div>
                            <div class="template-price">$${template.price}</div>
                            <div class="template-description">${template.description}</div>
                            <ul class="template-features">
                                ${template.features.map(feature => `<li>${feature}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    generatePlansListSection(config) {
        return `
            <div class="plans-list-section">
                <div class="section-header">
                    <h3 class="section-title">Existing Plans</h3>
                    <div class="list-actions">
                        <input type="search" placeholder="Search plans..." class="form-input" style="width: 200px;" id="planSearch">
                        <select class="form-select" style="width: 150px;" id="statusFilter">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                
                <div class="plans-list" id="plansList">
                    <table class="plans-table">
                        <thead>
                            <tr>
                                ${config.allowBulkOperations ? '<th><input type="checkbox" id="selectAll"></th>' : ''}
                                <th>Plan Name</th>
                                <th>Price</th>
                                <th>Subscribers</th>
                                <th>Revenue</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="plansTableBody">
                            <tr>
                                <td colspan="${config.allowBulkOperations ? '7' : '6'}" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                                    Loading plans...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateBulkOperationsSection() {
        return `
            <div class="bulk-operations" id="bulkOperations" style="display: none;">
                <div class="bulk-actions">
                    <input type="checkbox" class="checkbox-all" id="bulkSelectAll">
                    <span class="selected-count" id="selectedCount">0 plans selected</span>
                    <button class="btn-secondary" id="bulkActivateBtn">Activate Selected</button>
                    <button class="btn-secondary" id="bulkDeactivateBtn">Deactivate Selected</button>
                    <button class="btn-danger" id="bulkDeleteBtn">Delete Selected</button>
                </div>
            </div>
        `;
    }

    attachEventListeners(container, config) {
        // Create Plan Button
        const createBtn = container.querySelector('#createPlanBtn');
        createBtn?.addEventListener('click', () => this.showPlanForm());

        // Cancel Form Button
        const cancelBtn = container.querySelector('#cancelFormBtn');
        cancelBtn?.addEventListener('click', () => this.hidePlanForm());

        // Template Selection
        const templateCards = container.querySelectorAll('.template-card');
        templateCards.forEach(card => {
            card.addEventListener('click', () => this.selectTemplate(card.dataset.template));
        });

        // Add Feature Button
        const addFeatureBtn = container.querySelector('#addFeatureBtn');
        addFeatureBtn?.addEventListener('click', () => this.addFeature());

        // Plan Form Submission
        const planForm = container.querySelector('#planForm');
        planForm?.addEventListener('submit', (e) => this.handlePlanSubmission(e));

        // Search and Filter
        const searchInput = container.querySelector('#planSearch');
        searchInput?.addEventListener('input', (e) => this.filterPlans(e.target.value));

        const statusFilter = container.querySelector('#statusFilter');
        statusFilter?.addEventListener('change', (e) => this.filterPlansByStatus(e.target.value));

        // Form Validation
        this.attachFormValidation(container);
    }

    attachFormValidation(container) {
        const nameInput = container.querySelector('#planName');
        const priceInput = container.querySelector('#planPrice');
        const descInput = container.querySelector('#planDescription');

        nameInput?.addEventListener('blur', () => this.validateField('name', nameInput.value));
        priceInput?.addEventListener('blur', () => this.validateField('price', priceInput.value));
        descInput?.addEventListener('blur', () => this.validateField('description', descInput.value));
    }

    validateField(fieldName, value) {
        const rules = this.validationRules[fieldName];
        const errorElement = document.getElementById(`${fieldName}Error`);
        
        if (!rules || !errorElement) return true;

        let isValid = true;
        let errorMessage = '';

        if (rules.required && !value.trim()) {
            isValid = false;
            errorMessage = `${fieldName} is required`;
        } else if (rules.minLength && value.length < rules.minLength) {
            isValid = false;
            errorMessage = `${fieldName} must be at least ${rules.minLength} characters`;
        } else if (rules.maxLength && value.length > rules.maxLength) {
            isValid = false;
            errorMessage = `${fieldName} must be no more than ${rules.maxLength} characters`;
        } else if (rules.pattern && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = `${fieldName} format is invalid`;
        } else if (rules.min && parseFloat(value) < rules.min) {
            isValid = false;
            errorMessage = `${fieldName} must be at least ${rules.min}`;
        }

        errorElement.textContent = errorMessage;
        errorElement.style.display = errorMessage ? 'block' : 'none';

        return isValid;
    }

    showPlanForm() {
        const formContainer = document.getElementById('planFormContainer');
        if (formContainer) {
            formContainer.style.display = 'block';
            formContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    hidePlanForm() {
        const formContainer = document.getElementById('planFormContainer');
        if (formContainer) {
            formContainer.style.display = 'none';
        }
    }

    selectTemplate(templateKey) {
        const template = this.templates[templateKey];
        if (!template) return;

        // Remove previous selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked card
        const selectedCard = document.querySelector(`[data-template="${templateKey}"]`);
        selectedCard?.classList.add('selected');

        // Fill form with template data
        this.fillFormWithTemplate(template);
        this.showPlanForm();
    }

    fillFormWithTemplate(template) {
        document.getElementById('planName').value = template.name;
        document.getElementById('planPrice').value = template.price;
        document.getElementById('planDescription').value = template.description;

        // Fill features
        const featuresList = document.getElementById('featuresList');
        featuresList.innerHTML = '';
        
        template.features.forEach(feature => {
            this.addFeature(feature);
        });

        // Fill limits
        if (template.limits) {
            const requestLimit = document.getElementById('requestLimit');
            const bandwidthLimit = document.getElementById('bandwidthLimit');
            const supportLevel = document.getElementById('supportLevel');

            if (requestLimit && template.limits.requests !== 'unlimited') {
                requestLimit.value = template.limits.requests;
            }
            if (bandwidthLimit) {
                bandwidthLimit.value = template.limits.bandwidth;
            }
            if (supportLevel) {
                supportLevel.value = template.limits.support;
            }
        }
    }

    addFeature(featureText = '') {
        const featuresList = document.getElementById('featuresList');
        const featureItem = document.createElement('div');
        featureItem.className = 'feature-item';
        
        featureItem.innerHTML = `
            <input type="text" class="feature-input" placeholder="Enter a feature..." value="${featureText}">
            <button type="button" class="remove-feature">×</button>
        `;

        // Add remove functionality
        const removeBtn = featureItem.querySelector('.remove-feature');
        removeBtn.addEventListener('click', () => featureItem.remove());

        featuresList.appendChild(featureItem);
    }

    async handlePlanSubmission(event) {
        event.preventDefault();
        
        try {
            console.log('📋 Creating new plan...');

            // Validate form
            const isValid = this.validateForm();
            if (!isValid) {
                throw new Error('Please fix validation errors');
            }

            // Collect form data
            const planData = this.collectFormData();
            
            // Create plan on blockchain
            const result = await this.createPlanOnBlockchain(planData);
            
            console.log('✅ Plan created successfully:', result);
            
            // Reset form and refresh list
            this.resetForm();
            this.hidePlanForm();
            await this.loadExistingPlans();
            
            // Show success message
            this.showSuccessMessage('Plan created successfully!');

        } catch (error) {
            console.error('❌ Failed to create plan:', error);
            this.showErrorMessage(error.message);
        }
    }

    validateForm() {
        const name = document.getElementById('planName').value;
        const price = document.getElementById('planPrice').value;
        const description = document.getElementById('planDescription').value;

        const nameValid = this.validateField('name', name);
        const priceValid = this.validateField('price', price);
        const descValid = this.validateField('description', description);

        return nameValid && priceValid && descValid;
    }

    collectFormData() {
        const formData = new FormData(document.getElementById('planForm'));
        const features = Array.from(document.querySelectorAll('.feature-input'))
            .map(input => input.value.trim())
            .filter(value => value);

        return {
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            description: formData.get('description'),
            category: formData.get('category'),
            duration: formData.get('duration'),
            features: features,
            limits: {
                requests: formData.get('requestLimit') ? parseInt(formData.get('requestLimit')) : null,
                bandwidth: formData.get('bandwidthLimit'),
                rateLimit: formData.get('rateLimit') ? parseInt(formData.get('rateLimit')) : null,
                support: formData.get('supportLevel')
            }
        };
    }

    async createPlanOnBlockchain(planData) {
        // Mock blockchain interaction
        console.log('🔗 Creating plan on blockchain:', planData);
        
        // Simulate blockchain transaction delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            planId: `plan_${Date.now()}`,
            transactionHash: `0x${Math.random().toString(16).substring(2)}`,
            planData: planData
        };
    }

    async loadExistingPlans() {
        try {
            console.log('📋 Loading existing plans...');
            
            // Mock data - replace with real blockchain queries
            const plans = [
                {
                    id: 'plan_1',
                    name: 'Basic API',
                    price: '$29.99',
                    subscribers: 45,
                    revenue: '$1,349.55',
                    status: 'active'
                },
                {
                    id: 'plan_2',
                    name: 'Premium API',
                    price: '$99.99',
                    subscribers: 23,
                    revenue: '$2,299.77',
                    status: 'active'
                },
                {
                    id: 'plan_3',
                    name: 'Enterprise',
                    price: '$299.99',
                    subscribers: 8,
                    revenue: '$2,399.92',
                    status: 'inactive'
                }
            ];

            this.renderPlansList(plans);
            
        } catch (error) {
            console.error('❌ Failed to load plans:', error);
        }
    }

    renderPlansList(plans) {
        const tbody = document.getElementById('plansTableBody');
        if (!tbody) return;

        tbody.innerHTML = plans.map(plan => `
            <tr data-plan-id="${plan.id}">
                <td>
                    <input type="checkbox" class="plan-checkbox" data-plan-id="${plan.id}">
                </td>
                <td>${plan.name}</td>
                <td>${plan.price}</td>
                <td>${plan.subscribers}</td>
                <td>${plan.revenue}</td>
                <td>
                    <span class="plan-status ${plan.status}">${plan.status}</span>
                </td>
                <td>
                    <div class="plan-actions">
                        <button class="action-btn btn-secondary" onclick="editPlan('${plan.id}')">Edit</button>
                        <button class="action-btn btn-success" onclick="duplicatePlan('${plan.id}')">Duplicate</button>
                        <button class="action-btn btn-danger" onclick="deletePlan('${plan.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    resetForm() {
        const form = document.getElementById('planForm');
        if (form) {
            form.reset();
            
            // Clear features list
            const featuresList = document.getElementById('featuresList');
            featuresList.innerHTML = '';
            this.addFeature();
            
            // Clear error messages
            document.querySelectorAll('.form-error').forEach(error => {
                error.textContent = '';
                error.style.display = 'none';
            });
        }
    }

    showSuccessMessage(message) {
        console.log('✅', message);
        // Implement toast notification
    }

    showErrorMessage(message) {
        console.error('❌', message);
        // Implement error notification
    }
}

// Export
window.BlicencePlanManagement = BlicencePlanManagement;
