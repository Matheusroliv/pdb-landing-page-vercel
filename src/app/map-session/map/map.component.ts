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
import { ModalLocationPromptComponent } from '../../modal-location-prompt/modal-location-prompt.component';
import { PreRegistrationModalComponent } from '../../pre-registration-modal/pre-registration-modal.component';
import { currentPageService } from '../../service/currentPage.service';
import { hideFooterService } from '../../service/hide-footer.service';
import { InstitutionIconService } from '../../service/institution-icon.service';
import { InstitutionsService } from '../../service/institutions.service';
import { MarkerClusterService } from '../../service/marker-cluster.service';
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
    private toastr: ToastrService,
    private markerClusterService: MarkerClusterService
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
        name: params['name'] || undefined,
        cnpj: params['cnpj'] || undefined,
        zipCode: params['zipCode'] || undefined,
        city: params['city'] || undefined,
        address: params['address'] || undefined,
        state: params['state'] || undefined,
        juridicName: params['juridicName'] || undefined,
        type: params['type'] || undefined,
        academicOrganization: params['academicOrganization'] || undefined,
        openingdateBegin: params['openingdateBegin'] || undefined,
        openingdateEnd: params['openingdateEnd'] || undefined,
        rating: params['rating'] ? Number(params['rating']) : undefined,
        coordinates: params['coordinates']
          ? (params['coordinates'].split(',').map(Number) as [number, number])
          : undefined,
        educationLevelSource: params['educationLevelSource'] || undefined,
        acessibility: params['acessibility'] ? params['acessibility'].split(',') : undefined,
        phone: params['phone'] === 'true' ? true : undefined,
        email: params['email'] === 'true' ? true : undefined,
        site: params['site'] === 'true' ? true : undefined,
        scholarshipPolicy: params['scholarshipPolicy'] || undefined,
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
    this.injectTooltipStyles();
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

    this.map = L.map('map', {
      worldCopyJump: false,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0
    }).setView([-23.5505, -46.6333], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markerClusterGroup = this.markerClusterService.getMarkerClusterGroup();
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

  private requestUserLocation(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.mapInitialized) {
        console.warn('Mapa não inicializado, adiando solicitação de geolocalização');
        resolve();
        return;
      }

      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              position => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;
                if (userLon >= -180 && userLon <= 180 && userLat >= -90 && userLat <= 90) {
                  this.query.coordinates = [userLon, userLat];
                  this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { coordinates: JSON.stringify(this.query.coordinates) },
                    queryParamsHandling: 'merge',
                  });
                } else {
                  console.warn('Invalid coordinates received:', [userLat, userLon]);
                  this.query.coordinates = undefined;
                  this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { coordinates: null },
                    queryParamsHandling: 'merge',
                  });
                }
                resolve();
              },
              error => {
                console.error('Geolocalização falhou após permissão concedida:', error);
                this.query.coordinates = undefined;
                this.router.navigate([], {
                  relativeTo: this.route,
                  queryParams: { coordinates: null },
                  queryParamsHandling: 'merge',
                });
                resolve();
              },
              {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
              }
            );
          } else {
            const modalRef = this.modalService.open(ModalLocationPromptComponent, {
              centered: true,
              size: 'md',
            });

            modalRef.result.then(
              (result) => {
                if (result === true) {
                  if (!navigator.geolocation) {
                    console.warn('Navegador não suporta geolocalização');
                    this.toastr.warning('Seu navegador não suporta geolocalização.');
                    this.query.coordinates = undefined;
                    this.router.navigate([], {
                      relativeTo: this.route,
                      queryParams: { coordinates: null },
                      queryParamsHandling: 'merge',
                    });
                    resolve();
                    return;
                  }

                  navigator.geolocation.getCurrentPosition(
                    position => {
                      const userLat = position.coords.latitude;
                      const userLon = position.coords.longitude;
                      if (userLon >= -180 && userLon <= 180 && userLat >= -90 && userLat <= 90) {
                        this.query.coordinates = [userLon, userLat];
                        this.router.navigate([], {
                          relativeTo: this.route,
                          queryParams: { coordinates: JSON.stringify(this.query.coordinates) },
                          queryParamsHandling: 'merge',
                        });
                      } else {
                        console.warn('Invalid coordinates received:', [userLat, userLon]);
                        this.query.coordinates = undefined;
                        this.router.navigate([], {
                          relativeTo: this.route,
                          queryParams: { coordinates: null },
                          queryParamsHandling: 'merge',
                        });
                      }
                      resolve();
                    },
                    error => {
                      console.error('Geolocalização falhou:', error);
                      this.query.coordinates = undefined;
                      this.router.navigate([], {
                        relativeTo: this.route,
                        queryParams: { coordinates: null },
                        queryParamsHandling: 'merge',
                      });
                      resolve();
                    },
                    {
                      enableHighAccuracy: true,
                      timeout: 20000,
                      maximumAge: 0
                    }
                  );
                } else {
                  console.log('User denied location access via modal');
                  this.query.coordinates = undefined;
                  this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { coordinates: null },
                    queryParamsHandling: 'merge',
                  });
                  resolve();
                }
              },
              () => {
                console.log('Location prompt modal dismissed');
                this.query.coordinates = undefined;
                this.router.navigate([], {
                  relativeTo: this.route,
                  queryParams: { coordinates: null },
                  queryParamsHandling: 'merge',
                });
                resolve();
              }
            );
          }

          permissionStatus.onchange = () => {
            console.log('Permissão de geolocalização alterada para:', permissionStatus.state);
          };
        });
      } else {
        const modalRef = this.modalService.open(ModalLocationPromptComponent, {
          centered: true,
          size: 'md',
        });

        modalRef.result.then(
          (result) => {
            if (result === true) {
              if (!navigator.geolocation) {
                console.warn('Navegador não suporta geolocalização');
                this.toastr.warning('Seu navegador não suporta geolocalização.');
                this.query.coordinates = undefined;
                this.router.navigate([], {
                  relativeTo: this.route,
                  queryParams: { coordinates: null },
                  queryParamsHandling: 'merge',
                });
                resolve();
                return;
              }

              navigator.geolocation.getCurrentPosition(
                position => {
                  const userLat = position.coords.latitude;
                  const userLon = position.coords.longitude;
                  if (userLon >= -180 && userLon <= 180 && userLat >= -90 && userLat <= 90) {
                    this.query.coordinates = [userLon, userLat];
                    this.router.navigate([], {
                      relativeTo: this.route,
                      queryParams: { coordinates: JSON.stringify(this.query.coordinates) },
                      queryParamsHandling: 'merge',
                    });
                  } else {
                    console.warn('Invalid coordinates received:', [userLat, userLon]);
                    this.query.coordinates = undefined;
                    this.router.navigate([], {
                      relativeTo: this.route,
                      queryParams: { coordinates: null },
                      queryParamsHandling: 'merge',
                    });
                  }
                  resolve();
                },
                error => {
                  console.error('Geolocalização falhou:', error);
                  this.query.coordinates = undefined;
                  this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: { coordinates: null },
                    queryParamsHandling: 'merge',
                  });
                  resolve();
                },
                {
                  enableHighAccuracy: true,
                  timeout: 20000,
                  maximumAge: 0
                }
              );
            } else {
              console.log('User denied location access via modal');
              this.query.coordinates = undefined;
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { coordinates: null },
                queryParamsHandling: 'merge',
              });
              resolve();
            }
          },
          () => {
            console.log('Location prompt modal dismissed');
            this.query.coordinates = undefined;
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { coordinates: null },
              queryParamsHandling: 'merge',
            });
            resolve();
          }
        );
      }
    });
  }

  updateSort(sort: string): void {
    this.query.sort = sort as sortType;
    const queryParams: any = { sort: this.query.sort };

    if (this.query.sort === sortType.NEXT_LOCATION && (!this.query.coordinates || this.query.coordinates.length !== 2 || !this.query.coordinates.every(coord => typeof coord === 'number' && !isNaN(coord)))) {
      this.requestUserLocation().then(() => {
        if (this.query.coordinates && this.query.coordinates.length === 2 && this.query.coordinates.every(coord => typeof coord === 'number' && !isNaN(coord))) {
          queryParams.coordinates = JSON.stringify(this.query.coordinates);
        } else {
          this.query.coordinates = undefined;
          queryParams.coordinates = null;
        }
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams,
          queryParamsHandling: 'merge',
        });
        this.loadAllInstitutions();
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: 'merge',
      });
      this.loadAllInstitutions();
    }
  }

  private injectTooltipStyles(): void {
    const styleId = 'tooltip-styles';
    if (document.getElementById(styleId)) return;
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
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
        margin-top: -5px !important;
      }

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

    console.log('Tooltip styles injected');

  }

  private updateMaxLimit(): void {
    if (!this.map) return;

    const zoomLevel = this.map.getZoom();
    const baseLimit = 2000;
    const multiplier = Math.max(1, Math.floor(zoomLevel / 2));
    const dynamicLimit = baseLimit * multiplier;

    this.maxLimit = Math.min(dynamicLimit, this.totalItems || 18000);
  }

  loadAllInstitutions(): void {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.spinner.show();

    const sort = this.query.coordinates && Array.isArray(this.query.coordinates) && this.query.coordinates.length === 2 && this.query.coordinates.every(coord => typeof coord === 'number' && !isNaN(coord)) ? sortType.NEXT_LOCATION : sortType.A_Z;
    const queryWithoutBounds: InstitutionQuery = { ...this.query };
    delete queryWithoutBounds.minLat;
    delete queryWithoutBounds.maxLat;
    delete queryWithoutBounds.minLon;
    delete queryWithoutBounds.maxLon;

    if (sort === sortType.NEXT_LOCATION && !queryWithoutBounds.coordinates) {
      this.requestUserLocation().then(() => {
        const updatedSort = this.query.coordinates && Array.isArray(this.query.coordinates) && this.query.coordinates.length === 2 && this.query.coordinates.every(coord => typeof coord === 'number' && !isNaN(coord)) ? sortType.NEXT_LOCATION : sortType.A_Z;
        this.institutionsService.listInstitutions(this.page, this.limit, updatedSort, queryWithoutBounds)
          .pipe(finalize(() => {
            this.isLoading = false;
            this.spinner.hide();
          }))
          .subscribe({
            next: (response: { data: any[]; totalCount: number; hasMore: boolean }) => {
              console.log("List of institutions: ", response.data, response.totalCount, response.hasMore)
              const newData = Array.isArray(response.data) ? response.data : [];
              const mappedData = newData.map((item: any) => this.mapInstitutionData(item));
              this.institutions = [...this.institutions, ...mappedData];
              this.totalItems = response.totalCount;
              this.hasMore = response.hasMore;
              this.page += 1;

              if (this.mapInitialized && this.institutions.length > 0) {
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
      });
      return;
    }

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

          if (this.mapInitialized && this.institutions.length > 0) {
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

    const sort = this.query.coordinates && Array.isArray(this.query.coordinates) && this.query.coordinates.length === 2 && this.query.coordinates.every(coord => typeof coord === 'number' && !isNaN(coord)) ? sortType.NEXT_LOCATION : sortType.A_Z;

    this.isLoading = true;
    this.spinner.show();

    this.institutionsService.listInstitutions(this.page, this.limit, sort, queryWithBounds)
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

          if (!this.lastFetchedBounds) {
            this.lastFetchedBounds = bounds;
          } else {
            this.lastFetchedBounds = this.lastFetchedBounds.extend(bounds);
          }

          if (this.mapInitialized && this.institutions.length > 0) {
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

    let name = 'Nome não disponível';
    if (emec.iesName) name = emec.iesName;
    else if (inep.school) name = inep.school;
    else if (cebas.maintainersName) name = cebas.maintainersName;
    else if (fiscal.fantasyName) name = fiscal.fantasyName;
    else if (fiscal.socialReason) name = fiscal.socialReason;
    else if (register.institutionName) name = register.institutionName;

    let lat: number | undefined;
    let lng: number | undefined;
    let locationSource: any = null;

    if (register.address?.location?.coordinates && Array.isArray(register.address.location.coordinates) && register.address.location.coordinates.length === 2) {
      [lng, lat] = register.address.location.coordinates;
      locationSource = 'register';
    } else if (inep.address?.location?.coordinates && Array.isArray(inep.address.location.coordinates) && inep.address.location.coordinates.length === 2) {
      [lat, lng] = inep.address.location.coordinates;
      locationSource = 'inep';
    } else if (emec.address?.location?.coordinates && Array.isArray(emec.address.location.coordinates) && emec.address.location.coordinates.length === 2) {
      [lat, lng] = emec.address.location.coordinates;
      locationSource = 'emec';
    } else if (data.location?.coordinates && Array.isArray(data.location.coordinates) && data.location.coordinates.length === 2) {
      [lat, lng] = data.location.coordinates;
      locationSource = 'data.location';
    }

    const coordinates = lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0
      ? { lat, lng }
      : null;

    const showMap = coordinates !== null;

    const isValidLat = lat != null && !isNaN(lat) && lat >= -90 && lat <= 90 && lat !== 0;
    const isValidLng = lng != null && !isNaN(lng) && lng >= -180 && lng <= 180 && lng !== 0;
    const hasValidCoordinates = isValidLat && isValidLng;

    if (!hasValidCoordinates) {
      console.warn(`Institution ${name} excluded from map due to invalid coordinates: [lat: ${lat}, lng: ${lng}]`);
    }

    const institutionImages = register.institution_images && Array.isArray(register.institution_images) && register.institution_images.length > 0
      ? register.institution_images
      : '';

    let photo = data.photo || institutionImages[0];

    const randomIcon = this.institutionIconService.getRandomIcon();
    const quotasType = register.quotas_offered?.quotas_type || '';
    const institutionInep = inep || {};
    const rating = data.review?.rating || 0;

    const isVerified = register && register.status === 'APPROVED' ? true : false;
    const isFist = register.scholarships?.quotas_offered?.some(
      (quota: { quotas_type: string }) => quota.quotas_type === 'Cotas raciais'
    ) || false;
    const isInstitution = register || inep || emec ? true : false;
    const hasAccessibility =
      register.scholarships?.quotas_offered?.some(
        (quota: any) => quota.quotas_type === 'Cotas PCD'
      ) ||
      inep.attendanceRestriction === 'ESCOLA ATENDE EXCLUSIVAMENTE ALUNOS COM DEFICIÊNCIA';

    return {
      id: data._id,
      photo,
      name,
      characteristics: this.getCharacteristics(data),
      city: inep.address?.city || emec.address?.city || fiscal.address?.city || cebas.address?.city || register.address?.city || '',
      fiscal,
      emec,
      inep,
      cebas,
      register,
      isVerified,
      isFist,
      isInstitution,
      hasAccessibility,
      latitude: lat,
      longitude: lng,
      hasValidCoordinates,
      randomIcon,
      quotasType,
      institutionInep,
      rating,
      educationLevel: this.getEducationLevel(data),
      locationSource,
      coordinates,
      showMap
    };
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
      this.fetchEventSubject.next();
    } else if (visibleInstitutions.length >= minVisibleThreshold && this.institutions.length < this.maxLimit && this.hasMore) {
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
    if (!this.map || !this.markerClusterGroup || !this.institutions.length) {
      console.warn('Map, marker cluster group, or institutions not initialized');
      return;
    }

    this.markerClusterService.clearMarkers();

    const bounds = this.map.getBounds();
    const visibleInstitutions = this.institutions.filter(inst =>
      inst.hasValidCoordinates && inst.latitude && inst.longitude && bounds.contains([inst.latitude, inst.longitude])
    );

    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconSize: [20, 25],
      iconAnchor: [10, 25],
      popupAnchor: [0, -25]
    });

    visibleInstitutions.forEach(institution => {
      const marker = L.marker([institution.latitude, institution.longitude], { icon: customIcon });
      const rating = institution.rating || 0;
      const characteristics = institution.characteristics || 'Não informado';
      const educationLevel = institution.educationLevel || '';
      const associationType = institution.register?.institution_type === 'Matriz' || institution.register?.institution_type === 'MATRIX'
        ? 'Matriz'
        : institution.register?.institution_type || institution.fiscal?.type || 'Filial';
      const isVerified = institution.isVerified ? 'Verificado' : '';
      const randomIcon = institution.randomIcon || '/assets/icons/fallback-logo.png';
      const address = this.getCleanAddress(institution) || 'Endereço não disponível';
      const tooltipContent =
        `<div class="custom-tooltip-content">
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
            <p>${characteristics}</p>
            <p>${associationType}, ${educationLevel} ${isVerified ? `| ${isVerified}` : ''}</p>
          </div>
        </div>
      </div>`;

      marker.bindTooltip(tooltipContent, {
        className: 'custom-tooltip'
      }).on('click', (e) => {
        const target = e.target as L.Marker;
        if (target.getTooltip()?.isOpen()) {
          target.closeTooltip();
          this.navigateToProfile(institution.id);
        } else {
          target.openTooltip();
        }
      });

      this.markerClusterService.addMarker(marker);
    });

    this.filteredInstitutions = visibleInstitutions;
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

  getCharacteristics(data: any): string {
    const fiscal = data.fiscal || {};
    const inep = data.inep || {};
    const emec = data.emec || {};
    const cebas = data.cebas || {};
    const register = data.registerInstitution || {};

    const characteristics: string[] = [];

    if (fiscal.juridicName) {
      characteristics.push(fiscal.juridicName);
    }

    if (register.institution_type) {
      characteristics.push(register.institution_type === 'Matriz' || register.institution_type === 'MATRIX' ? 'Matriz' : 'Filial');
    } else if (fiscal.type) {
      characteristics.push(fiscal.type);
    }

    if (emec.academicorganization) {
      characteristics.push(emec.academicorganization);
    }

    if (inep.privateschoolCategory) {
      characteristics.push(`Escola ${inep.privateschoolCategory}`);
    }

    if (emec.accreditationType) {
      characteristics.push(emec.accreditationType);
    }

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

  getCleanAddress(data: any): string {
    const fiscal = data.fiscal || {};
    const emec = data.emec || {};
    const inep = data.inep || {};
    const register = data.registerInstitution || {};

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
          (typeof value !== 'string' || value.trim() !== '') &&
          (!Array.isArray(value) || value.length > 0)
        ) {
          if (['phone', 'email', 'site'].includes(key)) {
            queryParams[key] = value === true ? 'true' : null;
          } else {
            queryParams[key] = Array.isArray(value) ? value.join(',') : value.toString();
          }
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
    this.activeFilterCount = filterFields.filter((field) => field !== null && field !== undefined).length;
  }

  onSearchChange(): void {
    const trimmedSearchText = (this.searchText || '').trim();

    if (trimmedSearchText) {
      this.getCityCoordinates(trimmedSearchText).subscribe(
        (coordinates: [number, number] | null) => {
          if (coordinates) {
            this.map.setView(coordinates, 11);
            this.query.city = trimmedSearchText;
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { city: trimmedSearchText },
              queryParamsHandling: 'merge',
              replaceUrl: true,
            });
            this.loadAllInstitutions();
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
      this.loadAllInstitutions();
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
