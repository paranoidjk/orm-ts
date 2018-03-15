import { BaseRepository, repository } from '../../lib';
import { ActivityModel } from '../model';

@repository(ActivityModel)
export class ActivityRepository extends BaseRepository<ActivityModel> {
}
