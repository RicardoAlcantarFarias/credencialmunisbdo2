import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SubirFotoPageRoutingModule } from './subir-foto-routing.module';

import { SubirFotoPage } from './subir-foto.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SubirFotoPageRoutingModule
  ],
  declarations: [SubirFotoPage]
})
export class SubirFotoPageModule {}
