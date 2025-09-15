// Event System for Blicence Ecosystem
// Centralized event management and communication between widgets

class BlicenceEventManager {
    constructor() {
        this.eventEmitter = new EventTarget();
        this.subscriptions = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 100;
        
        // Widget communication channels
        this.channels = {
            purchase: 'blicence:purchase',
            subscription: 'blicence:subscription',
            analytics: 'blicence:analytics',
            theme: 'blicence:theme',
            error: 'blicence:error',
            notification: 'blicence:notification'
        };

        console.log('📡 Event Manager initialized');
    }

    // Subscribe to events
    on(eventName, callback, options = {}) {
        const wrappedCallback = (event) => {
            try {
                callback(event.detail, event);
            } catch (error) {
                console.error(`Event callback error for ${eventName}:`, error);
                this.emit('error', { error: error.message, event: eventName });
            }
        };

        this.eventEmitter.addEventListener(eventName, wrappedCallback, options);

        // Track subscription for cleanup
        if (!this.subscriptions.has(eventName)) {
            this.subscriptions.set(eventName, []);
        }
        this.subscriptions.get(eventName).push({
            original: callback,
            wrapped: wrappedCallback,
            options
        });

        return {
            unsubscribe: () => this.off(eventName, callback)
        };
    }

    // Unsubscribe from events
    off(eventName, callback) {
        const subs = this.subscriptions.get(eventName);
        if (!subs) return;

        const index = subs.findIndex(sub => sub.original === callback);
        if (index !== -1) {
            const sub = subs[index];
            this.eventEmitter.removeEventListener(eventName, sub.wrapped);
            subs.splice(index, 1);
        }
    }

    // Emit events
    emit(eventName, data = {}, options = {}) {
        const eventData = {
            timestamp: Date.now(),
            source: options.source || 'system',
            id: this.generateEventId(),
            ...data
        };

        // Add to history
        this.addToHistory(eventName, eventData);

        // Emit event
        const customEvent = new CustomEvent(eventName, {
            detail: eventData,
            bubbles: options.bubbles || false,
            cancelable: options.cancelable || false
        });

        this.eventEmitter.dispatchEvent(customEvent);

        // Debug logging
        if (options.debug || this.isDebugMode()) {
            console.log(`📡 Event emitted: ${eventName}`, eventData);
        }

        return customEvent;
    }

    // Purchase events
    emitPurchaseStarted(data) {
        return this.emit(this.channels.purchase + ':started', {
            planId: data.planId,
            customerAddress: data.customerAddress,
            amount: data.amount,
            currency: data.currency || 'USD'
        }, { source: 'sales-widget' });
    }

    emitPurchaseCompleted(data) {
        return this.emit(this.channels.purchase + ':completed', {
            planId: data.planId,
            customerAddress: data.customerAddress,
            transactionHash: data.transactionHash,
            amount: data.amount,
            subscriptionId: data.subscriptionId
        }, { source: 'sales-widget' });
    }

    emitPurchaseFailed(data) {
        return this.emit(this.channels.purchase + ':failed', {
            planId: data.planId,
            customerAddress: data.customerAddress,
            error: data.error,
            errorCode: data.errorCode
        }, { source: 'sales-widget' });
    }

    // Subscription events
    emitSubscriptionCreated(data) {
        return this.emit(this.channels.subscription + ':created', {
            subscriptionId: data.subscriptionId,
            planId: data.planId,
            customerAddress: data.customerAddress,
            startDate: data.startDate,
            endDate: data.endDate
        }, { source: 'customer-dashboard' });
    }

    emitSubscriptionUpdated(data) {
        return this.emit(this.channels.subscription + ':updated', {
            subscriptionId: data.subscriptionId,
            changes: data.changes,
            previousState: data.previousState
        }, { source: 'customer-dashboard' });
    }

    emitSubscriptionCancelled(data) {
        return this.emit(this.channels.subscription + ':cancelled', {
            subscriptionId: data.subscriptionId,
            reason: data.reason,
            refundAmount: data.refundAmount
        }, { source: 'customer-dashboard' });
    }

    // Analytics events
    emitAnalyticsEvent(category, action, data = {}) {
        return this.emit(this.channels.analytics, {
            category,
            action,
            value: data.value,
            label: data.label,
            customData: data.customData
        }, { source: 'analytics' });
    }

    // Theme events
    emitThemeChanged(theme) {
        return this.emit(this.channels.theme + ':changed', {
            theme,
            previousTheme: this.previousTheme
        }, { source: 'theme-manager' });
    }

    // Error events
    emitError(error, context = {}) {
        return this.emit(this.channels.error, {
            message: error.message || error,
            stack: error.stack,
            context,
            severity: context.severity || 'error'
        }, { source: context.source || 'system' });
    }

    // Notification events
    emitNotification(type, message, options = {}) {
        return this.emit(this.channels.notification, {
            type, // success, error, warning, info
            message,
            title: options.title,
            duration: options.duration || 5000,
            actions: options.actions || []
        }, { source: 'notification-system' });
    }

    // Event history management
    addToHistory(eventName, data) {
        this.eventHistory.push({
            eventName,
            data,
            timestamp: Date.now()
        });

        // Trim history if it gets too large
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
        }
    }

    getEventHistory(filter = {}) {
        let history = [...this.eventHistory];

        if (filter.eventName) {
            history = history.filter(event => 
                event.eventName.includes(filter.eventName)
            );
        }

        if (filter.since) {
            history = history.filter(event => 
                event.timestamp >= filter.since
            );
        }

        if (filter.source) {
            history = history.filter(event => 
                event.data.source === filter.source
            );
        }

        return history;
    }

    // Widget registration and communication
    registerWidget(widgetName, widget) {
        this.emit('widget:registered', {
            widgetName,
            widget: widget.constructor.name,
            capabilities: widget.getCapabilities ? widget.getCapabilities() : []
        }, { source: 'ecosystem' });

        // Setup widget-specific event handlers
        this.setupWidgetEvents(widgetName, widget);
    }

    setupWidgetEvents(widgetName, widget) {
        // Purchase events for sales widget
        if (widgetName === 'sales' && widget.on) {
            widget.on('purchase_started', (data) => {
                this.emitPurchaseStarted(data);
            });

            widget.on('purchase_completed', (data) => {
                this.emitPurchaseCompleted(data);
                this.emitNotification('success', 'Purchase completed successfully!');
            });

            widget.on('purchase_failed', (data) => {
                this.emitPurchaseFailed(data);
                this.emitNotification('error', `Purchase failed: ${data.error}`);
            });
        }

        // Subscription events for customer dashboard
        if (widgetName === 'dashboard' && widget.on) {
            widget.on('subscription_updated', (data) => {
                this.emitSubscriptionUpdated(data);
            });

            widget.on('subscription_cancelled', (data) => {
                this.emitSubscriptionCancelled(data);
                this.emitNotification('info', 'Subscription cancelled');
            });
        }

        // Analytics events
        if (widget.on) {
            widget.on('analytics_event', (data) => {
                this.emitAnalyticsEvent(data.category, data.action, data);
            });
        }
    }

    // Cross-widget communication
    sendToWidget(widgetName, message, data) {
        return this.emit(`widget:${widgetName}:${message}`, data, {
            source: 'widget-communication'
        });
    }

    // Event batching for performance
    batch(events) {
        const batchId = this.generateEventId();
        
        return this.emit('batch:started', { batchId, count: events.length })
            .then(() => {
                return Promise.all(events.map(({ event, data }) => 
                    this.emit(event, { ...data, batchId })
                ));
            })
            .then(() => {
                return this.emit('batch:completed', { batchId });
            });
    }

    // Utility methods
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    isDebugMode() {
        return localStorage.getItem('blicence-debug') === 'true' || 
               window.location.search.includes('debug=true');
    }

    // Cleanup
    removeAllListeners(eventName = null) {
        if (eventName) {
            const subs = this.subscriptions.get(eventName);
            if (subs) {
                subs.forEach(sub => {
                    this.eventEmitter.removeEventListener(eventName, sub.wrapped);
                });
                this.subscriptions.delete(eventName);
            }
        } else {
            this.subscriptions.forEach((subs, eventName) => {
                subs.forEach(sub => {
                    this.eventEmitter.removeEventListener(eventName, sub.wrapped);
                });
            });
            this.subscriptions.clear();
        }
    }

    destroy() {
        this.removeAllListeners();
        this.eventHistory = [];
        console.log('📡 Event Manager destroyed');
    }
}

// Create global event manager instance
if (typeof window !== 'undefined') {
    window.BlicenceEventManager = new BlicenceEventManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlicenceEventManager;
}
