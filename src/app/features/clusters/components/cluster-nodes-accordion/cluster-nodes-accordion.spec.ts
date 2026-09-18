import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterNodesAccordion } from './cluster-nodes-accordion';

describe('ClusterNodesAccordion', () => {
  let component: ClusterNodesAccordion;
  let fixture: ComponentFixture<ClusterNodesAccordion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClusterNodesAccordion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClusterNodesAccordion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
