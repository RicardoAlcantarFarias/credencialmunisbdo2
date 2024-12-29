import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  registerForm: FormGroup;
  registrationError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nombre_completo: ['', Validators.required],
      rut: ['', Validators.required],
      departamento: ['', Validators.required],
      direccion: ['', Validators.required],
      correo: [
        '', 
        [
          Validators.required, 
          Validators.email, 
          Validators.pattern('^[a-zA-Z0-9._%+-]+@sanbernardo\\.cl$')  // Validación para correo con dominio específico
        ]
      ],
      telefono: ['', Validators.required],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  register() {
    if (this.registerForm.valid) {
      // URL actualizada con prefijo /api y IP y puerto correctos
      this.http.post('http://190.215.38.222:9595/api/register', this.registerForm.value).subscribe(
        (res: any) => {
          if (res.status === 'Usuario registrado') {
            this.router.navigate(['/login']);
          } else {
            this.registrationError = 'Error en el registro. Inténtelo de nuevo.';
          }
        },
        (err) => {
          console.error('Error de registro', err);
          this.registrationError = 'Error de registro. Inténtelo de nuevo.';
        }
      );
    } else {
      // Validaciones personalizadas
      if (this.registerForm.get('nombre_completo')?.hasError('required')) {
        this.registrationError = 'El campo de nombre completo es obligatorio.';
      } else if (this.registerForm.get('rut')?.hasError('required')) {
        this.registrationError = 'El campo de RUT es obligatorio.';
      } else if (this.registerForm.get('departamento')?.hasError('required')) {
        this.registrationError = 'El campo de departamento es obligatorio.';
      } else if (this.registerForm.get('direccion')?.hasError('required')) {
        this.registrationError = 'El campo de dirección es obligatorio.';
      } else if (this.registerForm.get('correo')?.hasError('required')) {
        this.registrationError = 'El campo de correo es obligatorio.';
      } else if (this.registerForm.get('correo')?.hasError('email')) {
        this.registrationError = 'Por favor, ingresa un correo válido.';
      } else if (this.registerForm.get('correo')?.hasError('pattern')) {
        this.registrationError = 'Por favor, ingresa un correo con el dominio @sanbernardo.cl.';
      } else if (this.registerForm.get('telefono')?.hasError('required')) {
        this.registrationError = 'El campo de teléfono es obligatorio.';
      } else if (this.registerForm.get('contrasena')?.hasError('required')) {
        this.registrationError = 'El campo de contraseña es obligatorio.';
      } else if (this.registerForm.get('contrasena')?.hasError('minlength')) {
        this.registrationError = 'La contraseña debe tener al menos 6 caracteres.';
      } else {
        this.registrationError = 'Por favor, completa todos los campos correctamente.';
      }
    }
  }
}
