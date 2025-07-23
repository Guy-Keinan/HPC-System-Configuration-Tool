import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ConfigurationStateService, ConfigurationData, FinalConfiguration } from '../../services/configuration-state.service';
import { PricingService, PriceResponse } from '../../services/pricing.service';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-step4-review-generate',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './step4-review-generate.component.html',
    styleUrls: ['./step4-review-generate.component.scss']
})
export class Step4ReviewGenerateComponent implements OnInit, OnDestroy {

    configuration: ConfigurationData | null = null;
    isGenerating = false;
    isExporting = false;
    hasConfigChanged = true;

    // Pricing state
    currentPrice: PriceResponse | null = null;
    isPriceLoading = false;
    priceError: string | null = null;

    // Subscriptions
    private subscriptions: Subscription[] = [];

    // For template access
    getCurrentTimestamp(): number {
        return Date.now();
    }

    constructor(
        private http: HttpClient,
        private configService: ConfigurationStateService,
        private pricingService: PricingService
    ) { }

    ngOnInit() {
        this.loadConfiguration();
        this.setupPricingSubscription();

        // Subscribe to configuration changes
        this.configService.configuration$.subscribe(config => {
            this.configuration = config;
            this.hasConfigChanged = this.configService.hasConfigurationChanged();

            // Load pricing when configuration changes
            this.loadPricingData();
        });
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    private setupPricingSubscription() {
        // Subscribe to pricing updates
        const priceSub = this.pricingService.currentPrice$.subscribe(price => {
            this.currentPrice = price;
        });
        this.subscriptions.push(priceSub);
    }

    private loadConfiguration() {
        this.configuration = this.configService.getCurrentConfiguration();
        this.hasConfigChanged = this.configService.hasConfigurationChanged();
        console.log('Final configuration for review:', this.configuration);
        console.log('Configuration changed since last generation:', this.hasConfigChanged);

        // Load pricing for current configuration
        this.loadPricingData();
    }

    private loadPricingData() {
        if (this.configuration?.step1?.selectedNodes) {
            this.fetchPricing(this.configuration.step1.selectedNodes);
        }
    }

    private fetchPricing(nodesCount: number) {
        this.isPriceLoading = true;
        this.priceError = null;

        const priceSub = this.pricingService.getPriceByNodes(nodesCount).subscribe({
            next: (price) => {
                this.isPriceLoading = false;
                console.log(`✅ Price loaded for Step 4: ${nodesCount} nodes = $${price.price_usd}`);
            },
            error: (error) => {
                this.isPriceLoading = false;
                this.priceError = 'Failed to load pricing information';
                console.error('Error fetching price for Step 4:', error);
            }
        });

        this.subscriptions.push(priceSub);
    }

    // Helper methods for display
    get systemConfiguration() {
        return this.configuration?.step1;
    }

    get powerConfiguration() {
        return this.configuration?.step2;
    }

    get storageConfiguration() {
        return this.configuration?.step3;
    }

    get isConfigurationComplete() {
        return !!(
            this.configuration?.step1 &&
            this.configuration?.step2 &&
            this.configuration?.step3
        );
    }

    // Pricing helper methods
    get displayPrice(): string {
        if (this.isPriceLoading) return 'Loading...';
        if (this.priceError) return 'Error loading price';
        if (this.currentPrice) return `$${this.currentPrice.price_usd.toLocaleString()}`;
        return 'Price not available';
    }

    get formattedPrice(): string {
        if (this.currentPrice) {
            return `$${this.currentPrice.price_usd.toLocaleString()}.00`;
        }
        return '$0.00';
    }

    // Navigation
    onPrevious() {
        this.configService.navigateToStep(3);
    }

    onEditStep(step: number) {
        this.configService.navigateToStep(step);
    }

    // Export functions
    async onExportJSON() {
        if (!this.isConfigurationComplete) return;

        this.isExporting = true;

        try {
            const finalConfig: FinalConfiguration = this.configService.getFinalConfiguration();

            // Add pricing information to export
            if (this.currentPrice) {
                finalConfig.pricing = {
                    total_price_usd: this.currentPrice.price_usd,
                    currency: this.currentPrice.currency,
                    nodes_count: this.currentPrice.nodes_count,
                    calculated_at: new Date().toISOString()
                };
            }

            const jsonStr = JSON.stringify(finalConfig, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `hpc-configuration-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            console.log('JSON exported successfully with pricing data');
        } catch (error) {
            console.error('Failed to export JSON:', error);
        } finally {
            this.isExporting = false;
        }
    }

    async onExportPDF() {
        if (!this.isConfigurationComplete) return;

        this.isExporting = true;

        try {
            // TODO: Implement PDF generation
            // For now, we'll just show an alert
            alert('PDF export functionality will be implemented soon!');
            console.log('PDF export requested');
        } catch (error) {
            console.error('Failed to export PDF:', error);
        } finally {
            this.isExporting = false;
        }
    }

    // Generate and save configuration
    async onGenerateConfiguration() {
        if (!this.isConfigurationComplete) return;

        this.isGenerating = true;

        try {
            const finalConfig: FinalConfiguration = this.configService.getFinalConfiguration();

            // Add pricing information to the configuration
            if (this.currentPrice) {
                finalConfig.pricing = {
                    total_price_usd: this.currentPrice.price_usd,
                    currency: this.currentPrice.currency,
                    nodes_count: this.currentPrice.nodes_count,
                    calculated_at: new Date().toISOString()
                };
            }

            // Actually save to backend database
            console.log('Saving configuration to backend...', finalConfig);

            const apiUrl = `${environment.apiUrl}/configuration/save`;
            const saveResponse = await this.http.post(apiUrl, {
                configuration_data: finalConfig
            }).toPromise();

            console.log('✅ Configuration saved to database:', saveResponse);

            // Mark as complete and generated
            this.configService.completeConfiguration();
            this.configService.markAsGenerated();

            // Show success message with configuration ID
            const configId = (saveResponse as any)?.configuration_id || 'Unknown';
            alert(`Configuration generated and saved successfully!\nConfiguration ID: ${configId}`);

            // Reload to show the generated section
            this.loadConfiguration();

        } catch (error) {
            console.error('❌ Failed to save configuration to backend:', error);

            // Still mark as generated locally for now
            this.configService.completeConfiguration();
            this.configService.markAsGenerated();

            alert('Configuration generated locally, but failed to save to backend. Please check backend connection.');
            this.loadConfiguration();
        } finally {
            this.isGenerating = false;
        }
    }

    // Reset configuration
    onNewConfiguration() {
        if (confirm('Are you sure you want to start a new configuration? This will clear all current data.')) {
            this.configService.resetConfiguration();
            this.configService.navigateToStep(1);
        }
    }

    // Utility functions
    calculateTotalEstimatedPower(): number {
        if (this.powerConfiguration?.estimatedPowerConsumption) {
            return this.powerConfiguration.estimatedPowerConsumption;
        }
        return 0;
    }

    getConfigurationDate(): string {
        return new Date().toLocaleDateString();
    }

    getPerformanceStyle(performance: string) {
        const ratings: { [key: string]: any } = {
            'Excellent': {
                'background-color': '#000000',
                'color': '#FFFFFF',
                'padding': '4px 8px',
                'border-radius': '4px',
                'font-size': '12px',
                'font-weight': '500'
            },
            'Very Good': {
                'background-color': '#E8F5E8',
                'color': '#2E7D32',
                'padding': '4px 8px',
                'border-radius': '4px',
                'font-size': '12px',
                'font-weight': '500'
            },
            'Good': {
                'background-color': '#FFF3E0',
                'color': '#F57C00',
                'padding': '4px 8px',
                'border-radius': '4px',
                'font-size': '12px',
                'font-weight': '500'
            }
        };

        return ratings[performance] || {};
    }
} 