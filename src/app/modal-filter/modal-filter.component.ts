import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { getAddressByCepService } from '../service/getAddressByCep.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EducationLevelEnum, InstitutionQuery } from '../map-session/interface-query';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { InstitutionsService } from '../service/institutions.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-modal-filter',
  templateUrl: './modal-filter.component.html',
  styleUrls: ['./modal-filter.component.scss'],
  standalone: false
})
export class ModalFilterComponent implements OnInit, OnDestroy {
  @Output() applyFilters = new EventEmitter<any>();
  @Input() currentFilters: InstitutionQuery = {};

  institutionFilter: boolean = false;
  locationFilter: boolean = false;
  formLocation: FormGroup;
  formInstitution: FormGroup;
  endereco: any;
  showSelectPlaceholder1: boolean = false;
  showSelectPlaceholder2: boolean = false;
  showSelectPlaceholder3: boolean = false;
  avaliacao: number | undefined = undefined;
  coordinates: [number, number] | undefined = undefined;
  private destroy$ = new Subject<void>();

  // State map with all Brazilian states (full name or abbreviation to abbreviation)
  private stateMap: { [key: string]: string } = {
    'Acre': 'AC',
    'AC': 'AC',
    'Alagoas': 'AL',
    'AL': 'AL',
    'Amapá': 'AP',
    'AP': 'AP',
    'Amazonas': 'AM',
    'AM': 'AM',
    'Bahia': 'BA',
    'BA': 'BA',
    'Ceará': 'CE',
    'CE': 'CE',
    'Distrito Federal': 'DF',
    'DF': 'DF',
    'Espírito Santo': 'ES',
    'ES': 'ES',
    'Goiás': 'GO',
    'GO': 'GO',
    'Maranhão': 'MA',
    'MA': 'MA',
    'Mato Grosso': 'MT',
    'MT': 'MT',
    'Mato Grosso do Sul': 'MS',
    'MS': 'MS',
    'Minas Gerais': 'MG',
    'MG': 'MG',
    'Pará': 'PA',
    'PA': 'PA',
    'Paraíba': 'PB',
    'PB': 'PB',
    'Paraná': 'PR',
    'PR': 'PR',
    'Pernambuco': 'PE',
    'PE': 'PE',
    'Piauí': 'PI',
    'PI': 'PI',
    'Rio de Janeiro': 'RJ',
    'RJ': 'RJ',
    'Rio Grande do Norte': 'RN',
    'RN': 'RN',
    'Rio Grande do Sul': 'RS',
    'RS': 'RS',
    'Rondônia': 'RO',
    'RO': 'RO',
    'Roraima': 'RR',
    'RR': 'RR',
    'Santa Catarina': 'SC',
    'SC': 'SC',
    'São Paulo': 'SP',
    'SP': 'SP',
    'Sergipe': 'SE',
    'SE': 'SE',
    'Tocantins': 'TO',
    'TO': 'TO'
  };

  constructor(
    private fb: FormBuilder,
    private getAddressByCep: getAddressByCepService,
    private modalService: NgbModal,
    private institutionsService: InstitutionsService,
    private toastr: ToastrService
  ) {
    this.formLocation = this.fb.group({
      zipCode: [''],
      state: [''],
      city: [''],
      address: ['']
    });

    this.formInstitution = this.fb.group({
      dataBegin: [''],
      dataEnd: [''],
      educationLevel: [''],
      juridicName: [''],
      institutionType: [''],
      academicOrganization: [''],
      acessibility: [undefined],
      phone: [false],
      email: [false],
      site: [false],
      scholarshipPolicy: [''],
      rating: ['']
    });
  }

  ngOnInit(): void {
    this.initializeFilters();
    this.setupZipCodeDebounce();
    this.setupDateFormatting();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDateFormatting(): void {
    this.formInstitution.get('dataBegin')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value instanceof Date) {
          const day = String(value.getDate()).padStart(2, '0');
          const month = String(value.getMonth() + 1).padStart(2, '0');
          const year = value.getFullYear();
          this.formInstitution.get('dataBegin')?.setValue(`${day}/${month}/${year}`, { emitEvent: false });
        }
      });

    this.formInstitution.get('dataEnd')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value instanceof Date) {
          const day = String(value.getDate()).padStart(2, '0');
          const month = String(value.getMonth() + 1).padStart(2, '0');
          const year = value.getFullYear();
          this.formInstitution.get('dataEnd')?.setValue(`${day}/${month}/${year}`, { emitEvent: false });
        }
      });
  }

  formatDateInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);

    if (value.length >= 4) {
      value = value.replace(/^(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
    } else if (value.length >= 2) {
      value = value.replace(/^(\d{2})(\d{0,2})/, '$1/$2');
    }

    this.formInstitution.get(controlName)?.setValue(value, { emitEvent: false });
  }

  initializeFilters(): void {
    if (this.currentFilters && Object.keys(this.currentFilters).length > 0) {
      this.formLocation.patchValue({
        zipCode: this.currentFilters.zipCode || '',
        city: this.currentFilters.city || '',
        address: this.currentFilters.address || '',
        state: this.currentFilters.state || ''
      });

      this.formInstitution.patchValue({
        educationLevel: this.currentFilters.educationLevelSource || '',
        juridicName: this.currentFilters.juridicName || '',
        institutionType: this.currentFilters.type || '',
        academicOrganization: this.currentFilters.academicOrganization || '',
        scholarshipPolicy: this.currentFilters.scholarshipPolicy || '',
        rating: this.currentFilters.rating || '',
        dataBegin: this.currentFilters.openingdateBegin || '',
        dataEnd: this.currentFilters.openingdateEnd || ''
      }, { emitEvent: false });

      const safeAccessibility = Array.isArray(this.currentFilters.acessibility) && this.currentFilters.acessibility.length > 0
        ? this.currentFilters.acessibility
        : undefined;
      this.formInstitution.get('acessibility')?.setValue(safeAccessibility, { emitEvent: false });

      this.formInstitution.patchValue({
        phone: this.currentFilters.phone === true,
        email: this.currentFilters.email === true,
        site: this.currentFilters.site === true
      }, { emitEvent: false });

      this.avaliacao = this.currentFilters.rating;
      this.coordinates = this.currentFilters.coordinates || undefined;
    } else {
      this.formInstitution.patchValue({
        educationLevel: '',
        juridicName: '',
        institutionType: '',
        academicOrganization: '',
        scholarshipPolicy: '',
        rating: '',
        dataBegin: '',
        dataEnd: '',
        acessibility: undefined,
        phone: false,
        email: false,
        site: false
      }, { emitEvent: false });
    }

    this.showSelectPlaceholder1 = !!this.formLocation.get('zipCode')?.value ||
      !!this.formLocation.get('city')?.value ||
      !!this.formLocation.get('address')?.value;

    this.showSelectPlaceholder2 = !!this.formInstitution.get('educationLevel')?.value ||
      !!this.formInstitution.get('scholarshipPolicy')?.value;

    this.showSelectPlaceholder3 = !!this.formInstitution.get('juridicName')?.value ||
      !!this.formInstitution.get('institutionType')?.value ||
      !!this.formInstitution.get('academicOrganization')?.value ||
      (this.formInstitution.get('acessibility')?.value && this.formInstitution.get('acessibility')?.value.length > 0) ||
      this.formInstitution.get('phone')?.value ||
      this.formInstitution.get('email')?.value ||
      this.formInstitution.get('site')?.value;
  }

  setupZipCodeDebounce(): void {
    this.formLocation.get('zipCode')?.valueChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        const cleanZipCode = value?.replace(/\D/g, '');
        this.consultarCep(cleanZipCode);
      });
  }

  openFilter(option: string) {
    if (option === 'institution') {
      this.institutionFilter = !this.institutionFilter;
      this.locationFilter = false;
    }
    if (option === 'location') {
      this.locationFilter = !this.locationFilter;
      this.institutionFilter = false;
    }
  }

  async consultarCep(zipCode: string = '') {
    const cleanZipCode = zipCode.replace(/\D/g, '');
    if (cleanZipCode.length === 8) {
      this.getAddressByCep.buscarCep(cleanZipCode).subscribe(
        (dados) => {
          if (dados.erro) {
            this.formLocation.patchValue({
              state: '',
              city: '',
              address: ''
            });
            this.toastr.error('CEP inválido.');
            this.showSelectPlaceholder1 = false;
          } else {
            // Normalize state to abbreviation
            let normalizedState = dados.estado || '';
            normalizedState = this.stateMap[normalizedState] || normalizedState.toUpperCase();

            this.endereco = dados;
            this.formLocation.patchValue({
              state: normalizedState,
              city: dados.localidade || '',
              address: dados.logradouro || ''
            });
            this.showSelectPlaceholder1 = true;
          }
        },
        (error) => {
          console.error('Erro ao buscar CEP:', error);
          this.formLocation.patchValue({
            state: '',
            city: '',
            address: ''
          });
          this.toastr.error('Erro ao buscar CEP.');
          this.showSelectPlaceholder1 = false;
        }
      );
    } else {
      this.formLocation.patchValue({
        state: '',
        city: '',
        address: ''
      });
      this.showSelectPlaceholder1 = false;
    }
  }

  apply(): void {
    const dataBegin = this.formInstitution.get('dataBegin')?.value;
    const dataEnd = this.formInstitution.get('dataEnd')?.value;
    const acessibility = this.formInstitution.get('acessibility')?.value || [];
    const phone = this.formInstitution.get('phone')?.value ?? false;
    const email = this.formInstitution.get('email')?.value ?? false;
    const site = this.formInstitution.get('site')?.value ?? false;
    const scholarshipPolicy = this.formInstitution.get('scholarshipPolicy')?.value;

    const formatDateToISO = (date: string): string | undefined => {
      if (!date) return undefined;
      const cleanDate = date.replace(/\D/g, '');
      if (cleanDate.length !== 8) return undefined;
      const day = cleanDate.slice(0, 2);
      const month = cleanDate.slice(2, 4);
      const year = cleanDate.slice(4);
      return `${year}-${month}-${day}`;
    };

    const formattedDataBegin = formatDateToISO(dataBegin);
    const formattedDataEnd = formatDateToISO(dataEnd);

    if (formattedDataBegin && formattedDataEnd) {
      const beginDate = new Date(formattedDataBegin);
      const endDate = new Date(formattedDataEnd);
      if (beginDate > endDate) {
        this.toastr.error('A data de início não pode ser posterior à data de fim.');
        return;
      }
    }

    const educationLevel = this.formInstitution.get('educationLevel')?.value;
    const educationLevelSource = educationLevel ? educationLevel as EducationLevelEnum : undefined;
    const ratingValue = this.avaliacao !== undefined && this.avaliacao >= 0 && this.avaliacao <= 5 ? this.avaliacao : undefined;
    const zipCode = this.formLocation.get('zipCode')?.value || '';

    let coordinates: [number, number] | undefined = this.coordinates ?? undefined;

    const applyFiltersAsync = new Promise<void>((resolve) => {
      if (zipCode && zipCode.replace(/\D/g, '').length === 8) {
        this.institutionsService.getCoordinatesFromZipCode(zipCode).then(coords => {
          coordinates = coords === null ? undefined : coords;
          resolve();
        }).catch(() => {
          coordinates = undefined;
          resolve();
        });
      } else {
        coordinates = undefined;
        resolve();
      }
    });

    applyFiltersAsync.then(() => {
      const filters: InstitutionQuery = {
        zipCode: zipCode && zipCode.trim() !== '' ? zipCode : undefined,
        city: zipCode ? undefined : (this.formLocation.get('city')?.value?.trim() || undefined),
        address: zipCode ? undefined : (this.formLocation.get('address')?.value?.trim() || undefined),
        state: zipCode ? undefined : (this.formLocation.get('state')?.value?.trim() || undefined),
        coordinates: coordinates, // Enviar coordenadas obtidas do CEP
        juridicName: this.formInstitution.get('juridicName')?.value?.trim() || undefined,
        type: this.formInstitution.get('institutionType')?.value?.trim() || undefined,
        academicOrganization: this.formInstitution.get('academicOrganization')?.value?.trim() || undefined,
        openingdateBegin: formattedDataBegin,
        openingdateEnd: formattedDataEnd,
        rating: ratingValue,
        educationLevelSource: educationLevelSource,
        acessibility: Array.isArray(acessibility) && acessibility.length > 0 ? acessibility : undefined,
        phone: phone,
        email: email,
        site: site,
        scholarshipPolicy: scholarshipPolicy?.trim() || undefined,
      };

      this.applyFilters.emit(filters);
      this.closeModal();
    });
  }
  resetFilters(): void {
    this.formLocation.reset();
    this.formInstitution.reset();
    this.formInstitution.patchValue({
      academicOrganization: '',
      dataBegin: '',
      dataEnd: '',
      acessibility: undefined,
      phone: false,
      email: false,
      site: false,
      scholarshipPolicy: '',
    });
    this.showSelectPlaceholder1 = false;
    this.showSelectPlaceholder2 = false;
    this.showSelectPlaceholder3 = false;
    this.avaliacao = undefined;
    this.coordinates = undefined;
  }

  updateAccessibility(event: Event): void {
    const input = event.target as HTMLInputElement;
    const option = input.value;
    let currentAccessibility = this.formInstitution.get('acessibility')?.value || [];

    if (input.checked) {
      if (!currentAccessibility.includes(option)) {
        currentAccessibility = [...currentAccessibility, option];
      }
    } else {
      currentAccessibility = currentAccessibility.filter((item: string) => item !== option);
    }

    this.formInstitution.get('acessibility')?.setValue(currentAccessibility.length > 0 ? currentAccessibility : undefined);
    this.updateShowSelectPlaceholder3();
  }

  updateShowSelectPlaceholder1(): void {
    this.showSelectPlaceholder1 = !!this.formLocation.get('zipCode')?.value ||
      !!this.formLocation.get('city')?.value ||
      !!this.formLocation.get('address')?.value;
  }

  updateShowSelectPlaceholder2(): void {
    this.showSelectPlaceholder2 = !!this.formInstitution.get('educationLevel')?.value ||
      !!this.formInstitution.get('scholarshipPolicy')?.value;
  }

  updateShowSelectPlaceholder3(): void {
    this.showSelectPlaceholder3 = !!this.formInstitution.get('juridicName')?.value ||
      !!this.formInstitution.get('institutionType')?.value ||
      !!this.formInstitution.get('academicOrganization')?.value ||
      (this.formInstitution.get('acessibility')?.value && this.formInstitution.get('acessibility')?.value.length > 0) ||
      this.formInstitution.get('phone')?.value ||
      this.formInstitution.get('email')?.value ||
      this.formInstitution.get('site')?.value;
  }

  changeAvaliacao(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const value = parseInt((target.closest('[data-value]') as HTMLElement)?.getAttribute('data-value') || '0', 10);
    if (value >= 0 && value <= 5) {
      this.avaliacao = value === 0 ? undefined : value;
    }
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  isAccessibilitySelected(option: string): boolean {
    const value = this.formInstitution.get('acessibility')?.value;
    return Array.isArray(value) && value.includes(option);
  }
}
