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
import { AuthService } from '../../services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CustomDialogComponent } from '../../components/custom-dialog/custom-dialog.component';

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
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.scss']
})
export class ApprovalsComponent implements OnInit {
  pendingTrips: Trip[] = [];
  tripExpenses: { [key: string]: Expense[] } = {};
  approverNotes: { [key: string]: string } = {};
  userNames: { [key: string]: string } = {};

  constructor(
    private tripService: TripService,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

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
          this.loadUserName(trip.userId);
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

  loadUserName(userId: string) {
    this.authService.getUserById(userId).subscribe({
      next: (user) => {
        if (user) {
          this.userNames[userId] = user.name;
        }
      },
      error: (error) => console.error('Error loading user:', error)
    });
  }

  viewExpense(expense: Expense) {
    this.dialog.open(CustomDialogComponent, {
      width: '400px',
      data: {
        dataType: 'Expense',
        event: 'View',
        isEditable: false,
        expenseId: expense.id,
        type: expense.type,
        tripId: expense.tripId
      }
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
