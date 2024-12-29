import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';

type CustomErrors = {
  mismatch?: boolean;
  [key: string]: any;
};

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
})
export class ResetPasswordPage implements OnInit {
  resetPasswordForm: FormGroup;
  errorMessage: string | null = null;
  passwordType: string = 'password';
  token: string | null = null;
  email: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private alertCtrl: AlertController
  ) {
    this.resetPasswordForm = this.fb.group({
      nuevaContrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.email = this.route.snapshot.queryParamMap.get('email');

    if (!this.token || !this.email) {
      this.errorMessage = 'El enlace de restablecimiento no es válido o ha expirado.';
    }
  }

  private validatePasswords() {
    const nuevaContrasena = this.resetPasswordForm.get('nuevaContrasena')?.value;
    const confirmarContrasena = this.resetPasswordForm.get('confirmarContrasena')?.value;

    if (nuevaContrasena !== confirmarContrasena) {
      const errors: CustomErrors = { mismatch: true };
      this.resetPasswordForm.get('confirmarContrasena')?.setErrors(errors);
      return false;
    }

    return true;
  }

  get formErrors() {
    const errors: any = {};
    if (this.resetPasswordForm.get('nuevaContrasena')?.errors) {
      errors.nuevaContrasena = 'La contraseña debe tener al menos 6 caracteres.';
    }
    const confirmarContrasenaErrors = this.resetPasswordForm.get('confirmarContrasena')?.errors as CustomErrors;
    if (confirmarContrasenaErrors && confirmarContrasenaErrors['mismatch']) {
      errors.confirmarContrasena = 'Las contraseñas no coinciden.';
    }
    return errors;
  }

  resetPassword() {
    if (this.resetPasswordForm.invalid || !this.validatePasswords()) {
      return;
    }

    const nuevaContrasena = this.resetPasswordForm.get('nuevaContrasena')?.value;

    this.http
      .post('http://190.215.38.222:9595/api/update-password', {
        correo: this.email,
        token: this.token,
        nuevaContrasena,
      })
      .subscribe(
        async () => {
          // Redirigir siempre a Google después de la actualización
          const alert = await this.alertCtrl.create({
            header: 'Éxito',
            message: 'Tu contraseña ha sido actualizada correctamente.',
            buttons: [
              {
                text: 'Continuar',
                handler: () => {
                  window.location.href = 'https://www.google.com';
                },
              },
            ],
          });
          await alert.present();
        },
        async (err) => {
          console.error('Error al actualizar la contraseña:', err);
          this.errorMessage = 'Hubo un error al restablecer tu contraseña. Intenta nuevamente.';
          const alert = await this.alertCtrl.create({
            header: 'Error',
            message: this.errorMessage,
            buttons: ['OK'],
          });
          await alert.present();
        }
      );
  }

  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }
}
