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
import { NgbSlideEvent } from '@ng-bootstrap/ng-bootstrap';

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

  showMoreActivities: boolean = false;
  currentSlide: number = 0;
  scholarshipsAvailable = false;
  facilitiesAndCapacity = false;
  contactAndInformations = false;

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
    if (!id) {
      console.warn('Nenhum ID fornecido. Usando dados padrão.');
      this.institution = this.mapInstitutionData({});
      this.photos = this.institution.institutionImages || [];
      this.loading = false;
      return;
    }

    this.spinner.show();
    this.loading = true;
    this.institutionsService.getInstitutionById(id)
      .subscribe({
        next: (response: any) => {
          console.log('Dados da instituição carregados:', response);
          this.institution = this.mapInstitutionData(response);
          this.photos = this.institution.institutionImages || [];
          this.loading = false;
          this.spinner.hide();
          setTimeout(() => {
            if (this.institution.showMap && this.mapContainer && this.institution?.coordinates) {
              this.initMap();
            }
          }, 0);
        },
        error: (error) => {
          console.error('Erro ao carregar dados da instituição:', error);
          this.institution = this.mapInstitutionData({});
          this.photos = this.institution.institutionImages || [];
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
    const register = data.registerInstitution || {};

    let name = 'Nome não disponível';
    if (register.institutionName) name = register.institutionName;
    else if (emec.iesName) name = emec.iesName;
    else if (inep.school) name = inep.school;
    else if (cebas.maintainersName) name = cebas.maintainersName;
    else if (fiscal.fantasyName) name = fiscal.fantasyName;
    else if (fiscal.socialReason) name = fiscal.socialReason;

    let lat: number | undefined;
    let lng: number | undefined;

    // Prioridade: register -> inep -> emec
    let locationSource: any = null;

    if (register.address?.location?.coordinates && Array.isArray(register.address.location.coordinates) && register.address.location.coordinates.length === 2) {
      [lng, lat] = register.address.location.coordinates;
      locationSource = 'register';
    }
    else if (inep.address?.location?.coordinates && Array.isArray(inep.address.location.coordinates) && inep.address.location.coordinates.length === 2) {
      [lat, lng] = inep.address.location.coordinates;
      locationSource = 'inep';
    }
    else if (emec.address?.location?.coordinates && Array.isArray(emec.address.location.coordinates) && emec.address.location.coordinates.length === 2) {
      [lat, lng] = emec.address.location.coordinates;
      locationSource = 'emec';
    }
    else if (data.location?.coordinates && Array.isArray(data.location.coordinates) && data.location.coordinates.length === 2) {
      [lat, lng] = data.location.coordinates;
      locationSource = 'data.location';
    } else {
      console.warn(`Invalid or missing coordinates for institution ${name} from register, inep, emec, or data.location:`, {
        register: register.address?.location?.coordinates,
        inep: inep.address?.location?.coordinates,
        emec: emec.address?.location?.coordinates,
        dataLocation: data.location?.coordinates
      });
    }

    const coordinates = lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0
      ? { lat, lng }
      : null;

    const showMap = coordinates !== null;

    // Resto do método permanece igual
    let activities: string = 'Não informado';
    if (fiscal.cnaes && fiscal.cnaes.length > 0) {
      const mappedActivities = fiscal.cnaes.map((cnae: string) => {
        const normalizedCNAE = this.normalizeCNAE(cnae);
        return this.cnaeToAtividade[normalizedCNAE] || 'Atividade não encontrada';
      });
      const validActivities = [...new Set(mappedActivities)].filter(activity => activity !== 'Atividade não encontrada');
      activities = validActivities.length > 0 ? validActivities.sort().join(', ') : 'Atividade não encontrada';
    }

    const institutionImages = register.institution_images && Array.isArray(register.institution_images) && register.institution_images.length > 0
      ? register.institution_images
      : [];

    let photoOfInstitution = institutionImages;

    const description = fiscal.fantasyName
      ? `Instituição ${fiscal.fantasyName}`
      : fiscal.socialReason
        ? `Instituição ${fiscal.socialReason}`
        : register.about ? `${register.about}` : 'Instituição não forneceu descrição';

    const infrastructureCapacity = register.infrastructure_capacity || {};
    const green_areas = [
      ...(infrastructureCapacity.green_areas || []).map((item: any) => ({
        name: item.green_areas,
        value: item.quantity,
        type: 'green',
        icon: 'trees.svg'
      }))
    ];

    const cultural_infrastructure = [
      ...(infrastructureCapacity.cultural_infrastructure || []).map((item: any) => ({
        name: item.cultural_infrastructure,
        value: item.quantity,
        type: 'cultural',
        icon: 'masks-theater.svg'
      }))
    ];

    const scientific_infrastructure = [
      ...(infrastructureCapacity.scientific_infrastructure || []).map((item: any) => ({
        name: item.scientific_infrastructure,
        value: item.quantity,
        type: 'scientific',
        icon: 'flask.png'
      }))
    ];

    const sports_infrastructure = [
      ...(infrastructureCapacity.sports_infrastructure || []).map((item: any) => ({
        name: item.sports_infrastructure,
        value: item.quantity,
        type: 'sports',
        icon: 'court.svg'
      }))
    ];

    const scholarshipTotal = (register.scholarships?.quotas_offered || []).reduce(
      (sum: number, item: any) => sum + (item.quantity || 0), 0
    ) || 0;

    const quotaTypes = [
      ...(register.scholarships?.quotas_offered || []).map((item: any) => ({
        name: item.quotas_type,
        value: item.quantity
      }))
    ];

    const courseTypes = [
      ...(register.scholarships?.available_vacancies || []).map((item: any) => ({
        name: item.course_name,
        value: item.vacancies
      }))
    ];

    const hasAvailableVacancies = register.scholarships?.available_vacancies?.length > 0;
    const hasCulturalInfrastructure = infrastructureCapacity.cultural_infrastructure?.length > 0;
    const hasGreenAreas = infrastructureCapacity.green_areas?.length > 0;
    const hasScientificInfrastructure = infrastructureCapacity.scientific_infrastructure?.length > 0;
    const hasSportsInfrastructure = infrastructureCapacity.sports_infrastructure?.length > 0;
    const hasQuotasOffered = register.scholarships?.quotas_offered?.length > 0;
    const hasScholarshipOffered = register.scholarships?.scholarships_offered?.length > 0;

    const scholarshipOrder = ['Integral', 'Parcial', 'CEBAS', 'Prouni', 'Livre iniciativa'];

    const scholarshipsTypes = [
      ...(register.scholarships?.scholarships_offered || []).map((item: any) => ({
        name: item.scholarship_name,
        value: item.quantity
      }))
    ].sort((a, b) => {
      const indexA = scholarshipOrder.indexOf(a.name);
      const indexB = scholarshipOrder.indexOf(b.name);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA === -1) {
        return 1;
      }
      if (indexB === -1) {
        return -1;
      }
      return 0;
    });

    const isVerified = register && register.status === 'APPROVED' ? true : false;
    const isFist = register.scholarships?.quotas_offered?.some(
      (quota: { quotas_type: string }) => quota.quotas_type === 'Cotas raciais'
    ) || false;
    const isInstitution = (register && Object.keys(register).length > 0) || (inep && Object.keys(inep).length > 0) || (emec && Object.keys(emec).length > 0) ? true : false;
    const hasAccessibility =
      register.scholarships?.quotas_offered?.some(
        (quota: any) => quota.quotas_type === 'Cotas PCD'
      ) ||
      inep.attendanceRestriction === 'ESCOLA ATENDE EXCLUSIVAMENTE ALUNOS COM DEFICIÊNCIA';
    const notice_link = register.scholarships?.notice_link || 'Não informado';
    const iesCode = emec.iesCode || "Não informado";

    return {
      name,
      photoOfInstitution,
      institutionImages,
      characteristic: this.getCharacteristics(data),
      numOfStars: data.review?.length ? Math.min(Math.round(data.review.length / 100), 5) : 0,
      numOfReviews: data.review?.length || 0,
      description,
      location: this.getCleanAddress(data),
      coordinates,
      showMap,
      scholarships: scholarshipTotal > 0 ? scholarshipTotal : '0',
      activities,
      address: this.getCleanAddress(data),
      hasAvailableVacancies,
      hasCulturalInfrastructure,
      hasGreenAreas,
      hasScientificInfrastructure,
      hasSportsInfrastructure,
      hasQuotasOffered,
      hasScholarshipOffered,
      green_areas,
      cultural_infrastructure,
      scientific_infrastructure,
      sports_infrastructure,
      quotaTypes,
      courseTypes,
      scholarshipsTypes,
      isVerified,
      isFist,
      isInstitution,
      hasAccessibility,
      notice_link,
      iesCode,
      numberOfStudents: infrastructureCapacity.number_students || 0,
      numberOfTeachers: infrastructureCapacity.number_teachers || 0,
      contact: {
        phone: this.getPhone(data),
        site: this.getSite(data),
        email: this.getEmail(data)
      },
      cnpj: this.maskCNPJ(data.cnpj) || 'Não informado',
      foundation: fiscal.openingDate ? new Date(fiscal.openingDate).toLocaleDateString('pt-BR') : 'Não informado',
      ies: emec.iesName || inep.inepCode || 'Não informado',
      inep: data.inep || null,
      emec: data.emec || null,
      educationLevel: this.getEducationLevel(data),
    };
  }

  formatInfrastructure(infrastructure: any[]): string {
    if (!infrastructure || infrastructure.length === 0) return '';

    const grouped = infrastructure.reduce((acc, curr) => {
      const key = curr.name.toLowerCase().trim();
      if (!acc[key]) {
        acc[key] = { name: curr.name, value: 0 };
      }
      acc[key].value += parseInt(curr.value) || 0;
      return acc;
    }, {});

    return Object.values(grouped)
      .map((item: any) => `${item.value} ${item.name}`)
      .join(', ');
  }

  maskBrazilianPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 11) {
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 3)}${digits.substring(3, 7)}-${digits.substring(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    } else {
      return phone;
    }
  }

  maskCNPJ(cnpj: string | undefined): string {
    if (!cnpj || cnpj === 'Não informado') {
      return 'Não informado';
    }

    const digits = cnpj.replace(/\D/g, '');

    if (digits.length !== 14) {
      return cnpj; // Retorna original se inválido
    }

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
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


  getPhone(data: any): string {
    const register = data.registerInstitution || {};
    const fiscal = data.fiscal || {};
    const inep = data.inep || {};
    const emec = data.emec || {};
    const cebas = data.cebas || {};

    let contact = '';
    if (register.contact?.phone) contact = register.contact.phone;
    else if (fiscal.contact?.phone) contact = fiscal.contact.phone;
    else if (inep.contact?.phone) contact = inep.contact.phone;
    else if (emec.contact?.phone) contact = emec.contact.phone;
    else if (cebas.contact?.phone) contact = cebas.contact.phone;
    else return 'Contato não disponível';

    return contact.trim();
  }

  getSite(data: any): string {
    const register = data.registerInstitution || {};
    const fiscal = data.fiscal || {};
    const inep = data.inep || {};
    const emec = data.emec || {};
    const cebas = data.cebas || {};

    let contact = '';
    if (register.contact?.site) contact = register.contact.site;
    else if (fiscal.contact?.site) contact = fiscal.contact.site;
    else if (inep.contact?.site) contact = inep.contact.site;
    else if (emec.contact?.site) contact = emec.contact.site;
    else if (cebas.contact?.site) contact = cebas.contact.site;
    else return 'Site não disponível';

    return contact.trim();
  }

  getEmail(data: any): string {
    const register = data.registerInstitution || {};
    const fiscal = data.fiscal || {};
    const inep = data.inep || {};
    const emec = data.emec || {};
    const cebas = data.cebas || {};

    let contact = '';
    if (register.contact?.email) contact = register.contact.email;
    else if (fiscal.contact?.email) contact = fiscal.contact.email;
    else if (inep.contact?.email) contact = inep.contact.email;
    else if (emec.contact?.email) contact = emec.contact.email;
    else if (cebas.contact?.email) contact = cebas.contact.email;
    else return 'Email não disponível';

    return contact.trim();
  }

  getCharacteristics(data: any): string {
    const fiscal = data.fiscal || {};
    const inep = data.inep || {};
    const emec = data.emec || {};
    const cebas = data.cebas || {};
    const register = data.registerInstitution || {};

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

  toggleActivities() {
    this.showMoreActivities = !this.showMoreActivities;
  }

  initMap(): void {
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      console.error('Map container not found.');
      return;
    }

    if (!this.institution?.showMap || !this.institution.coordinates) {
      console.error('Map cannot be initialized: showMap is false or coordinates are missing.', {
        showMap: this.institution?.showMap,
        coordinates: this.institution?.coordinates
      });
      return;
    }

    const { lat, lng } = this.institution.coordinates;
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates:', { lat, lng });
      return;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    try {
      this.map = L.map(this.mapContainer.nativeElement).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.map);

      const customIcon = L.icon({
        iconUrl: '/assets/icons/marker-icon.png',
        iconSize: [41, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      L.marker([lat, lng], { icon: customIcon })
        .addTo(this.map)
        .openPopup();

      setTimeout(() => {
        this.map?.invalidateSize();
      }, 0);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  onSlideChange(event: NgbSlideEvent): void {
    this.currentSlide = parseInt(event.current.replace('slide-', ''), 10);
    if (this.currentSlide === 0 && this.institution?.showMap && this.map) {
      console.log('Map slide active, invalidating size');
      setTimeout(() => {
        this.map.invalidateSize();
      }, 200);
    }
  }

  isCoordinatesString(): boolean {
    return typeof this.institution?.coordinates === 'string';
  }


  createStarArray(): { isFilled: boolean }[] {
    const numOfStars = Math.max(0, Math.min(this.institution?.numOfStars || 0, 5));
    return Array(5).fill(null).map((_, i) => ({ isFilled: i < numOfStars }));
  }

  formatReviewCount(): string {
    if (!this.institution?.numOfReviews) return 'Sem avaliações disponíveis';
    if (this.institution.numOfReviews < 1000) return this.institution.numOfReviews + ' avaliações';
    else if (this.institution.numOfReviews < 1000000) {
      let newNum = this.institution.numOfReviews / 1000;
      return newNum.toFixed(1) + 'k avaliações';
    } else {
      let newNum = this.institution.numOfReviews / 1000000;
      return newNum.toFixed(1) + 'mi avaliações';
    }
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
    const link = `http://localhost:4200/institution-profile/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      this.toastrService.success('', 'Link copiado!', { timeOut: 2000 });
    }).catch(err => {
      console.error('Erro ao copiar o link:', err);
      this.toastrService.error('Falha ao copiar o link.', 'Erro', { timeOut: 2000 });
    });
  }


  nextSlide(): void {
    const totalSlides = (this.institution?.showMap ? 1 : 0) + this.photos.length;
    this.currentSlide = (this.currentSlide + 1) % totalSlides;
    if (this.currentSlide === 0 && this.institution?.showMap) {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 0);
    }
  }

  prevSlide(): void {
    const totalSlides = (this.institution?.showMap ? 1 : 0) + this.photos.length;
    this.currentSlide = (this.currentSlide - 1 + totalSlides) % totalSlides;
    if (this.currentSlide === 0 && this.institution?.showMap) {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 0);
    }
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    if (index === 0 && this.institution?.showMap) {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 0);
    }
  }

  changeSection(section: string) {
    switch (section) {
      case 'scholarshipsAvailable':
        if (this.scholarshipsAvailable) {
          this.scholarshipsAvailable = false;
        } else {
          this.scholarshipsAvailable = true;
          this.contactAndInformations = false;
          this.facilitiesAndCapacity = false;
        }
        break;
      case 'facilitiesAndCapacity':
        if (this.facilitiesAndCapacity) {
          this.facilitiesAndCapacity = false;
        } else {
          this.facilitiesAndCapacity = true;
          this.scholarshipsAvailable = false;
          this.contactAndInformations = false;
        }
        break;
      default:
        if (this.contactAndInformations) {
          this.contactAndInformations = false;
        } else {
          this.contactAndInformations = true;
          this.facilitiesAndCapacity = false;
          this.scholarshipsAvailable = false;
        }
    }
  }
}
