import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TripService } from '../../services/trip.service';
import { Trip, TripStatus } from '../../models/trip.model';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './finance.component.html'
})
export class FinanceComponent implements OnInit {
  approvedTrips: Trip[] = [];

  constructor(private tripService: TripService) { }

  ngOnInit() {
    this.loadTrips();
  }

  loadTrips() {
    // Get approved trips
    this.tripService.getTripsByStatus(TripStatus.APPROVED).subscribe({
      next: (approvedTrips) => {
        // Get in-process trips
        this.tripService.getTripsByStatus(TripStatus.IN_PROCESS).subscribe({
          next: (inProcessTrips) => {
            // Get pending trips
            this.tripService.getTripsByStatus(TripStatus.REFUNDED).subscribe({
              next: (pendingTrips) => {
                // Combine all three arrays
                this.approvedTrips = [...approvedTrips, ...inProcessTrips, ...pendingTrips];
              },
              error: (error) => console.error('Error loading refunded trips:', error)
            });
          },
          error: (error) => console.error('Error loading in-process trips:', error)
        });
      },
      error: (error) => console.error('Error loading approved trips:', error)
    });
  }

  markAsInProcess(tripId: string) {
    this.tripService.updateTripStatus(tripId, TripStatus.IN_PROCESS).subscribe({
      next: () => {
        this.loadTrips();
      },
      error: (error) => console.error('Error updating trip status:', error)
    });
  }

  markAsRefunded(tripId: string) {
    this.tripService.updateTripStatus(tripId, TripStatus.REFUNDED).subscribe({
      next: () => {
        this.loadTrips();
      },
      error: (error) => console.error('Error updating trip status:', error)
    });
  }
}
