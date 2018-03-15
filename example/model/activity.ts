import { BaseModel, manyToOne } from '../../lib';

import { UserModel } from './user';
import { TeamModel } from './team';

export class ActivityModel extends BaseModel {
  id: number;

  @manyToOne('owner', UserModel, 'getByUsername')
  user: Promise<UserModel>;

  @manyToOne('teamId', TeamModel)
  team: Promise<TeamModel>;
}
