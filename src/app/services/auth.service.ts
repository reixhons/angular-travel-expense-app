import { computed, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap, throwError, finalize } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUser = signal<User | null>(null);

  private isLoading = signal<boolean>(false);
  private error = signal<string | null>(null);

  isAuthenticated = computed(() => !!this.currentUser());
  loading = computed(() => this.isLoading());
  errorMessage = computed(() => this.error());


  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser.set(JSON.parse(storedUser));
    }
  }

  login(email: string, password: string): Observable<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<User[]>(`${this.apiUrl}/users?email=${email}`).pipe(
      map(users => {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          // Create a session record
          return this.http.post<{ id: string }>(`${this.apiUrl}/sessions`, {
            id: user.id,
            createdAt: new Date().toISOString()
          }).pipe(
            tap(() => {
              this.currentUser.set(user);
              localStorage.setItem('currentUser', JSON.stringify(user));
              this.error.set(null);
            }),
            map(() => true)
          );
        }
        this.error.set('Invalid email or password');
        return of(false);
      }),
      switchMap(result => {
        if (result instanceof Observable) {
          return result;
        }
        return of(result as boolean);
      }),
      catchError(error => {
        console.error('Login failed:', error);
        this.error.set('An error occurred during login');
        return throwError(() => error);
      }),
      tap(() => this.isLoading.set(false))
    );
  }

  signup(email: string, password: string, name: string): Observable<boolean> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<User[]>(`${this.apiUrl}/users?email=${email}`).pipe(
      switchMap(users => {
        if (users.length > 0) {
          this.error.set('Email already exists');
          return of(false);
        }

        const newUser: User = {
          id: crypto.randomUUID(),
          email,
          password,
          name,
          role: UserRole.END_USER
        };

        return this.http.post<User>(`${this.apiUrl}/users`, newUser).pipe(
          switchMap(user =>
            this.http.post<{ id: string }>(`${this.apiUrl}/sessions`, {
              userId: user.id,
              createdAt: new Date().toISOString()
            }).pipe(
              tap(() => {
                this.currentUser.set(user);
                localStorage.setItem('currentUser', JSON.stringify(user));
              }),
              map(() => true)
            )
          )
        );
      }),
      catchError(error => {
        console.error('Signup failed:', error);
        this.error.set('An error occurred during signup');
        return of(false) as Observable<boolean>;
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  logout(): Observable<boolean> {
    this.isLoading.set(true);
    this.error.set(null);
    const userId = this.currentUser()?.id;

    if (!userId) {
      this.currentUser.set(null);
      this.isLoading.set(false);
      return of(true);
    }

    return this.http.delete(`${this.apiUrl}/sessions/${userId}`).pipe(
      tap(() => this.currentUser.set(null)),
      map(() => true),
      catchError(error => {
        console.error('Logout failed:', error);
        this.error.set('An error occurred during logout');
        throw error;
      }),
      tap(() => this.isLoading.set(false))
    );
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser()?.role === role;
  }
}