import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopDashboard } from './pop-dashboard';

describe('PopDashboard', () => {
  let component: PopDashboard;
  let fixture: ComponentFixture<PopDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
