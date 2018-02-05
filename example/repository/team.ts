import { getDecorators, BaseRepository } from '../../lib';
import { TeamModel } from '../model';
const { repository, bindSql } = getDecorators();

@repository(TeamModel)
export class TeamRepository extends BaseRepository<TeamModel> {
}
