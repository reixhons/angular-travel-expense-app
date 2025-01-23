import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
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
