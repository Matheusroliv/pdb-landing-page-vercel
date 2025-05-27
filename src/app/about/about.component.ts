import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { currentPageService } from '../service/currentPage.service';
import { MenuMobileService } from '../service/menu-download.service';
import { hideFooterService } from '../service/hide-footer.service';
import { Subscription } from 'rxjs';
import { OpenPreRegistrationModalService } from '../service/open-pre-registration-modal.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { PreRegistrationModalComponent } from '../pre-registration-modal/pre-registration-modal.component';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    standalone: false
})
export class AboutComponent implements OnInit {
  videoUrl!: SafeResourceUrl;
  openMenu: boolean = false;
  openModalDownloadApp: boolean = false;
  showPreRegistrationModal = false
  private preRegistrationModalSubscription: Subscription | undefined;

  constructor(
    private sanitizer: DomSanitizer,
    private breakpointObserver: BreakpointObserver,
    private currentPageService: currentPageService,
    private menuService: MenuMobileService,
    private hideFolter: hideFooterService,
    private openPreRegistrationModalService: OpenPreRegistrationModalService,
    private modalService: NgbModal,
  ) { }

  events = [
    {
      title: 'Promulgação da Constituição',
      year: 1988,
      fullText: 'O Artigo 195 da Constituição prevê benefício fiscal para entidades beneficentes nas áreas de educação, saúde e assistência social.'
    },
    {
      title: 'Primeiras bolsas na PUC-Rio',
      year: 1991,
      fullText: 'Em 91, após Frei David solicitar que a PUC-Rio ofertasse bolsas para negros e pobres, o reitor disse que: “nenhuma pessoa de Colégio Público tem condições de ser aprovado na PUC, darei bolsa 100% a todos que conseguirem passar”. E graças aos esforços do Pré-Vestibular para Negros e Carentes (PVNC) 3 bolsistas foram aprovados no Vestibular da PUC-RIO. O programa regular das bolsas da PUC-Rio seria criado em 1993, a partir de uma iniciativa EDUCAFRO Brasil.'
    },
    {
      title: 'Início da Luta pela Lei de Cotas e Prouni',
      year: 1996,
      fullText: 'Apesar dos esforços para os cursinhos pré-vestibular gratuitos, a EDUCAFRO Brasil percebe a necessidade de que haja alguma política pública que garanta a inclusão de negros e pobres nas universidades públicas e uma política pública consolidada a nível Nacional para bolsas de estudos em universidade privadas.'
    },
    {
      title: 'Adoção de cotas na UNEB, UERJ e UNB',
      year: 2002,
      fullText: 'A Universidade do Estado da Bahia adotou em 2002 o primeiro vestibular público com reserva de vagas para ações afirmativa em cursos de graduação e pós-graduação, sendo a pioneira em uma política interna de Cotas. No ano seguinte, foi a vez da UERJ, e em 2004, a UNB se tornou a primeira Universidade Federal a adotar cotas raciais em todo o país.'
    },
    {
      title: 'Criação do ProUni',
      year: 2004,
      fullText: 'O Programa Universidade para Todos (ProUni) foi criado em 2004, pela Lei nº 11.096/2005, e tem como finalidade a concessão de bolsas de estudos integrais e parciais a estudantes de cursos de graduação e de cursos sequenciais de formação específica, em instituições privadas de educação superior.'
    },
    {
      title: 'Operação Fariseus da Receita Federal',
      year: 2008,
      fullText: 'Uma fraude previdenciária de mais de R$ 2 bilhões fez com que a Polícia Federal deflagrasse a Operação Fariseu, que prendeu advogados e ex-conselheiros do Conselho Nacional de Assistência Social. Em suma, as organizações processadas se utilizavam de propina e tráfico de influências para ter acesso à Certificação de Entidade Beneficente de Assistência Social (CEBAS) sem entregar as contrapartidas previstas.'
    },
    {
      title: 'Aprovação da Lei 12.101',
      year: 2009,
      fullText: 'Como consequência a Operação Fariseus, o Congresso brasileiro aprovou a Lei 12.101, a primeira Lei da CEBAS. Dentre outras mudanças, ela criou o conceito de entidades beneficentes na área da educação, admitindo instituições de ensino que concedam percentual de bolsas de estudo, não só as que prestam serviços inteiramente gratuitos.'
    },
    {
      title: 'Criação da Lei de Cotas',
      year: 2012,
      fullText: 'A Lei nº 12.711/2012, sancionada em agosto de 2012, garante a reserva de 50% das matrículas por curso e turno nas 63 universidades federais e 41 institutos federais de educação, ciência e tecnologia a alunos oriundos integralmente do ensino médio público, com proporções para negros e indígenas.'
    },
    {
      title: 'Ação Direta de Inconstitucionalidade 4.480',
      year: 2020,
      fullText: 'A CONFENEN, uma das principais associações de lobby do setor privado da educação, protocolou a ADI 4.480, com objetivo declarar a CEBAS Educação inconstitucional, argumentando contra artigos como os que exigem bolsas de estudo e que limitam a remuneração dos dirigentes das instituições que recebem o benefício. A ação foi julgada parcialmente procedente, de forma que foi necessário que o Congresso aprovasse uma nova Lei para a CEBAS.'
    },
    {
      title: 'Criação da Ponteduca e do primeiro Relatório CEBAS',
      year: 2021,
      fullText: 'Um grupo de alunos, bolsistas e pagantes, do curso de Administração Pública da FGV-SP, descobrem a CEBAS Educação e decidem lutar pela regularização de centenas de milhares de bolsas de estudos, publicando seu primeiro relatório sobre a Lei, analisando os relatórios de investigação do TCU(2017) e da AGU(2019).'
    },
    {
      title: 'Aprovação da Lei Complementar 187',
      year: 2021,
      fullText: 'Após 12 anos desde a primeira regulamentação e como resultado da ADI 4.480, a Lei Complementar 187 foi aprovada em novembro de 2021, estabelecendo um novo marco legal para a Certificação de Entidades Beneficentes de Assistência Social (CEBAS) nos setores de Saúde, Educação e Assistência Social. O principal objetivo da nova legislação é garantir maior segurança jurídica e preservar os direitos já adquiridos pelas entidades. No entanto, um ponto negativo foi a falta de revisão de aspectos cruciais, como o processo seletivo, a melhoria no sistema de prestação de contas e uma definição mais clara sobre o tratamento diferenciado entre bolsistas e pagantes, que poderiam aumentar a eficiência e a eficácia da política.'
    },
    {
      title: 'Manifestação na ESPM e conquista de centenas de bolsas',
      year: 2022,
      fullText: 'Após relatarem a oferta ineficiente de bolsas da ESPM-SP, a Ponteduca, em parceria com a UNE, UMES e diversas figuras políticas, realizam um protesto em frente da ESPM cobrando pelas bolsas CEBAS Educação. O resultado até agora foi a oferta de mais de 200 bolsas integrais.'
    },
    {
      title: 'Entidades protocolam ação contra o Colégio Porto Seguro',
      year: 2024,
      fullText: 'Após os pedidos não acatados pelo Colégio, de fim da segregação, e uma falha negociação entre as partes, EDUCAFRO, Ponteduca e ANCED protocolam Ação Civil Pública contra o Colégio Visconde de Porto Seguro por danos morais e coletivos contra a comunidade bolsista e afro-brasileira. O processo se deu a partir da denúncia da histórica prática de segregação dos alunos bolsistas praticada pelo Colégio.'
    },
    {
      title: 'Destinação de emenda para construção do Portal do Bolsista',
      year: 2024,
      fullText: 'A partir de uma iniciativa da Ponteduca, em parceria com a Educafro Brasil, o gabinete da Deputada Federal Tábata Amaral, em colaboração com o Ministério da Igualdade Racial, destinou R$ 220 mil para a criação do Portal do Bolsista, uma plataforma desenvolvida para fornecer informações sobre bolsas de estudo e auxiliar os estudantes bolsistas na garantia de seus direitos.'
    },
  ];


  selectedEventIndex: number | null = null;
  currentPage: number = 0;
  pageSize: number = 5;
  totalPages: number = Math.ceil(this.events.length / this.pageSize);

  ngOnInit() {
    this.currentPageService.setCurrentData('about');
    const videoId = 'tcLLTsP3wlo';
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://youtu.be/CvYsXm0XGe8${videoId}`);

    this.breakpointObserver.observe([
      '(max-width: 460px)',
      '(min-width: 461px) and (max-width: 768px)',
      '(min-width: 769px) and (max-width: 992px)',
      '(min-width: 993px) and (max-width: 1200px)',
      '(min-width: 1201px)'
    ]).subscribe((state: BreakpointState) => {
      if (state.matches) {
        if (this.breakpointObserver.isMatched('(max-width: 576px)')) {
          this.pageSize = 2;
        } else if (this.breakpointObserver.isMatched('(min-width: 577px) and (max-width: 768px)')) {
          this.pageSize = 2;
        } else if (this.breakpointObserver.isMatched('(min-width: 769px) and (max-width: 992px)')) {
          this.pageSize = 3;
        } else if (this.breakpointObserver.isMatched('(min-width: 993px) and (max-width: 1200px)')) {
          this.pageSize = 4;
        } else if (this.breakpointObserver.isMatched('(min-width: 1201px)')) {
          this.pageSize = 5;
        }
        this.totalPages = Math.ceil(this.events.length / this.pageSize);
        if (this.currentPage >= this.totalPages) {
          this.currentPage = this.totalPages - 1;
        }
      }
    });

    this.menuService.menu.subscribe(data => {
      this.openMenu = data;
    })
    this.menuService.setMenu(false);

    this.menuService.download.subscribe(data => {
      this.openModalDownloadApp = data;
    })

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

  togglePopover(index: number): void {
    this.selectedEventIndex =
      this.selectedEventIndex === index ? null : index;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.selectedEventIndex = null;
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.selectedEventIndex = null;
    }
  }

  closeMenu() {
    this.menuService.setMenu(false);
    this.hideFolter.changeHidefooter(false);
    this.openPreRegistrationModalService.setData(false)
    this.showPreRegistrationModal = false
    console.log(this.showPreRegistrationModal)
  }

  closeModal() {
    this.openModalDownloadApp = false
    this.menuService.setDownload(false);
    console.log('closeModal()')
  }

  changeModalDownloadApp(b: boolean) {
    this.openModalDownloadApp = b;
    this.menuService.setDownload(b);
    this.hideFolter.changeHidefooter(b);
    console.log('changeModalDownloadApp()')
  }

  scrollToTop() {
    window.scrollTo({
      top: 0
    })
  }
}
