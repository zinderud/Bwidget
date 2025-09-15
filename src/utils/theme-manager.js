// Theme System for Blicence Ecosystem
// Centralized theme management with CSS variables

class BlicenceThemeManager {
    constructor() {
        this.themes = {
            light: {
                // Background colors
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f8fafc',
                '--bg-tertiary': '#e2e8f0',
                '--bg-overlay': 'rgba(255, 255, 255, 0.95)',
                
                // Text colors
                '--text-primary': '#1a202c',
                '--text-secondary': '#4a5568',
                '--text-muted': '#718096',
                '--text-inverse': '#ffffff',
                
                // Border colors
                '--border-color': '#e2e8f0',
                '--border-focus': '#3b82f6',
                '--border-error': '#ef4444',
                '--border-success': '#10b981',
                
                // Accent colors
                '--accent-color': '#667eea',
                '--accent-hover': '#5a67d8',
                '--accent-light': 'rgba(102, 126, 234, 0.1)',
                
                // Status colors
                '--success-color': '#10b981',
                '--warning-color': '#f59e0b',
                '--danger-color': '#ef4444',
                '--info-color': '#3b82f6',
                
                // Component specific
                '--card-shadow': '0 4px 20px rgba(0, 0, 0, 0.1)',
                '--modal-shadow': '0 10px 40px rgba(0, 0, 0, 0.2)',
                '--button-shadow': '0 2px 8px rgba(0, 0, 0, 0.1)'
            },
            
            dark: {
                // Background colors
                '--bg-primary': '#1a202c',
                '--bg-secondary': '#2d3748',
                '--bg-tertiary': '#4a5568',
                '--bg-overlay': 'rgba(26, 32, 44, 0.95)',
                
                // Text colors
                '--text-primary': '#f7fafc',
                '--text-secondary': '#a0aec0',
                '--text-muted': '#718096',
                '--text-inverse': '#1a202c',
                
                // Border colors
                '--border-color': '#4a5568',
                '--border-focus': '#63b3ed',
                '--border-error': '#fc8181',
                '--border-success': '#68d391',
                
                // Accent colors
                '--accent-color': '#9f7aea',
                '--accent-hover': '#805ad5',
                '--accent-light': 'rgba(159, 122, 234, 0.1)',
                
                // Status colors
                '--success-color': '#68d391',
                '--warning-color': '#fbd38d',
                '--danger-color': '#fc8181',
                '--info-color': '#63b3ed',
                
                // Component specific
                '--card-shadow': '0 4px 20px rgba(0, 0, 0, 0.3)',
                '--modal-shadow': '0 10px 40px rgba(0, 0, 0, 0.5)',
                '--button-shadow': '0 2px 8px rgba(0, 0, 0, 0.3)'
            },
            
            auto: {
                // Auto theme uses CSS prefers-color-scheme
                // Will be dynamically set based on system preference
            }
        };
        
        this.currentTheme = 'light';
        this.customThemes = new Map();
        
        // Initialize theme detection
        this.detectSystemTheme();
        this.setupThemeListeners();
    }

    // Apply theme to document or specific element
    applyTheme(themeName, element = document.documentElement) {
        let theme = this.themes[themeName];
        
        if (!theme && this.customThemes.has(themeName)) {
            theme = this.customThemes.get(themeName);
        }
        
        if (!theme) {
            console.warn(`Theme ${themeName} not found, falling back to light theme`);
            theme = this.themes.light;
        }

        // Handle auto theme
        if (themeName === 'auto') {
            const systemTheme = this.getSystemTheme();
            theme = this.themes[systemTheme];
        }

        // Apply CSS variables
        Object.entries(theme).forEach(([property, value]) => {
            element.style.setProperty(property, value);
        });

        // Set data attribute for theme-specific styling
        element.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;

        console.log(`🎨 Applied theme: ${themeName}`);
    }

    // Get current system theme preference
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    // Detect and apply initial theme
    detectSystemTheme() {
        const savedTheme = localStorage.getItem('blicence-theme');
        if (savedTheme && this.themes[savedTheme]) {
            this.applyTheme(savedTheme);
        } else {
            this.applyTheme('auto');
        }
    }

    // Setup listeners for system theme changes
    setupThemeListeners() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }

    // Register a custom theme
    registerTheme(name, themeConfig) {
        // Merge with base theme to ensure all variables are defined
        const baseTheme = this.themes.light;
        const customTheme = { ...baseTheme, ...themeConfig };
        
        this.customThemes.set(name, customTheme);
        console.log(`🎨 Registered custom theme: ${name}`);
    }

    // Get theme configuration
    getTheme(name) {
        if (this.themes[name]) {
            return this.themes[name];
        }
        if (this.customThemes.has(name)) {
            return this.customThemes.get(name);
        }
        return null;
    }

    // Set theme and save preference
    setTheme(themeName, savePreference = true) {
        this.applyTheme(themeName);
        
        if (savePreference) {
            localStorage.setItem('blicence-theme', themeName);
        }

        // Emit theme change event
        window.dispatchEvent(new CustomEvent('blicence:theme-changed', {
            detail: { theme: themeName }
        }));
    }

    // Generate theme CSS for injection
    generateThemeCSS(themeName = this.currentTheme) {
        const theme = this.getTheme(themeName);
        if (!theme) return '';

        const cssVariables = Object.entries(theme)
            .map(([property, value]) => `  ${property}: ${value};`)
            .join('\n');

        return `:root {\n${cssVariables}\n}`;
    }

    // Create theme toggle component
    createThemeToggle(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Theme toggle container ${containerId} not found`);
            return;
        }

        const config = {
            showLabel: options.showLabel !== false,
            position: options.position || 'inline',
            themes: options.themes || ['light', 'dark', 'auto'],
            ...options
        };

        container.innerHTML = `
            <div class="blicence-theme-toggle" data-position="${config.position}">
                ${config.showLabel ? '<label class="theme-label">Theme:</label>' : ''}
                <select class="theme-selector">
                    ${config.themes.map(theme => `
                        <option value="${theme}" ${theme === this.currentTheme ? 'selected' : ''}>
                            ${this.getThemeDisplayName(theme)}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <style>
                .blicence-theme-toggle {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .blicence-theme-toggle[data-position="floating"] {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    background: var(--bg-primary);
                    padding: 8px 12px;
                    border-radius: 6px;
                    box-shadow: var(--card-shadow);
                    border: 1px solid var(--border-color);
                }
                
                .theme-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-secondary);
                    margin: 0;
                }
                
                .theme-selector {
                    padding: 4px 8px;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    font-size: 14px;
                    cursor: pointer;
                }
                
                .theme-selector:focus {
                    outline: none;
                    border-color: var(--border-focus);
                }
            </style>
        `;

        // Add event listener
        const selector = container.querySelector('.theme-selector');
        selector.addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });
    }

    getThemeDisplayName(theme) {
        const names = {
            light: '☀️ Light',
            dark: '🌙 Dark',
            auto: '🔄 Auto'
        };
        return names[theme] || theme;
    }

    // Widget-specific theme application
    applyWidgetTheme(widget, themeName = this.currentTheme) {
        const widgetElement = widget.container || widget.element;
        if (widgetElement) {
            this.applyTheme(themeName, widgetElement);
        }
    }
}

// Create global theme manager instance
if (typeof window !== 'undefined') {
    window.BlicenceThemeManager = new BlicenceThemeManager();
    
    // Auto-apply theme on load
    document.addEventListener('DOMContentLoaded', () => {
        window.BlicenceThemeManager.detectSystemTheme();
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlicenceThemeManager;
}
