import { Test, TestingModule } from '@nestjs/testing';
import { BannedUserService } from './banneduser.service';

describe('BannedUserService', () => {
  let service: BannedUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BannedUserService],
    }).compile();

    service = module.get<BannedUserService>(BannedUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
