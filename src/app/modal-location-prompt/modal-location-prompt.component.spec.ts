import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalLocationPromptComponent } from './modal-location-prompt.component';

describe('ModalLocationPromptComponent', () => {
  let component: ModalLocationPromptComponent;
  let fixture: ComponentFixture<ModalLocationPromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalLocationPromptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalLocationPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
