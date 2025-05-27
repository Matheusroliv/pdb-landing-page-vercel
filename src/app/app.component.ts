import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { hideFooterService } from './service/hide-footer.service';
import { currentPageService } from './service/currentPage.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})

export class AppComponent implements OnInit {

  title = 'portal-landing-page';

  mustHidefooter: boolean = false;
  currentPage: any;

  constructor(
    private hideFooterService: hideFooterService,
    private currentPageService: currentPageService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.hideFooterService.hidefooter.subscribe(data => {
      this.mustHidefooter = data;
      this.changeDetectorRef.detectChanges();
    })

    this.currentPageService.currentData.subscribe(data => {
      this.currentPage = data;
      this.hideFooterService.changeHidefooter(false);
      this.scrollToTop();
      this.changeDetectorRef.detectChanges();
    })

  }

  scrollToTop() {
    window.scrollTo({
      top: 0
    })
  }

}