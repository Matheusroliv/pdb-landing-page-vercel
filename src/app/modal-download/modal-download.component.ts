import { Component, OnInit } from '@angular/core';
import { MenuMobileService } from '../service/menu-download.service';

@Component({
    selector: 'app-modal-download',
    templateUrl: './modal-download.component.html',
    styleUrls: ['./modal-download.component.scss'],
    standalone: false
})
export class ModalDownloadComponent implements OnInit {

  openModalDownloadApp: boolean = true;

  constructor(private downloadService: MenuMobileService) { }

  ngOnInit(): void {
    this.downloadService.download.subscribe(data => {
        this.openModalDownloadApp = data;
    })
  }

}