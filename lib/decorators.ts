import { IocContext } from 'power-di';
import { getGlobalType } from 'power-di/utils';
import { getDecorators as diDecorators, Decorators as DIDecorators } from 'power-di/helper';
import { BaseRepository } from './BaseRepository';
import { BaseModel } from './index';

export class Decorators extends DIDecorators {

  constructor(
    private ioc: IocContext = IocContext.DefaultInstance,
  ) {
    super(ioc);

    this.manyToOne = this.manyToOne.bind(this);
    this.bindSql = this.bindSql.bind(this);
    this.repository = this.repository.bind(this);
  }

  manyToOne(foreignKeyField: string, modelCls: any, method: string = 'getById') {
    return this.mapper(foreignKeyField, modelCls, method);
  }

  oneToOne(foreignKeyField: string, modelCls: any, method: string = 'getById') {
    return this.mapper(foreignKeyField, modelCls, method);
  }

  oneToMany(foreignKeyField: string, modelCls: any, method: string) {
    return this.mapper(foreignKeyField, modelCls, method);
  }

  manyToMany(foreignKeyField: string, modelCls: any, method: string) {
    return this.mapper(foreignKeyField, modelCls, method);
  }

  bindSql(sql: string, config?: any) {
    return (target: any, key: string): any => {

    };
  }

  repository(modelType: Function) {
    return (target: any) => {
      this.ioc.register(target);
      this.register(modelType)(target);
    };
  }

  private mapper(foreignKeyField: string, modelCls: any, method: string) {
    const self = this;
    return (target: any, key: string): any => {
      let isLoaded = false;
      let data = target[key];
      return {
        configurable: true,
        enumerable: true,
        get: function () {
          if (this.isSerializing) {
            return data;
          }
          return new Promise(async (resolve) => {
            if (!isLoaded) {
              isLoaded = true;
              const domain = self.ioc.get<BaseRepository>(modelCls);
              const key = this[foreignKeyField];
              if (!domain) {
                console.error(`No repository for: ${getGlobalType(modelCls)} .`);
              }
              data = new modelCls(await (domain as any)[method](key));
            }
            resolve(data);
          });
        },
        set: async function (value: any) { data = await value; },
      };
    };
  }
}

export function getDecorators(ioc: IocContext = IocContext.DefaultInstance) {
  return new Decorators(ioc);
}
