import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {userRole }  from '../../models/role.model';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    registerForm: FormGroup;
    loading = false;
    submitted = false;
    error = '';
    public userRole = userRole;
    public roleOptions = Object.values(userRole);

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authService: AuthService
    ) {
        if (this.authService.getCurrentUser()) {
            this.router.navigate(['/']);
        }

        this.registerForm = this.formBuilder.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            role: ['PROJECT_MANAGER', Validators.required],
            organizationId: [null, [Validators.required, Validators.min(1)]]
        });
    }

    get f() { return this.registerForm.controls; }

    onSubmit() {
        this.submitted = true;
        this.error = '';

        if (this.registerForm.invalid) {
            return;
        }

        this.loading = true;
        this.authService.register(this.registerForm.value)
            .subscribe({
                next: () => {
                    this.router.navigate(['/']);
                },
                error: error => {
                    this.error = error.error?.message || 'Error en el registro';
                    this.loading = false;
                }
            });
    }
}
