import { BaseDomain } from '../../lib';
import { UserModel } from '../model';
import { UserRepository } from '../repository';

import { getDecorators as getCacheDecorators } from 'any-cache';
import { lazyInject } from '../ioc';
const { cachePut, cacheEvict } = getCacheDecorators();

export class UserDomain extends BaseDomain {
  @lazyInject()
  private userRepository: UserRepository;

  async getByUsername(username: string) {
    return await this.userRepository.getByUsername(username);
  }
}
