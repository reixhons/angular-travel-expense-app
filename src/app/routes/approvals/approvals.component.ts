import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TripService } from '../../services/trip.service';
import { Trip, TripStatus, Expense } from '../../models/trip.model';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './approvals.component.html'
})
export class ApprovalsComponent implements OnInit {
  pendingTrips: Trip[] = [];
  approverNotes: { [key: string]: string } = {};
  tripExpenses: { [key: string]: Expense[] } = {};

  constructor(private tripService: TripService) { }

  ngOnInit() {
    this.loadPendingTrips();
  }

  loadPendingTrips() {
    this.tripService.getTripsByStatus(TripStatus.PENDING_APPROVAL).subscribe({
      next: (trips) => {
        this.pendingTrips = trips;
        trips.forEach(trip => {
          this.approverNotes[trip.id] = '';
          this.loadTripExpenses(trip.id);
        });
      },
      error: (error) => console.error('Error loading pending trips:', error)
    });
  }

  loadTripExpenses(tripId: string) {
    this.tripService.getTripExpensesDetails(tripId).subscribe({
      next: (expenses) => {
        this.tripExpenses[tripId] = expenses;
      },
      error: (error) => console.error('Error loading expenses:', error)
    });
  }

  approveTrip(tripId: string) {
    const note = this.approverNotes[tripId];
    this.tripService.updateTripStatus(tripId, TripStatus.APPROVED, note).subscribe({
      next: () => {
        this.loadPendingTrips();
      },
      error: (error) => console.error('Error approving trip:', error)
    });
  }

  cancelTrip(tripId: string) {
    const note = this.approverNotes[tripId];
    this.tripService.updateTripStatus(tripId, TripStatus.CANCELLED, note).subscribe({
      next: () => {
        this.loadPendingTrips();
      },
      error: (error) => console.error('Error cancelling trip:', error)
    });
  }



  getTotalExpenses(tripId: string): number {
    return this.tripExpenses[tripId]?.reduce((sum, expense) => sum + expense.totalPrice, 0) || 0;
  }
}
