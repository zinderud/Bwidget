// Minification Script for Blicence Ecosystem
// Minifies JavaScript files and creates .min.js versions

const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');

class BlicenceMinifier {
    constructor() {
        this.distDir = path.join(__dirname, '..', 'dist');
        this.config = require('../package.json').config;
        
        this.terserOptions = {
            compress: {
                drop_console: false, // Keep console logs for debugging
                drop_debugger: true,
                pure_funcs: ['console.debug'],
                passes: 2
            },
            mangle: {
                reserved: [
                    // Preserve class names for external API
                    'BlicenceEcosystem',
                    'BlicenceWidgetSDK', 
                    'BlicenceCustomerDashboard',
                    'BlicenceProducerAnalytics',
                    'BlicencePlanManagement',
                    'BlicenceServiceAccess',
                    'BlicenceBlockchainManager',
                    'BlicenceThemeManager',
                    'BlicenceEventManager'
                ]
            },
            format: {
                comments: function(node, comment) {
                    // Preserve license comments
                    return comment.value.includes('Blicence') || 
                           comment.value.includes('License') ||
                           comment.value.includes('MIT');
                }
            },
            sourceMap: this.config.build.sourcemap
        };
    }

    async minify() {
        console.log('🗜️  Starting minification process...');
        
        try {
            // Minify bundles
            await this.minifyBundles();
            
            // Minify individual files
            await this.minifyIndividualFiles();
            
            // Generate compression report
            await this.generateCompressionReport();
            
            console.log('✅ Minification completed successfully!');
            
        } catch (error) {
            console.error('❌ Minification failed:', error);
            process.exit(1);
        }
    }

    async minifyBundles() {
        console.log('📦 Minifying bundles...');
        
        const bundlesDir = path.join(this.distDir, 'bundles');
        const bundleFiles = await fs.readdir(bundlesDir);
        
        for (const file of bundleFiles) {
            if (file.endsWith('.js') && !file.endsWith('.min.js')) {
                await this.minifyFile(
                    path.join(bundlesDir, file),
                    path.join(bundlesDir, file.replace('.js', '.min.js'))
                );
            }
        }
    }

    async minifyIndividualFiles() {
        console.log('📄 Minifying individual files...');
        
        const individualDir = path.join(this.distDir, 'individual');
        await this.minifyDirectory(individualDir);
    }

    async minifyDirectory(dir) {
        const items = await fs.readdir(dir, { withFileTypes: true });
        
        for (const item of items) {
            const itemPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
                await this.minifyDirectory(itemPath);
            } else if (item.name.endsWith('.js') && !item.name.endsWith('.min.js')) {
                const minPath = itemPath.replace('.js', '.min.js');
                await this.minifyFile(itemPath, minPath);
            }
        }
    }

    async minifyFile(inputPath, outputPath) {
        try {
            const inputCode = await fs.readFile(inputPath, 'utf8');
            const originalSize = inputCode.length;
            
            const result = await minify(inputCode, this.terserOptions);
            
            if (result.error) {
                throw result.error;
            }
            
            await fs.writeFile(outputPath, result.code);
            
            // Write source map if enabled
            if (this.config.build.sourcemap && result.map) {
                await fs.writeFile(outputPath + '.map', result.map);
            }
            
            const minifiedSize = result.code.length;
            const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
            
            const fileName = path.basename(inputPath);
            console.log(`    ✅ ${fileName} → ${(originalSize/1024).toFixed(1)}KB → ${(minifiedSize/1024).toFixed(1)}KB (-${reduction}%)`);
            
        } catch (error) {
            console.error(`    ❌ Failed to minify ${path.basename(inputPath)}:`, error.message);
        }
    }

    async generateCompressionReport() {
        console.log('📊 Generating compression report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            bundles: {},
            individual: {},
            summary: {
                totalOriginalSize: 0,
                totalMinifiedSize: 0,
                totalReduction: 0,
                filesProcessed: 0
            }
        };

        // Analyze bundles
        const bundlesDir = path.join(this.distDir, 'bundles');
        const bundleFiles = await fs.readdir(bundlesDir);
        
        for (const file of bundleFiles) {
            if (file.endsWith('.js')) {
                const filePath = path.join(bundlesDir, file);
                const stats = await fs.stat(filePath);
                
                const category = file.endsWith('.min.js') ? 'minified' : 'original';
                const baseName = file.replace('.min.js', '').replace('.js', '');
                
                if (!report.bundles[baseName]) {
                    report.bundles[baseName] = {};
                }
                
                report.bundles[baseName][category] = {
                    size: stats.size,
                    sizeKB: Math.round(stats.size / 1024 * 10) / 10
                };
            }
        }

        // Calculate reductions for bundles
        for (const [name, bundle] of Object.entries(report.bundles)) {
            if (bundle.original && bundle.minified) {
                bundle.reduction = Math.round((bundle.original.size - bundle.minified.size) / bundle.original.size * 100 * 10) / 10;
                report.summary.totalOriginalSize += bundle.original.size;
                report.summary.totalMinifiedSize += bundle.minified.size;
                report.summary.filesProcessed += 1;
            }
        }

        if (report.summary.totalOriginalSize > 0) {
            report.summary.totalReduction = Math.round(
                (report.summary.totalOriginalSize - report.summary.totalMinifiedSize) / 
                report.summary.totalOriginalSize * 100 * 10
            ) / 10;
        }

        // Write report
        await fs.writeFile(
            path.join(this.distDir, 'compression-report.json'),
            JSON.stringify(report, null, 2)
        );

        // Generate human-readable report
        await this.generateHumanReadableReport(report);

        console.log(`📊 Compression Summary:`);
        console.log(`    Files processed: ${report.summary.filesProcessed}`);
        console.log(`    Total original size: ${(report.summary.totalOriginalSize/1024).toFixed(1)}KB`);
        console.log(`    Total minified size: ${(report.summary.totalMinifiedSize/1024).toFixed(1)}KB`);
        console.log(`    Overall reduction: ${report.summary.totalReduction}%`);
    }

    async generateHumanReadableReport(report) {
        let htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blicence Build Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .summary { background: #f6f8fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .bundle { margin: 20px 0; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px; }
        .size-bar { height: 20px; background: #e1e4e8; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .size-bar-fill { height: 100%; background: #28a745; transition: width 0.3s ease; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .stat { text-align: center; padding: 15px; background: #f6f8fa; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #28a745; }
        .stat-label { color: #6a737d; font-size: 14px; }
    </style>
</head>
<body>
    <h1>🚀 Blicence Build Report</h1>
    <p>Generated: ${report.timestamp}</p>

    <div class="summary">
        <h2>📊 Summary</h2>
        <div class="stats">
            <div class="stat">
                <div class="stat-value">${report.summary.filesProcessed}</div>
                <div class="stat-label">Files Processed</div>
            </div>
            <div class="stat">
                <div class="stat-value">${(report.summary.totalOriginalSize/1024).toFixed(1)}KB</div>
                <div class="stat-label">Original Size</div>
            </div>
            <div class="stat">
                <div class="stat-value">${(report.summary.totalMinifiedSize/1024).toFixed(1)}KB</div>
                <div class="stat-label">Minified Size</div>
            </div>
            <div class="stat">
                <div class="stat-value">${report.summary.totalReduction}%</div>
                <div class="stat-label">Size Reduction</div>
            </div>
        </div>
    </div>

    <h2>📦 Bundle Details</h2>`;

        for (const [name, bundle] of Object.entries(report.bundles)) {
            if (bundle.original && bundle.minified) {
                const reductionPercent = 100 - (bundle.minified.size / bundle.original.size * 100);
                
                htmlReport += `
    <div class="bundle">
        <h3>${name}</h3>
        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>Original: ${bundle.original.sizeKB}KB</span>
            <span>Minified: ${bundle.minified.sizeKB}KB</span>
            <span style="color: #28a745; font-weight: bold;">-${bundle.reduction}%</span>
        </div>
        <div class="size-bar">
            <div class="size-bar-fill" style="width: ${100 - reductionPercent}%;"></div>
        </div>
    </div>`;
            }
        }

        htmlReport += `
    <h2>🔗 CDN Links</h2>
    <p>Use these URLs for production deployment:</p>
    <ul>`;

        for (const bundleName of Object.keys(report.bundles)) {
            htmlReport += `
        <li><code>https://cdn.blicence.com/bundles/${bundleName}.min.js</code></li>`;
        }

        htmlReport += `
    </ul>

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e4e8; color: #6a737d;">
        <p>Blicence Producer Ecosystem v${require('../package.json').version}</p>
    </footer>
</body>
</html>`;

        await fs.writeFile(
            path.join(this.distDir, 'build-report.html'),
            htmlReport
        );
    }
}

// Run minifier if called directly
if (require.main === module) {
    const minifier = new BlicenceMinifier();
    minifier.minify();
}

module.exports = BlicenceMinifier;
