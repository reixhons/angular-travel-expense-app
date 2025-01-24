import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface BroadcastMessage {
    type: 'TRIP_UPDATE' | 'EXPENSE_UPDATE' | 'STATUS_UPDATE';
    data?: any;
}

@Injectable({
    providedIn: 'root'
})
export class BroadcastService {
    private broadcastChannel: BroadcastChannel;
    private messageSubject = new Subject<BroadcastMessage>();

    readonly messages$ = this.messageSubject.asObservable();

    constructor() {
        this.broadcastChannel = new BroadcastChannel('travel-expense-app');

        this.broadcastChannel.onmessage = (event) => {
            this.messageSubject.next(event.data);
        };
    }

    broadcast(message: BroadcastMessage) {
        this.broadcastChannel.postMessage(message);
    }

    ngOnDestroy() {
        this.broadcastChannel.close();
    }
}
