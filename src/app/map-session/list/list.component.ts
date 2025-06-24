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
import { ToastrService } from 'ngx-toastr';

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

  isLoading: boolean = false;
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
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
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
        name: processedParams['name'] || undefined,
        cnpj: processedParams['cnpj'] || undefined,
        zipCode: processedParams['zipCode'] || undefined,
        city: processedParams['city'] || undefined,
        address: processedParams['address'] || undefined,
        state: processedParams['state'] || undefined,
        juridicName: processedParams['juridicName'] || undefined,
        type: processedParams['type'] || undefined,
        academicOrganization: processedParams['academicOrganization'] || undefined,
        openingdateBegin: processedParams['openingdateBegin'] || undefined,
        openingdateEnd: processedParams['openingdateEnd'] || undefined,
        rating: processedParams['rating'] ? Number(processedParams['rating']) : undefined,
        coordinates: processedParams['coordinates']
          ? (processedParams['coordinates'].split(',').map(Number) as [number, number])
          : undefined,
        educationLevelSource: processedParams['educationLevelSource'] || undefined,
        acessibility: processedParams['acessibility'] ? processedParams['acessibility'].split(',') : undefined,
        phone: processedParams['phone'] === 'true' ? true : undefined,
        email: processedParams['email'] === 'true' ? true : undefined,
        site: processedParams['site'] === 'true' ? true : undefined,
        scholarshipPolicy: processedParams['scholarshipPolicy'] || undefined,
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
    return new Promise((resolve) => {
      if (this.sort !== sortType.NEXT_LOCATION) {
        this.query.coordinates = undefined;
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { coordinates: null },
          queryParamsHandling: 'merge',
        });
        this.listAllInstitutions();
        resolve();
        return;
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          position => {
            const longitude = position.coords.longitude;
            const latitude = position.coords.latitude;
            if (longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90) {
              this.query.coordinates = [longitude, latitude];
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { coordinates: JSON.stringify(this.query.coordinates) },
                queryParamsHandling: 'merge',
              });
            } else {
              console.warn('Invalid coordinates received:', [longitude, latitude]);
              this.query.coordinates = undefined;
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { coordinates: null },
                queryParamsHandling: 'merge',
              });
            }
            this.listAllInstitutions();
            resolve();
          },
          error => {
            console.warn('Geolocation access denied or unavailable:', error);
            this.query.coordinates = undefined;
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { coordinates: null },
              queryParamsHandling: 'merge',
            });
            this.sort = sortType.A_Z;
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { sort: this.sort },
              queryParamsHandling: 'merge',
            });
            alert('Proximidade não disponível (geolocalização negada). Ordenando por A-Z.');
            this.listAllInstitutions();
            resolve();
          }
        );
      } else {
        this.query.coordinates = undefined;
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { coordinates: null },
          queryParamsHandling: 'merge',
        });
        this.sort = sortType.A_Z;
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { sort: this.sort },
          queryParamsHandling: 'merge',
        });
        alert('Proximidade não disponível (sem geolocalização). Ordenando por A-Z.');
        this.listAllInstitutions();
        resolve();
      }
    });
  }

  resetSearch(): void {
    if (!confirm('Deseja limpar todos os filtros e a busca?')) {
      return;
    }

    this.searchText = '';
    this.query = {
      name: undefined,
      cnpj: undefined,
      zipCode: undefined,
      city: undefined,
      address: undefined,
      state: undefined,
      juridicName: undefined,
      type: undefined,
      academicOrganization: undefined,
      openingdateBegin: undefined,
      openingdateEnd: undefined,
      rating: undefined,
      coordinates: undefined,
      educationLevelSource: undefined,
      acessibility: undefined,
      phone: undefined,
      email: undefined,
      site: undefined,
      scholarshipPolicy: undefined,
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
      this.query.name?.trim() ||
      this.query.cnpj?.trim() ||
      this.query.zipCode?.trim() ||
      this.query.city?.trim() ||
      this.query.address?.trim() ||
      this.query.state?.trim() ||
      this.query.juridicName?.trim() ||
      this.query.type?.trim() ||
      this.query.academicOrganization?.trim() ||
      this.query.openingdateBegin?.trim() ||
      this.query.openingdateEnd?.trim() ||
      this.query.rating !== undefined ||
      this.query.coordinates ||
      this.query.educationLevelSource ||
      (this.query.acessibility && this.query.acessibility.length > 0) ||
      this.query.phone === true ||
      this.query.email === true ||
      this.query.site === true ||
      this.query.scholarshipPolicy?.trim()
    );
    this.updateActiveFilterCount();
    return hasFilters;
  }

  updateActiveFilterCount(): void {
    this.activeFilterCount = 0;
    const filterFields = [
      this.query.name?.trim(),
      this.query.cnpj?.trim(),
      this.query.zipCode?.trim(),
      this.query.city?.trim(),
      this.query.address?.trim(),
      this.query.state?.trim(),
      this.query.juridicName?.trim(),
      this.query.type?.trim(),
      this.query.academicOrganization?.trim(),
      this.query.openingdateBegin?.trim(),
      this.query.openingdateEnd?.trim(),
      this.query.rating !== undefined ? this.query.rating : null,
      this.query.coordinates,
      this.query.educationLevelSource,
      (this.query.acessibility && this.query.acessibility.length > 0) ? this.query.acessibility : null,
      this.query.phone === true ? true : null,
      this.query.email === true ? true : null,
      this.query.site === true ? true : null,
      this.query.scholarshipPolicy?.trim(),
    ];
    this.activeFilterCount = filterFields.filter(Boolean).length;
  }

  onSearchChange(): void {
    const trimmedSearchText = (this.searchText || '').trim();

    const newQuery = {
      ...this.query,
      name: trimmedSearchText || undefined,
      cnpj: this.query.cnpj || undefined,
      zipCode: this.query.zipCode || undefined || '',
      city: this.query.city || undefined,
      address: this.query.address || undefined,
    };

    this.query = newQuery;

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
        queryParams[key] = Array.isArray(value) && key !== 'coordinates' ? value.join(',') : key === 'coordinates' ? JSON.stringify(value) : String(value);
      }
    }

    console.log('Search query params to URL:', queryParams);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    this.updateActiveFilterCount();
    this.listAllInstitutions();
  }

  listAllInstitutions() {
    if (this.isLoading) return;
    console.log('Query object before request:', this.query);
    this.isLoading = true;
    this.spinner.show();
    this.institutionsService.listInstitutions(this.page, this.limit, this.sort, this.query).subscribe({
      next: (response: any) => {
        this.institutions = response.data.map((institution: any) => {
          const register = institution.registerInstitution || {};
          const inep = institution.inep || {};
          const emec = institution.emec || {};

          const isVerified = register && register.status === 'APPROVED' ? true : false;
          const isFist = this.getIsFist(institution);
          const isInstitution = (register && Object.keys(register).length > 0) ||
            (inep && Object.keys(inep).length > 0) ||
            (emec && Object.keys(emec).length > 0) ? true : false;
          const hasAccessibility = this.getHasAccessibility(institution);

          return {
            ...institution,
            name: this.getInstitutionName(institution),
            characteristics: this.getCharacteristics(institution),
            cleanAddress: this.getCleanAddress(institution),
            randomIcon: this.institutionIconService.getRandomIcon(),
            educationLevel: this.getEducationLevel(institution),
            isVerified,
            isFist,
            isInstitution,
            hasAccessibility
          };
        });
        this.totalItems = response.totalCount || response.data.length;
        this.qtdOfPaginators();
        this.putOnPagesOfMiddle();
        this.isLoading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading institutions:', err);
        this.toastr.error('Failed to load institutions. Please check your filters or try again later.');
        this.institutions = [];
        this.totalItems = 0;
        this.isLoading = false;
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
      juridicName: filters.juridicName || '',
      type: filters.type || '',
      academicOrganization: filters.academicOrganization || '',
      openingdateBegin: filters.openingdateBegin || '',
      openingdateEnd: filters.openingdateEnd || '',
      rating: filters.rating || undefined,
      coordinates: filters.coordinates || this.query.coordinates,
      educationLevelSource: filters.educationLevelSource || undefined,
      acessibility: filters.acessibility || undefined,
      phone: filters.phone || undefined,
      email: filters.email || undefined,
      site: filters.site || undefined,
      scholarshipPolicy: filters.scholarshipPolicy || '',
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
    if (this.query.educationLevelSource) queryParams.educationLevelSource = this.query.educationLevelSource;
    if (this.query.juridicName) queryParams.juridicName = this.query.juridicName;
    if (this.query.type) queryParams.type = this.query.type;
    if (this.query.academicOrganization) {
      queryParams.academicOrganization = this.query.academicOrganization;
    }
    if (this.query.openingdateBegin) queryParams.openingdateBegin = this.query.openingdateBegin;
    if (this.query.openingdateEnd) queryParams.openingdateEnd = this.query.openingdateEnd;
    if (this.query.coordinates) queryParams.coordinates = JSON.stringify(this.query.coordinates);
    if (this.query.rating) queryParams.rating = this.query.rating.toString();
    if (this.query.acessibility) queryParams.acessibility = this.query.acessibility.join(',');
    queryParams.phone = this.query.phone === true ? 'true' : null;
    queryParams.email = this.query.email === true ? 'true' : null;
    queryParams.site = this.query.site === true ? 'true' : null;
    if (this.query.scholarshipPolicy) queryParams.scholarshipPolicy = this.query.scholarshipPolicy;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    console.log('Updated query after filters:', this.query);
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

  async onSortChange(event: Event): Promise<void> {
    const selectElement = event.target as HTMLSelectElement;
    const selectedSort = selectElement.value as sortType;

    this.sort = selectedSort;
    if (selectedSort === sortType.NEXT_LOCATION) {
      await this.requestGeolocation();
    } else {
      this.query.coordinates = undefined;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { coordinates: null },
        queryParamsHandling: 'merge',
      });
    }
    this.listAllInstitutions();
  }

  getInstitutionName(institution: any): string {
    const fiscal = institution.fiscal || {};
    const cebas = institution.cebas || {};
    const emec = institution.emec || {};
    const inep = institution.inep || {};
    const register = institution.registerInstitution || {};

    let name = 'Nome não disponível';
    if (register.institutionName) name = register.institutionName;
    else if (emec.iesName) name = emec.iesName;
    else if (inep.school) name = inep.school;
    else if (cebas.maintainersName) name = cebas.maintainersName;
    else if (fiscal.fantasyName) name = fiscal.fantasyName;
    else if (fiscal.socialReason) name = fiscal.socialReason;

    return name;
  }

  getIsFist(institution: any): boolean {
    const register = institution.registerInstitution || {};
    let isFist = false;
    if (register.scholarships && register.scholarships.quotas_offered) {
      isFist = register.scholarships.quotas_offered.some(
        (quota: any) => quota.quotas_type === 'Cotas raciais'
      );
    }
    return isFist;
  }

  getHasAccessibility(institution: any): boolean {
    const register = institution.registerInstitution || {};
    let hasAccessibility = false;
    if (register.scholarships && register.scholarships.quotas_offered) {
      hasAccessibility = register.scholarships.quotas_offered.some(
        (quota: any) => quota.quotas_type === 'Cotas PCD'
      );
    } else if (institution.inep?.attendanceRestriction === 'ESCOLA ATENDE EXCLUSIVAMENTE ALUNOS COM DEFICIÊNCIA') {
      hasAccessibility = true;
    }
    return hasAccessibility;
  }

  getCharacteristics(institution: any): string {
    const fiscal = institution.fiscal || {};
    const inep = institution.inep || {};
    const emec = institution.emec || {};
    const cebas = institution.cebas || {};
    const register = institution.registerInstitution || {};

    const characteristics: string[] = [];

    // 1. fiscal.juridicName
    if (fiscal.juridicName) {
      characteristics.push(fiscal.juridicName);
    }

    // 2. register.institution_type ou institutionfiscal.type
    if (register.institution_type) {
      characteristics.push(register.institution_type === 'Matriz' || register.institution_type === 'MATRIX' ? 'Matriz' : 'Filial');
    } else if (fiscal.type) {
      characteristics.push(fiscal.type);
    }

    // 3. institutionemec.academicorganization
    if (emec.academicorganization) {
      characteristics.push(emec.academicorganization);
    }

    // 4. "Escola" institutioninep.privateschoolCategory
    if (inep.privateschoolCategory) {
      characteristics.push(`Escola ${inep.privateschoolCategory}`);
    }

    // 5. emec.accreditationType
    if (emec.accreditationType) {
      characteristics.push(emec.accreditationType);
    }

    // 6. register.administrative_category ou emec.administrativeCategory ou inep.administrativeCategory
    if (register.administrative_category) {
      characteristics.push(
        register.administrative_category === 'PRIVATE_NON_PROFIT' || register.administrative_category === 'Sem fins lucrativos'
          ? 'Sem fins lucrativos'
          : 'Com fins lucrativos'
      );
    } else if (emec.administrativeCategory) {
      characteristics.push(
        emec.administrativeCategory === 'PRIVATE_NON_PROFIT' || emec.administrativeCategory === 'Sem fins lucrativos'
          ? 'Sem fins lucrativos'
          : 'Com fins lucrativos'
      );
    } else if (inep.administrativeCategory) {
      characteristics.push(
        inep.administrativeCategory === 'PRIVATE_NON_PROFIT' || inep.administrativeCategory === 'Sem fins lucrativos'
          ? 'Sem fins lucrativos'
          : 'Com fins lucrativos'
      );
    }

    if (cebas.ordinance && cebas.ordinance !== '' && cebas.ordinance !== '----') {
      characteristics.push(`CEBAS (${cebas.ordinance})`);
    }


    return characteristics.length > 0 ? characteristics.join(', ') : 'Não informado';
  }

  getCleanAddress(institution: any): string {
    const fiscal = institution.fiscal || {};
    const emec = institution.emec || {};
    const inep = institution.inep || {};
    const register = institution.registerInstitution || {};

    let address = '';
    if (inep.address?.address) {
      address = inep.address.address;
    } else if (emec.address?.address) {
      address = emec.address.address;
    } else if (fiscal.address?.address) {
      address = fiscal.address.address;
    } else if (register.address?.address) {
      const street = register.address.address || '';
      const number = register.address.number ? String(register.address.number) : '';
      address = number ? `${street}, ${number}` : street;
    } else {
      return 'Endereço não disponível';
    }

    if (register.address?.address) {
      const street = register.address.address || '';
      const number = register.address.number ? String(register.address.number) : '';
      address = number ? `${street}, ${number}` : street;
    } else if (fiscal.address?.address) {
      const street = fiscal.address.address || '';
      const number = fiscal.address.number ? String(fiscal.address.number) : '';
      address = number ? `${street}, ${number}` : street;
    } else if (inep.address?.address) {
      const street = inep.address.address || '';
      const number = inep.address.number ? String(inep.address.number) : '';
      address = number ? `${street}, ${number}` : street;
    } else if (emec.address?.address) {
      const street = emec.address.address || '';
      const number = emec.address.number ? String(emec.address.number) : '';
      address = number ? `${street}, ${number}` : street;
    } else {
      return 'Endereço não disponível';
    }

    return address.trim();
  }

  getEducationLevel(institution: any): string {
    const register = institution.registerInstitution || {};
    const inep = institution.inep || {};

    let educationLevelArr: string[] = [];

    if (register.education_level) {
      if (Array.isArray(register.education_level)) {
        educationLevelArr = register.education_level;
      } else if (typeof register.education_level === 'string') {
        educationLevelArr = [register.education_level];
      }
    } else if (institution.emec && institution.emec > 0) {
      educationLevelArr = ['Graduação'];
    } else if (inep.offeredEducationStagesAndModalities) {
      if (Array.isArray(inep.offeredEducationStagesAndModalities)) {
        educationLevelArr = inep.offeredEducationStagesAndModalities;
      } else if (typeof inep.offeredEducationStagesAndModalities === 'string') {
        educationLevelArr = [inep.offeredEducationStagesAndModalities];
      }
    }

    return educationLevelArr.length > 0 ? educationLevelArr.join(', ') : '';
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

    Object.entries(this.query).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        (typeof value !== 'string' || value.trim() !== '') &&
        (!Array.isArray(value) || value.length > 0)
      ) {
        queryParams[key] = Array.isArray(value) && key !== 'coordinates' ? value.join(',') : key === 'coordinates' ? JSON.stringify(value) : String(value);
      }
    });

    console.log('Updating URL with query params:', queryParams);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
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
