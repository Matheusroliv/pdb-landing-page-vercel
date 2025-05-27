import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { currentPageService } from '../service/currentPage.service';
import { MenuMobileComponent } from '../menu-mobile/menu-mobile.component';
import { MenuMobileService } from '../service/menu-download.service';
import { SomeFullModalIsOpenService } from '../service/someFullModalIsOpen.service';
import { hideFooterService } from '../service/hide-footer.service';
import { Router } from '@angular/router';
import { OpenPreRegistrationModalService } from '../service/open-pre-registration-modal.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: false
})
export class HeaderComponent implements OnInit {

  currentPage: any;
  openMenu: boolean = false;
  someFullModalIsOpen: boolean = false;
  openKnowMore: boolean = false;

  constructor(
    private currentPageService: currentPageService, 
    private changeDetectorRef: ChangeDetectorRef,
    private menuDownloadService: MenuMobileService,
    private someFullModalIsOpenService: SomeFullModalIsOpenService,
    private hideFolter: hideFooterService,
    private router: Router,
    private openPreRegistrationModalService: OpenPreRegistrationModalService
  ) { }

  ngOnInit(): void {
    this.currentPageService.currentData.subscribe(data => {
        this.currentPage = data;
        this.openKnowMore = false;
        this.changeDetectorRef.detectChanges();
    })

    this.someFullModalIsOpenService.currentData.subscribe(data => {
      this.someFullModalIsOpen = data;
    })
  }

  changeMenu(b: boolean) {
    this.openMenu = true;
    this.hideFolter.changeHidefooter(b)
    this.menuDownloadService.setMenu(b);
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

  openPreRegistrationModal() {
    this.openPreRegistrationModalService.setData(true)
  }

}