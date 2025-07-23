import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Step1Data {
    systemType: any;
    deploymentType: any;
    selectedNodes: number;
    nodesPerRack: number;
    totalRacks: number;
}

export interface Step2Data {
    powerConfiguration: any;
    region: any;
    calculatedEfficiency: number;
    estimatedPowerConsumption: number;
}

export interface Step3Data {
    storageProtocol: any;
    storageVendor: any;
    supportOption: any;
}

export interface PricingData {
    total_price_usd: number;
    currency: string;
    nodes_count: number;
    calculated_at: string;
}

export interface FinalConfiguration {
    system: {
        type: string;
        deployment: string;
        nodes: number;
        nodesPerRack: number;
        totalRacks: number;
    };
    power: {
        configuration: string;
        region: string;
        efficiency: number;
        estimatedConsumption: number;
    };
    storage: {
        protocol: string;
        vendor: string;
        support: string;
    };
    timestamp: string;
    version: string;
    pricing?: PricingData;
}

export interface ConfigurationData {
    step1?: Step1Data;
    step2?: Step2Data;
    step3?: Step3Data;
    currentStep: number;
    isComplete: boolean;
    lastGeneratedHash?: string; // Hash of config when last generated
}

@Injectable({
    providedIn: 'root'
})
export class ConfigurationStateService {

    private configurationSubject = new BehaviorSubject<ConfigurationData>({
        currentStep: 1,
        isComplete: false
    });

    public configuration$ = this.configurationSubject.asObservable();

    constructor() {
        // Load from localStorage if exists (only in browser)
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('hpc-configuration');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    this.configurationSubject.next(parsed);
                } catch (error) {
                    console.error('Failed to parse saved configuration:', error);
                }
            }
        }
    }

    // Get current configuration
    getCurrentConfiguration(): ConfigurationData {
        return this.configurationSubject.value;
    }

    // Update Step 1 data
    updateStep1(data: Step1Data) {
        const current = this.getCurrentConfiguration();
        const updated = {
            ...current,
            step1: data,
            currentStep: Math.max(current.currentStep, 2), // Allow moving to step 2
            isComplete: false, // Reset completion status
            lastGeneratedHash: undefined // Clear generated status
        };
        this.updateConfiguration(updated);
    }

    // Update Step 2 data
    updateStep2(data: Step2Data) {
        const current = this.getCurrentConfiguration();
        const updated = {
            ...current,
            step2: data,
            currentStep: Math.max(current.currentStep, 3), // Allow moving to step 3
            isComplete: false, // Reset completion status
            lastGeneratedHash: undefined // Clear generated status
        };
        this.updateConfiguration(updated);
    }

    // Update Step 3 data
    updateStep3(data: Step3Data) {
        const current = this.getCurrentConfiguration();
        const updated = {
            ...current,
            step3: data,
            currentStep: Math.max(current.currentStep, 4), // Allow moving to step 4
            isComplete: false, // Reset completion status
            lastGeneratedHash: undefined // Clear generated status
        };
        this.updateConfiguration(updated);
    }

    // Complete configuration
    completeConfiguration() {
        const current = this.getCurrentConfiguration();
        const updated = {
            ...current,
            isComplete: true
        };
        this.updateConfiguration(updated);
    }

    // Navigate to specific step
    navigateToStep(step: number) {
        const current = this.getCurrentConfiguration();
        if (step <= current.currentStep) {
            const updated = {
                ...current,
                currentStep: step
            };
            this.configurationSubject.next(updated);
        }
    }

    // Check if step is accessible
    isStepAccessible(step: number): boolean {
        return step <= this.getCurrentConfiguration().currentStep;
    }

    // Reset configuration
    resetConfiguration() {
        const fresh = {
            currentStep: 1,
            isComplete: false
        };
        this.updateConfiguration(fresh);
    }

    // Private method to update and save
    private updateConfiguration(config: ConfigurationData) {
        this.configurationSubject.next(config);
        // Only save to localStorage if in browser
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.setItem('hpc-configuration', JSON.stringify(config));
        }
    }

    // Get final configuration for backend - only selected choices
    getFinalConfiguration(): FinalConfiguration {
        const config = this.getCurrentConfiguration();

        // Extract only the selected choices, not all the configuration data
        const selectedConfig = {
            system: {
                type: config.step1?.systemType?.name || '',
                deployment: config.step1?.deploymentType?.name || '',
                nodes: config.step1?.selectedNodes || 0,
                nodesPerRack: config.step1?.nodesPerRack || 0,
                totalRacks: config.step1?.totalRacks || 0
            },
            power: {
                configuration: config.step2?.powerConfiguration?.name || '',
                region: config.step2?.region?.name || '',
                efficiency: config.step2?.calculatedEfficiency || 0,
                estimatedConsumption: config.step2?.estimatedPowerConsumption || 0
            },
            storage: {
                protocol: config.step3?.storageProtocol?.name || '',
                vendor: config.step3?.storageVendor?.name || '',
                support: config.step3?.supportOption?.name || ''
            },
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        return selectedConfig as FinalConfiguration;
    }

    // Calculate hash of current configuration
    private calculateConfigHash(): string {
        const config = this.getCurrentConfiguration();
        const configString = JSON.stringify({
            step1: config.step1,
            step2: config.step2,
            step3: config.step3
        });
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < configString.length; i++) {
            const char = configString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    // Check if configuration has changed since last generation
    hasConfigurationChanged(): boolean {
        const currentConfig = this.getCurrentConfiguration();
        if (!currentConfig.lastGeneratedHash) {
            return true; // Never generated before
        }
        const currentHash = this.calculateConfigHash();
        return currentConfig.lastGeneratedHash !== currentHash;
    }

    // Mark configuration as generated
    markAsGenerated() {
        const currentConfig = this.getCurrentConfiguration();
        const newHash = this.calculateConfigHash();
        this.updateConfiguration({
            ...currentConfig,
            lastGeneratedHash: newHash
        });
    }
} 