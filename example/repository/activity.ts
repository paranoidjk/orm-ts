import { BaseRepository, getDecorators } from '../../lib';
import { ActivityModel } from '../model';
const { repository } = getDecorators();

@repository(ActivityModel)
export class ActivityRepository extends BaseRepository<ActivityModel> {
}
