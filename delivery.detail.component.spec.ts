// Vendor dependencies
import { async, inject, TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideRoutes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MomentModule } from 'angular2-moment';
import { By } from '@angular/platform-browser';
import { Http, BaseRequestOptions } from '@angular/http';
// Custom dependencies
import { DeliveryDetailComponent } from './delivery.detail.component';
import { LoggingService } from '../../../services/logging.service';
import { ApiService } from '../../../services/api.service';
import { GlobalSettingsService } from '../../../services/global.settings.service';
// Test resources
import { MockDeliveryService } from '../../../../../test/resources/mocks/MockDeliveryService';
import { MockLoggingService } from '../../../../../test/resources/mocks/MockLoggingService';
import { MockBackend } from '@angular/http/testing';

describe('DeliveryDetailComponent', () => {
    let comp: DeliveryDetailComponent;
    let fixture: ComponentFixture<DeliveryDetailComponent>;

    // provide our implementations or mocks to the dependency injector
    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [MomentModule],
            declarations: [DeliveryDetailComponent],
            providers: [
                { provide: LoggingService, useClass: MockLoggingService }, // Turn logger off for our tests
                {
                    provide: Http,
                    useFactory: (mockBackend: MockBackend, options: BaseRequestOptions) => {
                        return new Http(mockBackend, options);
                    },
                    deps: [MockBackend, BaseRequestOptions]
                },
                MockBackend,
                BaseRequestOptions
            ],
            schemas: [
                CUSTOM_ELEMENTS_SCHEMA
            ]
        }).overrideComponent(DeliveryDetailComponent, {
            set: {
                styleUrls: []
            }
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(DeliveryDetailComponent);
            comp = fixture.componentInstance;
        });
    }));

    it('should construct', () => {
        expect(fixture).toBeDefined();
    });

    it('should display delivery', inject([Http], (http: Http) => {
        comp.delivery = new MockDeliveryService(new LoggingService(), new ApiService(http, new LoggingService()),
            new GlobalSettingsService(new LoggingService(), new ApiService(http, new LoggingService()))).deliveries[0]; // Take first mocked delivery      

        // Detect changes as necessary (triggers data biding)
        fixture.detectChanges();

        // Access the element 
        const element = fixture.debugElement;

        // Data checks
        expect(element.nativeElement.textContent).toContain('Bedford');
        expect(element.nativeElement.textContent).toContain('On Route');
        expect(element.nativeElement.textContent).toContain('Returns');
        expect(element.nativeElement.textContent).not.toContain('Cancelled');
    }));

    it('should not display delivery', () => {
        // Provided no delivery  

        // Detect changes as necessary (triggers data biding)
        fixture.detectChanges();

        // Access the element 
        const element = fixture.debugElement;

        // Data checks
        expect(element.nativeElement.textContent).not.toContain('Bedford');
        expect(element.nativeElement.textContent).not.toContain('On Route');
        expect(element.nativeElement.textContent).not.toContain('Returns');
    });
});