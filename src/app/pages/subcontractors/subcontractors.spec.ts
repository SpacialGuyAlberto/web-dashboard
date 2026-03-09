import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Subcontractors } from './subcontractors';

describe('Subcontractors', () => {
  let component: Subcontractors;
  let fixture: ComponentFixture<Subcontractors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Subcontractors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Subcontractors);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
