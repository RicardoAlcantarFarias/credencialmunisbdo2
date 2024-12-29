import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-subir-foto',
  templateUrl: './subir-foto.page.html',
  styleUrls: ['./subir-foto.page.scss'],
})
export class SubirFotoPage implements OnInit {
  selectedFile: File | null = null;
  previewImage: string | null = null;
  errorMessage: string | null = null;
  correo: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    // Recuperar correo del usuario desde localStorage
    this.correo = localStorage.getItem('correo');
    if (!this.correo) {
      this.errorMessage =
        'Error: No se pudo obtener el correo del usuario. Por favor, inicie sesión nuevamente.';
      this.showAlert('Error', this.errorMessage, '/login');
    }
  }

  async showAlert(header: string, message: string, route: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: [
        {
          text: 'Aceptar',
          handler: () => {
            this.router.navigate([route]);
          },
        },
      ],
    });
    await alert.present();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Generar una vista previa de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadPhoto() {
    if (!this.selectedFile) {
      this.errorMessage = 'Por favor selecciona una foto antes de continuar.';
      return;
    }

    if (!this.correo) {
      this.errorMessage = 'Error: No se pudo obtener el correo del usuario.';
      this.showAlert('Error', this.errorMessage, '/login');
      return;
    }

    const formData = new FormData();
    formData.append('correo', this.correo); // Aseguramos que se envíe el correo
    formData.append('imagen_perfil', this.selectedFile);

    this.http.post('http://190.215.38.222:9595/api/subir-foto', formData).subscribe(
      async (res: any) => {
        const alert = await this.alertCtrl.create({
          header: 'Éxito',
          message: 'Foto de perfil subida correctamente.',
          buttons: [
            {
              text: 'Aceptar',
              handler: () => {
                localStorage.clear(); // Cerrar sesión limpiando el localStorage
                this.router.navigate(['/login']); // Redirigir a la página de inicio de sesión
              },
            },
          ],
        });
        await alert.present();
      },
      async (err) => {
        console.error(err);
        this.errorMessage =
          'Hubo un error al subir tu foto. Por favor intenta nuevamente.';
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: this.errorMessage,
          buttons: ['OK'],
        });
        await alert.present();
      }
    );
  }
}

