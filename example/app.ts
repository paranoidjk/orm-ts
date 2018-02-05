import 'reflect-metadata';
import { IocContext } from 'power-di';

import './';

import { ActivityModel, UserModel } from './model';
import { ActivityService } from './service';
import { MySQLRepository, IRepository } from '../lib';

import { MockRepository } from '../lib/MockRepository';

async function main() {
  const ioc = IocContext.DefaultInstance;
  ioc.register(MockRepository, IRepository);

  const activityModel = new ActivityModel({
    id: 1,
    teamId: 2,
  });

  console.log('activityModel 1st', activityModel, await activityModel.team);

  activityModel.user = Promise.resolve(new UserModel({ id: 123, username: 'test' }));
  console.log('activityModel 2nd', activityModel, await activityModel.team);
  console.log('activityModel 3rd', activityModel, await activityModel.team);

  console.log('JSON.stringify', JSON.stringify(activityModel));
  console.log('toJSON', activityModel.toJSON());

  const activityService = ioc.get<ActivityService>(ActivityService);
  console.log('activityService', await activityService.getById(123));
}

main().then();
