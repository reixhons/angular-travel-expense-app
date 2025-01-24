import { Component, computed, EnvironmentInjector, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Signal } from '@angular/core';
import { Trip } from '../../models/trip.model';
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
      data: { message: 'newTrip' }
    });
  }

  ngOnInit(): void {
    this.tripService.loadTrips();
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
}