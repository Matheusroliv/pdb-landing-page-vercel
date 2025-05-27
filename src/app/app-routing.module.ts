import { NoPreloading, RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { NgModule } from '@angular/core';
import { MenuMobileComponent } from './menu-mobile/menu-mobile.component';
import { AboutComponent } from './about/about.component';
import { ListInstitutionsComponent } from './map-session/list/list.component';
import { MapComponent } from './map-session/map/map.component';
import { InstitutionProfileComponent } from './institution-profile/institution-profile.component';
import { KnowMoreComponent } from './know-more/know-more.component';
import { KnowMoreInstitutionComponent } from './know-more-institution/know-more-institution.component';
import { ComplaintStep1Component } from './new-complaint/complaint-step1/complaint-step1.component';
import { ComplaintFormsAComponent } from './new-complaint/complaint-step1/fluxoA/complaint-forms-a/complaint-forms-a.component';
import { ComplaintFormsBComponent } from './new-complaint/complaint-step1/fluxoB/complaint-forms-b/complaint-forms-b.component';
import { ComplaintFormsCComponent } from './new-complaint/complaint-step1/fluxoC/complaint-forms-c/complaint-forms-c.component';
import { ComplaintFormsDComponent } from './new-complaint/complaint-step1/fluxoD/complaint-forms-d/complaint-forms-d.component';
import { ComplaintFormsEComponent } from './new-complaint/complaint-step1/fluxoE/complaint-forms-e/complaint-forms-e.component';
import { ComplaintStep2Component } from './new-complaint/complaint-step2/complaint-step2.component';
import { ComplaintStep3Component } from './new-complaint/complaint-step3/complaint-step3.component';
import { ModalFilterComponent } from './modal-filter/modal-filter.component';
import { CalculatorComponent } from './calculator/calculator.component';
import { PpModalComponent } from './pp-modal/pp-modal.component';
import { TermosModalComponentComponent } from './termos-modal-component/termos-modal-component.component';
import { SegurancaModalComponent } from './seguranca-modal/seguranca-modal.component';

const routes: Routes = [
  {
    path: "",
    component: HomeComponent
  },
  {
    path: "home",
    component: HomeComponent
  },
  {
    path: "list",
    component: ListInstitutionsComponent
  },
  {
    path: "map",
    component: MapComponent
  },
  {
    path: "institution-profile/:id",
    component: InstitutionProfileComponent
  },
  {
    path: "about",
    component: AboutComponent
  },
  {
    path: "know-more",
    component: KnowMoreComponent
  },
  {
    path: "know-more-institution",
    component: KnowMoreInstitutionComponent
  },
  {
    path: "new-complaint-step1",
    component: ComplaintStep1Component
  },
  {
    path: "new-complaint-forms-A",
    component: ComplaintFormsAComponent
  },
  {
    path: "new-complaint-forms-B",
    component: ComplaintFormsBComponent
  },
  {
    path: "new-complaint-forms-C",
    component: ComplaintFormsCComponent
  },
  {
    path: "new-complaint-forms-D",
    component: ComplaintFormsDComponent
  },
  {
    path: "new-complaint-forms-E",
    component: ComplaintFormsEComponent
  },
  {
    path: "new-complaint-step2",
    component: ComplaintStep2Component
  },
  {
    path: "new-complaint-step3",
    component: ComplaintStep3Component
  },
  {
    path: "calculator",
    component: CalculatorComponent
  },
  {
    path: "pp-modal",
    component: PpModalComponent
  },
  {
    path: "termos-modal-component",
    component: TermosModalComponentComponent
  },
  {
    path: "seguranca-modal-component",
    component: SegurancaModalComponent
  },
  

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: NoPreloading })
  ],
  exports: [RouterModule]
})

export class AppRoutingModule { }
