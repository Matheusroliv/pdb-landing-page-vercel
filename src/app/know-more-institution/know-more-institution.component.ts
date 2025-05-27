import { Component, OnInit } from '@angular/core';
import { MenuMobileService } from '../service/menu-download.service';
import { hideFooterService } from '../service/hide-footer.service';
import { currentPageService } from '../service/currentPage.service';
import { OpenPreRegistrationModalService } from '../service/open-pre-registration-modal.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { PreRegistrationModalComponent } from '../pre-registration-modal/pre-registration-modal.component';

@Component({
    selector: 'app-know-more-institution',
    templateUrl: './know-more-institution.component.html',
    styleUrls: ['./know-more-institution.component.scss'],
    standalone: false
})
export class KnowMoreInstitutionComponent implements OnInit {

  informationBoxes = [false, false, false]
  openMenu: boolean = false;
  openModalDownloadApp: boolean = false;
  showPreRegistrationModal = false
  private preRegistrationModalSubscription: Subscription | undefined;

  constructor(
    private menuService: MenuMobileService,
    private hideFooterService: hideFooterService,
    private currentPage: currentPageService,
    private openPreRegistrationModalService: OpenPreRegistrationModalService,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    this.menuService.menu.subscribe(data => {
        this.openMenu = data;
    })
    this.menuService.setMenu(false);

    this.menuService.download.subscribe(data => {
        this.openModalDownloadApp = data;
    })

    this.currentPage.setCurrentData('know more')

    this.preRegistrationModalSubscription = this.openPreRegistrationModalService.currentData.subscribe(data => {
      this.showPreRegistrationModal = data
      if (this.showPreRegistrationModal) {
        const modalRef = this.modalService.open(PreRegistrationModalComponent, {
          centered: true,
          size: 'xl'
        })

        modalRef.result.then(
          (result) => {
            console.log('Fechado com:', result);
            this.openPreRegistrationModalService.setData(false)
            this.showPreRegistrationModal = false
          },
          (reason) => {
            if (reason === ModalDismissReasons.BACKDROP_CLICK) {
              console.log('Fechado ao clicar fora do modal');
              this.openPreRegistrationModalService.setData(false)
              this.showPreRegistrationModal = false
            }
            if (reason === ModalDismissReasons.ESC) {
              console.log('Fechado ao pressionar Esc');
              this.openPreRegistrationModalService.setData(false)
              this.showPreRegistrationModal = false
            }
          }
        );
      }
    })
  }

  ngOnDestroy(): void {
    if (this.preRegistrationModalSubscription) {
      this.preRegistrationModalSubscription.unsubscribe()
    }
  }

  changeinformationBox1(i: number) {
    if (this.informationBoxes[i]) this.informationBoxes[i] = false
    else {
        for (let j = 0; j < this.informationBoxes.length; j++) {
            if (j == i) this.informationBoxes[j] = true
            else this.informationBoxes[j] = false
        }
    }
  }

  closeMenu() {
    this.menuService.setMenu(false);
    this.hideFooterService.changeHidefooter(false);
  }

  changeModalDownloadApp(b: boolean) {
    this.openModalDownloadApp = b;
    this.menuService.setDownload(b);
  }

  downloadCartilha(){
    const link = document.createElement('a');
    link.href = 'assets/cartilha.pdf';
    link.download = 'Cartilha - Boas Práticas de Políticas Inclusivas de Bolsas de Estudo.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

}