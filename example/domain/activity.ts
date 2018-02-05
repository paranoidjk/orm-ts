import { BaseDomain, getDecorators } from '../../lib';
const { lazyInject, register } = getDecorators();

import { ActivityModel } from '../model';
import { ActivityRepository } from '../repository';

@register()
export class ActivityDomain extends BaseDomain {
  @lazyInject()
  repository: ActivityRepository;

  async getById(id: number) {
    return await this.repository.getById(id);
  }
}
