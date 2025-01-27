import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  login(email: string, password: string) {
    this.email = email;
    this.password = password;
    this.onSubmit();
  }

  onSubmit() {
    this.authService.login(this.email, this.password).subscribe({
      next: (success) => {
        if (success) {
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            switch (currentUser.role) {
              case UserRole.END_USER:
                this.router.navigate(['/trips']);
                break;
              case UserRole.APPROVER:
                this.router.navigate(['/approvals']);
                break;
              case UserRole.FINANCE:
                this.router.navigate(['/finance']);
                break;
              default:
                this.router.navigate(['/trips']);
            }
          }
        }
      },
      error: (error) => {
        console.error('Login error:', error);
      }
    });
  }
}
