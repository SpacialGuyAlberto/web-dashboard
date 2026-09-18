import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterStats } from './cluster-stats';

describe('ClusterStats', () => {
  let component: ClusterStats;
  let fixture: ComponentFixture<ClusterStats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClusterStats]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClusterStats);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
