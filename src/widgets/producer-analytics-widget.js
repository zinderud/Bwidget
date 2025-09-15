// Producer Analytics Widget
// Advanced analytics dashboard for Producers

class BlicenceProducerAnalytics {
    constructor(config) {
        this.config = config;
        this.blockchain = new BlicenceBlockchainManager(config);
        this.serviceAccess = new BlicenceServiceAccess(config);
        
        // Analytics configuration
        this.analytics = {
            realTime: config.realTimeAnalytics !== false,
            dataRetention: config.dataRetention || '90d',
            updateInterval: config.updateInterval || 30000 // 30 seconds
        };
        
        // Data stores
        this.metricsCache = new Map();
        this.realtimeData = new Map();
        
        // Chart instances
        this.charts = new Map();
    }

    async initialize() {
        await this.blockchain.initialize();
        await this.serviceAccess.initialize();
        
        console.log('📊 Producer Analytics initialized');
        
        if (this.analytics.realTime) {
            this.startRealtimeUpdates();
        }
    }

    createWidget(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container ${containerId} not found`);
        }

        const widgetConfig = {
            theme: options.theme || 'light',
            sections: options.sections || ['overview', 'sales', 'customers', 'usage'],
            timeRange: options.timeRange || '30d',
            ...options
        };

        container.innerHTML = this.generateAnalyticsHTML(widgetConfig);
        this.attachEventListeners(container, widgetConfig);
        this.loadAnalyticsData(widgetConfig);

        console.log('📊 Analytics widget created');
        return this;
    }

    generateAnalyticsHTML(config) {
        return `
            <div class="blicence-analytics-widget" data-theme="${config.theme}">
                <!-- Header -->
                <div class="analytics-header">
                    <div class="header-content">
                        <h2>Producer Analytics</h2>
                        <div class="time-range-selector">
                            <select id="timeRange" data-value="${config.timeRange}">
                                <option value="7d">Last 7 Days</option>
                                <option value="30d" selected>Last 30 Days</option>
                                <option value="90d">Last 90 Days</option>
                                <option value="1y">Last Year</option>
                            </select>
                        </div>
                    </div>
                    <div class="realtime-indicator ${this.analytics.realTime ? 'active' : ''}">
                        <span class="indicator-dot"></span>
                        Real-time
                    </div>
                </div>

                <!-- Overview Section -->
                ${config.sections.includes('overview') ? this.generateOverviewSection() : ''}

                <!-- Sales Analytics -->
                ${config.sections.includes('sales') ? this.generateSalesSection() : ''}

                <!-- Customer Analytics -->
                ${config.sections.includes('customers') ? this.generateCustomersSection() : ''}

                <!-- Usage Analytics -->
                ${config.sections.includes('usage') ? this.generateUsageSection() : ''}

                <!-- Plan Performance -->
                ${config.sections.includes('plans') ? this.generatePlansSection() : ''}
            </div>

            <style>
                .blicence-analytics-widget {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: var(--bg-primary);
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }

                .blicence-analytics-widget[data-theme="light"] {
                    --bg-primary: #ffffff;
                    --bg-secondary: #f8fafc;
                    --text-primary: #1a202c;
                    --text-secondary: #4a5568;
                    --border-color: #e2e8f0;
                    --accent-color: #667eea;
                }

                .blicence-analytics-widget[data-theme="dark"] {
                    --bg-primary: #1a202c;
                    --bg-secondary: #2d3748;
                    --text-primary: #f7fafc;
                    --text-secondary: #a0aec0;
                    --border-color: #4a5568;
                    --accent-color: #9f7aea;
                }

                .analytics-header {
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

                .time-range-selector select {
                    padding: 8px 12px;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    font-size: 14px;
                }

                .realtime-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-secondary);
                    font-size: 14px;
                }

                .realtime-indicator.active {
                    color: #10b981;
                }

                .indicator-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #6b7280;
                }

                .realtime-indicator.active .indicator-dot {
                    background: #10b981;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .analytics-section {
                    margin-bottom: 40px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .section-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .metric-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                }

                .metric-value {
                    font-size: 32px;
                    font-weight: 700;
                    color: var(--accent-color);
                    margin-bottom: 5px;
                }

                .metric-label {
                    font-size: 14px;
                    color: var(--text-secondary);
                    margin-bottom: 10px;
                }

                .metric-change {
                    font-size: 12px;
                    font-weight: 500;
                    padding: 2px 6px;
                    border-radius: 12px;
                }

                .metric-change.positive {
                    color: #10b981;
                    background: rgba(16, 185, 129, 0.1);
                }

                .metric-change.negative {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                }

                .chart-container {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 20px;
                    height: 300px;
                    margin-bottom: 20px;
                }

                .data-table {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .data-table table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .data-table th,
                .data-table td {
                    padding: 12px 16px;
                    text-align: left;
                    border-bottom: 1px solid var(--border-color);
                }

                .data-table th {
                    background: var(--bg-primary);
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .data-table td {
                    color: var(--text-secondary);
                }

                .loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100px;
                    color: var(--text-secondary);
                }

                .loading::after {
                    content: "";
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--border-color);
                    border-top: 2px solid var(--accent-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-left: 10px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .analytics-header {
                        flex-direction: column;
                        gap: 15px;
                        align-items: flex-start;
                    }

                    .metrics-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
    }

    generateOverviewSection() {
        return `
            <div class="analytics-section overview-section">
                <div class="section-header">
                    <h3 class="section-title">Overview</h3>
                </div>
                
                <div class="metrics-grid" id="overviewMetrics">
                    <div class="metric-card">
                        <div class="metric-value" id="totalRevenue">-</div>
                        <div class="metric-label">Total Revenue</div>
                        <div class="metric-change" id="revenueChange">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value" id="totalCustomers">-</div>
                        <div class="metric-label">Total Customers</div>
                        <div class="metric-change" id="customersChange">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value" id="activePlans">-</div>
                        <div class="metric-label">Active Plans</div>
                        <div class="metric-change" id="plansChange">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value" id="apiUsage">-</div>
                        <div class="metric-label">API Requests</div>
                        <div class="metric-change" id="usageChange">-</div>
                    </div>
                </div>
            </div>
        `;
    }

    generateSalesSection() {
        return `
            <div class="analytics-section sales-section">
                <div class="section-header">
                    <h3 class="section-title">Sales Performance</h3>
                </div>
                
                <div class="chart-container" id="salesChart">
                    <div class="loading">Loading sales data</div>
                </div>
                
                <div class="data-table" id="salesTable">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Plan</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="salesTableBody">
                            <tr><td colspan="5" class="loading">Loading sales data</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateCustomersSection() {
        return `
            <div class="analytics-section customers-section">
                <div class="section-header">
                    <h3 class="section-title">Customer Analytics</h3>
                </div>
                
                <div class="metrics-grid" id="customerMetrics">
                    <div class="metric-card">
                        <div class="metric-value" id="newCustomers">-</div>
                        <div class="metric-label">New Customers</div>
                        <div class="metric-change" id="newCustomersChange">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value" id="churnRate">-</div>
                        <div class="metric-label">Churn Rate</div>
                        <div class="metric-change" id="churnChange">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value" id="avgLifetime">-</div>
                        <div class="metric-label">Avg. Lifetime Value</div>
                        <div class="metric-change" id="lifetimeChange">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value" id="satisfaction">-</div>
                        <div class="metric-label">Satisfaction Score</div>
                        <div class="metric-change" id="satisfactionChange">-</div>
                    </div>
                </div>
                
                <div class="chart-container" id="customerChart">
                    <div class="loading">Loading customer data</div>
                </div>
            </div>
        `;
    }

    generateUsageSection() {
        return `
            <div class="analytics-section usage-section">
                <div class="section-header">
                    <h3 class="section-title">Usage Analytics</h3>
                </div>
                
                <div class="metrics-grid" id="usageMetrics">
                    <div class="metric-card">
                        <div class="metric-value" id="totalRequests">-</div>
                        <div class="metric-label">Total API Requests</div>
                        <div class="metric-change" id="requestsChange">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value" id="avgResponseTime">-</div>
                        <div class="metric-label">Avg. Response Time</div>
                        <div class="metric-change" id="responseTimeChange">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value" id="errorRate">-</div>
                        <div class="metric-label">Error Rate</div>
                        <div class="metric-change" id="errorRateChange">-</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value" id="bandwidth">-</div>
                        <div class="metric-label">Bandwidth Used</div>
                        <div class="metric-change" id="bandwidthChange">-</div>
                    </div>
                </div>
                
                <div class="chart-container" id="usageChart">
                    <div class="loading">Loading usage data</div>
                </div>
            </div>
        `;
    }

    generatePlansSection() {
        return `
            <div class="analytics-section plans-section">
                <div class="section-header">
                    <h3 class="section-title">Plan Performance</h3>
                </div>
                
                <div class="data-table" id="plansTable">
                    <table>
                        <thead>
                            <tr>
                                <th>Plan Name</th>
                                <th>Subscribers</th>
                                <th>Revenue</th>
                                <th>Usage</th>
                                <th>Conversion Rate</th>
                            </tr>
                        </thead>
                        <tbody id="plansTableBody">
                            <tr><td colspan="5" class="loading">Loading plan data</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    attachEventListeners(container, config) {
        // Time range selector
        const timeRangeSelect = container.querySelector('#timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                config.timeRange = e.target.value;
                this.loadAnalyticsData(config);
            });
        }

        // Refresh button (if added)
        const refreshBtn = container.querySelector('#refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAnalyticsData(config);
            });
        }
    }

    async loadAnalyticsData(config) {
        try {
            console.log(`📊 Loading analytics data for ${config.timeRange}`);

            // Load data in parallel
            const [overview, sales, customers, usage, plans] = await Promise.all([
                this.getOverviewData(config.timeRange),
                this.getSalesData(config.timeRange),
                this.getCustomerData(config.timeRange),
                this.getUsageData(config.timeRange),
                this.getPlanData(config.timeRange)
            ]);

            // Update UI sections
            if (config.sections.includes('overview')) {
                this.updateOverviewSection(overview);
            }
            if (config.sections.includes('sales')) {
                this.updateSalesSection(sales);
            }
            if (config.sections.includes('customers')) {
                this.updateCustomersSection(customers);
            }
            if (config.sections.includes('usage')) {
                this.updateUsageSection(usage);
            }
            if (config.sections.includes('plans')) {
                this.updatePlansSection(plans);
            }

            console.log('📊 Analytics data loaded successfully');

        } catch (error) {
            console.error('❌ Failed to load analytics data:', error);
            this.showError('Failed to load analytics data');
        }
    }

    async getOverviewData(timeRange) {
        // Mock data - replace with real analytics queries
        const daysAgo = this.getDaysFromTimeRange(timeRange);
        
        return {
            totalRevenue: {
                value: 15750.50,
                change: '+12.5%',
                trend: 'positive'
            },
            totalCustomers: {
                value: 342,
                change: '+8.3%',
                trend: 'positive'
            },
            activePlans: {
                value: 12,
                change: '+2',
                trend: 'positive'
            },
            apiUsage: {
                value: 89650,
                change: '+15.2%',
                trend: 'positive'
            }
        };
    }

    async getSalesData(timeRange) {
        // Mock sales data
        return {
            chartData: this.generateMockChartData(timeRange, 'sales'),
            transactions: [
                { date: '2024-01-15', plan: 'Premium API', customer: '0x1234...5678', amount: '$99.99', status: 'completed' },
                { date: '2024-01-14', plan: 'Basic API', customer: '0x8765...4321', amount: '$29.99', status: 'completed' },
                { date: '2024-01-13', plan: 'Enterprise', customer: '0x9999...1111', amount: '$299.99', status: 'pending' },
            ]
        };
    }

    updateOverviewSection(data) {
        document.getElementById('totalRevenue').textContent = `$${data.totalRevenue.value.toLocaleString()}`;
        document.getElementById('revenueChange').textContent = data.totalRevenue.change;
        document.getElementById('revenueChange').className = `metric-change ${data.totalRevenue.trend}`;

        document.getElementById('totalCustomers').textContent = data.totalCustomers.value.toLocaleString();
        document.getElementById('customersChange').textContent = data.totalCustomers.change;
        document.getElementById('customersChange').className = `metric-change ${data.totalCustomers.trend}`;

        document.getElementById('activePlans').textContent = data.activePlans.value;
        document.getElementById('plansChange').textContent = data.activePlans.change;
        document.getElementById('plansChange').className = `metric-change ${data.activePlans.trend}`;

        document.getElementById('apiUsage').textContent = data.apiUsage.value.toLocaleString();
        document.getElementById('usageChange').textContent = data.apiUsage.change;
        document.getElementById('usageChange').className = `metric-change ${data.apiUsage.trend}`;
    }

    updateSalesSection(data) {
        // Update sales chart
        this.renderChart('salesChart', data.chartData, 'line');

        // Update sales table
        const tbody = document.getElementById('salesTableBody');
        tbody.innerHTML = data.transactions.map(tx => `
            <tr>
                <td>${tx.date}</td>
                <td>${tx.plan}</td>
                <td>${tx.customer}</td>
                <td>${tx.amount}</td>
                <td><span class="status-badge ${tx.status}">${tx.status}</span></td>
            </tr>
        `).join('');
    }

    renderChart(containerId, data, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Simple chart rendering - replace with real charting library
        container.innerHTML = `
            <div style="display: flex; align-items: end; height: 200px; gap: 10px; padding: 20px;">
                ${data.map((point, index) => `
                    <div style="
                        width: ${100 / data.length}%;
                        height: ${(point.value / Math.max(...data.map(p => p.value))) * 100}%;
                        background: var(--accent-color);
                        border-radius: 4px 4px 0 0;
                        position: relative;
                    ">
                        <div style="
                            position: absolute;
                            bottom: -30px;
                            left: 50%;
                            transform: translateX(-50%);
                            font-size: 12px;
                            color: var(--text-secondary);
                        ">${point.label}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    generateMockChartData(timeRange, type) {
        const days = this.getDaysFromTimeRange(timeRange);
        const data = [];
        
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            data.push({
                label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: Math.floor(Math.random() * 1000) + 100
            });
        }
        
        return data;
    }

    getDaysFromTimeRange(timeRange) {
        switch (timeRange) {
            case '7d': return 7;
            case '30d': return 30;
            case '90d': return 90;
            case '1y': return 365;
            default: return 30;
        }
    }

    startRealtimeUpdates() {
        setInterval(() => {
            this.updateRealtimeMetrics();
        }, this.analytics.updateInterval);
    }

    async updateRealtimeMetrics() {
        // Update real-time metrics
        const realtimeData = await this.getRealtimeData();
        this.updateRealtimeUI(realtimeData);
    }

    async getRealtimeData() {
        // Mock real-time data
        return {
            activeUsers: Math.floor(Math.random() * 50) + 10,
            currentRevenue: Math.floor(Math.random() * 1000) + 500,
            apiRequestsPerMinute: Math.floor(Math.random() * 100) + 20
        };
    }

    showError(message) {
        console.error('📊 Analytics Error:', message);
        // Show error UI
    }
}

// Export
window.BlicenceProducerAnalytics = BlicenceProducerAnalytics;
