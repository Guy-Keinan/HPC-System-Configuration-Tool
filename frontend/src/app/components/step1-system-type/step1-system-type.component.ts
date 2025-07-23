import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ConfigurationStateService, Step1Data } from '../../services/configuration-state.service';
import { Subscription } from 'rxjs';

interface SystemType {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
}

interface DeploymentType {
    id: string;
    name: string;
    description: string;
    minNodes: number;
    maxNodes: number;
    availableNodeCounts: number[];
    nodesPerRackOptions: number[];
}

interface Step1Config {
    systemTypes: SystemType[];
    deploymentTypes: { [key: string]: DeploymentType[] };
}

@Component({
    selector: 'app-step1-system-type',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './step1-system-type.component.html',
    styleUrls: ['./step1-system-type.component.scss']
})
export class Step1SystemTypeComponent implements OnInit, OnDestroy {

    // Configuration data
    config: Step1Config | null = null;

    // Form state
    selectedSystemType: SystemType | null = null;
    selectedDeploymentType: DeploymentType | null = null;
    selectedNodes: number | null = null;
    selectedNodesPerRack: number | null = null;

    // UI state
    availableDeploymentTypes: DeploymentType[] = [];
    availableNodeCounts: number[] = [];
    availableNodesPerRack: number[] = [];

    // Subscriptions
    private subscriptions: Subscription[] = [];

    constructor(
        private http: HttpClient,
        private configService: ConfigurationStateService
    ) { }

    ngOnInit() {
        this.loadConfiguration();
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    private loadConfiguration() {
        console.log('Loading configuration...');
        this.http.get<Step1Config>('/assets/config/step1-system-types.json')
            .subscribe({
                next: (config) => {
                    console.log('Configuration loaded:', config);
                    this.config = config;

                    // Load existing selections if any
                    this.loadExistingSelections();
                },
                error: (error) => {
                    console.error('Failed to load step1 configuration:', error);
                }
            });
    }

    onSystemTypeSelect(systemType: SystemType) {
        this.selectedSystemType = systemType;
        this.availableDeploymentTypes = this.config?.deploymentTypes[systemType.id] || [];

        // Reset dependent selections
        this.selectedDeploymentType = null;
        this.selectedNodes = null;
        this.selectedNodesPerRack = null;
        this.availableNodeCounts = [];
        this.availableNodesPerRack = [];
    }

    onDeploymentTypeSelect(deploymentType: DeploymentType) {
        this.selectedDeploymentType = deploymentType;
        this.availableNodeCounts = deploymentType.availableNodeCounts;
        this.availableNodesPerRack = deploymentType.nodesPerRackOptions;

        // Reset dependent selections
        this.selectedNodes = null;
        this.selectedNodesPerRack = null;
    }

    onNodesSelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        this.selectedNodes = +target.value;
    }

    onNodesPerRackSelect(event: Event) {
        const target = event.target as HTMLSelectElement;
        this.selectedNodesPerRack = +target.value;
    }

    // Load existing selections from state
    private loadExistingSelections() {
        const currentConfig = this.configService.getCurrentConfiguration();
        if (currentConfig.step1) {
            // Restore previous selections
            this.selectedSystemType = currentConfig.step1.systemType;
            this.selectedDeploymentType = currentConfig.step1.deploymentType;
            this.selectedNodes = currentConfig.step1.selectedNodes;
            this.selectedNodesPerRack = currentConfig.step1.nodesPerRack;

            // Update available options
            if (this.selectedSystemType) {
                this.availableDeploymentTypes = this.config?.deploymentTypes[this.selectedSystemType.id] || [];
            }
            if (this.selectedDeploymentType) {
                this.availableNodeCounts = this.selectedDeploymentType.availableNodeCounts;
                this.availableNodesPerRack = this.selectedDeploymentType.nodesPerRackOptions;
            }
        }
    }

    // Helper methods
    get firstSystemType() {
        return this.config?.systemTypes?.[0] || null;
    }

    isFormValid(): boolean {
        return !!(
            this.selectedSystemType &&
            this.selectedDeploymentType &&
            this.selectedNodes &&
            this.selectedNodesPerRack
        );
    }

    calculateTotalRacks(): number {
        if (this.selectedNodes && this.selectedNodesPerRack) {
            return Math.ceil(this.selectedNodes / this.selectedNodesPerRack);
        }
        return 0;
    }

    getRecommendedNodesPerRack(): number {
        // Based on the mock, 4 nodes per rack is recommended
        return 4;
    }

    isRecommended(nodesPerRack: number): boolean {
        return nodesPerRack === this.getRecommendedNodesPerRack();
    }

    onNext() {
        if (this.isFormValid()) {
            const step1Data: Step1Data = {
                systemType: this.selectedSystemType!,
                deploymentType: this.selectedDeploymentType!,
                selectedNodes: this.selectedNodes!,
                nodesPerRack: this.selectedNodesPerRack!,
                totalRacks: this.calculateTotalRacks()
            };

            // Save to state service
            this.configService.updateStep1(step1Data);
            console.log('Step 1 completed and saved:', step1Data);

            // Navigate to step 2
            this.configService.navigateToStep(2);
        }
    }
} 