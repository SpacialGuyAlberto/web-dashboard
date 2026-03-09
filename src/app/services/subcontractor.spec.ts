import { TestBed } from '@angular/core/testing';

import { Subcontractor } from './subcontractor';

describe('Subcontractor', () => {
  let service: Subcontractor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Subcontractor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
