import { Expense, TripStatus } from './../models/trip.model';
import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { Trip } from '../models/trip.model';
import { BroadcastService } from './broadcast.service';

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

  constructor(
    private http: HttpClient,
    private broadcastService: BroadcastService
  ) {
    this.loadTrips();

    // Subscribe to broadcast messages
    this.broadcastService.messages$.subscribe(message => {
      switch (message.type) {
        case 'TRIP_UPDATE':
        case 'EXPENSE_UPDATE':
        case 'STATUS_UPDATE':
          this.loadTrips();
          break;
      }
    });
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
        this.broadcastService.broadcast({ type: 'TRIP_UPDATE' });
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

  updateTripStatus(tripId: string, status: TripStatus, note?: string): Observable<Trip> {
    const updateData: Partial<Trip> = {
      status,
      ...(note && { approverNote: note })
    };

    return this.http.patch<Trip>(`${this.apiUrl}/trips/${tripId}`, updateData).pipe(
      tap(updatedTrip => {
        this.tripsSignal.update(trips =>
          trips.map(t => t.id === tripId ? updatedTrip : t)
        );
        this.broadcastService.broadcast({ type: 'STATUS_UPDATE', data: { tripId, status } });
      }),
      catchError(error => {
        console.error('Failed to update trip status:', error);
        return throwError(() => error);
      })
    );
  }

  getTrip(tripId: string): Observable<Trip> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<Trip>(`${this.apiUrl}/trips/${tripId}`).pipe(
      catchError(error => {
        this.errorSignal.set('Failed to load trip details');
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  getTripExpensesDetails(tripId: string): Observable<any[]> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<any[]>(`${this.apiUrl}/expenses?tripId=${tripId}`).pipe(
      catchError(error => {
        this.errorSignal.set('Failed to load trip expenses');
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  sendTripForApproval(tripId: string): Observable<Trip> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.patch<Trip>(`${this.apiUrl}/trips/${tripId}`, {
      status: TripStatus.PENDING_APPROVAL
    }).pipe(
      tap(updatedTrip => {
        this.tripsSignal.update(trips =>
          trips.map(t => t.id === tripId ? updatedTrip : t)
        );
      }),
      catchError(error => {
        this.errorSignal.set('Failed to send trip for approval');
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  getExpenseById(expenseId: string): Observable<Expense> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<Expense>(`${this.apiUrl}/expenses/${expenseId}`).pipe(
      catchError(error => {
        this.errorSignal.set('Failed to load expense');
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  getTripsByStatus(status: TripStatus): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/trips?status=${status}`).pipe(
      catchError(error => {
        console.error('Failed to load trips:', error);
        return throwError(() => error);
      })
    );
  }

  addExpense(expenseData: any): Observable<any> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<any>(`${this.apiUrl}/expenses`, expenseData).pipe(
      tap(newExpense => {
        this.loadTripExpenses(newExpense.tripId);
        this.broadcastService.broadcast({ type: 'EXPENSE_UPDATE', data: { tripId: newExpense.tripId } });
      }),
      catchError(error => {
        this.errorSignal.set('Failed to create expense');
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }

  updateExpense(expenseId: string, expenseData: any): Observable<any> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.patch<any>(`${this.apiUrl}/expenses/${expenseId}`, expenseData).pipe(
      tap(updatedExpense => {
        this.loadTripExpenses(updatedExpense.tripId);
      }),
      catchError(error => {
        this.errorSignal.set('Failed to update expense');
        return throwError(() => error);
      }),
      finalize(() => this.isLoadingSignal.set(false))
    );
  }
}