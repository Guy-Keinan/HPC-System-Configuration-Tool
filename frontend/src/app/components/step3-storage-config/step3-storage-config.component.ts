import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ConfigurationStateService, Step3Data } from '../../services/configuration-state.service';

interface StorageNetworkProtocol {
    id: string;
    name: string;
    description: string;
    bandwidth: string;
    latency: string;
    isRecommended: boolean;
    icon: string;
    characteristics: {
        performance: string;
        latency: string;
        bandwidth: string;
        idealFor: string;
    };
}

interface StorageVendor {
    id: string;
    name: string;
    description: string;
    performance: string;
    icon: string;
    characteristics: {
        type: string;
        specialization: string;
        performance: string;
        capacity: string;
    };
}

interface SupportOption {
    id: string;
    name: string;
    description: string;
    duration: number;
    isRecommended: boolean;
}

interface Step3Config {
    storageNetworkProtocols: StorageNetworkProtocol[];
    storageVendors: {
        [key: string]: StorageVendor[];
    };
    supportOptions: SupportOption[];
    performanceRatings: {
        [key: string]: {
            color: string;
            backgroundColor: string;
            textColor: string;
        };
    };
}

@Component({
    selector: 'app-step3-storage-config',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './step3-storage-config.component.html',
    styleUrls: ['./step3-storage-config.component.scss']
})
export class Step3StorageConfigComponent implements OnInit {

    // Configuration data
    config: Step3Config | null = null;

    // Form state
    selectedStorageProtocol: StorageNetworkProtocol | null = null;
    selectedStorageVendor: StorageVendor | null = null;
    selectedSupportOption: SupportOption | null = null;

    // UI state
    availableVendors: StorageVendor[] = [];
    showSummary = false;

    constructor(
        private http: HttpClient,
        private configService: ConfigurationStateService
    ) { }

    ngOnInit() {
        this.loadConfiguration();
    }

    private loadConfiguration() {
        console.log('Loading step3 configuration...');
        this.http.get<Step3Config>('/assets/config/step3-storage-config.json')
            .subscribe({
                next: (config) => {
                    console.log('Step3 configuration loaded:', config);
                    this.config = config;

                    // Load existing selections if any
                    this.loadExistingSelections();
                },
                error: (error) => {
                    console.error('Failed to load step3 configuration:', error);
                }
            });
    }

    private loadExistingSelections() {
        const currentConfig = this.configService.getCurrentConfiguration();
        if (currentConfig.step3) {
            // Restore previous selections
            this.selectedStorageProtocol = currentConfig.step3.storageProtocol;
            this.selectedStorageVendor = currentConfig.step3.storageVendor;
            this.selectedSupportOption = currentConfig.step3.supportOption;

            // Update available vendors
            if (this.selectedStorageProtocol) {
                this.updateAvailableVendors();
            }

            this.updateSummary();
        }
    }

    onStorageProtocolSelect(protocol: StorageNetworkProtocol) {
        this.selectedStorageProtocol = protocol;
        this.updateAvailableVendors();

        // Reset dependent selections
        this.selectedStorageVendor = null;
        this.updateSummary();
    }

    private updateAvailableVendors() {
        if (this.selectedStorageProtocol && this.config) {
            this.availableVendors = this.config.storageVendors[this.selectedStorageProtocol.id] || [];
        }
    }

    onStorageVendorSelect(vendor: StorageVendor) {
        this.selectedStorageVendor = vendor;
        this.updateSummary();
    }

    onSupportOptionSelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        const supportId = target.value;
        this.selectedSupportOption = this.config?.supportOptions.find(s => s.id === supportId) || null;
        this.updateSummary();
    }

    private updateSummary() {
        this.showSummary = !!(
            this.selectedStorageProtocol &&
            this.selectedStorageVendor &&
            this.selectedSupportOption
        );
    }

    // Helper methods
    isFormValid(): boolean {
        return !!(
            this.selectedStorageProtocol &&
            this.selectedStorageVendor &&
            this.selectedSupportOption
        );
    }

    getPerformanceStyle(performance: string) {
        if (this.config?.performanceRatings[performance]) {
            const rating = this.config.performanceRatings[performance];
            return {
                'background-color': rating.backgroundColor,
                'color': rating.textColor,
                'padding': '4px 8px',
                'border-radius': '4px',
                'font-size': '12px',
                'font-weight': '500'
            };
        }
        return {};
    }

    onPrevious() {
        // Navigate back to step 2
        this.configService.navigateToStep(2);
    }

    onNext() {
        if (this.isFormValid()) {
            const step3Data: Step3Data = {
                storageProtocol: this.selectedStorageProtocol!,
                storageVendor: this.selectedStorageVendor!,
                supportOption: this.selectedSupportOption!
            };

            // Save to state service
            this.configService.updateStep3(step3Data);
            console.log('Step 3 completed and saved:', step3Data);

            // Navigate to step 4
            this.configService.navigateToStep(4);
        }
    }
} 