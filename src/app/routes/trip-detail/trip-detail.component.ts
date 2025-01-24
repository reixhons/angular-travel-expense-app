import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { TripService } from '../../services/trip.service';
import { Trip, Expense, ExpenseType, TripStatus } from '../../models/trip.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CustomDialogComponent } from '../../components/custom-dialog/custom-dialog.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSelectModule
  ],
  templateUrl: './trip-detail.component.html'
})
export class TripDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);

  trip: Trip | null = null;
  expenses: Expense[] = [];
  displayedColumns: string[] = ['type', 'details', 'date', 'totalPrice', 'actions'];
  selectedExpenseType: 'FLIGHT' | 'HOTEL' | 'CAR_RENTAL' | 'TAXI' = 'FLIGHT';
  isApprover: boolean = false;

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
    const tripId = this.route.snapshot.paramMap.get('id');
    if (tripId) {
      this.loadTripDetails(tripId);
      this.tripService.getTrip(tripId).subscribe({
        next: (trip) => {
          this.isApprover = trip.status === TripStatus.PENDING_APPROVAL;
        }
      });
    }
  }

  loadTripDetails(tripId: string) {
    this.tripService.getTrip(tripId).subscribe({
      next: (trip) => {
        this.trip = trip;
        this.loadTripExpenses(tripId);
      },
      error: (error) => {
        console.error('Error loading trip:', error);
      }
    });
  }

  loadTripExpenses(tripId: string) {
    this.tripService.getTripExpensesDetails(tripId).subscribe({
      next: (expenses) => {
        this.expenses = expenses;
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
      }
    });
  }

  getTripDuration(startDate: Date | undefined, endDate: Date | undefined): number {
    if (!startDate || !endDate) return 0;
    return this.tripService.calculateDuration(startDate, endDate);
  }

  getTotalCost(): number {
    return this.expenses.reduce((sum, expense) => sum + expense.totalPrice, 0);
  }

  getExpenseDate(expense: Expense): Date {
    switch (expense.type) {
      case ExpenseType.FLIGHT:
        return expense.departureDateTime;
      case ExpenseType.HOTEL:
        return expense.checkInDate;
      case ExpenseType.CAR_RENTAL:
        return expense.pickupDateTime;
      case ExpenseType.TAXI:
        return expense.dateTime;
      default:
        return new Date();
    }
  }

  addNewExpense() {
    if (!this.selectedExpenseType) return;
    if (!this.trip) return;

    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '600px',
      data: {
        dataType: 'Expense',
        isEditable: true,
        type: this.selectedExpenseType,
        tripId: this.trip.id,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTripExpenses(this.trip!.id);
      }
    });
  }

  editExpense(expense: Expense) {
    if (this.isApprover) {
      console.warn('Approvers cannot edit expenses.');
      return;
    }
    const dialogRef = this.dialog.open(CustomDialogComponent, {
      width: '600px',
      data: {
        dataType: 'Expense',
        event: "Edit",
        expenseId: expense.id,
        type: expense.type,
        tripId: expense.tripId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTripExpenses(this.trip!.id);
      }
    });
  }

  viewExpense(expense: Expense) {
    this.dialog.open(CustomDialogComponent, {
      width: '600px',
      data: {
        message: 'editExpense',
        isEditable: false,
        expenseId: expense.id,
        type: expense.type,
        tripId: expense.tripId
      }
    });
  }

  updateTripStatus() {
    if (this.trip) {
      this.tripService.updateTripStatus(this.trip.id, TripStatus.PENDING_APPROVAL).subscribe({
        next: () => {
          this.loadTripDetails(this.trip!.id);
        },
        error: (error) => {
          console.error('Error updating trip status:', error);
        }
      });
    }
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
}