import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { getAddressByCepService } from '../service/getAddressByCep.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InstitutionQuery } from '../map-session/interface-query';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { InstitutionsService } from '../service/institutions.service';

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
  coordinates: [number, number] | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private getAddressByCep: getAddressByCepService,
    private modalService: NgbModal,
    private institutionsService: InstitutionsService
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
      type: [''],
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

    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 8) value = value.slice(0, 8);

    // Format as DD/MM/YYYY

    if (value.length >= 4) {
      value = value.replace(/^(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
    } else if (value.length >= 2) {
      value = value.replace(/^(\d{2})(\d{0,2})/, '$1/$2');
    }

    this.formInstitution.get(controlName)?.setValue(value, { emitEvent: false });
  }

  initializeFilters(): void {
    if (this.currentFilters) {
      this.formLocation.patchValue({
        zipCode: this.currentFilters.zipCode || '',
        city: this.currentFilters.city || '',
        address: this.currentFilters.address || '',
        state: this.currentFilters.state || ''
      });

      this.formInstitution.patchValue({
        educationLevel: this.currentFilters.offeredEducationStagesAndModalities?.[0] || '',
        juridicName: this.currentFilters.juridicName || '',
        institutionType: this.currentFilters.type || '',
        academicOrganization: this.currentFilters.academicOrganization || '',
        dataBegin: this.currentFilters.openingdateBegin || '',
        dataEnd: this.currentFilters.openingdateEnd || '',
        rating: this.currentFilters.rating || ''
      });

      this.avaliacao = this.currentFilters.rating;

      this.coordinates = this.currentFilters.coordinates || null;

      this.showSelectPlaceholder1 = !!this.formLocation.get('zipCode')?.value ||
        !!this.formLocation.get('city')?.value ||
        !!this.formLocation.get('address')?.value;

      this.showSelectPlaceholder2 = !!this.formInstitution.get('educationLevel')?.value;

      this.showSelectPlaceholder3 = !!this.formInstitution.get('juridicName')?.value ||
        !!this.formInstitution.get('institutionType')?.value ||
        !!this.formInstitution.get('academicOrganization')?.value;
    }
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
            alert('CEP inválido. Por favor, verifique e tente novamente.');
          } else {
            this.endereco = dados;
            this.formLocation.patchValue({
              state: dados.estado || '',
              city: dados.localidade || '',
              address: dados.logradouro || ''
            });
            this.showSelectPlaceholder1 = true;
          }
        },
        (erro) => {
          console.error('Erro ao buscar CEP', erro);
          this.formLocation.patchValue({
            state: '',
            city: '',
            address: ''
          });
          alert('Erro ao buscar CEP. Por favor, tente novamente.');
          this.showSelectPlaceholder1 = false;
        }
      );
    } else if (cleanZipCode.length > 0 && cleanZipCode.length < 8) {
      this.formLocation.patchValue({
        state: '',
        city: '',
        address: ''
      });
      this.showSelectPlaceholder1 = false;
    } else if (cleanZipCode.length === 0) {
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

    const formatDate = (date: string): string => {
      if (!date) return '';
      const [day, month, year] = date.split('/');
      return `${day}/${month}/${year}`;

    };

    const formattedDataBegin = formatDate(dataBegin);
    const formattedDataEnd = formatDate(dataEnd);

    if (formattedDataBegin && formattedDataEnd) {
      const beginDate = new Date(formattedDataBegin.split('/').reverse().join('-'));
      const endDate = new Date(formattedDataEnd.split('/').reverse().join('-'));

      if (beginDate > endDate) {
        alert('A data de início não pode ser posterior à data de fim.');
        return;
      }
    }

    const educationLevel = this.formInstitution.get('educationLevel')?.value;
    let educationLevelSource: 'inep' | 'emec' | undefined;

    switch (educationLevel) {
      case 'GRADUATION':
        educationLevelSource = 'emec';
        break;
      case 'INFANT':
      case 'PRIMARY':
      case 'SECONDARY':
      case 'YOUNG_ADULTS':
      case 'PROFESSIONAL':
        educationLevelSource = 'inep';
        break;
      default:
        educationLevelSource = undefined;
        break;
    }

    const ratingValue = this.avaliacao !== undefined && this.avaliacao > 0 && this.avaliacao <= 5 ? this.avaliacao : undefined;

    const zipCode = this.formLocation.get('zipCode')?.value || '';

    const applyFiltersAsync = new Promise<void>((resolve) => {
      if (zipCode && zipCode.replace(/\D/g, '').length === 8) {
        this.institutionsService.getCoordinatesFromZipCode(zipCode).then(coordinates => {
          this.coordinates = coordinates;
          resolve();
        });
      } else {
        resolve();
      }
    });

    applyFiltersAsync.then(() => {
      const academicOrgValue = this.formInstitution.get('academicOrganization')?.value;
      const filters: InstitutionQuery = {
        zipCode: zipCode || undefined,
        city: zipCode ? undefined : this.formLocation.get('city')?.value || undefined,
        address: zipCode ? undefined : this.formLocation.get('address')?.value || undefined,
        state: zipCode ? undefined : this.formLocation.get('state')?.value || undefined,
        coordinates: this.coordinates || undefined,
        juridicName: this.formInstitution.get('juridicName')?.value || undefined,
        type: this.formInstitution.get('institutionType')?.value || undefined,
        academicOrganization: academicOrgValue || undefined,
        offeredEducationStagesAndModalities: educationLevel && educationLevelSource !== 'emec' ? [educationLevel] : undefined,
        openingdateBegin: formattedDataBegin || undefined,
        openingdateEnd: formattedDataEnd || undefined,
        rating: ratingValue,
        educationLevelSource: educationLevelSource,
      };

      this.applyFilters.emit(filters);
      this.closeModal();
    });
  }

  resetFilters(): void {
    this.formLocation.reset();
    this.formInstitution.reset();
    this.formInstitution.get('academicOrganization')?.setValue('');
    this.formInstitution.get('dataBegin')?.setValue('');
    this.formInstitution.get('dataEnd')?.setValue('');
    this.showSelectPlaceholder1 = false;
    this.showSelectPlaceholder2 = false;
    this.showSelectPlaceholder3 = false;
    this.avaliacao = undefined;
    this.coordinates = null;
  }

  updateShowSelectPlaceholder1(): void {
    this.showSelectPlaceholder1 = !!this.formLocation.get('zipCode')?.value ||
      !!this.formLocation.get('city')?.value ||
      !!this.formLocation.get('address')?.value;
  }

  updateShowSelectPlaceholder2(): void {
    this.showSelectPlaceholder2 = !!this.formInstitution.get('educationLevel')?.value;
  }

  updateShowSelectPlaceholder3(): void {
    this.showSelectPlaceholder3 = !!this.formInstitution.get('juridicName')?.value ||
      !!this.formInstitution.get('institutionType')?.value ||
      !!this.formInstitution.get('academicOrganization')?.value;
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
}
