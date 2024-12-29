import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage {
  forgotPasswordForm: FormGroup;
  updatePasswordForm: FormGroup;
  recoveryMessage: string | null = null;
  emailVerified: boolean = false;
  token: string | null = null; // Token de recuperación

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController
  ) {
    // Formulario para verificar correo
    this.forgotPasswordForm = this.fb.group({
      correo: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern('^[a-zA-Z0-9._%+-]+@sanbernardo\\.cl$'),
        ],
      ],
    });

    // Formulario para actualizar contraseña
    this.updatePasswordForm = this.fb.group({
      nuevaContrasena: [
        '',
        [Validators.required, Validators.minLength(6)],
      ],
    });

    // Obtener el token de la URL
    this.token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.emailVerified = true; // Asume que el correo fue verificado si el token está presente
      this.forgotPasswordForm.patchValue({ correo: email });
    }
  }

  // Método para solicitar el enlace de recuperación
  async requestRecoveryLink() {
    if (this.forgotPasswordForm.valid) {
      this.http
        .post('http://190.215.38.222:9595/api/verify-email', this.forgotPasswordForm.value)
        .subscribe(
          async (res: any) => {
            if (res.status === 'Correo enviado') {
              await this.showAlert(
                'Correo Enviado',
                'Hemos enviado un enlace de recuperación a tu correo electrónico.'
              );
              this.recoveryMessage = 'Revisa tu correo para continuar con la recuperación.';
            } else {
              await this.showAlert('Error', 'No se pudo enviar el enlace de recuperación.');
            }
          },
          async (err) => {
            console.error('Error al enviar el correo', err);
            await this.showAlert('Error', 'Ocurrió un error. Intenta nuevamente.');
          }
        );
    } else {
      await this.setValidationErrors();
    }
  }

  // Método para actualizar la contraseña
  async updatePassword() {
    if (this.updatePasswordForm.valid && this.token) {
      const formData = {
        token: this.token,
        correo: this.forgotPasswordForm.value.correo,
        nuevaContrasena: this.updatePasswordForm.value.nuevaContrasena,
      };

      this.http
        .post('http://190.215.38.222:9595/api/update-password', formData)
        .subscribe(
          async (res: any) => {
            if (res.status === 'Contraseña actualizada') {
              await this.showAlert('Éxito', 'Tu contraseña ha sido actualizada exitosamente.');
              setTimeout(() => {
                this.router.navigate(['/login']); // Redirige al login después de 2 segundos
              }, 2000);
            } else {
              await this.showAlert('Error', 'Ocurrió un error al actualizar la contraseña.');
            }
          },
          async (err) => {
            console.error('Error al actualizar la contraseña', err);
            await this.showAlert('Error', 'Ocurrió un error. Intenta nuevamente.');
          }
        );
    } else {
      await this.setValidationErrors(true);
    }
  }

  // Validaciones de formulario
  private async setValidationErrors(isPassword = false) {
    if (!isPassword) {
      const correoControl = this.forgotPasswordForm.get('correo');
      if (correoControl?.hasError('required')) {
        await this.showAlert('Campo Obligatorio', 'El campo de correo es obligatorio.');
      } else if (correoControl?.hasError('email')) {
        await this.showAlert('Correo Inválido', 'Por favor, ingresa un correo válido.');
      } else if (correoControl?.hasError('pattern')) {
        await this.showAlert(
          'Dominio Inválido',
          'Por favor, ingresa un correo con el dominio @sanbernardo.cl.'
        );
      }
    } else {
      const passwordControl = this.updatePasswordForm.get('nuevaContrasena');
      if (passwordControl?.hasError('required')) {
        await this.showAlert('Campo Obligatorio', 'El campo de nueva contraseña es obligatorio.');
      } else if (passwordControl?.hasError('minlength')) {
        await this.showAlert('Contraseña Corta', 'La contraseña debe tener al menos 6 caracteres.');
      }
    }
  }

  // Método auxiliar para mostrar alertas
  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // Método para redirigir al login
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
