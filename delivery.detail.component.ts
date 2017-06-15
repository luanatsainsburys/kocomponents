// Vendor dependencies
import { Component, ViewEncapsulation, Input } from '@angular/core';
// import { ActivatedRoute } from '@angular/router';
import { BaseComponent } from '../../shared/base.component';
import * as moment from 'moment/moment';
// Custom dependencies
import { Delivery } from '../../../types/delivery/delivery.type';
// import { DeliveryStatus } from '../../../types/delivery/delivery.status.type';
// import { DeliveryUnit } from '../../../types/delivery/delivery.unit.type';
// import { DeliveryTurnaround } from '../../../types/delivery/delivery.turnaround.type';

@Component({
    selector: 'delivery-detail',
    templateUrl: 'delivery.detail.component.html',
    styleUrls: ['../../../../content/sass/main.scss'],
    encapsulation: ViewEncapsulation.None
})
export class DeliveryDetailComponent extends BaseComponent {
    @Input() delivery: Delivery;
    // private countDown: string;
    private intervalTimer: any;

    hasArrived(): boolean {
        return (this.delivery && this.delivery.Status.Name.toLowerCase() === 'arrived');
    }

    // ngOnInit() {        
    //     this.turnaroundCounter();
    // }

    // ngOnDestroy() {
    //     // ngOnInit fires every time data changes so clean up interval
    //     if (this.countDown) clearInterval(this.intervalTimer);
    // }

    // turnaroundCounter() {
    //     if (this.delivery && this.delivery.ETA) {            
    //         this.intervalTimer = setInterval(() => {
    //             this.countDown = this.delivery.Turnaround.getDuration(this.delivery.ETA);
    //         }, 1000);
    //     }
    // }

    turnaroundStatus(countDown: string) {
        if (!countDown) { return ''; }
        let reg = '(-)(\\d+)(:)';
        let result = countDown.search(reg) == -1 ? 'green' : 'red';
        return result;
    }
}
