import autobind from 'autobind-decorator';
import { IocContext } from 'power-di';
import { getGlobalType } from 'power-di/utils';
import { getDecorators as diDecorators, Decorators as DIDecorators } from 'power-di/helper';
import { BaseRepository } from './BaseRepository';
import { BaseModel } from './index';
import { MapperRule, metaSymbol } from './BaseModel';

@autobind
export class Decorators extends DIDecorators {

  /**
   * 多对一映射 (返回单数据)
   * @param foreignKeyField 外键字段 (当前对象字段)
   * @param modelCls 对应Model类型
   * @param method 对应Model的仓储层方法
   */
  manyToOne(foreignKeyField: string, modelCls: any, method: string = 'getByPrimaryKey') {
    return (target: any, key: string) => {

      const mapperRule: MapperRule = {
        mapperToDAO: (source, target) => { target[foreignKeyField] = source[key].xxx; },
        mapperToModel: (source, target) => { },
      };

      return this.mapper(foreignKeyField, modelCls, method)(target, key);
    };
  }

  /**
   * 一对一映射？？？？？
   * @param foreignKeyField 外键字段 (对应对象字段)
   * @param modelCls 对应Model类型
   * @param method 对应Model的仓储层方法
   */
  oneToOne(foreignKeyField: string, modelCls: any, method: string) {
    return this.mapper(foreignKeyField, modelCls, method);
  }

  /**
   * 一对多映射 (返回多个数据)
   * @param foreignKeyField 外键字段 (当前对象字段)
   * @param modelCls 对应Model类型
   * @param method 对应Model的仓储层方法
   */
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
      target[metaSymbol] = (modelType as any)[metaSymbol];
      this.context.register(target);
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
              const domain = self.context.get<BaseRepository>(modelCls);
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

export function getDecorators(ioc: IocContext | (() => IocContext) = IocContext.DefaultInstance) {
  return new Decorators(ioc);
}
