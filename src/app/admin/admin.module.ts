import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdminPageRoutingModule } from './admin-routing.module';
import { AdminPage } from './admin.page';

// Importación del módulo QRCode
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminPageRoutingModule,
    QRCodeModule  // Agregado aquí el módulo QRCode
  ],
  declarations: [AdminPage]
})
export class AdminPageModule {}
