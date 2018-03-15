import { ActivityDomain } from '../domain';
import { ActivityModel } from '../model';
import { register, lazyInject } from '../ioc';

@register()
export class ActivityService {
  @lazyInject()
  private acitvityDomain: ActivityDomain;

  async getById(id: number) {
    return await this.acitvityDomain.getById(id);
  }
}
