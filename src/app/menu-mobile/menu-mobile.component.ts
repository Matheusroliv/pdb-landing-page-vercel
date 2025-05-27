import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuMobileService } from '../service/menu-download.service';
import { currentPageService } from '../service/currentPage.service';
import { hideFooterService } from '../service/hide-footer.service';
import { OpenPreRegistrationModalService } from '../service/open-pre-registration-modal.service';

@Component({
    selector: 'app-menu-mobile',
    templateUrl: './menu-mobile.component.html',
    styleUrls: ['./menu-mobile.component.scss'],
    standalone: false
})
export class MenuMobileComponent implements OnInit {

  openMenu: boolean = true;
  openModalDownload: boolean = false;
  currentPage: any;
  openKnowMore: boolean = false;
  showModal = false;
  
  constructor(
    private router: Router,
    private menuDownloadService: MenuMobileService,
    private currentPageService: currentPageService,
    private changeDetectorRef: ChangeDetectorRef,
    private hideFolter: hideFooterService,
    private openPreRegistrationModalService: OpenPreRegistrationModalService,
  ) { }

  ngOnInit(): void {
    this.menuDownloadService.menu.subscribe(data => {
      this.openMenu = data;
    })
    
    this.menuDownloadService.download.subscribe(data => {
      this.openModalDownload = data;
    })

    this.currentPageService.currentData.subscribe(data => {
      this.currentPage = data;
      this.changeDetectorRef.detectChanges();
    })

    this.menuDownloadService.registerModalMobile.subscribe(data => {
      this.showModal = false;
    })

  }

  changeMenu(b: boolean) {
    this.openMenu = b;
    this.menuDownloadService.setMenu(b);
    this.hideFolter.changeHidefooter(b);
    this.showModal = false;
  }

  changeModalDownloadApp(b: boolean) {
    this.openModalDownload = b;
    this.menuDownloadService.setDownload(b);
  }

  reloadHome() {
    this.router.navigate(['/home']);
  }

  changeOpenKnowMore() {
    if (this.openKnowMore) this.openKnowMore = false
    else this.openKnowMore = true
    console.log(this.openKnowMore)
  }

  goToKnowMore(route: any) {
    this.openKnowMore = false;
    if (route == 'Estudantes') {
      this.router.navigate(['/know-more'])
    }
    if (route == 'Instituições') {
      this.router.navigate(['/know-more-institution'])
    }
  }

  openModal() {
    this.showModal = !this.showModal;
    this.openPreRegistrationModalService.setData(true)
  }

}