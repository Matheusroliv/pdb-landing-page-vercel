import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize, Subject, Subscription } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { ModalFilterComponent } from '../../modal-filter/modal-filter.component';
import { PreRegistrationModalComponent } from '../../pre-registration-modal/pre-registration-modal.component';
import { currentPageService } from '../../service/currentPage.service';
import { hideFooterService } from '../../service/hide-footer.service';
import { InstitutionIconService } from '../../service/institution-icon.service';
import { InstitutionsService } from '../../service/institutions.service';
import { MenuMobileService } from '../../service/menu-download.service';
import { OpenPreRegistrationModalService } from '../../service/open-pre-registration-modal.service';
import { ShareInstitutionService } from '../../service/share-institution.service';
import { SomeFullModalIsOpenService } from '../../service/someFullModalIsOpen.service';
import { InstitutionQuery, sortType } from '../interface-query';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: false
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  institutions: any[] = [];
  filteredInstitutions: any[] = [];
  indexFirstInstitution = 0;
  indexLastInstitution = 2;
  openMenu = false;
  openModalDownloadApp = false;
  openModalInstitutionProfile = false;
  map!: L.Map;
  markers: L.Marker[] = [];
  isLoading = false;
  page = 1;
  limit = 1000;
  totalItems = 0;
  maxLimit = 2000;
  hasMore = true;
  mapInitialized = false;
  selectedInstitutionId: string | null = null;
  showPreRegistrationModal = false;
  searchText: string = '';
  activeFilterCount: number = 0;
  private preRegistrationModalSubscription: Subscription | undefined;
  private query: InstitutionQuery = {};
  private markerClusterGroup!: L.MarkerClusterGroup;
  private mapEventSubject = new Subject<void>();
  private fetchEventSubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  private lastBounds: L.LatLngBounds | null = null;
  private lastFetchedBounds: L.LatLngBounds | null = null;

  constructor(
    private menuService: MenuMobileService,
    private currentPageService: currentPageService,
    private someFullModalIsOpenService: SomeFullModalIsOpenService,
    private hideFooter: hideFooterService,
    private modalService: NgbModal,
    private institutionIconService: InstitutionIconService,
    private institutionsService: InstitutionsService,
    private spinner: NgxSpinnerService,
    private http: HttpClient,
    private openPreRegistrationModalService: OpenPreRegistrationModalService,
    private shareInstitutionService: ShareInstitutionService,
    private breakPointObserver: BreakpointObserver,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.openPreRegistrationModalService.setData(false);
    this.currentPageService.setCurrentData('map');

    this.shareInstitutionService.shareInstitution.subscribe(data => {
      if (data && data[0]) {
        this.changeModalInstitutionProfile(true, data[1]);
      }
    });

    this.breakPointObserver.observe(['(max-width: 991px)']).subscribe((state: BreakpointState) => {
      if (state.matches) {
        if (this.breakPointObserver.isMatched('(max-width: 991px)')) {
          this.changeModalInstitutionProfile(false);
        }
      }
    });

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

    this.preRegistrationModalSubscription = this.openPreRegistrationModalService.currentData.subscribe(data => {
      this.showPreRegistrationModal = data;
      if (this.showPreRegistrationModal) {
        const modalRef = this.modalService.open(PreRegistrationModalComponent, {
          centered: true,
          size: 'xl',
        });

        modalRef.result.then(
          (result) => {
            this.openPreRegistrationModalService.setData(false);
            this.showPreRegistrationModal = false;
          },
          (reason) => {
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

    const cachedQuery = localStorage.getItem('mapQuery');
    if (cachedQuery) {
      this.query = JSON.parse(cachedQuery);
      this.searchText = this.query.city || '';
    }

    this.route.queryParams.subscribe(params => {
      this.query = {
        name: params['name'] || '',
        cnpj: params['cnpj'] || '',
        zipCode: params['zipCode'] || '',
        city: params['city'] || '',
        address: params['address'] || '',
        state: params['state'] || '',
        offeredEducationStagesAndModalities: params['offeredEducationStagesAndModalities'] ? (Array.isArray(params['offeredEducationStagesAndModalities']) ? params['offeredEducationStagesAndModalities'] : params['offeredEducationStagesAndModalities'].split(',')) : [],
        juridicName: params['juridicName'] || '',
        type: params['type'] || '',
        academicOrganization: params['academicOrganization'] || '',
        openingdateBegin: params['openingdateBegin'] || '',
        openingdateEnd: params['openingdateEnd'] || '',
        rating: params['rating'] ? +params['rating'] : undefined,
        coordinates: params['coordinates'] ? JSON.parse(params['coordinates']) : undefined,
        educationLevelSource: params['educationLevelSource'] || undefined,
        minLat: undefined,
        maxLat: undefined,
        minLon: undefined,
        maxLon: undefined,
      };
      this.searchText = this.query.city || '';
      localStorage.setItem('mapQuery', JSON.stringify(this.query));
      this.updateActiveFilterCount();
      this.loadAllInstitutions();
    });

    this.mapEventSubject.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateMaxLimit();
      this.plotVisibleMarkers();
      this.checkAndFetchMoreInstitutions();
    });

    this.fetchEventSubject.pipe(
      debounceTime(2000),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.fetchInstitutionsByBounds();
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.requestUserLocation();
    this.injectTooltipStyles(); // Inject styles after map initialization
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.mapInitialized = false;
    }

    if (this.preRegistrationModalSubscription) {
      this.preRegistrationModalSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initMap(): void {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Map container not found');
      return;
    }

    this.map = L.map('map').setView([-23.5505, -46.6333], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      disableClusteringAtZoom: 15,
    });
    this.map.addLayer(this.markerClusterGroup);

    this.map.invalidateSize();

    this.map.on('moveend zoomend', () => {
      this.mapEventSubject.next();
    });

    this.mapInitialized = true;

    if (this.institutions.length > 0) {
      this.plotVisibleMarkers();
    }
  }

  private requestUserLocation(): void {
    if (!navigator.geolocation) {
      console.warn('Navegador não suporta geolocalização');
      this.loadAllInstitutions();
      return;
    }

    if (!this.mapInitialized) {
      console.warn('Mapa não inicializado, adiando solicitação de geolocalização');
      return;
    }

    navigator.permissions.query({ name: 'geolocation' }).then(status => {
      navigator.geolocation.getCurrentPosition(
        position => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          this.map.setView([userLat, userLon], 11);
          this.query.coordinates = [userLon, userLat];
          this.loadAllInstitutions();
        },
        error => {
          console.error('Geolocalização falhou:', {
            code: error.code,
            message: error.message,
            permissionState: status.state
          });
          this.toastr.warning(`Geolocalização não disponível: ${error.message}`);
          this.loadAllInstitutions();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  private injectTooltipStyles(): void {
    const styleId = 'tooltip-styles';
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
      /* Override Leaflet Tooltip Defaults */
      .leaflet-tooltip.custom-tooltip {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: auto !important;
        height: auto !important;
      }
      .leaflet-tooltip.custom-tooltip:before {
        border-right-color: #fff !important;
        margin-top: -5px !important; /* Adjust arrow position */
      }

      /* Custom Tooltip Styles */
      .custom-tooltip-content {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        padding: 8px;
        max-width: 250px !important;
        width: 250px !important;
        height: 70px !important;
        font-family: Arial, sans-serif;
        display: block;
        overflow: hidden;
        box-sizing: border-box;
      }

      .tooltip-body {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        height: 100%;
      }

      .tooltip-logo {
        margin-right: 10px;
        flex-shrink: 0;
      }

      .tooltip-logo-img {
        width: 40px !important;
        height: 40px !important;
        border-radius: 4px;
        object-fit: cover;
      }

      .tooltip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }


      .tooltip-text {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow: hidden;
      }

      .tooltip-text strong {
        font-size: 14px;
        color: #333;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .tooltip-text span {
        font-size: 12px;
        color: #666;
        margin-bottom: 2px;
        white-space: nowrap;
      }

      .tooltip-text p {
        font-size: 10px;
        color: #666;
        margin: 0;
        line-height: 1.2;
        max-height: 24px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    `;
    document.head.appendChild(styleElement);
  }

  private updateMaxLimit(): void {
    if (!this.map) return;

    const zoomLevel = this.map.getZoom();
    const baseLimit = 2000;
    const multiplier = Math.max(1, Math.floor(zoomLevel / 2));
    const dynamicLimit = baseLimit * multiplier;

    this.maxLimit = Math.min(dynamicLimit, this.totalItems || 18000);
    console.log(`Updated maxLimit to ${this.maxLimit} at zoom level ${zoomLevel}`);
  }



  loadAllInstitutions(): void {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.spinner.show();

    const sort = sortType.NEXT_LOCATION;
    const queryWithoutBounds: InstitutionQuery = { ...this.query };
    delete queryWithoutBounds.minLat;
    delete queryWithoutBounds.maxLat;
    delete queryWithoutBounds.minLon;
    delete queryWithoutBounds.maxLon;

    this.institutionsService.listInstitutions(this.page, this.limit, sort, queryWithoutBounds)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.spinner.hide();
      }))
      .subscribe({
        next: (response: { data: any[]; totalCount: number; hasMore: boolean }) => {
          const newData = Array.isArray(response.data) ? response.data : [];
          const mappedData = newData.map((item: any) => this.mapInstitutionData(item));
          this.institutions = [...this.institutions, ...mappedData];
          this.totalItems = response.totalCount;
          this.hasMore = response.hasMore;
          this.page += 1;

          console.log(`Loaded ${this.institutions.length} of ${this.totalItems} institutions`);

          if (this.mapInitialized) {
            this.updateMaxLimit();
            this.plotVisibleMarkers();
          }

          if (this.hasMore && this.institutions.length < this.maxLimit) {
            this.loadAllInstitutions();
          }
        },
        error: (err: any) => {
          console.error('Erro ao listar instituições:', err);
          this.toastr.error('Erro ao carregar instituições. Tente novamente.');
          this.isLoading = false;
          this.spinner.hide();
        }
      });
  }

  private fetchInstitutionsByBounds(): void {
    if (!this.map || this.isLoading) return;

    const bounds = this.map.getBounds();
    this.lastBounds = bounds;

    if (this.lastFetchedBounds && this.lastFetchedBounds.contains(bounds)) {
      return;
    }

    const queryWithBounds: InstitutionQuery = {
      ...this.query,
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLon: bounds.getWest(),
      maxLon: bounds.getEast(),
    };

    this.isLoading = true;
    this.spinner.show();

    this.institutionsService.listInstitutions(this.page, this.limit, sortType.NEXT_LOCATION, queryWithBounds)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.spinner.hide();
      }))
      .subscribe({
        next: (response: { data: any[]; totalCount: number; hasMore: boolean }) => {
          const newData = Array.isArray(response.data) ? response.data : [];
          const mappedData = newData.map((item: any) => this.mapInstitutionData(item));
          this.institutions = [...this.institutions, ...mappedData];
          this.totalItems = response.totalCount;
          this.hasMore = response.hasMore;
          this.page += 1;

          console.log(`Fetched ${newData.length} institutions by bounds, total now: ${this.institutions.length}`);

          if (!this.lastFetchedBounds) {
            this.lastFetchedBounds = bounds;
          } else {
            this.lastFetchedBounds = this.lastFetchedBounds.extend(bounds);
          }

          if (this.mapInitialized) {
            this.updateMaxLimit();
            this.plotVisibleMarkers();
          }
        },
        error: (err: any) => {
          console.error('Erro ao buscar instituições por limites:', err);
          this.toastr.error('Erro ao buscar instituições. Tente novamente.');
          this.isLoading = false;
          this.spinner.hide();
        }
      });
  }

  private mapInstitutionData(data: any): any {
    const fiscal = data.fiscal || {};
    const cebas = data.cebas || {};
    const emec = data.emec || {};
    const inep = data.inep || {};
    const register = data.registerInstitution || {};

    let markerColor = '/assets/icons/FFBB4F.png';
    console.log('Processing institution:', data._id, 'Register:', register, 'EMEC:', emec, 'INEP:', inep);

    if (register.education_level) {
      switch (register.education_level) {
        case 'Ensino Infantil':
        case 'Ensino Fundamental':
        case 'Educação de Jovens e Adultos':
        case 'Ensino Médio':
          markerColor = '/assets/icons/F46F0B.png';
          console.log(`Set markerColor to F46F0B.png for education_level: ${register.education_level}`);
          break;
        case 'Graduação':
        case 'Pós-Graduação':
          markerColor = '/assets/icons/5994A9.png';
          console.log(`Set markerColor to 5994A9.png for education_level: ${register.education_level}`);
          break;
        case 'Cursinho':
          markerColor = '/assets/icons/AFC441.png';
          console.log(`Set markerColor to AFC441.png for education_level: ${register.education_level}`);
          break;
        default:
          console.log(`No match for education_level: ${register.education_level}, keeping default color`);
          break;
      }
    } else {
      console.log('No education_level found, starting with default color');
    }

    if (markerColor === '/assets/icons/FFBB4F.png') {
      let fallbackCondition = '';
      if (emec && emec.iesName) {
        fallbackCondition = 'emec';
      } else if (inep && inep.school) {
        fallbackCondition = 'inep';
      } else {
        fallbackCondition = 'default';
      }

      switch (fallbackCondition) {
        case 'emec':
          markerColor = '/assets/icons/F46F0B.png';
          console.log('Set markerColor to F46F0B.png because emec.iesName exists:', emec.iesName);
          break;
        case 'inep':
          markerColor = '/assets/icons/5994A9.png';
          console.log('Set markerColor to 5994A9.png because inep.school exists:', inep.school);
          break;
        case 'default':
          markerColor = '/assets/icons/FFBB4F.png';
          console.log('Set markerColor to default FFBB4F.png');
          break;
      }
    }

    let name = 'Nome não disponível';
    if (emec.iesName) name = emec.iesName;
    else if (inep.school) name = inep.school;
    else if (cebas.maintainersName) name = cebas.maintainersName;
    else if (fiscal.fantasyName) name = fiscal.fantasyName;
    else if (fiscal.socialReason) name = fiscal.socialReason;
    else if (register.institutionName) name = register.institutionName;

    let lat: number | undefined;
    let lng: number | undefined;

    if (inep.address?.location?.coordinates) {
      [lat, lng] = inep.address.location.coordinates;
    } else if (emec.address?.location?.coordinates) {
      [lat, lng] = emec.address.location.coordinates;
    } else if (fiscal.address?.location?.coordinates) {
      [lat, lng] = fiscal.address.location.coordinates;
    } else if (cebas.address?.location?.coordinates) {
      [lat, lng] = cebas.address.location.coordinates;
    } else if (register.location?.coordinates) {
      [lat, lng] = register.location.coordinates;
    }

    const randomIcon = this.institutionIconService.getRandomIcon();

    let characteristics = [
      fiscal.juridicName ?? '',
      fiscal.type ?? '',
      emec.academicOrganization ? `Escola ${emec.academicOrganization}` : '',
      inep.privateSchoolCategory ? `Escola ${inep.privateSchoolCategory}` : '',
      inep.administrativeCategory ?? '',
      register.institutionType ? `${register.institutionType}, ${register.administrative_category}, ${register.education_level}` : '',
    ]
      .filter(item => item && item.trim() !== '')
      .join(', ');

    if (!characteristics) {
      characteristics = 'Não disponível';
    }

    let photo;
    if (data.photo) {
      photo = data.photo;
    } else if (register.institution_images && register.institution_images.length > 0) {
      photo = register.institution_images[0];
    } else {
      photo = '/assets/imgs/institution-photo.svg';
    }

    const quotasType = register.quotas_offered?.quotas_type || '';
    const institutionInep = inep || {};
    const rating = data.review?.rating || 0;

    return {
      id: data._id,
      photo,
      name,
      city: inep.address?.city || emec.address?.city || fiscal.address?.city || cebas.address?.city || register.address?.city || '',
      fiscal,
      emec,
      inep,
      cebas,
      register,
      latitude: lat,
      longitude: lng,
      hasValidCoordinates: lat !== undefined && lng !== undefined,
      randomIcon: randomIcon,
      markerColor,
      characteristics,
      quotasType,
      institutionInep,
      rating
    };
  }

  private checkAndFetchMoreInstitutions(): void {
    if (!this.map || !this.mapInitialized || this.isLoading) {
      return;
    }

    const bounds = this.map.getBounds();
    const visibleInstitutions = this.institutions.filter(inst => {
      if (!inst.hasValidCoordinates) return false;
      return bounds.contains([inst.latitude, inst.longitude]);
    });

    const zoomLevel = this.map.getZoom();
    const minVisibleThreshold = zoomLevel > 12 ? 1000 : 500;

    if (visibleInstitutions.length < minVisibleThreshold && this.hasMore && (!this.lastBounds || !this.lastBounds.equals(bounds))) {
      console.log(`Fetching more institutions: ${visibleInstitutions.length} visible, threshold: ${minVisibleThreshold}`);
      this.fetchEventSubject.next();
    } else if (visibleInstitutions.length >= minVisibleThreshold && this.institutions.length < this.maxLimit && this.hasMore) {
      console.log(`Fetching more due to nearing plotting limit: ${visibleInstitutions.length} visible, maxLimit: ${this.maxLimit}`);
      this.fetchEventSubject.next();
    } else {
      console.log('No additional fetch needed:', {
        visibleInstitutionsCount: visibleInstitutions.length,
        hasMore: this.hasMore,
        boundsChanged: this.lastBounds ? !this.lastBounds.equals(bounds) : true
      });
    }
  }

  private plotVisibleMarkers(): void {
    if (!this.map || !this.markerClusterGroup) {
      console.error('Map or marker cluster group not initialized, cannot plot markers');
      return;
    }

    this.markerClusterGroup.clearLayers();

    const bounds = this.map.getBounds();
    const zoomLevel = this.map.getZoom();

    const visibleInstitutions = this.institutions.filter(inst => {
      if (!inst.hasValidCoordinates) return false;
      return bounds.contains([inst.latitude, inst.longitude]);
    });

    const baseMaxMarkers = 2000;
    const zoomMultiplier = Math.max(1, Math.floor(zoomLevel / 2));
    const maxMarkers = Math.min(baseMaxMarkers * zoomMultiplier, visibleInstitutions.length);

    const institutionsToPlot = visibleInstitutions.slice(0, maxMarkers);

    institutionsToPlot.forEach(institution => {
      const customIcon = L.icon({
        iconUrl: institution.markerColor,
        iconSize: [31, 31],
        iconAnchor: [15.5, 15.5],
        popupAnchor: [0, -15.5]
      });

      const rating = institution.review?.rating || 0;
      const address = this.getCleanAddress(institution) || 'Endereço não disponível';
      const details = institution.characteristics || 'Sem detalhes';
      const randomIcon = this.institutionIconService.getRandomIcon();


      const tooltipContent = `
        <div class="custom-tooltip-content">
          <div class="tooltip-body">
            <div class="tooltip-logo">
              <img src="${randomIcon}" alt="Logo" class="tooltip-logo-img" onerror="this.src='/assets/icons/fallback-logo.png'" />
            </div>
            <div class="tooltip-text">
              <div class="tooltip-header">
               <strong>${institution.name || 'Nome não disponível'}</strong>
               <span>${rating} ★</span>
              </div>
              <p>${address}</p>
              <p>${details}</p>
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([institution.latitude, institution.longitude], {
        icon: customIcon,
        zIndexOffset: 1000
      })
        .bindPopup(institution.name)
        .bindTooltip(tooltipContent, {
          direction: 'right',
          offset: [0, -20],
          className: 'custom-tooltip',
          permanent: false
        })
        .on('click', () => this.navigateToProfile(institution.id));

      this.markerClusterGroup.addLayer(marker);
    });

    this.filteredInstitutions = institutionsToPlot;
    console.log(`Plotted ${institutionsToPlot.length} markers out of ${visibleInstitutions.length} visible institutions (max: ${maxMarkers})`);

    if (institutionsToPlot.length === 0) {
      console.warn('No visible markers to plot in the current map bounds');
    }
  }

  private navigateToProfile(institutionId: string): void {
    if (!institutionId) {
      console.error('Invalid institutionId:', institutionId);
      return;
    }
    this.selectedInstitutionId = institutionId;
    this.changeModalInstitutionProfile(true);
  }

  changeModalInstitutionProfile(b: boolean, institutionId?: string): void {
    this.openModalInstitutionProfile = b;
    if (institutionId) {
      this.selectedInstitutionId = institutionId;
    }
    this.someFullModalIsOpenService.setCurrentData(b);
  }

  getCleanAddress(data: any): string {
    const fiscal = data.fiscal || {};
    const emec = data.emec || {};
    const inep = data.inep || {};
    const cebas = data.cebas || {};
    const register = data.registerInstitution || {};

    let address = '';
    if (inep.address?.address) {
      address = inep.address.address;
    } else if (emec.address?.address) {
      address = emec.address.address;
    } else if (fiscal.address?.address) {
      address = fiscal.address.address;
    } else if (cebas.address?.address) {
      address = cebas.address.address;
    } else if (register.address?.address) {
      address = register.address.address;
    } else {
      return 'Endereço não disponível';
    }

    return address.trim();
  }

  backInstitution() {
    if (this.indexFirstInstitution > 0) {
      this.indexFirstInstitution -= 3;
      this.indexLastInstitution -= 3;
    }
  }

  walkInstitution() {
    if (this.indexLastInstitution < this.filteredInstitutions.length - 1) {
      this.indexFirstInstitution += 3;
      this.indexLastInstitution += 3;
    }
  }

  backInstitutionMobile() {
    if (this.indexFirstInstitution > 0) {
      this.indexFirstInstitution--;
    }
  }

  walkInstitutionMobile() {
    if (this.indexFirstInstitution + 1 < this.filteredInstitutions.length) {
      this.indexFirstInstitution++;
    }
  }

  closeMenu() {
    this.menuService.setMenu(false);
    this.hideFooter.changeHidefooter(false);
  }

  changeModalDownloadApp(b: boolean) {
    this.openModalDownloadApp = b;
    this.menuService.setDownload(b);
  }

  showFilterModal(): void {
    const modalRef = this.modalService.open(ModalFilterComponent, { centered: true });
    modalRef.componentInstance.currentFilters = { ...this.query };

    modalRef.componentInstance.applyFilters.subscribe((filters: InstitutionQuery) => {
      const updatedQuery: InstitutionQuery = { ...this.query, ...filters };
      delete updatedQuery.minLat;
      delete updatedQuery.maxLat;
      delete updatedQuery.minLon;
      delete updatedQuery.maxLon;
      delete updatedQuery.coordinates;

      if (filters.rating === 0 || filters.rating === undefined) {
        delete updatedQuery.rating;
      }

      this.query = updatedQuery;
      localStorage.setItem('mapQuery', JSON.stringify(this.query));
      this.institutions = [];
      this.markers.forEach(marker => this.map.removeLayer(marker));
      this.markers = [];
      this.page = 1;
      this.hasMore = true;
      this.totalItems = 0;
      this.lastFetchedBounds = null;

      const queryParams: any = {};
      for (const [key, value] of Object.entries(this.query)) {
        if (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          (!Array.isArray(value) || value.length > 0)
        ) {
          queryParams[key] = Array.isArray(value) ? value.join(',') : (key === 'coordinates' ? JSON.stringify(value) : value);
        }
      }

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });

      this.updateActiveFilterCount();
      this.loadAllInstitutions();
    });
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
      minLat: undefined,
      maxLat: undefined,
      minLon: undefined,
      maxLon: undefined,
    };

    this.page = 1;
    this.hasMore = true;
    this.institutions = [];
    this.markers = [];
    this.totalItems = 0;
    this.lastFetchedBounds = null;

    localStorage.setItem('mapQuery', JSON.stringify(this.query));
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });

    this.updateActiveFilterCount();
    this.loadAllInstitutions();
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
      this.query.rating
    );
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

    if (trimmedSearchText) {
      this.getCityCoordinates(trimmedSearchText).subscribe(
        (coordinates: [number, number] | null) => {
          if (coordinates) {
            this.map.setView(coordinates, 11);
            this.checkAndFetchMoreInstitutions();
          } else {
            this.toastr.warning('Cidade não encontrada.');
          }
        },
        (err) => {
          console.error('Erro ao buscar coordenadas da cidade:', err);
          this.toastr.error('Erro ao localizar a cidade. Tente novamente.');
        }
      );
    } else {
      this.query.city = '';
      localStorage.setItem('mapQuery', JSON.stringify(this.query));
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { city: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }

    this.updateActiveFilterCount();
  }

  private getCityCoordinates(cityName: string) {
    return this.http.get<any>(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`).pipe(
      takeUntil(this.destroy$)
    ).pipe(
      map((response: any) => {
        if (response && response.length > 0) {
          const { lat, lon } = response[0];
          return [parseFloat(lat), parseFloat(lon)] as [number, number];
        }
        return null;
      })
    );
  }
}
