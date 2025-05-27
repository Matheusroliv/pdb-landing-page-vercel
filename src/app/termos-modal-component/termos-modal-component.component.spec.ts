import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermosModalComponentComponent } from './termos-modal-component.component';

describe('TermosModalComponentComponent', () => {
  let component: TermosModalComponentComponent;
  let fixture: ComponentFixture<TermosModalComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermosModalComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermosModalComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
