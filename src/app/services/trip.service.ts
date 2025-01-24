import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { Trip } from '../models/trip.model';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private apiUrl = 'http://localhost:3000';

  private tripsSignal = signal<Trip[]>([]);
  private expensesMap = signal<Map<string, number>>(new Map());
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  readonly trips = computed(() => this.tripsSignal());
  readonly expenses = computed(() => this.expensesMap());
  readonly isLoading = computed(() => this.isLoadingSignal());
  readonly error = computed(() => this.errorSignal());

  constructor(private http: HttpClient) {
    this.loadTrips();
  }

  loadTrips() {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    this.http.get<Trip[]>(`${this.apiUrl}/trips`).pipe(
      finalize(() => this.isLoadingSignal.set(false))
    ).subscribe({
      next: (trips) => {
        this.tripsSignal.set(trips);
        trips.forEach(trip => this.loadTripExpenses(trip.id));
      },
      error: (error) => this.errorSignal.set('Failed to load trips')
    });
  }

  createTrip(trip: Partial<Trip>): Observable<Trip> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<Trip>(`${this.apiUrl}/trips`, trip).pipe(
      tap(newTrip => {
        this.tripsSignal.update(trips => [...trips, newTrip]);
      }),
      catchError(error => {
        this.errorSignal.set('Failed to create trip');
        return throwError(() => 'Failed to create trip');
      }),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  private loadTripExpenses(tripId: string) {
    this.http.get<any[]>(`${this.apiUrl}/expenses?tripId=${tripId}`).subscribe({
      next: (expenses) => {
        const total = expenses.reduce((sum, expense) => sum + expense.totalPrice, 0);
        this.expensesMap.update(map => {
          const newMap = new Map(map);
          newMap.set(tripId, total);
          return newMap;
        });
      },
      error: () => this.errorSignal.set('Failed to load expenses')
    });
  }

  calculateDuration(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getTripExpenses(tripId: string): number {
    return this.expensesMap()?.get(tripId) || 0;
  }
}