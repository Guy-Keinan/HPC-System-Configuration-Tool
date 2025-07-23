import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ConfigurationStateService, Step2Data } from '../../services/configuration-state.service';

interface PowerConfiguration {
    id: string;
    name: string;
    description: string;
    efficiency: number;
    isRecommended: boolean;
    icon: string;
    requirements: string[];
    characteristics: {
        powerType: string;
        efficiency: string;
        infrastructure: string;
        distribution: string;
    };
}

interface Region {
    id: string;
    name: string;
    code: string;
    standards: string;
    voltage: string;
    description: string;
    powerMultiplier: number;
    basePowerConsumption: number;
}

interface PowerCalculation {
    baseConsumption: {
        minicluster: { [key: string]: number };
        supercluster: { [key: string]: number };
    };
    efficiencyMultipliers: {
        [key: string]: number;
    };
}

interface Step2Config {
    powerConfigurations: PowerConfiguration[];
    regions: Region[];
    powerCalculation: PowerCalculation;
}

@Component({
    selector: 'app-step2-power-config',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './step2-power-config.component.html',
    styleUrls: ['./step2-power-config.component.scss']
})
export class Step2PowerConfigComponent implements OnInit {

    // Configuration data
    config: Step2Config | null = null;

    // Form state
    selectedPowerConfiguration: PowerConfiguration | null = null;
    selectedRegion: Region | null = null;

    // Summary data
    showSummary = false;
    calculatedEfficiency = 0;
    estimatedPowerConsumption = 0;

    constructor(
        private http: HttpClient,
        private configService: ConfigurationStateService
    ) { }

    ngOnInit() {
        this.loadConfiguration();
    }

    private loadConfiguration() {
        console.log('Loading step2 configuration...');
        this.http.get<Step2Config>('/assets/config/step2-power-config.json')
            .subscribe({
                next: (config) => {
                    console.log('Step2 configuration loaded:', config);
                    this.config = config;

                    // Load existing selections if any
                    const currentConfig = this.configService.getCurrentConfiguration();
                    if (currentConfig.step2?.powerConfiguration) {
                        // Restore previous selections
                        this.selectedPowerConfiguration = currentConfig.step2.powerConfiguration;
                        this.selectedRegion = currentConfig.step2.region;
                        this.updateSummary();
                    }
                },
                error: (error) => {
                    console.error('Failed to load step2 configuration:', error);
                }
            });
    }

    onPowerConfigurationSelect(powerConfig: PowerConfiguration) {
        this.selectedPowerConfiguration = powerConfig;
        this.updateSummary();
    }

    onRegionSelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        const regionId = target.value;
        this.selectedRegion = this.config?.regions.find(r => r.id === regionId) || null;
        this.updateSummary();
    }

    private updateSummary() {
        if (this.selectedPowerConfiguration && this.selectedRegion) {
            this.showSummary = true;
            this.calculatePowerConsumption();
        } else {
            this.showSummary = false;
        }
    }

    private calculatePowerConsumption() {
        if (!this.selectedPowerConfiguration || !this.selectedRegion || !this.config) {
            return;
        }

        // Get step1 data for calculation
        const step1Data = this.configService.getCurrentConfiguration().step1;
        if (!step1Data) {
            console.error('Step1 data not found for power calculation');
            return;
        }

        // Calculate efficiency
        this.calculatedEfficiency = this.selectedPowerConfiguration.efficiency;

        // Calculate power consumption based on step1 selections
        const deploymentType = step1Data.deploymentType.id; // minicluster or supercluster
        const nodeCount = step1Data.selectedNodes.toString();

        const baseConsumption = this.config.powerCalculation.baseConsumption[deploymentType as keyof typeof this.config.powerCalculation.baseConsumption];
        const basePower = baseConsumption[nodeCount] || 1000; // fallback

        const efficiencyMultiplier = this.config.powerCalculation.efficiencyMultipliers[this.selectedPowerConfiguration.id] || 1.0;
        const regionalMultiplier = this.selectedRegion.powerMultiplier;

        this.estimatedPowerConsumption = Math.round(basePower * efficiencyMultiplier * regionalMultiplier * 10) / 10;
    }

    // Helper methods
    isFormValid(): boolean {
        return !!(this.selectedPowerConfiguration && this.selectedRegion);
    }

    onPrevious() {
        // Navigate back to step 1
        this.configService.navigateToStep(1);
    }

    onNext() {
        if (this.isFormValid()) {
            const step2Data: Step2Data = {
                powerConfiguration: this.selectedPowerConfiguration!,
                region: this.selectedRegion!,
                calculatedEfficiency: this.calculatedEfficiency,
                estimatedPowerConsumption: this.estimatedPowerConsumption
            };

            // Save to state service
            this.configService.updateStep2(step2Data);
            console.log('Step 2 completed and saved:', step2Data);

            // Navigate to step 3
            this.configService.navigateToStep(3);
        }
    }
} 