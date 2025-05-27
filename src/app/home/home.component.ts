import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { PreRegistrationModalComponent } from '../pre-registration-modal/pre-registration-modal.component';
import { currentPageService } from '../service/currentPage.service';
import { hideFooterService } from '../service/hide-footer.service';
import { MenuMobileService } from '../service/menu-download.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ContentService } from '../service/content.service';
import { StudentCommentService } from '../service/student-comment.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { OpenPreRegistrationModalService } from '../service/open-pre-registration-modal.service';
import { Subscription, Observable, of } from 'rxjs';
import { InstitutionsService } from '../service/institutions.service';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Student } from '../map-session/interface-query';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent implements OnInit, OnDestroy {
  selectWasChanged: boolean = false;
  openMenu: boolean = false;
  openModalDownloadApp: boolean = false;
  currentPhoto: number = 0;
  firstStudentOnScreen: number = 0;
  lastStudentOnScreen: number = 0;
  studentsHistories: Student[] = [];
  studentsOnScreen: Student[] = [];
  maxStudentsPerPage: number = 4;
  widthOfScreen: number = 0;
  openKnowMore: boolean = false;
  showModal: boolean = false;
  landingBanners: any[] = [];
  filteredLandingsBanner: any[] = [];
  intervalBanner: any;
  showPreRegistrationModal = false;
  private preRegistrationModalSubscription: Subscription | undefined;
  errorMessage: string = '';

  selectedCity: string = '';
  selectedEducationLevel: string = '';
  searchText: string = '';

  cityControl = new FormControl('');
  cities: { display: string; city: string; state: string }[] = [];

  cityFormatter = (city: { display: string; city: string; state: string }) => city.display;

  constructor(
    private router: Router,
    private hideFolter: hideFooterService,
    private currentPage: currentPageService,
    private menuDownloadService: MenuMobileService,
    private modalController: ModalController,
    private breakPointObserver: BreakpointObserver,
    private contentService: ContentService,
    private studentCommentService: StudentCommentService,
    private modalService: NgbModal,
    private openPreRegistrationModalService: OpenPreRegistrationModalService,
    private institutionsService: InstitutionsService
  ) { }

  ngOnInit(): void {
    this.loadCities();

    this.breakPointObserver
      .observe([
        '(max-width: 649px)',
        '(min-width: 650px) and (max-width: 991px)',
        '(min-width: 992px) and (max-width: 1399px)',
        '(min-width: 1400px)'
      ])
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          if (this.breakPointObserver.isMatched('(max-width: 649px)')) {
            this.maxStudentsPerPage = 1;
          }
          if (
            this.breakPointObserver.isMatched(
              '(min-width: 650px) and (max-width: 991px)'
            )
          ) {
            this.maxStudentsPerPage = 2;
          }
          if (
            this.breakPointObserver.isMatched(
              '(min-width: 992px) and (max-width: 1399px)'
            )
          ) {
            this.maxStudentsPerPage = 3;
          }
          if (this.breakPointObserver.isMatched('(min-width: 1400px)')) {
            this.maxStudentsPerPage = 4;
          }
          this.studentsOnScreen = [];
          this.putOnStudentsOnScreen();
        }
      });

    this.startAutoSlide();

    this.currentPage.setCurrentData('home');
    this.scrollToTop();

    this.menuDownloadService.menu.subscribe((data) => {
      this.openMenu = data;
    });

    this.menuDownloadService.download.subscribe((data) => {
      this.openModalDownloadApp = data;
    });

    this.changeMenu(false);
    this.loadLandingBanners();
    this.loadStudentsComments();

    this.preRegistrationModalSubscription = this.openPreRegistrationModalService.currentData.subscribe(data => {
      this.showPreRegistrationModal = data;
      if (this.showPreRegistrationModal) {
        const modalRef = this.modalService.open(PreRegistrationModalComponent, {
          centered: true,
          size: 'xl'
        });

        modalRef.result.then(
          (result) => {
            console.log('Fechado com:', result);
            this.openPreRegistrationModalService.setData(false);
            this.showPreRegistrationModal = false;
          },
          (reason) => {
            if (reason === ModalDismissReasons.BACKDROP_CLICK) {
              console.log('Fechado ao clicar fora do modal');
              this.openPreRegistrationModalService.setData(false);
              this.showPreRegistrationModal = false;
            }
            if (reason === ModalDismissReasons.ESC) {
              console.log('Fechado ao pressionar Esc');
              this.openPreRegistrationModalService.setData(false);
              this.showPreRegistrationModal = false;
            }
          }
        );
      }
    });
  }

  loadCities(): void {
    this.institutionsService.listCities().subscribe({
      next: (cities) => {
        this.cities = cities;
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = 'Erro ao carregar cidades. Tente novamente.';
        console.error('Error loading cities:', error);
        this.cities = [];
      }
    });
  }

  searchCities = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      switchMap(term => {
        const filterValue = term.toLowerCase();
        const filteredCities = this.cities.filter(city =>
          city.display.toLowerCase().includes(filterValue)
        );
        const filteredCitiesUnique = this.checkRepeated(filteredCities)
        return of(filteredCitiesUnique);
      }),
      catchError(() => {
        this.errorMessage = 'Erro ao filtrar cidades. Tente novamente.';
        return of([]);
      })
    );

  onCitySelect(event: any): void {
    const selectedCity = event.item;
    if (selectedCity) {
      this.selectedCity = selectedCity.city;
      this.cityControl.setValue(selectedCity.display, { emitEvent: false });
    }
  }

  onEducationLevelChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedEducationLevel = selectElement.value;
    this.selectWasChanged = true;
  }

  goToList(): void {
    const queryParams: any = {
      page: 1,
      limit: 15,
      sort: 'A-Z',
    };

    if (this.searchText?.trim()) {
      const trimmedSearchText = this.searchText.trim();
      if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(trimmedSearchText)) {
        queryParams.cnpj = trimmedSearchText;
      } else if (/^\d{5}-\d{3}$/.test(trimmedSearchText)) {
        queryParams.zipCode = trimmedSearchText;
      } else {
        queryParams.name = trimmedSearchText;
      }
    }

    if (this.selectedCity) {
      queryParams.city = this.selectedCity;
    }

    switch (this.selectedEducationLevel) {
      case 'GRADUATION':
        queryParams.educationLevelSource = 'emec';
        break;
      case 'INFANT':
      case 'PRIMARY':
      case 'SECONDARY':
      case 'YOUNG_ADULTS':
      case 'PROFESSIONAL':
        queryParams.educationLevelSource = 'inep';
        break;
      default:
        queryParams.educationLevelSource = undefined;
        break;
    }

    this.router.navigate(['/list'], { queryParams }).catch(err => {
      this.errorMessage = 'Erro ao navegar para a lista. Tente novamente.';
      console.error('Navigation error:', err);
    });
  }

  loadStudentsComments() {
    this.studentCommentService.listAll().subscribe({
      next: (data) => {
        console.log('Raw API Response (studentsHistories):', data);
        this.studentsHistories = data.map((report: any) => ({
          name: report.studentName || 'Sem Nome',
          city: report.location || 'Localização Desconhecida',
          photo: report.photo || './assets/imgs/default-student.svg',
          message: report.comment || 'Sem Comentário',
          backgroundColor: '',
          rotation: ''
        }));

        this.setRotationOfEachStudent();
        this.setBackgroundColorOfEachStudent();

        this.studentsOnScreen = [];
        this.putOnStudentsOnScreen();
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = 'Erro ao carregar relatos de estudantes. Tente novamente.';
        console.error('Erro ao carregar relatos de estudantes:', error);
        this.studentsHistories = [];
        this.studentsOnScreen = [];
      }
    });
  }

  loadLandingBanners() {
    this.contentService.listAllLandingPage().subscribe(
      (data: any) => {
        this.filteredLandingsBanner = data.filter(
          (banner: any) => banner.isLandingPage === true
        );
        this.landingBanners = this.filteredLandingsBanner.map((banner: any) => {
          let normalizedLink = banner.link;
          if (
            normalizedLink &&
            !normalizedLink.startsWith('http://') &&
            !normalizedLink.startsWith('https://')
          ) {
            normalizedLink = `https://${normalizedLink}`;
          }

          return {
            id: banner._id,
            photo: banner.photo,
            link: normalizedLink || '',
            isLandinPage: banner.isLandingPage,
            isApp: banner.isApp
          };
        });

        if (this.landingBanners.length > 0) {
          this.currentPhoto = 0;
        }
        this.errorMessage = '';
      },
      (error) => {
        this.errorMessage = 'Erro ao carregar banners. Tente novamente.';
        console.error('Error loading landing banners:', error);
      }
    );
  }

  walkOnePhoto() {
    this.currentPhoto = (this.currentPhoto + 1) % this.landingBanners.length;
    this.restartAutoSlide();
  }

  backOnePhoto() {
    this.currentPhoto = (this.currentPhoto - 1 + this.landingBanners.length) % this.landingBanners.length;
    this.restartAutoSlide();
  }

  walkToThisPhoto(num: number) {
    if (num >= 0 && num < this.landingBanners.length) {
      this.currentPhoto = num;
    }
    this.restartAutoSlide();
  }

  changeMenu(b: boolean) {
    this.openMenu = b;
    this.hideFolter.changeHidefooter(b);
    this.menuDownloadService.setMenu(b);
    this.menuDownloadService.setRegisterModalMobile(false);
  }

  changeModalDownloadApp(b: boolean) {
    this.openModalDownloadApp = b;
    this.hideFolter.changeHidefooter(b);
    this.menuDownloadService.setDownload(b);
  }

  reloadHome() {
    this.router.navigate(['/home']);
  }

  goToMap() {
    this.router.navigate(['./map']);
  }

  setRotationOfEachStudent() {
    if (!this.studentsHistories || this.studentsHistories.length === 0) {
      return;
    }
    for (let i = 0; i < this.studentsHistories.length; i++) {
      if (i % 2 === 0) this.studentsHistories[i].rotation = 'right';
      else this.studentsHistories[i].rotation = 'left';
    }
  }

  setBackgroundColorOfEachStudent() {
    if (!this.studentsHistories || this.studentsHistories.length === 0) {
      return;
    }
    for (let i = 0; i < this.studentsHistories.length; i++) {
      if (i % 4 === 0) this.studentsHistories[i].backgroundColor = 'green';
      else if (i % 4 === 1) this.studentsHistories[i].backgroundColor = 'orange';
      else if (i % 4 === 2) this.studentsHistories[i].backgroundColor = 'blue';
      else if (i % 4 === 3) this.studentsHistories[i].backgroundColor = 'dark-green';
    }
  }

  putOnStudentsOnScreen() {
    this.studentsOnScreen = [];
    if (!this.studentsHistories || this.studentsHistories.length === 0) {
      this.firstStudentOnScreen = 0;
      this.lastStudentOnScreen = 0;
      return;
    }
    for (
      let i = 0;
      i < this.maxStudentsPerPage && i < this.studentsHistories.length;
      i++
    ) {
      this.studentsOnScreen.push(this.studentsHistories[i]);
    }
    this.firstStudentOnScreen = 0;
    this.lastStudentOnScreen = this.studentsOnScreen.length - 1;
  }

  walkOneStudent() {
    if (
      !this.studentsHistories ||
      this.studentsHistories.length <= this.maxStudentsPerPage
    ) {
      return;
    }
    this.studentsOnScreen.shift();
    if (this.lastStudentOnScreen === this.studentsHistories.length - 1) {
      this.lastStudentOnScreen = 0;
      this.studentsOnScreen.push(this.studentsHistories[this.lastStudentOnScreen]);
    } else {
      this.studentsOnScreen.push(this.studentsHistories[++this.lastStudentOnScreen]);
    }
    this.firstStudentOnScreen = (this.firstStudentOnScreen + 1) % this.studentsHistories.length;
  }

  backOneStudent() {
    if (
      !this.studentsHistories ||
      this.studentsHistories.length <= this.maxStudentsPerPage
    ) {
      return;
    }
    this.studentsOnScreen.pop();
    if (this.firstStudentOnScreen === 0) {
      this.firstStudentOnScreen = this.studentsHistories.length - 1;
    } else {
      this.firstStudentOnScreen -= 1;
    }
    this.studentsOnScreen.unshift(this.studentsHistories[this.firstStudentOnScreen]);
    this.lastStudentOnScreen = this.firstStudentOnScreen + this.studentsOnScreen.length - 1;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  changeOpenKnowMore() {
    this.openKnowMore = !this.openKnowMore;
  }

  goToKnowMore(route: any) {
    if (route === 'Estudantes') {
      this.router.navigate(['/know-more']);
    }
    if (route === 'Instituições') {
      this.router.navigate(['/know-more-institution']);
    }
  }

  openModal() {
    this.modalService.open(PreRegistrationModalComponent, {
      centered: true,
      size: 'xl'
    });
  }

  startAutoSlide() {
    this.intervalBanner = setInterval(() => {
      this.walkOnePhoto();
    }, 7000);
  }

  restartAutoSlide() {
    clearInterval(this.intervalBanner);
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    if (this.preRegistrationModalSubscription) {
      this.preRegistrationModalSubscription.unsubscribe();
    }
    clearInterval(this.intervalBanner);
  }

  checkRepeated(list: any) {
    let newList = []
    if (list) newList.push(list[0])
    if (list.length > 1) {
      for (let i = 1; i < list.length; i++) {
        if (list[i].city.toLowerCase() != list[i - 1].city.toLowerCase()) {
          newList.push(list[i])
        }
      }
    }
    console.log(newList)
    return newList
  }
}
