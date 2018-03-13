//#region 元信息
export interface ColumnMetadata {
  modelFieldName: string;
  tableFieldName: string;
}
export interface ModelMetadata {
  tableName: string;
  primaryKey: string;
  fields: ColumnMetadata[];
  mapperRules: { [key: string]: MapperRule[] };
  vaildRules: { [key: string]: VaildRule[] };
}

export const metaSymbol = Symbol('metadata');
const getMetadata = (target: any): ModelMetadata => {
  if (!target[metaSymbol]) {
    target[metaSymbol] = {
      fields: [],
      mapperRules: {},
      vaildRules: {}
    } as ModelMetadata;
  }
  return target[metaSymbol];
};
//#endregion

export interface MapperRule<DAOType = any, ModelType = any> {
  type?: 'translate' | 'enum' | 'custom';
  data?: any;
  mapperToDAO?: (source: Readonly<ModelType>, target: DAOType) => void;
  mapperToModel?: (source: Readonly<DAOType>, target: ModelType) => void;
}
export const mapper = (rules: MapperRule[]) => (target: any, key: string) => {
  const metadata = getMetadata(target);
  metadata.mapperRules[key] = metadata.mapperRules[key].concat(rules);
};


export interface VaildRule {

}
export const valid = (rules: any[]) => (target: any, key: string): any => {
  const metadata = getMetadata(target);
  metadata.vaildRules[key] = metadata.vaildRules[key].concat(rules);
};

export class ModelConfig {
  tableName?: string;
  primaryKey: string = 'id';
  // camelCase ?= true;
}
export const model = (config = new ModelConfig) => {
  return (target: any) => {
    const metadata = getMetadata(target);
    const tableName = target.name.toLowerCase().replace('model', '');
    metadata.tableName = config.tableName || tableName;
    metadata.primaryKey = config.primaryKey;
  };
};

export class ColumnConfig {
  /** table field name */
  name?: string;
}
export const column = (config = new ColumnConfig) => {
  return (target: any, key: string) => {
    const metadata = getMetadata(target);
    metadata.fields.push({
      modelFieldName: key,
      tableFieldName: config.name || key,
    });
  };
};

export abstract class BaseModel<DAOType = any> {
  private static metadata: ModelMetadata;

  private isSerializing = false;

  constructor(dao: DAOType = {} as any) {
    Object.defineProperty(this, 'isSerializing', {
      enumerable: false,
    });

    this.mapper(dao, this, 'toModel');
  }

  /** 转换成DAO对象 */
  toDAO(): DAOType {
    const dao = {} as any;
    this.mapper(this, dao, 'toDAO');
    return dao;
  }

  /** 加载数据 */
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
        target[key] = data;
      }
    }

    cls.mapperRules.forEach((rule: MapperRule) => {
      if (type === 'toDAO' && rule.mapperToDAO) {
        rule.mapperToDAO(source, target);
        return;
      }
      if (type === 'toModel' && rule.mapperToModel) {
        rule.mapperToModel(source, target);
        return;
      }
    });

    // TODO 数据校验
    // (cls.vaildRules[key] || []).forEach((vaild: VaildRule[]) => {
    // });
  }
}
