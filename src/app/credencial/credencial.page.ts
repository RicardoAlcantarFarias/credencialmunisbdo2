import { Component, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-credencial',
  templateUrl: './credencial.page.html',
  styleUrls: ['./credencial.page.scss'],
})
export class CredencialPage {
  user: any = null;
  qrData: string = '';
  loadError: string | null = null;
  idleTimeout: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    this.checkVisitCount();
    this.loadUser();
    this.resetIdleTimer();
  }

  // Método para verificar y manejar el contador de visitas
  async checkVisitCount() {
    const visitCount = Number(localStorage.getItem('credentialVisitCount') || 0);

    if (visitCount === 2) {
      // Mostrar mensaje de subir foto de perfil
      const alert = await this.alertCtrl.create({
        header: 'Sube tu Foto',
        message: `
          <p>Por favor, sube una foto de perfil profesional para completar tu credencial.</p>
        `,
        buttons: [
          {
            text: 'Subir Foto',
            handler: () => {
              this.router.navigate(['/subir-foto']);
            },
          },
        ],
      });
      await alert.present();
    }

    // Incrementar el contador
    localStorage.setItem('credentialVisitCount', (visitCount + 1).toString());
  }

  // Método para obtener la URL completa de la imagen
  getProfileImage(relativePath: string): string {
    return `http://190.215.38.222:9595${relativePath}`;
  }

  // Redirige a la página para subir o actualizar foto
  navigateToUpdatePhoto() {
    this.router.navigate(['/subir-foto']);
  }

  // Resetea el temporizador cuando hay actividad del usuario
  @HostListener('document:mousemove')
  @HostListener('document:click')
  @HostListener('document:keydown')
  @HostListener('document:touchstart')
  resetIdleTimer() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
    this.idleTimeout = setTimeout(() => {
      this.logout();
    }, 120000); // 2 minutos
  }

  // Cargar datos del usuario
  loadUser() {
    const correo = localStorage.getItem('correo');
    console.log('Correo obtenido de localStorage:', correo);

    if (correo) {
      this.http
        .get(`http://190.215.38.222:9595/api/users?search=${correo}`)
        .subscribe(
          (res: any) => {
            console.log('Respuesta del servidor:', res);
            if (res && res.length > 0) {
              this.user = res[0];
              this.qrData = JSON.stringify({
                estado: 'Funcionario Validado',
                nombre: this.user.nombre_completo,
                rut: this.user.rut,
              });
              console.log('Datos del usuario:', this.user);
            } else {
              this.loadError = 'Usuario no encontrado';
              console.error('Usuario no encontrado');
            }
          },
          (err) => {
            console.error('Error al obtener usuario', err);
            this.loadError = 'Error al cargar los datos del usuario. Intente nuevamente.';
          }
        );
    } else {
      console.error('Correo no encontrado en localStorage');
      this.loadError = 'No se encontró información de inicio de sesión. Por favor, inicie sesión nuevamente.';
    }
  }

  // Cerrar sesión y limpiar datos de usuario
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('correo');
    localStorage.removeItem('credentialVisitCount'); // Resetear contador en caso de cerrar sesión
    console.log('Sesión cerrada por inactividad');
    this.router.navigate(['/login']);
  }
}
