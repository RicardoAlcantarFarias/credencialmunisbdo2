import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage {
  users: any[] = [];
  search = '';

  constructor(private http: HttpClient) {
    this.searchUsers(); // Cargar usuarios al iniciar la página
  }

  // Método para buscar usuarios por correo o RUT
  searchUsers() {
    const searchParam = this.search.trim(); // Remover espacios en blanco

    // URL actualizada con prefijo /api, IP y puerto correctos
    let url = `http://190.215.38.222:9595/api/users`;
    
    // Agregar el parámetro search solo si no está vacío
    if (searchParam) {
      url += `?search=${encodeURIComponent(searchParam)}`;
    }

    this.http.get(url).subscribe(
      (res: any) => {
        if (res && res.length > 0) {
          this.users = res; // Asignar los usuarios obtenidos
        } else {
          console.log('No se encontraron usuarios');
          this.users = []; // Limpiar usuarios si no hay resultados
        }
      },
      (err) => {
        console.error('Error al buscar usuarios:', err);
      }
    );
  }

  // Método para actualizar el estado del usuario (por ejemplo, Activo o Inactivo)
  updateUserStatus(id: number, estado: string) {
    // URL actualizada con prefijo /api, IP y puerto correctos
    this.http.put(`http://190.215.38.222:9595/api/update-status/${id}`, { estado }).subscribe(
      (res) => {
        console.log(`Estado del usuario actualizado a ${estado}`);
        this.searchUsers(); // Volver a buscar usuarios para reflejar los cambios
      },
      (err) => {
        console.error('Error al actualizar el estado del usuario:', err);
      }
    );
  }

  // Método para eliminar un usuario
  deleteUser(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      // URL actualizada con prefijo /api, IP y puerto correctos
      this.http.delete(`http://190.215.38.222:9595/api/users/${id}`).subscribe(
        (res) => {
          console.log('Usuario eliminado correctamente');
          this.searchUsers(); // Volver a buscar usuarios después de la eliminación
        },
        (err) => {
          console.error('Error al eliminar el usuario:', err);
        }
      );
    }
  }
}
