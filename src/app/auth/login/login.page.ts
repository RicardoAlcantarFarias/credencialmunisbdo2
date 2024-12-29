import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  loginForm: FormGroup;
  loginError: string | null = null;
  alertHeader: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private alertController: AlertController
  ) {
    this.loginForm = this.fb.group({
      correo: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern('^[a-zA-Z0-9._%+-]+@sanbernardo\\.cl$'),
        ],
      ],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // Métodos auxiliares para obtener errores de los campos del formulario
  get correoErrors() {
    return this.loginForm.get('correo')?.errors;
  }

  get contrasenaErrors() {
    return this.loginForm.get('contrasena')?.errors;
  }

  // Método de inicio de sesión
  async login() {
    if (this.loginForm.valid) {
      const correo = this.loginForm.value.correo; // Aseguramos que el correo se obtiene del formulario
      this.http.post('http://190.215.38.222:9595/api/login', this.loginForm.value).subscribe(
        async (res: any) => {
          if (res.token) {
            // Guardar información relevante en localStorage
            localStorage.setItem('token', res.token);
            localStorage.setItem('correo', correo); // Guardamos el correo de forma explícita
            localStorage.setItem('primer_inicio', JSON.stringify(res.primer_inicio));
            localStorage.setItem('debeCambiarContrasena', JSON.stringify(res.debeCambiarContrasena));
            localStorage.setItem('tieneImagen', JSON.stringify(res.tieneImagen));

            // Lógica basada en primer inicio de sesión
            if (res.primer_inicio) {
              if (!res.tieneImagen) {
                await this.showAlert(
                  'Sube tu Foto',
                  'Debes subir una foto de perfil profesional para continuar.'
                );
                this.router.navigate(['/subir-foto']);
              } else {
                await this.showAlert(
                  'Primer Inicio',
                  'Es tu primer inicio de sesión. Debes actualizar tu contraseña.'
                );
                this.router.navigate(['/forgot-password']);
              }
            } else if (res.debeCambiarContrasena) {
              this.router.navigate(['/forgot-password']);
            } else {
              this.router.navigate(['/credencial']);
            }
          } else {
            await this.showAlert('Credenciales Inválidas', 'Usuario o contraseña incorrectos.');
          }
        },
        async (err) => await this.handleError(err)
      );
    } else {
      await this.setValidationErrors();
    }
  }

  // Manejo de errores en la solicitud HTTP
  private async handleError(err: HttpErrorResponse) {
    if (err.status === 403) {
      await this.showAlert('Usuario Inactivo', 'Su usuario está inactivo. Por favor, comuníquese con RRHH.');
    } else if (err.status === 400) {
      await this.showAlert('Credenciales Inválidas', 'Usuario o contraseña incorrectos.');
    } else {
      await this.showAlert('Problema del Servidor', 'Ocurrió un problema en el servidor. Por favor, intente nuevamente más tarde.');
    }
  }

  // Método para establecer mensajes de error de validación de formulario
  private async setValidationErrors() {
    if (this.correoErrors) {
      if (this.correoErrors['required']) {
        await this.showAlert('Campo Obligatorio', 'El campo de correo es obligatorio.');
      } else if (this.correoErrors['email']) {
        await this.showAlert('Correo Inválido', 'Por favor, ingresa un correo válido.');
      } else if (this.correoErrors['pattern']) {
        await this.showAlert('Dominio Inválido', 'Por favor, ingresa un correo con el dominio @sanbernardo.cl.');
      }
    } else if (this.contrasenaErrors) {
      if (this.contrasenaErrors['required']) {
        await this.showAlert('Campo Obligatorio', 'El campo de contraseña es obligatorio.');
      } else if (this.contrasenaErrors['minlength']) {
        await this.showAlert('Contraseña Corta', 'La contraseña debe tener al menos 6 caracteres.');
      }
    } else {
      await this.showAlert('Formulario Incompleto', 'Por favor, completa todos los campos correctamente.');
    }
  }

  // Método auxiliar para mostrar alertas correctamente
  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  // Método para limpiar mensajes de error
  clearLoginError() {
    this.loginError = null;
    this.alertHeader = null;
  }
}
