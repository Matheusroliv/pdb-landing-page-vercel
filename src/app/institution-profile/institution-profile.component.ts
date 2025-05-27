import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { SomeFullModalIsOpenService } from '../service/someFullModalIsOpen.service';
import { MenuMobileService } from '../service/menu-download.service';
import { currentPageService } from '../service/currentPage.service';
import { InstitutionsService } from '../service/institutions.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import cnaeAtividades from './cnae/cnae_atividades.json';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ShareInstitutionService } from '../service/share-institution.service';
import { ToastrService } from 'ngx-toastr';
import { ReviewsService } from '../service/reviews.service';

@Component({
  selector: 'app-institution-profile',
  templateUrl: './institution-profile.component.html',
  styleUrls: ['./institution-profile.component.scss'],
  standalone: false
})
export class InstitutionProfileComponent implements OnInit, OnDestroy {
  @Input() institutionId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  institution: any = null;
  loading: boolean = true;
  openMenu: boolean = false;
  openModalInstitutionProfile: boolean = false;
  lastPage: any;
  map: any;
  photos: string[] = [];
  private destroy$ = new Subject<void>();
  private cnaeToAtividade: { [key: string]: string } = {};
  private preShareInstitutionSubscription: Subscription | undefined;

  reviews: any[] = [];
  rating: any;

  constructor(
    private someFullModalIsOpenService: SomeFullModalIsOpenService,
    private openMenuService: MenuMobileService,
    private currentPageService: currentPageService,
    private institutionsService: InstitutionsService,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private http: HttpClient,
    private breakPointObserver: BreakpointObserver,
    private shareInstitutionService: ShareInstitutionService,
    private router: Router,
    private toastrService: ToastrService,
    private reviewsService: ReviewsService
  ) {
    cnaeAtividades.forEach(item => {
      this.cnaeToAtividade[item.CNAE] = item.Atividade;
    });
  }

  ngOnInit(): void {
    this.preShareInstitutionSubscription = this.breakPointObserver.observe([
      '(min-width: 992px)'
    ]).subscribe((state: BreakpointState) => {
      if (state.matches) {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
          this.shareInstitutionService.setShareInstitution([true, id]);
          this.router.navigate(['/map']);
        }
      }
    });

    this.loadInstitutionData();

    this.someFullModalIsOpenService.currentData
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.openModalInstitutionProfile = data;
      });

    this.openMenuService.menu
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.openMenu = data;
      });
    this.openMenuService.setMenu(false);

    this.scrollToTop();

    this.currentPageService.currentData
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.lastPage = data;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (this.mapContainer && this.mapContainer.nativeElement) {
      this.mapContainer.nativeElement.innerHTML = '';
    }
    if (this.preShareInstitutionSubscription) {
      this.preShareInstitutionSubscription.unsubscribe();
    }
  }

  loadInstitutionData(): void {
    const id = this.institutionId || this.route.snapshot.paramMap.get('id');
    console.log(id);

    if (!id) {
      console.warn('Nenhum ID fornecido. Usando dados padrão.');
      this.institution = this.mapInstitutionData({});
      this.loading = false;
      return;
    }
    this.getAverageRating(id);
    this.getReviews(id);

    this.spinner.show();
    this.loading = true;
    this.institutionsService.getInstitutionById(id)
      .subscribe({
        next: (response: any) => {
          this.institution = this.mapInstitutionData(response);
          this.photos = [this.institution.photoOfInstitution || '/assets/imgs/institution-photo.svg'];
          this.loading = false;
          this.spinner.hide();
          setTimeout(() => {
            // Só inicializar o mapa se showMap for true
            if (this.institution.showMap && this.mapContainer && this.institution?.coordinates) {
              this.initMap();
            }
          }, 0);
        },
        error: (error) => {
          console.error('Erro ao carregar dados da instituição:', error);
          this.institution = this.mapInstitutionData({});
          this.photos = ['/assets/imgs/institution-photo.svg'];
          this.loading = false;
          this.spinner.hide();
          setTimeout(() => {
            if (this.institution.showMap && this.mapContainer) {
              this.initMap();
            }
          }, 0);
        }
      });
  }

  normalizeCNAE(cnae: string): string {
    return cnae.replace(/[\.-]/g, '');
  }

  mapInstitutionData(data: any): any {
    const fiscal = data.fiscal || {};
    const cebas = data.cebas || {};
    const emec = data.emec || {};
    const inep = data.inep || {};

    let name = 'Nome não disponível';
    if (emec.iesName) name = emec.iesName;
    else if (inep.school) name = inep.school;
    else if (cebas.maintainersName) name = cebas.maintainersName;
    else if (fiscal.fantasyName) name = fiscal.fantasyName;
    else if (fiscal.socialReason) name = fiscal.socialReason;

    let lat: number | undefined;
    let lng: number | undefined;
    if (inep.address?.location?.coordinates) [lat, lng] = inep.address.location.coordinates;
    else if (emec.address?.location?.coordinates) [lat, lng] = emec.address.location.coordinates;
    else if (cebas.address?.location?.coordinates) [lat, lng] = cebas.address.location.coordinates;
    else if (fiscal.address?.location?.coordinates) [lat, lng] = fiscal.address.location.coordinates;

    const coordinates = lat !== undefined && lng !== undefined
      ? { lat, lng }
      : { lat: -23.5505, lng: -46.6333 }; // Coordenadas padrão (São Paulo, Brasil)

    // Verificar se as coordenadas são (0,0)
    const showMap = !(coordinates.lat === 0 && coordinates.lng === 0);

    let atividades: string = 'Não informado';
    if (fiscal.cnaes && fiscal.cnaes.length > 0) {
      const mappedAtividades = fiscal.cnaes.map((cnae: string) => {
        const normalizedCNAE = this.normalizeCNAE(cnae);
        return this.cnaeToAtividade[normalizedCNAE] || 'Atividade não encontrada';
      });
      const validAtividades = [...new Set(mappedAtividades)].filter(atividade => atividade !== 'Atividade não encontrada');
      atividades = validAtividades.length > 0 ? validAtividades.sort().join(', ') : 'Atividade não encontrada';
    }

    return {
      name,
      photoOfInstitution: data.photoOfInstitution || '/assets/imgs/institution-photo.svg',
      characteristic: this.getCharacteristics(data),
      numOfStars: data.review?.length ? Math.min(Math.round(data.review.length / 100), 5) : 0,
      numOfReviews: data.review?.length || 0,
      description: fiscal.fantasyName
        ? `Instituição ${fiscal.fantasyName}`
        : fiscal.socialReason
          ? `Instituição ${fiscal.socialReason}`
          : 'Instituição não forneceu descrição',
      location: this.getCleanAddress(data),
      coordinates,
      showMap, // Nova propriedade para controlar exibição do mapa
      scholarships: { amount: 0, forCourse: [] },
      activities: atividades,
      address: this.getCleanAddress(data),
      infrastructure: [
        { name: "Número de alunos", value: inep.schoolSize || 'Não informado' },
        { name: "Número de professores", value: 'Não informado' },
        { name: "Infraestrutura esportiva", value: 'Não informado' },
        { name: "Infraestrutura científica", value: 'Não informado' },
        { name: "Infraestrutura cultural", value: 'Não informado' },
        { name: "Área verde", value: 'Não informado' }
      ],
      contact: {
        phone: fiscal.contact?.phone || 'Não informado',
        site: fiscal.contact?.site || 'Não informado',
        email: fiscal.contact?.email || 'Não informado'
      },
      cnpj: data.cnpj || 'Não informado',
      foundation: fiscal.openingDate ? new Date(fiscal.openingDate).toLocaleDateString('pt-BR') : 'Não informado',
      ies: emec.iesName || inep.inepCode || 'Não informado',
      inep: data.inep || null,
      emec: data.emec || null
    };
  }

  getCharacteristics(data: any): string {
    const fiscal = data.fiscal || {};
    const emec = data.emec || {};
    const inep = data.inep || {};

    if (fiscal.juridicName) return fiscal.juridicName;
    else if (fiscal.type) return fiscal.type;
    else if (emec.academicOrganization) return emec.academicOrganization;
    else if (inep.privateSchoolCategory) return `Escola ${inep.privateSchoolCategory}`;
    else if (inep.administrativeCategory) return `Escola ${inep.administrativeCategory}`;
    else return 'Não disponível';
  }

  getCleanAddress(data: any): string {
    const fiscal = data.fiscal || {};
    const emec = data.emec || {};
    const inep = data.inep || {};

    let address = '';
    if (inep.address?.address) address = inep.address.address;
    else if (emec.address?.address) address = emec.address.address;
    else if (fiscal.address?.address) address = fiscal.address.address;
    else return 'Endereço não disponível';

    return address.trim();
  }

  initMap(): void {
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      console.error('Map container not found.');
      return;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    try {
      this.map = L.map(this.mapContainer.nativeElement).setView(
        [this.institution.coordinates.lat, this.institution.coordinates.lng],
        15
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      L.marker([this.institution.coordinates.lat, this.institution.coordinates.lng])
        .addTo(this.map)
        .bindPopup(this.institution.name)
        .openPopup();

      setTimeout(() => this.map.invalidateSize(), 0);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  isCoordinatesString(): boolean {
    return typeof this.institution?.coordinates === 'string';
  }

  creatingArrayOfStars(): { isFilled: boolean }[] {
    const numOfStars = this.institution?.numOfStars || 0;
    const stars: { isFilled: boolean }[] = [];
    for (let i = 0; i < 5; i++) {
      stars.push({ isFilled: numOfStars > 0 && i < numOfStars });
    }
    return stars;
  }

  getReviews(id: string) {
    this.reviewsService.getReviewByInstitutionId(id).subscribe({
      next: data => {
        this.reviews = data
      },
      error: error => {
        console.error('Erro ao obter a média de avaliações:', error);
      }
    })
  }

  getAverageRating(id: string) {
    this.reviewsService.getAverageRating(id).subscribe({
      next: data => {
        this.rating = data
      },
      error: error => {
        console.error('Erro ao obter a média de avaliações:', error);
      }
    })
  }

  refactoringNumOfReviews(): string {
    if (!this.institution?.numOfReviews) return 'Sem avaliações disponíveis';
    if (this.institution.numOfReviews < 1000) return this.institution.numOfReviews + " avaliações";
    else if (this.institution.numOfReviews < 1000000) {
      let newNum = this.institution.numOfReviews / 1000;
      return newNum.toFixed(1) + "k avaliações";
    } else {
      let newNum = this.institution.numOfReviews / 1000000;
      return newNum.toFixed(1) + "mi avaliações";
    }
  }

  changeModalInstitutionProfile(b: boolean): void {
    this.openModalInstitutionProfile = b;
    this.someFullModalIsOpenService.setCurrentData(b);
    this.closeModal.emit();
  }

  closeMenu(): void {
    this.openMenuService.setMenu(false);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0 });
  }

  copyLink(): void {
    const id = this.institutionId || this.route.snapshot.paramMap.get('id') || '';
    const link = `https://localhost:4200/institution-profile/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      this.toastrService.success('', 'Link copiado!', { timeOut: 2000 });
    }).catch(err => {
      console.error('Erro ao copiar o link:', err);
    });
  }
}
