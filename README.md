# orm-ts

[![CI](https://img.shields.io/travis/zhang740/orm-ts.svg?style=flat-square)](https://travis-ci.org/zhang740/orm-ts)
[![Coverage](https://img.shields.io/coveralls/zhang740/orm-ts.svg?style=flat-square)](https://coveralls.io/github/zhang740/orm-ts)
[![Version](https://img.shields.io/npm/v/orm-ts.svg?style=flat-square)](https://www.npmjs.com/package/orm-ts)
[![License](https://img.shields.io/npm/l/orm-ts.svg?style=flat-square)](https://github.com/zhang740/orm-ts/blob/master/LICENSE)


## Install
```shell
npm i orm-ts --save
```

## Example

### a simple example
service:
```ts
@register()
export class ActivityService {
  @lazyInject()
  private acitvityDomain: ActivityDomain;

  async getById(id: number) {
    return await this.acitvityDomain.getById(id);
  }
}
```

domain:
```ts
@register()
export class ActivityDomain extends BaseDomain {
  @lazyInject()
  repository: ActivityRepository;

  async getById(id: number) {
    return await this.repository.getById(id);
  }
}
```

repository:
```ts
@repository(ActivityModel)
export class ActivityRepository extends BaseRepository<ActivityModel> {
}

@repository(UserModel)
export class UserRepository extends BaseRepository<UserModel> {

  @cachePut((username: string) => `user_${username}`, { expiredTime: 30 * 60 })
  @bindSql(`select * from #table# where username = #username#`, { page: false })
  async getByUsername(username: string) {
    // SQL
    return new UserModel(this.queryOne(`
        xxxxxxxx
    `, arguments));
  }

  async add(model: UserModel) { }

  @cacheEvict((username: string) => `user_${username}`)
  async updateByUsername(username: string, model: UserModel) { }

  @cacheEvict((username: string) => `user_${username}`)
  async deleteByUsername(username: string) { }
}
```

domain:
```ts
export class ActivityModel extends BaseModel {
  id: number;

  @manyToOne('owner', UserModel, 'getByUsername')
  user: Promise<UserModel>;

  @manyToOne('teamId', TeamModel)
  team: Promise<TeamModel>;
}

export class UserModel extends BaseModel {
  id: number;

  @valid([
    { minLength: 10 },
    { custom: (str: string) => true, errorMsg: 'xxx' }
  ])
  username: string;
}
```


#### [See the full example.](https://github.com/zhang740/orm-ts/tree/master/example)
