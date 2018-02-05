export interface MapperRule<T = any> {
  type?: 'translate' | 'enum' | 'custom';
  data?: any;
  mapperToDAO?: (value: T) => any;
  mapperToModel?: (value: T) => any;
}

export interface VaildRule {

}

export const mapper = (rules: MapperRule[]) => (target: any, key: string) => {
  target.constructor.mapperRules[key] = (target.constructor.mapperRules[key] || []).concat(rules);
};

export const valid = (rules: any[]) => (target: any, key: string): any => {
  target.constructor.vaildRules[key] = (target.constructor.vaildRules[key] || []).concat(rules);
};

export abstract class BaseModel {
  private static mapperRules: { [key: string]: MapperRule[] } = {};
  private static vaildRules: { [key: string]: VaildRule[] } = {};
  private isSerializing = false;

  constructor(dao = {}) {
    Object.defineProperty(this, 'isSerializing', {
      enumerable: false,
    });

    this.toModel(dao);
  }

  toModel(dao: any) {
    this.mapper(dao, this, 'toModel');
  }

  toDAO() {
    const dao = {};
    this.mapper(this, dao, 'toDAO');
    return dao;
  }

  loadData(data: any) {
    this.mapper(data, this, 'none');
  }

  toString() {
    return `${this.toJSON()}`;
  }

  toJSON() {
    this.isSerializing = true;
    const data: any = {};
    for (const key in this) {
      data[key] = this[key];
    }
    this.isSerializing = false;
    return data;
  }

  private mapper(source: any, target: any, type: 'toDAO' | 'toModel' | 'none') {
    const cls = this.constructor as any;

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        let data = source[key];
        // extend other complex mapper rules.
        (cls.mapperRules[key] || []).forEach((rule: MapperRule) => {
          if (type === 'toDAO' && rule.mapperToDAO) {
            data = rule.mapperToDAO(data);
            return;
          }
          if (type === 'toModel' && rule.mapperToModel) {
            data = rule.mapperToModel(data);
            return;
          }
          if (type !== 'none') {
            switch (rule.type) {
              case 'translate':
                if (type === 'toDAO') {

                }
                if (type === 'toModel') {

                }
                return;
              case 'enum':
                data = rule.data[data];
                return;
            }
          }
        });
        (cls.vaildRules[key] || []).forEach((vaild: VaildRule[]) => {
        });
        target[key] = data;
      }
    }
  }
}
