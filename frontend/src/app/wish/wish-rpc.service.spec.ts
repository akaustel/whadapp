import { TestBed } from '@angular/core/testing';

import { WishRpcService } from './wish-rpc.service';

describe('RpcService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WishRpcService = TestBed.get(WishRpcService);
    expect(service).toBeTruthy();
  });
});
