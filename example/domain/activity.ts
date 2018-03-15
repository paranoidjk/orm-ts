import { BaseDomain } from '../../lib';

import { ActivityModel } from '../model';
import { ActivityRepository } from '../repository';
import { register, lazyInject } from '../ioc';

@register()
export class ActivityDomain extends BaseDomain {
  @lazyInject()
  repository: ActivityRepository;

  async getById(id: number) {
    return await this.repository.getByPrimaryKey(id);
  }
}
