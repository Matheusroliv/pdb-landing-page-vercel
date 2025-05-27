import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { MenuMobileService } from '../service/menu-download.service';
import { hideFooterService } from '../service/hide-footer.service';
import { Subscription } from 'rxjs';
import { OpenPreRegistrationModalService } from '../service/open-pre-registration-modal.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { PreRegistrationModalComponent } from '../pre-registration-modal/pre-registration-modal.component';

@Component({
    selector: 'app-calculator',
    templateUrl: './calculator.component.html',
    styleUrls: ['./calculator.component.scss'],
    standalone: false
})
export class CalculatorComponent implements OnInit {

  form: FormGroup;
  calculatedIncome: number | null = null;
  calculatedIncomeSM: number | null = null;
  resultMessage: string = '';
  readonly SM = 1518;
  selectWasChanged = false;
  openMenu = false;
  openModalDownloadApp = false;
  showPreRegistrationModal = false
  private preRegistrationModalSubscription: Subscription | undefined;

  constructor(
    private fb: FormBuilder,
    private navCtrl: NavController,
    private menuService: MenuMobileService,
    private hideFooter: hideFooterService,
    private openPreRegistrationModalService: OpenPreRegistrationModalService,
    private modalService: NgbModal,
  ) {
    this.form = this.fb.group({
      totalPeople: ['', Validators.required],
      incomes: this.fb.array([]),
      alimony: [0],
      socialBenefits: [0],
    });
  }

  ngOnInit() {
    
    this.scrollToTop()

    this.menuService.menu.subscribe(data => {
      this.openMenu = data;
    });
    this.menuService.setMenu(false);
    this.menuService.download.subscribe(data => {
      this.openModalDownloadApp = data;
    });

    this.form.get('totalPeople')?.valueChanges.subscribe((value) => {
      this.updateIncomeInputs(value);
    });

    this.preRegistrationModalSubscription = this.openPreRegistrationModalService.currentData.subscribe(data => {
      this.showPreRegistrationModal = data
      if (this.showPreRegistrationModal) {
        const modalRef = this.modalService.open(PreRegistrationModalComponent, {
          centered: true,
          size: 'xl'
        })

        modalRef.result.then(
          (result) => {
            console.log('Fechado com:', result);
            this.openPreRegistrationModalService.setData(false)
            this.showPreRegistrationModal = false
          },
          (reason) => {
            if (reason === ModalDismissReasons.BACKDROP_CLICK) {
              console.log('Fechado ao clicar fora do modal');
              this.openPreRegistrationModalService.setData(false)
              this.showPreRegistrationModal = false
            }
            if (reason === ModalDismissReasons.ESC) {
              console.log('Fechado ao pressionar Esc');
              this.openPreRegistrationModalService.setData(false)
              this.showPreRegistrationModal = false
            }
          }
        );
      }
    })
  }

  ngOnDestroy(): void {
    if (this.preRegistrationModalSubscription) {
      this.preRegistrationModalSubscription.unsubscribe()
    }
  }

  navigateBack() {
    this.navCtrl.back();
  }

  get incomes(): FormArray {
    return this.form.get('incomes') as FormArray;
  }

  updateIncomeInputs(totalPeople: number) {
    const currentLength = this.incomes.length;

    if (totalPeople > currentLength) {
      for (let i = currentLength; i < totalPeople; i++) {
        this.incomes.push(this.fb.group({ income: [0, Validators.min(0)] }));
      }
    }
    else {
      for (let i = currentLength - 1; i >= totalPeople; i--) {
        this.incomes.removeAt(i);
      }
    }
  }

  calculate() {
    const totalPeople = this.form.get('totalPeople')?.value;
    const alimony = this.form.get('alimony')?.value || 0;
    const socialBenefits = this.form.get('socialBenefits')?.value || 0;
    const incomes = this.incomes.value.map((incomeGroup: any) => incomeGroup.income || 0);

    const totalIncome = incomes.reduce((acc: number, income: number) => acc + income, 0) + alimony + socialBenefits;

    this.calculatedIncome = totalIncome / totalPeople;
    this.calculatedIncomeSM = parseFloat((this.calculatedIncome / this.SM).toFixed(2));

    if (this.calculatedIncomeSM < 1.5) {
      this.resultMessage = `Com esta renda você se qualifica para bolsa <br> <span class="special-color">INTEGRAL</span> e <span class="special-color">PARCIAL</span>.`;
    } else if (this.calculatedIncomeSM >= 1.5 && this.calculatedIncomeSM < 1.8) {
      this.resultMessage = `Com esta renda você se qualifica para bolsa <span class="special-color">PARCIAL</span> e pode se qualificar para bolsa <span class="special-color">INTEGRAL</span>, caso sejam considerados aspectos de natureza social, comprovados por relatório comprobatório assinado por assistente social.`;
    } else if (this.calculatedIncomeSM >= 1.8 && this.calculatedIncomeSM < 3) {
      this.resultMessage = `Com esta renda você se qualifica para bolsa <span class="special-color">PARCIAL</span>.`;
    } else {
      this.resultMessage = `Com esta renda você não se qualifica para bolsas socioeconômicas.`;
    }
  }

  isCalculateButtonDisabled(): boolean {
    return !this.incomes.controls.some((control) => control.value.income > 0);
  }

  changeSelectWasChanged() {
    this.selectWasChanged = true
  }

  closeMenu() {
    this.menuService.setMenu(false);
    this.hideFooter.changeHidefooter(false);
  }

  changeModalDownloadApp(b: boolean) {
    this.openModalDownloadApp = b;
    this.menuService.setDownload(b);
  }

  scrollToTop() {
    window.scrollTo({
      top: 0
    })
  }

}
