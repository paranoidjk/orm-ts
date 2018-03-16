import { toCamelCase, toHyphenCase, guard } from './util';

export type Diff<T extends string, U extends string> = ({[P in T]: P } &
  {[P in U]: never } & { [x: string]: never })[T];
export type Omit<T, K extends string> = Pick<T, Diff<keyof T, K>>;

export type PModel<T> = Omit<T, keyof BaseModel>;

//#region Mapper
export interface DataMapperType {
  mapperToDAO?: (data: Readonly<any>) => any;
  mapperToModel?: (data: Readonly<any>) => any;
}
export const mapper = (mapper: DataMapperType) => (target: any, key: string) => {
  const metadata = getMetadata(target.constructor);
  const field = metadata.fields.find(f => f.modelFieldName === key);
  if (field) {
    field.mapper = mapper;
  }
};

export const jsonMapper = () => {
  return mapper({
    mapperToDAO: (data) => guard(
      () => JSON.stringify(data), '',
      (err) => console.log('jsonMapper to dao err:', err)
    ),
    mapperToModel: (data: any) => guard(
      () => JSON.parse(data), null,
      (err) => console.log('jsonMapper to model err:', err)
    ),
  });
};

export const enumMapper = (enumType: any) => {
  return mapper({
    mapperToDAO: (data: any) => guard(
      () => !Number.isNaN(+data) ? enumType[+data as any] : data, '',
      (err) => console.log('enumMpper to dao err:', err)
    ),
    mapperToModel: (data: any) => guard(
      () => !Number.isNaN(+data) ? enumType[+data as any] : data, null,
      (err) => console.log('enumMpper to model err:', err)
    ),
  });
};
//#endregion

//#region 导航属性
export interface ReferenceMetadata {
  field: string;
  foreignKeyField: string;
  modelCls: any;
  method: string;
}
function reference(foreignKeyField: string, modelCls: any, method: string) {
  return (target: any, key: string) => {
    getMetadata(target.constructor)
      .reference.push({
        field: key,
        foreignKeyField,
        modelCls,
        method,
      });
  };
}

/**
 * 多对一映射 (返回单数据)
 * @param foreignKeyField 外键字段 (当前对象字段)
 * @param modelCls 对应Model类型
 * @param method 对应Model的仓储层方法
 */
export function manyToOne(foreignKeyField: string, modelCls: any, method: string = 'getByPrimaryKey') {
  return (target: any, key: string) => {
    if (!modelCls) {
      throw new Error(`No modelCls![${target.constructor.name} -> ${key}] cycle reference? you can use string name of ModelCls.`);
    }
    getMetadata(target.constructor).foreignKeys.push(foreignKeyField);
    return reference(foreignKeyField, modelCls, method)(target, key);
  };
}

/**
 * 一对多映射 (返回多个数据)
 * @param foreignKeyField 外键字段 (对应Model关联本Model字段，主键？)
 * @param modelCls 对应Model类型
 * @param method 当前Model的仓储层方法
 */
export function oneToMany(foreignKeyField: string, modelCls: any, method: string) {
  return (target: any, key: string) => {
    if (!modelCls) {
      throw new Error(`No modelCls![${target.constructor.name} -> ${key}] cycle reference? you can use string name of ModelCls.`);
    }
    return reference(foreignKeyField, modelCls, method)(target, key);
  };
}
//#endregion

//#region 元信息
export interface ColumnMetadata {
  modelFieldName: string;
  tableFieldName: string;
  mapper: DataMapperType;
}
export interface ModelMetadata {
  modelType?: any;
  tableName?: string;
  primaryKey?: string;
  fields: ColumnMetadata[];
  foreignKeys: string[];
  camelCase?: boolean;
  reference: ReferenceMetadata[];
}

const metaSymbol = Symbol('metadata');
export const setMetadata = (classType: any, metadata: ModelMetadata) => {
  Object.defineProperty(classType, metaSymbol, {
    value: metadata
  });
};
export const getMetadata = (classType: any): ModelMetadata => {
  if (!classType[metaSymbol]) {
    setMetadata(classType, {
      fields: [],
      foreignKeys: [],
      reference: [],
    });
  }
  return classType[metaSymbol];
};
//#endregion

export class ModelConfig {
  tableName?: string;
  primaryKey: string = 'id';
  camelCase ?= true;
}
export const model = (config = new ModelConfig) => {
  return (target: any) => {
    const metadata = getMetadata(target);
    const tableName = target.name.toLowerCase().replace('model', '');
    Object.assign(
      metadata, {
        modelType: target,
        tableName: config.tableName || tableName,
        primaryKey: config.primaryKey,
        camelCase: config.camelCase,
      } as ModelMetadata
    );

    function complateFieldInfo(field: ColumnMetadata) {
      if (!field.tableFieldName) {
        if (config.camelCase) {
          field.tableFieldName = toHyphenCase(field.modelFieldName);
        } else {
          field.tableFieldName = field.modelFieldName;
        }
      }
      if (!field.modelFieldName) {
        if (config.camelCase) {
          field.modelFieldName = toCamelCase(field.tableFieldName);
        } else {
          field.modelFieldName = field.tableFieldName;
        }
      }
      return field;
    }

    metadata.fields.forEach(field => {
      complateFieldInfo(field);
    });

    metadata.foreignKeys.forEach(fk => {
      if (!metadata.fields.find(f => f.modelFieldName === fk)) {
        metadata.fields.push(complateFieldInfo({
          modelFieldName: fk,
          tableFieldName: undefined,
          mapper: {},
        }));
      }
    });

  };
};

export class ColumnConfig {
  /** table field name */
  name?: string;
}
export const column = (config = new ColumnConfig) => {
  return (target: any, key: string) => {
    const metadata = getMetadata(target.constructor);
    metadata.fields.push({
      modelFieldName: key,
      tableFieldName: config.name,
      mapper: {},
    });
  };
};

export abstract class BaseModel {
  // private static metadata: ModelMetadata;

  private isSerializing = false;

  constructor(modelOrDao: any) {
    Object.defineProperty(this, 'isSerializing', {
      enumerable: false,
    });

    this.mapper(modelOrDao, this, 'toModel');
  }

  toDAO() {
    const dao = {};
    this.mapper(this, dao, 'toDAO');
    return dao;
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

  private mapper(source: Readonly<any>, target: any, type: 'toDAO' | 'toModel' | 'none') {
    if (!source) {
      return;
    }
    const cls = this.constructor as any;

    getMetadata(cls).fields.forEach(field => {
      if (!(field.modelFieldName in source) && !(field.tableFieldName in source)) {
        return;
      }

      if (type === 'toModel') {
        target[field.modelFieldName] = source[field.modelFieldName] || source[field.tableFieldName];
        if (field.mapper.mapperToModel) {
          target[field.modelFieldName] = field.mapper.mapperToModel(target[field.modelFieldName]);
        }
      } else if (type === 'toDAO') {
        target[field.tableFieldName] = source[field.modelFieldName] || source[field.tableFieldName];
        if (field.mapper.mapperToModel) {
          target[field.tableFieldName] = field.mapper.mapperToDAO(target[field.tableFieldName]);
        }
      }
    });
  }
}
