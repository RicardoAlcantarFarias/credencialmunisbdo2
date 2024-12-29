import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CredencialPageRoutingModule } from './credencial-routing.module';

import { CredencialPage } from './credencial.page';

// Importación del módulo QRCode
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonicModule,
    CredencialPageRoutingModule,
    QRCodeModule  // Agregado aquí el módulo QRCode
  ],
  declarations: [CredencialPage]
})
export class CredencialPageModule {}
