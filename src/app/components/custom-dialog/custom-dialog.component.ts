import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TripService } from '../../services/trip.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CarRentalExpense, Expense, ExpenseType, FlightExpense, HotelExpense, TaxiExpense, Trip, TripStatus } from '../../models/trip.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-custom-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './custom-dialog.component.html',
  styleUrl: './custom-dialog.component.scss'
})

export class CustomDialogComponent {

  tripName: string = '';
  duration: number = 0;
  expenseTotalPrice: number = 0;
  type: string = '';

  startDate: Date = new Date();
  endDate: Date = new Date();
  name: string = ''

  // Flight specific fields
  airline: string = '';
  from: string = '';
  to: string = '';
  departureDateTime: Date = new Date();
  arrivalDateTime: Date = new Date();

  // Hotel specific fields
  hotelName: string = '';
  location: string = '';
  checkInDate: Date = new Date();
  checkOutDate: Date = new Date();

  // Car Rental specific fields
  carName: string = '';
  pickupDateTime: Date = new Date();
  dropoffDateTime: Date = new Date();
  pickupLocation: string = '';
  dropoffLocation: string = '';

  // Taxi specific fields
  dateTime: Date = new Date();

  // Add these properties
  today: string = new Date().toISOString().split('T')[0];
  isValid: boolean = true;
  errorMessage: string = '';

  constructor(

    public dialogRef: MatDialogRef<CustomDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      dataType: 'Trip' | 'Expense';
      event: 'New' | 'Edit' | 'View';
      expenseId?: string;
      type?: string;
      tripId?: string;
    },

    private tripService: TripService,
    private authService: AuthService
  ) {
    if (data.type !== undefined) {
      this.type = data.type;
    }

    if (data.expenseId) {
      this.tripService.getExpenseById(data.expenseId).subscribe({
        next: (expense: Expense) => {
          this.expenseTotalPrice = expense.totalPrice;

          switch (expense.type) {
            case ExpenseType.FLIGHT:
              const flightExpense = expense as FlightExpense;
              this.airline = flightExpense.airline;
              this.from = flightExpense.from;
              this.to = flightExpense.to;
              this.departureDateTime = new Date(flightExpense.departureDateTime);
              this.arrivalDateTime = new Date(flightExpense.arrivalDateTime);
              break;

            case ExpenseType.HOTEL:
              const hotelExpense = expense as HotelExpense;
              this.hotelName = hotelExpense.hotelName;
              this.location = hotelExpense.location;
              this.checkInDate = new Date(hotelExpense.checkInDate);
              this.checkOutDate = new Date(hotelExpense.checkOutDate);
              break;

            case ExpenseType.CAR_RENTAL:
              const carRentalExpense = expense as CarRentalExpense;
              this.carName = carRentalExpense.carName;
              this.pickupDateTime = new Date(carRentalExpense.pickupDateTime);
              this.dropoffDateTime = new Date(carRentalExpense.dropoffDateTime);
              this.pickupLocation = carRentalExpense.pickupLocation;
              this.dropoffLocation = carRentalExpense.dropoffLocation;
              break;

            case ExpenseType.TAXI:
              const taxiExpense = expense as TaxiExpense;
              this.from = taxiExpense.from;
              this.to = taxiExpense.to;
              this.dateTime = new Date(taxiExpense.dateTime);
              break;
          }
        },
        error: (err) => console.error('Failed to load expense:', err)
      });
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  updateEndDate(): void {
    if (this.startDate && this.duration > 0) {
      const startDate = new Date(this.startDate);
      startDate.setDate(startDate.getDate() + this.duration);
      this.endDate = startDate
    }
  }

  validateDates(): void {
    if (this.data.dataType === 'Trip') {
      if (new Date(this.endDate) < new Date(this.startDate)) {
        this.endDate = this.startDate;
        this.errorMessage = 'End date cannot be before start date';
        this.isValid = false;
      } else {
        this.errorMessage = '';
        this.isValid = true;
      }
    } else if (this.data.type === ExpenseType.FLIGHT) {
      if (new Date(this.arrivalDateTime) < new Date(this.departureDateTime)) {
        this.arrivalDateTime = this.departureDateTime;
        this.errorMessage = 'Arrival time cannot be before departure time';
        this.isValid = false;
      } else {
        this.errorMessage = '';
        this.isValid = true;
      }
    } else if (this.data.type === ExpenseType.HOTEL) {
      if (new Date(this.checkOutDate) < new Date(this.checkInDate)) {
        this.checkOutDate = this.checkInDate;
        this.errorMessage = 'Check-out date cannot be before check-in date';
        this.isValid = false;
      } else {
        this.errorMessage = '';
        this.isValid = true;
      }
    } else if (this.data.type === ExpenseType.CAR_RENTAL) {
      if (new Date(this.dropoffDateTime) < new Date(this.pickupDateTime)) {
        this.dropoffDateTime = this.pickupDateTime;
        this.errorMessage = 'Drop-off time cannot be before pickup time';
        this.isValid = false;
      } else {
        this.errorMessage = '';
        this.isValid = true;
      }
    }
  }

  saveTrip(): void {
    if (!this.isValid) return;

    const currentUser = this.authService.getCurrentUser();

    const tripData = {
      name: this.tripName,
      startDate: this.startDate,
      endDate: this.endDate,
      userId: currentUser ? currentUser.id : 'unknown',
      status: TripStatus.DRAFT
    };

    this.tripService.createTrip(tripData as Partial<Trip>).subscribe({
      next: () => this.dialogRef.close(),
      error: (err) => console.error(err)
    });
  }

  saveExpense(): void {
    if (!this.isValid) return;

    if (!this.data.expenseId) {
      // Create new expense
      const expenseData = {
        type: this.data.type,
        totalPrice: this.expenseTotalPrice,
        tripId: this.data.tripId,

        // Add type-specific fields
        ...(this.data.type === ExpenseType.FLIGHT && {
          airline: this.airline,
          from: this.from,
          to: this.to,
          departureDateTime: this.departureDateTime,
          arrivalDateTime: this.arrivalDateTime
        }),
        ...(this.data.type === ExpenseType.HOTEL && {
          hotelName: this.hotelName,
          location: this.location,
          checkInDate: this.checkInDate,
          checkOutDate: this.checkOutDate
        }),
        ...(this.data.type === ExpenseType.CAR_RENTAL && {
          carName: this.carName,
          pickupDateTime: this.pickupDateTime,
          dropoffDateTime: this.dropoffDateTime
        }),
        ...(this.data.type === ExpenseType.TAXI && {
          type: this.type,
          from: this.from,
          to: this.to,
          dateTime: this.dateTime
        })
      };

      this.tripService.addExpense(expenseData).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Failed to create expense:', err)
      });
    } else {
      this.tripService.getExpenseById(this.data.expenseId).subscribe({
        next: (expense: Expense) => {
          const updatedExpense = {
            ...expense,
            totalPrice: this.expenseTotalPrice,
            tripId: this.data.tripId,

            ...(expense.type === ExpenseType.FLIGHT && {
              airline: this.airline,
              from: this.from,
              to: this.to,
              departureDateTime: this.departureDateTime,
              arrivalDateTime: this.arrivalDateTime
            }),
            ...(expense.type === ExpenseType.HOTEL && {
              hotelName: this.hotelName,
              location: this.location,
              checkInDate: this.checkInDate,
              checkOutDate: this.checkOutDate
            }),
            ...(expense.type === ExpenseType.CAR_RENTAL && {
              carName: this.carName,
              pickupDateTime: this.pickupDateTime,
              dropoffDateTime: this.dropoffDateTime
            }),
            ...(expense.type === ExpenseType.TAXI && {
              type: this.type,
              from: this.from,
              to: this.to,
              dateTime: this.dateTime
            })
          };

          this.tripService.updateExpense(this.data.expenseId!, updatedExpense).subscribe({
            next: () => this.dialogRef.close(true),
            error: (err) => console.error('Failed to update expense:', err)
          });
        },
        error: (err) => console.error('Failed to load expense:', err)
      });
    }
  }

}