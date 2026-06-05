import { HttpException, HttpStatus } from '@nestjs/common';

export class SyncCancelledException extends HttpException {
  constructor() {
    super('Sync cancelled', HttpStatus.CONFLICT);
  }
}
