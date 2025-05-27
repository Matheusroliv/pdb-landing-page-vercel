import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskDirective, NgxMaskPipe, provideEnvironmentNgxMask } from 'ngx-mask';
import { NgxSpinnerModule } from 'ngx-spinner';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { ToastrModule } from 'ngx-toastr';
import { RouterModule } from '@angular/router'; // Added RouterModule
import { AboutComponent } from './about/about.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CalculatorComponent } from './calculator/calculator.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { InstitutionProfileComponent } from './institution-profile/institution-profile.component';
import { KnowMoreInstitutionComponent } from './know-more-institution/know-more-institution.component';
import { KnowMoreComponent } from './know-more/know-more.component';
import { ListInstitutionsComponent } from './map-session/list/list.component';
import { MapComponent } from './map-session/map/map.component';
import { MenuMobileComponent } from './menu-mobile/menu-mobile.component';
import { ModalDownloadComponent } from './modal-download/modal-download.component';
import { ModalFilterComponent } from './modal-filter/modal-filter.component';
import { ComplaintStep1Component } from './new-complaint/complaint-step1/complaint-step1.component';
import { ComplaintFormsAComponent } from './new-complaint/complaint-step1/fluxoA/complaint-forms-a/complaint-forms-a.component';
import { ComplaintFormsBComponent } from './new-complaint/complaint-step1/fluxoB/complaint-forms-b/complaint-forms-b.component';
import { ComplaintFormsCComponent } from './new-complaint/complaint-step1/fluxoC/complaint-forms-c/complaint-forms-c.component';
import { ComplaintFormsDComponent } from './new-complaint/complaint-step1/fluxoD/complaint-forms-d/complaint-forms-d.component';
import { ComplaintFormsEComponent } from './new-complaint/complaint-step1/fluxoE/complaint-forms-e/complaint-forms-e.component';
import { ComplaintStep2Component } from './new-complaint/complaint-step2/complaint-step2.component';
import { ComplaintStep3Component } from './new-complaint/complaint-step3/complaint-step3.component';
import { PreRegistrationModalComponent } from './pre-registration-modal/pre-registration-modal.component';
import { currentPageService } from './service/currentPage.service';
import { getAddressByCepService } from './service/getAddressByCep.service';
import { hideFooterService } from './service/hide-footer.service';
import { InstitutionIconService } from './service/institution-icon.service';
import { InstitutionsService } from './service/institutions.service';
import { MenuMobileService } from './service/menu-download.service';
import { SomeFullModalIsOpenService } from './service/someFullModalIsOpen.service';
import { UserService } from './service/user.service';
import { PpModalComponent } from './pp-modal/pp-modal.component';
import { OpenPreRegistrationModalService } from './service/open-pre-registration-modal.service';
import { ReviewsService } from './service/reviews.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    FooterComponent,
    MapComponent,
    AboutComponent,
    HeaderComponent,
    MenuMobileComponent,
    ModalDownloadComponent,
    KnowMoreComponent,
    KnowMoreInstitutionComponent,
    PreRegistrationModalComponent,
    ComplaintStep1Component,
    ComplaintFormsAComponent,
    ComplaintFormsBComponent,
    ComplaintFormsCComponent,
    ComplaintFormsDComponent,
    ComplaintFormsEComponent,
    ComplaintStep2Component,
    ComplaintStep3Component,
    ListInstitutionsComponent,
    InstitutionProfileComponent,
    ModalFilterComponent,
    CalculatorComponent,
    PpModalComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    IonicModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    ToastrModule.forRoot(),
    CarouselModule.forRoot(),
    BrowserAnimationsModule,
    NgxMaskDirective,
    NgxMaskPipe,
    NgbModule,
    CommonModule,
    NgxSpinnerModule.forRoot({
      type: 'ball-scale-multiple'
    }),
    RouterModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    hideFooterService,
    currentPageService,
    MenuMobileService,
    SomeFullModalIsOpenService,
    InstitutionsService,
    UserService,
    ReviewsService,
    provideEnvironmentNgxMask(),
    getAddressByCepService,
    InstitutionIconService,
    OpenPreRegistrationModalService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
