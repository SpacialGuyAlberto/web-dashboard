import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterMap } from './cluster-map';

describe('ClusterMap', () => {
  let component: ClusterMap;
  let fixture: ComponentFixture<ClusterMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClusterMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClusterMap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
