import { BaseDomain, getDecorators } from '../../lib';
const { lazyInject } = getDecorators();
import { UserModel } from '../model';
import { UserRepository } from '../repository';

import { getDecorators as getCacheDecorators } from 'any-cache';
const { cachePut, cacheEvict } = getCacheDecorators();

export class UserDomain extends BaseDomain {
  @lazyInject()
  private userRepository: UserRepository;

  async getByUsername(username: string) {
    return await this.userRepository.getByUsername(username);
  }
}
