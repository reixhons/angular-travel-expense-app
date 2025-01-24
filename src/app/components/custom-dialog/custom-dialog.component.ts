import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TripService } from '../../services/trip.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Trip } from '../../models/trip.model';

@Component({
  selector: 'app-custom-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule
  ],
  templateUrl: './custom-dialog.component.html',
  styleUrl: './custom-dialog.component.scss'
})

export class CustomDialogComponent {
  tripName: string = '';
  startDate: Date = new Date();
  endDate: Date = new Date();
  duration: number = 0;

  constructor(
    public dialogRef: MatDialogRef<CustomDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string },
    private tripService: TripService
  ) { }

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

  saveTrip(): void {
    const tripData = {
      name: this.tripName,
      startDate: this.startDate,
      endDate: this.endDate,
      userId: '101' // Replace with the actual user ID or dynamically fetch
    };

    this.tripService.createTrip(tripData as Partial<Trip>).subscribe({
      next: () => this.dialogRef.close(),
      error: (err) => console.error(err)
    });
  }
}