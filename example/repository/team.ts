import { BaseRepository, repository } from '../../lib';
import { TeamModel } from '../model';

@repository(TeamModel)
export class TeamRepository extends BaseRepository<TeamModel> {
}
