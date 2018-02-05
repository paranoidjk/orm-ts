import { getDecorators } from '../../lib';
const { lazyInject, register } = getDecorators();

import { ActivityDomain } from '../domain';
import { ActivityModel } from '../model';

@register()
export class ActivityService {
  @lazyInject()
  private acitvityDomain: ActivityDomain;

  async getById(id: number) {
    return await this.acitvityDomain.getById(id);
  }
}
