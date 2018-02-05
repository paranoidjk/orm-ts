import { getDecorators, BaseRepository } from '../../lib';
import { ActivityModel } from '../model';
const { repository, bindSql } = getDecorators();

@repository(ActivityModel)
export class ActivityRepository extends BaseRepository<ActivityModel> {
}
