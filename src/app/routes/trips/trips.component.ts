import { Component, computed, EnvironmentInjector, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { Signal } from '@angular/core';
import { Trip, TripStatus } from '../../models/trip.model';
import { CustomDialogComponent } from '../../components/custom-dialog/custom-dialog.component';


@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './trips.component.html'
})
export class TripsComponent implements OnInit {
  readonly trips: Signal<Trip[]>;
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly userName: Signal<string>;

  constructor(
    private tripService: TripService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.trips = this.tripService.trips;
    this.isLoading = this.tripService.isLoading;
    this.error = this.tripService.error;
    this.userName = computed(() => this.authService.getCurrentUser()?.name || '');
  }


  openCustomDialog() {
    this.dialog.open(CustomDialogComponent, {
      width: '400px',
      data: { dataType: "Trip", event: 'New', isEditable: true }
    });
  }

  ngOnInit(): void {
    this.tripService.loadTrips();
  }


  sendForApproval(trip: Trip) {
    this.tripService.updateTripStatus(trip.id, TripStatus.PENDING_APPROVAL).subscribe({
      next: () => {
        // Success notification could be added here
      },
      error: (error) => {
        console.error('Error sending trip for approval:', error);
      }
    });
  }


  getTripDuration(startDate: Date, endDate: Date): number {
    return this.tripService.calculateDuration(startDate, endDate);
  }

  getTripExpenses(tripId: string): number {
    return this.tripService.getTripExpenses(tripId);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => { } // Error handling is done in service
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case TripStatus.PENDING_APPROVAL:
        return 'status-pending';
      case TripStatus.APPROVED:
        return 'status-approved';
      case TripStatus.CANCELLED:
        return 'status-cancelled';
      case TripStatus.IN_PROCESS:
        return 'status-in-process';
      case TripStatus.REFUNDED:
        return 'status-refunded';
      default:
        return 'status-draft';
    }
  }

  updateTripStatus(trip: Trip) {
    this.tripService.updateTripStatus(trip.id, TripStatus.PENDING_APPROVAL).subscribe({
      next: () => {
        // Success notification could be added here
      },
      error: (error) => {
        console.error('Error updating trip status:', error);
      }
    });
  }
}