import { User } from './../../models/user.model';
import { Component, computed, Signal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  readonly userName: Signal<string>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.userName = computed(() => this.authService.getCurrentUser()?.name || '');
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => { }
    });
  }
}
