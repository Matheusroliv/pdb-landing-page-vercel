import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { currentPageService } from '../../service/currentPage.service';
import { hideFooterService } from '../../service/hide-footer.service';
import { InstitutionsService } from '../../service/institutions.service';
import { MenuMobileService } from '../../service/menu-download.service';
import { InstitutionIconService } from '../../service/institution-icon.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { ModalFilterComponent } from '../../modal-filter/modal-filter.component';
import { Subscription } from 'rxjs';
import { OpenPreRegistrationModalService } from '../../service/open-pre-registration-modal.service';
import { PreRegistrationModalComponent } from '../../pre-registration-modal/pre-registration-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
import { InstitutionQuery, sortType } from '../interface-query';
import { SomeFullModalIsOpenService } from '../../service/someFullModalIsOpen.service';

@Component({
    selector: 'app-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.scss'],
    animations: [
        trigger('fadeInOut', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-in', style({ opacity: 1 })),
            ]),
            transition(':leave', [
                animate('300ms ease-out', style({ opacity: 0 })),
            ]),
        ]),
    ],
    standalone: false
})
export class ListInstitutionsComponent implements OnInit {
  openModalDownloadApp = false;
  openMenu = false;
  openModalInstitutionProfile = false;
  selectedInstitutionId: string | null = null;
  beginOfFirstColumn = 0;
  endOfFirstColumn = 5;
  endOfSecondColumn = 10;
  endOfThirdColumn = 15;
  pagesOfMiddle: number[] = [];
  inicializador = false;
  showPreRegistrationModal = false;
  private preRegistrationModalSubscription: Subscription | undefined;

  query: InstitutionQuery = {};
  page: number = 1;
  limit: number = 15;
  sort: sortType = sortType.A_Z;
  institutions: any[] = [];
  totalItems = 0;
  currentPaginator = 1;
  totalPaginators = 0;
  searchText: string = '';
  activeFilterCount: number = 0;

  constructor(
    private currentPage: currentPageService,
    private menuService: MenuMobileService,
    private someFullModalIsOpenService: SomeFullModalIsOpenService,
    private modalService: NgbModal,
    private hideFolter: hideFooterService,
    private institutionsService: InstitutionsService,
    private institutionIconService: InstitutionIconService,
    private spinner: NgxSpinnerService,
    private openPreRegistrationModalService: OpenPreRegistrationModalService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.currentPage.setCurrentData('list');
    this.qtdOfPaginators();
    this.pagesOfMiddle = [];
    this.putOnPagesOfMiddle();

    this.menuService.menu.subscribe(data => {
      this.openMenu = data;
    });
    this.menuService.setMenu(false);

    this.menuService.download.subscribe(data => {
      this.openModalDownloadApp = data;
    });

    this.someFullModalIsOpenService.currentData.subscribe(data => {
      this.openModalInstitutionProfile = data;
    });

    this.route.queryParams.subscribe(params => {
      const processedParams = { ...params };
      if (processedParams['zipCode']) {
        processedParams['city'] = null;
        processedParams['address'] = null;
        processedParams['state'] = null;
      }

      this.searchText = processedParams['name'] || processedParams['cnpj'] || processedParams['zipCode'] || '';
      this.query = {
        name: processedParams['name'] || '',
        cnpj: processedParams['cnpj'] || '',
        zipCode: processedParams['zipCode'] || '',
        city: processedParams['city'] || '',
        address: processedParams['address'] || '',
        state: processedParams['state'] || '',
        offeredEducationStagesAndModalities: processedParams['educationLevelSource'] === 'emec' ? [] : (processedParams['offeredEducationStagesAndModalities'] ? (Array.isArray(processedParams['offeredEducationStagesAndModalities']) ? processedParams['offeredEducationStagesAndModalities'] : processedParams['offeredEducationStagesAndModalities'].split(',')) : []),
        juridicName: processedParams['juridicName'] || '',
        type: processedParams['type'] || '',
        academicOrganization: processedParams['academicOrganization'] || '',
        openingdateBegin: processedParams['openingdateBegin'] || '',
        openingdateEnd: processedParams['openingdateEnd'] || '',
        rating: processedParams['rating'] ? +processedParams['rating'] : undefined,
        coordinates: processedParams['coordinates'] ? JSON.parse(processedParams['coordinates']) : undefined,
        educationLevelSource: processedParams['educationLevelSource'] || undefined,
      };
      this.sort = processedParams['sort'] === 'Z-A' ? sortType.Z_A : sortType.A_Z;
      this.page = processedParams['page'] ? +processedParams['page'] : 1;
      this.limit = processedParams['limit'] ? +processedParams['limit'] : 15;
      this.currentPaginator = this.page;

      this.updateActiveFilterCount();
      this.listAllInstitutions();
    });

    this.preRegistrationModalSubscription = this.openPreRegistrationModalService.currentData.subscribe(data => {
      this.showPreRegistrationModal = data;
      if (this.showPreRegistrationModal) {
        const modalRef = this.modalService.open(PreRegistrationModalComponent, {
          centered: true,
          size: 'xl',
        });

        modalRef.result.then(
          result => {
            this.openPreRegistrationModalService.setData(false);
            this.showPreRegistrationModal = false;
          },
          reason => {
            if (reason === ModalDismissReasons.BACKDROP_CLICK) {
              this.openPreRegistrationModalService.setData(false);
              this.showPreRegistrationModal = false;
            }
            if (reason === ModalDismissReasons.ESC) {
              this.openPreRegistrationModalService.setData(false);
              this.showPreRegistrationModal = false;
            }
          }
        );
      }
    });
  }

  ngOnDestroy(): void {
    if (this.preRegistrationModalSubscription) {
      this.preRegistrationModalSubscription.unsubscribe();
    }
  }

  async requestGeolocation(): Promise<void> {
    if (this.sort !== sortType.NEXT_LOCATION) {
      this.query.coordinates = undefined;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { coordinates: null },
        queryParamsHandling: 'merge',
      });
      this.listAllInstitutions();
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.query.coordinates = [position.coords.longitude, position.coords.latitude];
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              coordinates: this.query.coordinates ? JSON.stringify(this.query.coordinates) : null,
            },
            queryParamsHandling: 'merge',
          });
          this.listAllInstitutions();
        },
        error => {
          console.warn('Geolocation access denied or unavailable:', error);
          this.query.coordinates = undefined;
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { coordinates: null },
            queryParamsHandling: 'merge',
          });
          if (this.query.zipCode) {
            this.listAllInstitutions();
          } else {
            this.sort = sortType.A_Z;
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { sort: this.sort },
              queryParamsHandling: 'merge',
            });
            alert('Proximidade não disponível (geolocalização negada e sem CEP). Ordenando por A-Z.');
            this.listAllInstitutions();
          }
        }
      );
    } else {
      this.query.coordinates = undefined;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { coordinates: null },
        queryParamsHandling: 'merge',
      });
      if (this.query.zipCode) {
        this.listAllInstitutions();
      } else {
        this.sort = sortType.A_Z;
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { sort: this.sort },
          queryParamsHandling: 'merge',
        });
        alert('Proximidade não disponível (sem geolocalização ou CEP). Ordenando por A-Z.');
        this.listAllInstitutions();
      }
    }
  }

  resetSearch(): void {
    if (!confirm('Deseja limpar todos os filtros e a busca?')) {
      return;
    }

    this.searchText = '';
    this.query = {
      name: '',
      cnpj: '',
      zipCode: '',
      address: '',
      city: '',
      state: '',
      offeredEducationStagesAndModalities: [],
      juridicName: '',
      type: '',
      academicOrganization: '',
      openingdateBegin: '',
      openingdateEnd: '',
      rating: undefined,
      coordinates: undefined,
      educationLevelSource: undefined,
    };

    this.sort = sortType.A_Z;
    this.page = 1;
    this.limit = 15;
    this.currentPaginator = 1;

    this.router.navigate(['/list'], {
      queryParams: { page: 1, limit: 15, sort: 'A-Z' },
      replaceUrl: true,
    });

    this.updateActiveFilterCount();
    this.listAllInstitutions();
    this.cdr.detectChanges();
  }

  hasActiveFilters(): boolean {
    const hasFilters = !!(
      this.query.name ||
      this.query.city ||
      this.query.state ||
      this.query.address ||
      this.query.offeredEducationStagesAndModalities?.length ||
      this.query.educationLevelSource ||
      this.query.zipCode ||
      this.query.cnpj ||
      this.query.juridicName ||
      this.query.type ||
      this.query.academicOrganization?.length ||
      this.query.openingdateBegin ||
      this.query.openingdateEnd ||
      this.query.rating);
    this.updateActiveFilterCount();
    return hasFilters;
  }

  updateActiveFilterCount(): void {
    this.activeFilterCount = 0;
    const filterFields = [
      this.query.name,
      this.query.city,
      this.query.state,
      this.query.address,
      this.query.offeredEducationStagesAndModalities?.length ? true : false,
      this.query.educationLevelSource,
      this.query.zipCode,
      this.query.cnpj,
      this.query.juridicName,
      this.query.type,
      this.query.academicOrganization,
      this.query.openingdateBegin,
      this.query.openingdateEnd,
      this.query.rating,
    ];
    this.activeFilterCount = filterFields.filter(Boolean).length;
  }

  onSearchChange(): void {
    const trimmedSearchText = (this.searchText || '').trim();
    const newQuery = { ...this.query };

    if (!trimmedSearchText) {
      newQuery.name = '';
      newQuery.cnpj = '';
      newQuery.zipCode = '';
      newQuery.address = '';
      newQuery.city = '';
    } else {
      let searchType: string;
      if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(trimmedSearchText)) {
        searchType = 'cnpj';
        newQuery.cnpj = trimmedSearchText;
        newQuery.name = '';
        newQuery.zipCode = '';
        newQuery.address = '';
        newQuery.city = '';
      } else if (/^\d{5}-\d{3}$/.test(trimmedSearchText)) {
        searchType = 'zipCode';
        newQuery.zipCode = trimmedSearchText;
        newQuery.name = '';
        newQuery.cnpj = '';
        newQuery.address = '';
        newQuery.city = '';
      } else if (trimmedSearchText.includes(',') || trimmedSearchText.length > 3) {
        searchType = 'city';
        newQuery.city = trimmedSearchText;
        newQuery.name = '';
        newQuery.cnpj = '';
        newQuery.zipCode = '';
        newQuery.address = '';
      } else if (trimmedSearchText.length > 5) {
        searchType = 'address';
        newQuery.address = trimmedSearchText;
        newQuery.name = '';
        newQuery.cnpj = '';
        newQuery.zipCode = '';
        newQuery.city = '';
      } else {
        searchType = 'name';
        newQuery.name = trimmedSearchText;
        newQuery.cnpj = '';
        newQuery.zipCode = '';
        newQuery.address = '';
        newQuery.city = '';
      }
    }

    this.query = newQuery;
    this.page = 1;
    this.currentPaginator = 1;

    const queryParams: any = {
      page: this.page,
      limit: this.limit,
      sort: this.sort,
    };

    for (const [key, value] of Object.entries(this.query)) {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        (!Array.isArray(value) || value.length > 0)
      ) {
        queryParams[key] = Array.isArray(value) ? value.join(',') : value;
      }
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });

    this.updateActiveFilterCount();
    this.listAllInstitutions();
  }

  listAllInstitutions() {
    if (this.query.educationLevelSource === 'emec') {
      this.query.offeredEducationStagesAndModalities = [];
    }
    if (this.query.offeredEducationStagesAndModalities && !Array.isArray(this.query.offeredEducationStagesAndModalities)) {
      this.query.offeredEducationStagesAndModalities = [this.query.offeredEducationStagesAndModalities];
    }
    this.spinner.show();
    this.institutionsService.listInstitutions(this.page, this.limit, this.sort, this.query).subscribe({
      next: (response: any) => {
        this.institutions = response.data.map((institution: any) => ({
          ...institution,
          name: this.getInstitutionName(institution),
          characteristics: this.getCharacteristics(institution),
          cleanAddress: this.getCleanAddress(institution),
          randomIcon: this.institutionIconService.getRandomIcon(),
        }));
        this.totalItems = response.totalCount || response.data.length;
        this.qtdOfPaginators();
        this.putOnPagesOfMiddle();
        this.spinner.hide();
      },
      error: (err: any) => {
        console.error('ListInstitutionsComponent - Erro ao carregar instituições:', err);
        this.institutions = [];
        this.totalItems = 0;
        this.spinner.hide();
      },
    });
  }

  applyLocationFilters(filters: any) {
    this.spinner.show();
    this.query = {
      name: this.query.name || '',
      cnpj: this.query.cnpj || '',
      zipCode: filters.zipCode || '',
      city: filters.city || '',
      address: filters.address || '',
      state: filters.state || '',
      offeredEducationStagesAndModalities: filters.educationLevelSource === 'emec' ? [] : (filters.offeredEducationStagesAndModalities || []),
      juridicName: filters.juridicName || '',
      type: filters.type || '',
      academicOrganization: filters.academicOrganization || '',
      openingdateBegin: filters.openingdateBegin || '',
      openingdateEnd: filters.openingdateEnd || '',
      rating: filters.rating || undefined,
      coordinates: filters.coordinates || this.query.coordinates,
      educationLevelSource: filters.educationLevelSource || undefined,
    };

    const queryParams: any = {
      page: this.page,
      limit: this.limit,
      sort: this.sort,
    };

    if (this.query.zipCode) {
      queryParams.zipCode = this.query.zipCode;
      queryParams.city = null;
      queryParams.address = null;
      queryParams.state = null;
    } else {
      if (this.query.city) queryParams.city = this.query.city;
      if (this.query.address) queryParams.address = this.query.address;
      if (this.query.state) queryParams.state = this.query.state;
    }

    if (this.query.name) queryParams.name = this.query.name;
    if (this.query.cnpj) queryParams.cnpj = this.query.cnpj;
    if (this.query.offeredEducationStagesAndModalities?.length && this.query.educationLevelSource !== 'emec') {
      queryParams.offeredEducationStagesAndModalities = this.query.offeredEducationStagesAndModalities.join(',');
    }
    if (this.query.juridicName) queryParams.juridicName = this.query.juridicName;
    if (this.query.type) queryParams.type = this.query.type;
    if (this.query.academicOrganization) {
      queryParams.academicOrganization = this.query.academicOrganization;
    }
    if (this.query.openingdateBegin) queryParams.openingdateBegin = this.query.openingdateBegin;
    if (this.query.openingdateEnd) queryParams.openingdateEnd = this.query.openingdateEnd;
    if (this.query.coordinates) queryParams.coordinates = JSON.stringify(this.query.coordinates);
    if (this.query.educationLevelSource) queryParams.educationLevelSource = this.query.educationLevelSource;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    this.listAllInstitutions();
  }

  showFilterModal(reset: boolean = false): void {
    const modalRef = this.modalService.open(ModalFilterComponent, { centered: true });
    modalRef.componentInstance.currentFilters = { ...this.query };
    if (reset) {
      modalRef.componentInstance.resetFilters();
    }
    modalRef.componentInstance.applyFilters.subscribe((filters: any) => {
      this.applyLocationFilters(filters);
    });
  }

  onSortChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedSort = selectElement.value as sortType;

    this.sort = selectedSort;
    this.requestGeolocation();
    this.listAllInstitutions();
  }

  getInstitutionName(institution: any): string {
    const emec = institution.emec || {};
    const inep = institution.inep || {};
    const cebas = institution.cebas || {};
    const fiscal = institution.fiscal || {};

    if (emec.iesName) {
      return emec.iesName;
    } else if (inep.school) {
      return inep.school;
    } else if (cebas.maintainersName) {
      return cebas.maintainersName;
    } else if (fiscal.fantasyName) {
      return fiscal.fantasyName;
    } else if (fiscal.socialReason) {
      return fiscal.socialReason;
    }
    return 'Nome não disponível';
  }

  getCharacteristics(institution: any): string {
    const fiscal = institution.fiscal || {};
    const emec = institution.emec || {};
    const inep = institution.inep || {};

    if (fiscal.juridicName) {
      return fiscal.juridicName;
    } else if (fiscal.type) {
      return fiscal.type;
    } else if (emec.academicOrganization) {
      return emec.academicOrganization;
    } else if (inep.privateSchoolCategory) {
      return `Escola ${inep.privateSchoolCategory}`;
    } else if (inep.administrativeCategory) {
      return `Escola ${inep.administrativeCategory}`;
    } else {
      return 'Não disponível';
    }
  }

  getCleanAddress(institution: any): string {
    const fiscal = institution.fiscal || {};
    const emec = institution.emec || {};
    const inep = institution.inep || {};

    let address = '';
    if (inep.address?.address) {
      address = inep.address.address;
    } else if (emec.address?.address) {
      address = emec.address.address;
    } else if (fiscal.address?.address) {
      address = fiscal.address.address;
    } else {
      return 'Endereço não disponível';
    }

    const socialReason = fiscal.socialReason || '';
    if (socialReason && address.includes(socialReason)) {
      address = address.replace(socialReason, '').trim();
    }

    return address || 'Endereço não disponível';
  }

  qtdOfPaginators() {
    this.totalPaginators = Math.ceil(this.totalItems / this.limit);
  }

  putOnPagesOfMiddle() {
    this.pagesOfMiddle = [];
    const start = Math.max(2, this.currentPaginator - 2);
    const end = Math.min(this.totalPaginators - 1, this.currentPaginator + 2);
    for (let i = start; i <= end; i++) {
      console.log(i)
      this.pagesOfMiddle.push(i);
    }
  }

  backOnePage() {
    if (this.page > 1) {
      this.page -= 1;
      this.currentPaginator = this.page;
      this.updateUrlQueryParams();
      this.listAllInstitutions();
    }
  }

  walkOnePage() {
    if (this.page < this.totalPaginators) {
      this.page += 1;
      this.currentPaginator = this.page;
      this.updateUrlQueryParams();
      this.listAllInstitutions();
    }
  }

  updateUrlQueryParams() {
    const queryParams: any = {
      page: this.page,
      limit: this.limit,
      sort: this.sort,
    };

    for (const [key, value] of Object.entries(this.query)) {
      if (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        (!Array.isArray(value) || value.length > 0)
      ) {
        if (key === 'offeredEducationStagesAndModalities' && this.query.educationLevelSource === 'emec') {
          continue;
        }
        queryParams[key] = Array.isArray(value) ? value.join(',') : (key === 'rating' ? value.toString() : value);
      }
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  goToPage(num: number) {
    this.page = num;
    this.currentPaginator = num;
    this.updateUrlQueryParams();
    this.listAllInstitutions();
  }

  closeMenu() {
    this.menuService.setMenu(false);
    this.hideFolter.changeHidefooter(false);
  }

  showThisPaginator(num: number) {
    return num === this.currentPaginator || Math.abs(num - this.currentPaginator) <= 2;
  }

  showThisPaginatorLast(num: number) {
    return num > this.totalPaginators - 5;
  }

  showPaginatorMiddle() {
    return this.totalPaginators >= 7 && this.currentPaginator > 2 && this.currentPaginator < this.totalPaginators - 1;
  }

  changeModalDownloadApp(b: boolean) {
    this.openModalDownloadApp = b;
    this.menuService.setDownload(b);
  }

  openInstitutionProfile(institutionId: string) {
    this.selectedInstitutionId = institutionId;
    this.changeModalInstitutionProfile(true);
  }

  changeModalInstitutionProfile(b: boolean) {
    this.openModalInstitutionProfile = b;
    this.someFullModalIsOpenService.setCurrentData(b);
    if (!b) {
      this.selectedInstitutionId = null;
      document.body.classList.remove('modal-open');
    } else {
      document.body.classList.add('modal-open');
    }
  }
}
