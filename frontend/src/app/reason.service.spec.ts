import { TestBed } from '@angular/core/testing';

import { ReasonService } from './reason.service';

describe('ReasonService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ReasonService = TestBed.get(ReasonService);
    expect(service).toBeTruthy();
  });
});
