import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SegurancaModalComponent } from './seguranca-modal.component';

describe('SegurancaModalComponent', () => {
  let component: SegurancaModalComponent;
  let fixture: ComponentFixture<SegurancaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegurancaModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SegurancaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
