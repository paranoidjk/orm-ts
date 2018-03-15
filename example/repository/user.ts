import { BaseRepository, repository } from '../../lib';
import { UserModel } from '../model/user';

import { getDecorators as getCacheDecorators } from 'any-cache';
const { cachePut, cacheEvict } = getCacheDecorators();

@repository(UserModel)
export class UserRepository extends BaseRepository<UserModel> {

  /**
   * 根据约定自动生成 SQL 或手动绑定，等价
   */
  @cachePut((username: string) => `user_${username}`, { expiredTime: 30 * 60 })
  // @bindSql(`select * from #table# where username = #username#`, { page: false })
  async getByUsername(username: string) {
    // SQL
    return new UserModel(this.queryOne(`
        xxxxxxxx
    `, arguments as any));
  }

  async add(model: UserModel) { }

  @cacheEvict((username: string) => `user_${username}`)
  async updateByUsername(username: string, model: UserModel) { }

  @cacheEvict((username: string) => `user_${username}`)
  async deleteByUsername(username: string) { }
}
