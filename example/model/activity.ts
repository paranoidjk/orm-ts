import { BaseModel, getDecorators } from '../../lib';
const { manyToOne } = getDecorators();

import { UserModel } from './user';
import { TeamModel } from './team';

export class ActivityModel extends BaseModel {
  id: number;

  @manyToOne('owner', UserModel, 'getByUsername')
  user: Promise<UserModel>;

  @manyToOne('teamId', TeamModel)
  team: Promise<TeamModel>;
}
