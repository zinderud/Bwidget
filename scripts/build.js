// Build Script for Blicence Ecosystem
// Bundles and optimizes all source files

const fs = require('fs-extra');
const path = require('path');

class BlicenceBuildSystem {
    constructor() {
        this.srcDir = path.join(__dirname, '..', 'src');
        this.distDir = path.join(__dirname, '..', 'dist');
        this.config = require('../package.json').config;
        
        this.bundles = {
            // Core ecosystem bundle (everything included)
            'blicence-ecosystem-full.js': [
                'src/utils/theme-manager.js',
                'src/utils/event-manager.js',
                'src/core/blockchain-manager-v2.js',
                'src/core/service-access-layer.js',
                'src/widgets/blicence-widget-sdk.js',
                'src/widgets/customer-dashboard-widget.js',
                'src/widgets/producer-analytics-widget.js',
                'src/widgets/plan-management-widget.js',
                'src/blicence-ecosystem.js'
            ],
            
            // Sales widget only (lightweight)
            'blicence-sales-widget.js': [
                'src/utils/theme-manager.js',
                'src/utils/event-manager.js',
                'src/core/blockchain-manager-v2.js',
                'src/widgets/blicence-widget-sdk.js'
            ],
            
            // Customer dashboard bundle
            'blicence-customer-dashboard.js': [
                'src/utils/theme-manager.js',
                'src/utils/event-manager.js',
                'src/core/blockchain-manager-v2.js',
                'src/core/service-access-layer.js',
                'src/widgets/customer-dashboard-widget.js'
            ],
            
            // Producer tools bundle
            'blicence-producer-tools.js': [
                'src/utils/theme-manager.js',
                'src/utils/event-manager.js',
                'src/core/blockchain-manager-v2.js',
                'src/widgets/producer-analytics-widget.js',
                'src/widgets/plan-management-widget.js'
            ]
        };
    }

    async build() {
        console.log('🏗️  Starting Blicence Build Process...');
        
        try {
            // Clean dist directory
            await this.cleanDist();
            
            // Create bundles
            await this.createBundles();
            
            // Copy examples and docs
            await this.copyAssets();
            
            // Generate CDN structure
            await this.generateCDNStructure();
            
            console.log('✅ Build completed successfully!');
            
        } catch (error) {
            console.error('❌ Build failed:', error);
            process.exit(1);
        }
    }

    async cleanDist() {
        console.log('🧹 Cleaning dist directory...');
        await fs.emptyDir(this.distDir);
        
        // Create subdirectories
        await fs.ensureDir(path.join(this.distDir, 'bundles'));
        await fs.ensureDir(path.join(this.distDir, 'individual'));
        await fs.ensureDir(path.join(this.distDir, 'examples'));
        await fs.ensureDir(path.join(this.distDir, 'docs'));
    }

    async createBundles() {
        console.log('📦 Creating bundles...');
        
        for (const [bundleName, files] of Object.entries(this.bundles)) {
            console.log(`  Building ${bundleName}...`);
            
            let bundleContent = this.generateBundleHeader(bundleName);
            
            for (const file of files) {
                const filePath = path.join(__dirname, '..', file);
                
                if (await fs.pathExists(filePath)) {
                    const content = await fs.readFile(filePath, 'utf8');
                    const processedContent = this.processFileContent(content, file);
                    
                    bundleContent += `\n// === ${file} ===\n`;
                    bundleContent += processedContent;
                    bundleContent += '\n';
                } else {
                    console.warn(`⚠️  File not found: ${file}`);
                }
            }
            
            bundleContent += this.generateBundleFooter(bundleName);
            
            // Write bundle
            const bundlePath = path.join(this.distDir, 'bundles', bundleName);
            await fs.writeFile(bundlePath, bundleContent);
            
            console.log(`    ✅ ${bundleName} created (${(bundleContent.length / 1024).toFixed(1)}KB)`);
        }
    }

    async copyAssets() {
        console.log('📄 Copying assets...');
        
        // Copy individual source files
        await fs.copy(this.srcDir, path.join(this.distDir, 'individual'));
        
        // Copy examples
        const examplesDir = path.join(__dirname, '..', 'examples');
        if (await fs.pathExists(examplesDir)) {
            await fs.copy(examplesDir, path.join(this.distDir, 'examples'));
        }
        
        // Copy docs
        const docsDir = path.join(__dirname, '..', 'docs');
        if (await fs.pathExists(docsDir)) {
            await fs.copy(docsDir, path.join(this.distDir, 'docs'));
        }
        
        // Copy README and LICENSE
        await fs.copy(path.join(__dirname, '..', 'README.md'), path.join(this.distDir, 'README.md'));
        await fs.copy(path.join(__dirname, '..', 'LICENSE'), path.join(this.distDir, 'LICENSE'));
    }

    async generateCDNStructure() {
        console.log('🌐 Generating CDN structure...');
        
        const cdnStructure = {
            version: this.config.cdn.version,
            files: {},
            bundles: {},
            examples: [],
            docs: []
        };

        // Index bundles
        for (const bundleName of Object.keys(this.bundles)) {
            const bundlePath = path.join(this.distDir, 'bundles', bundleName);
            const stats = await fs.stat(bundlePath);
            
            cdnStructure.bundles[bundleName] = {
                url: `${this.config.cdn.base}/bundles/${bundleName}`,
                size: stats.size,
                modified: stats.mtime
            };
        }

        // Index individual files
        const indexFiles = async (dir, baseUrl) => {
            const files = await fs.readdir(dir, { withFileTypes: true });
            
            for (const file of files) {
                if (file.isDirectory()) {
                    await indexFiles(
                        path.join(dir, file.name),
                        `${baseUrl}/${file.name}`
                    );
                } else if (file.name.endsWith('.js')) {
                    const filePath = path.join(dir, file.name);
                    const stats = await fs.stat(filePath);
                    
                    cdnStructure.files[`${baseUrl}/${file.name}`] = {
                        size: stats.size,
                        modified: stats.mtime
                    };
                }
            }
        };

        await indexFiles(path.join(this.distDir, 'individual'), '/individual');

        // Write CDN index
        await fs.writeFile(
            path.join(this.distDir, 'cdn-index.json'),
            JSON.stringify(cdnStructure, null, 2)
        );

        // Generate integration HTML
        await this.generateIntegrationHTML();
    }

    async generateIntegrationHTML() {
        const integrationHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blicence Ecosystem - CDN Integration</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .code-block { background: #f6f8fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .bundle-option { margin: 20px 0; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px; }
        .bundle-size { color: #6a737d; font-size: 14px; }
    </style>
</head>
<body>
    <h1>🚀 Blicence Ecosystem CDN Integration</h1>
    <p>Choose the bundle that best fits your needs:</p>

    <div class="bundle-option">
        <h3>Complete Ecosystem (Recommended)</h3>
        <p>Includes all widgets and features - best for full Producer platforms</p>
        <div class="bundle-size">~150KB minified</div>
        <div class="code-block">
&lt;script src="${this.config.cdn.base}/bundles/blicence-ecosystem-full.min.js">&lt;/script>
&lt;script>
const ecosystem = new BlicenceEcosystem({
    producerAddress: 'YOUR_ADDRESS',
    network: 'polygon'
});
&lt;/script>
        </div>
    </div>

    <div class="bundle-option">
        <h3>Sales Widget Only</h3>
        <p>Lightweight bundle for sales widget only</p>
        <div class="bundle-size">~60KB minified</div>
        <div class="code-block">
&lt;script src="${this.config.cdn.base}/bundles/blicence-sales-widget.min.js">&lt;/script>
&lt;script>
const widget = new BlicenceWidgetSDK({
    producerAddress: 'YOUR_ADDRESS',
    network: 'polygon'
});
&lt;/script>
        </div>
    </div>

    <div class="bundle-option">
        <h3>Customer Dashboard</h3>
        <p>For customer-facing dashboard and self-service portals</p>
        <div class="bundle-size">~80KB minified</div>
        <div class="code-block">
&lt;script src="${this.config.cdn.base}/bundles/blicence-customer-dashboard.min.js">&lt;/script>
&lt;script>
const dashboard = new BlicenceCustomerDashboard({
    producerAddress: 'YOUR_ADDRESS',
    customerAddress: 'CUSTOMER_ADDRESS'
});
&lt;/script>
        </div>
    </div>

    <div class="bundle-option">
        <h3>Producer Tools</h3>
        <p>Analytics and plan management tools for Producers</p>
        <div class="bundle-size">~90KB minified</div>
        <div class="code-block">
&lt;script src="${this.config.cdn.base}/bundles/blicence-producer-tools.min.js">&lt;/script>
&lt;script>
const analytics = new BlicenceProducerAnalytics({
    producerAddress: 'YOUR_ADDRESS'
});
const planMgmt = new BlicencePlanManagement({
    producerAddress: 'YOUR_ADDRESS'
});
&lt;/script>
        </div>
    </div>

    <h2>Individual Files</h2>
    <p>For advanced users who want to load specific components:</p>
    <div class="code-block">
&lt;!-- Core Components -->
&lt;script src="${this.config.cdn.base}/individual/utils/theme-manager.js">&lt;/script>
&lt;script src="${this.config.cdn.base}/individual/utils/event-manager.js">&lt;/script>
&lt;script src="${this.config.cdn.base}/individual/core/blockchain-manager-v2.js">&lt;/script>

&lt;!-- Widgets (choose what you need) -->
&lt;script src="${this.config.cdn.base}/individual/widgets/blicence-widget-sdk.js">&lt;/script>
&lt;script src="${this.config.cdn.base}/individual/widgets/customer-dashboard-widget.js">&lt;/script>

&lt;!-- Main Ecosystem -->
&lt;script src="${this.config.cdn.base}/individual/blicence-ecosystem.js">&lt;/script>
    </div>

    <h2>Version Information</h2>
    <p>Current Version: <strong>${this.config.cdn.version}</strong></p>
    <p>Build Date: <strong>${new Date().toISOString()}</strong></p>
</body>
</html>`;

        await fs.writeFile(
            path.join(this.distDir, 'integration.html'),
            integrationHTML
        );
    }

    generateBundleHeader(bundleName) {
        return `/*!
 * ${bundleName}
 * Blicence Producer Ecosystem v${this.config.cdn.version}
 * https://github.com/blicence/Bwidget
 * 
 * Built: ${new Date().toISOString()}
 * License: MIT
 */

(function(window, document) {
    'use strict';
    
    // Bundle: ${bundleName}
    console.log('🚀 Loading Blicence ${bundleName}...');
`;
    }

    generateBundleFooter(bundleName) {
        return `
    // Bundle initialization complete
    console.log('✅ Blicence ${bundleName} loaded successfully');
    
    // Emit ready event
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('blicence:loaded', {
            detail: { bundle: '${bundleName}', version: '${this.config.cdn.version}' }
        }));
    }
    
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});`;
    }

    processFileContent(content, filePath) {
        // No processing - just return content as-is
        // This preserves all original structure and syntax
        return content.trim();
    }

    extractClassName(content) {
        const classMatch = content.match(/class\s+(\w+)/);
        return classMatch ? classMatch[1] : null;
    }
}

// Run build if called directly
if (require.main === module) {
    const builder = new BlicenceBuildSystem();
    builder.build();
}

module.exports = BlicenceBuildSystem;
