import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterNodeForm } from './cluster-node-form';

describe('ClusterNodeForm', () => {
  let component: ClusterNodeForm;
  let fixture: ComponentFixture<ClusterNodeForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClusterNodeForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClusterNodeForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
