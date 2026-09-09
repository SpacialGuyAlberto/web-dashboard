import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DpDashboard } from './dp-dashboard';

describe('DpDashboard', () => {
  let component: DpDashboard;
  let fixture: ComponentFixture<DpDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DpDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DpDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
