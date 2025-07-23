import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Step1SystemTypeComponent } from './components/step1-system-type/step1-system-type.component';
import { Step2PowerConfigComponent } from './components/step2-power-config/step2-power-config.component';
import { Step3StorageConfigComponent } from './components/step3-storage-config/step3-storage-config.component';
import { Step4ReviewGenerateComponent } from './components/step4-review-generate/step4-review-generate.component';
import { ConfigurationStateService } from './services/configuration-state.service';

@Component({
  selector: 'app-root',
  imports: [HttpClientModule, CommonModule, Step1SystemTypeComponent, Step2PowerConfigComponent, Step3StorageConfigComponent, Step4ReviewGenerateComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'HPC System Configuration Tool';
  currentStep = 1;

  constructor(private configService: ConfigurationStateService) { }

  ngOnInit() {
    // Subscribe to configuration changes
    this.configService.configuration$.subscribe(config => {
      this.currentStep = config.currentStep;
    });
  }

  onStepClick(step: number) {
    if (this.configService.isStepAccessible(step)) {
      this.configService.navigateToStep(step);
    }
  }

  isStepAccessible(step: number): boolean {
    return this.configService.isStepAccessible(step);
  }

  isStepCompleted(step: number): boolean {
    const config = this.configService.getCurrentConfiguration();
    switch (step) {
      case 1: return !!config.step1;
      case 2: return !!config.step2;
      case 3: return !!config.step3;
      default: return false;
    }
  }
}
