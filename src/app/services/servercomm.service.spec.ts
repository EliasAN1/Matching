import { TestBed } from '@angular/core/testing';

import { ServercommService } from './servercomm.service';

describe('ServercommService', () => {
  let service: ServercommService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServercommService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
