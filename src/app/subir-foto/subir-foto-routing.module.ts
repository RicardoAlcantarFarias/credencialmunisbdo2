import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SubirFotoPage } from './subir-foto.page';

const routes: Routes = [
  {
    path: '',
    component: SubirFotoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubirFotoPageRoutingModule {}
