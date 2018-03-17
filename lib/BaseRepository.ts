import { lazyInject } from 'power-di/helper';
import { IProvider } from './provider';
import { Paginator } from './Paginator';
import { Page } from './PageModel';
import { ModelMetadata, ColumnMetadata, getMetadata } from './BaseModel';
import { setMetadata } from './BaseModel';

export function repository(modelType: Function) {
  return (target: any) => {
    setMetadata(target, getMetadata(modelType));
  };
}

export interface SQLConfig {
  /** 返回多条时默认为true */
  paged?: boolean;
  /** 是否转换成Model */
  convertToModel?: boolean;
}

export interface SQLStruct extends SQLConfig {
  select?: string;
  from?: string;
  where?: string;
  groupBy?: string;
  orderBy?: string;
  limit?: string;
  multi?: boolean;
  argLength?: number;
}

function buildSQLStruct(initData: SQLConfig, metadata: ModelMetadata, funcName: string) {
  /**
   * getByIdAndUserIdGroupByTypeOrderByCreateTimeAndUpdateTimeDESC
   * getAllByUserId
   * TODO:
   * 抽象语法树结构？
   */
  const struct: SQLStruct = {
    select: metadata.fields.map(field => `\`${field.tableFieldName}\``).join(', '),
    from: `\`${metadata.tableName}\``,
    paged: true,
    multi: false,
    argLength: 0,
    convertToModel: true,
    ...initData,
  };
  const indexs = ['getBy', 'getAllBy', 'GroupBy', 'OrderBy']
    .map(k => funcName.indexOf(k))
    .filter(i => i >= 0)
    .sort((a, b) => a - b);

  const subClauses: string[] = [];
  indexs.forEach((pos, i) => {
    const end = indexs.length - 1 > i ? indexs[i + 1] : undefined;
    subClauses.push(funcName.substring(pos, end));
  });

  subClauses.forEach(clause => {
    if (clause.startsWith('getBy') || clause.startsWith('getAllBy')) {
      struct.multi = clause.startsWith('getAllBy');
      if (struct.multi && struct.paged) {
        struct.argLength += 2;
        struct.limit = '?, ?';
      } else if (!struct.multi) {
        struct.paged = false;
        struct.limit = '1';
      }

      struct.where = clause.replace(/getBy|getAllBy/g, '').split(/And/g)
        .map(name => {
          name = `${name[0].toLowerCase()}${name.substr(1)}`;

          const field = metadata.fields.find(f => f.modelFieldName === name);
          if (!field) {
            throw new Error(`No field [${name}]! [${metadata.modelType.name}] -> ${funcName}`);
          }
          struct.argLength += 1;
          return `\`${field.tableFieldName}\` = ?`;
        }).join(' AND ');
    } else if (clause.startsWith('GroupBy')) {
      struct.groupBy = clause.replace(/GroupBy/g, '').split(/And/g)
        .map(name => {
          name = `${name[0].toLowerCase()}${name.substr(1)}`;

          const field = metadata.fields.find(f => f.modelFieldName === name);
          if (!field) {
            throw new Error(`No field [${name}]! [${metadata.modelType.name}] -> ${funcName}`);
          }
          return `\`${field.tableFieldName}\``;
        }).join(', ');
    } else if (clause.startsWith('OrderBy')) {
      struct.orderBy = clause.replace(/OrderBy/g, '').split(/And/g)
        .map(name => {
          name = `${name[0].toLowerCase()}${name.substr(1)}`;

          let direct = 'ASC';
          if (name.endsWith('DESC')) {
            name = name.substr(0, name.length - 4);
            direct = 'DESC';
          } else if (name.endsWith('ASC')) {
            name = name.substr(0, name.length - 3);
          }
          const field = metadata.fields.find(f => f.modelFieldName === name);
          if (!field) {
            throw new Error(`No field [${name}]! [${metadata.modelType.name}] -> ${funcName}`);
          }
          return `\`${field.tableFieldName}\` ${direct}`;
        }).join(', ');
    }
  });

  return struct;
}

export function bindSql(sqlConfig: SQLConfig = {}) {
  let sqlStruct: SQLStruct;
  return (target: any, key: string) => {
    return {
      value: async function (this: BaseRepository, ...args: any[]) {
        const metadata: ModelMetadata = (this as any).modelMetadata;
        sqlStruct = sqlStruct || buildSQLStruct(sqlConfig, metadata, key);

        return await (this as any).queryBySqlStruct(sqlStruct, args);
      }
    };
  };
}

export class BaseRepository<ModelType = any, DTOType = any> {
  protected get modelMetadata(): ModelMetadata {
    return getMetadata(this.constructor);
  }
  protected get tableName(): string {
    return this.modelMetadata.tableName;
  }
  protected get primaryKey(): string {
    return this.modelMetadata.primaryKey;
  }
  protected get fields(): ColumnMetadata[] {
    return this.modelMetadata.fields;
  }

  @lazyInject()
  private provider: IProvider;

  protected convertToModel(data: any) {
    if (!data) {
      return data;
    }

    const repoSelf = this;
    const model = new this.modelMetadata.modelType(data);
    this.modelMetadata.reference.forEach(reference => {
      const { field, foreignKeyField, method, modelCls } = reference;
      let isLoaded = false;
      let data = model[field];
      Object.defineProperty(model, reference.field, {
        configurable: true,
        enumerable: true,
        get: function () {
          if (this.isSerializing) {
            return data;
          }
          return new Promise(async (resolve) => {
            if (!isLoaded) {
              isLoaded = true;

              const repo = repoSelf.provider.getRepositoryByModelClass(modelCls);
              if (!repo) {
                throw new Error(`No repository for: ${modelCls.name} .`);
              }
              const keyValue = this[foreignKeyField];

              if (method === 'getByPrimaryKey') {
                data = repo.getByPrimaryKey(keyValue);
              } else {
                data = repo.queryBySqlStruct(
                  buildSQLStruct({ paged: false }, repo.modelMetadata, method),
                  [keyValue]
                );
              }
            }
            resolve(data);
          });
        },
        set: async function (value: any) { data = await value; },
      });
    });
    return model;
  }

  protected async queryCount(sql: string, params?: any[]): Promise<number> {
    const sqlResult: any = await this.query(sql, params);
    return sqlResult[0] && sqlResult[0].count || 0;
  }

  protected async queryOne(sql: string, params?: any[]): Promise<DTOType> {
    return await this.provider.queryOne(sql, params);
  }

  protected async query(sql: string, params?: any): Promise<any> {
    return await this.provider.query(sql, params);
  }

  protected async queryBySqlStruct(sqlStruct: SQLStruct, params: any[] = [])
    : Promise<Page<DTOType>> {
    if (sqlStruct.argLength !== params.length) {
      throw new Error(`[queryBySqlStruct] params error! FIND ${params.length}, NEED ${sqlStruct.argLength}`);
    }

    const select = sqlStruct.select ? `SELECT
        ${sqlStruct.select}
    ` : '';
    const from = sqlStruct.from ? `FROM
        ${sqlStruct.from}
    ` : '';
    const where = sqlStruct.where ? `WHERE
        ${sqlStruct.where}
    ` : '';
    const groupBy = sqlStruct.groupBy ? `Group By
        ${sqlStruct.orderBy}
    ` : '';
    const orderBy = sqlStruct.orderBy ? `Order By
        ${sqlStruct.orderBy}
    ` : '';
    const limit = sqlStruct.limit ? `LIMIT
        ${sqlStruct.limit}
    ` : '';

    let paginatorData;
    if (sqlStruct.paged) {
      const pageSize: number = params.pop();
      const pageNum: number = params.pop();
      if (Number.isNaN(pageNum) || Number.isNaN(pageSize)) {
        throw new Error('[queryBySqlStruct] params error! Need pageNum and pageSize in args.');
      }

      const _total = await this.queryCount(`SELECT
          count(1) AS count ${from} ${where} ${groupBy}
      `, params);

      const _paginator = this.getPaginator(pageSize, _total);
      const _offset = _paginator.getOffset(pageNum);
      const _length = _paginator.getLength(pageNum);
      paginatorData = _paginator.getConfig(pageNum);

      params.push(_offset, _length);
    }

    const sql = `${select} ${from} ${where} ${groupBy} ${orderBy} ${limit}`;
    let result: any[] = await this.provider.query(sql, params);

    if (sqlStruct.convertToModel) {
      result = [].concat(result || []).map(item => this.convertToModel(item));
    }

    if (sqlStruct.paged) {
      return {
        dataList: result,
        paginator: paginatorData,
      };
    } else {
      return sqlStruct.multi ? result : result[0];
    }
  }

  protected getPaginator(size: number, total: number) {
    return new Paginator(size, total);
  }

  // extend helper methods
  async getByPrimaryKey(id: any): Promise<ModelType> {
    return this.convertToModel(
      await this.queryOne(`
      SELECT
        ${this.fields.map(field => `\`${field.tableFieldName}\``).join(', ')}
      FROM
        \`${this.tableName}\`
      WHERE
        \`${this.primaryKey}\` = ?
       LIMIT 1
    `, [id])
    );
  }

  async deleteByPrimaryKey(id: any): Promise<ModelType> {
    return this.convertToModel(
      await this.query(`
      DELETE FROM \`${this.tableName}\` WHERE \`${this.primaryKey}\` = ?
    `, [id])
    );
  }

  async save(model: ModelType): Promise<ModelType> {
    const data: any = model;

    const updateFields = Object.keys(model);
    const filterFields = this.fields.filter(field => updateFields.indexOf(field.modelFieldName) >= 0);

    const keyValue = data[this.primaryKey];
    let result: any;
    const values = filterFields.map(field => {
      let value = data[field.modelFieldName];
      if (field.mapper.mapperToDAO) {
        value = field.mapper.mapperToDAO(value);
      }
      return value;
    });
    if (keyValue) {
      result = await this.query(`
        UPDATE
          \`${this.tableName}\`
        SET
          ${filterFields.map(field => `\`${field.tableFieldName}\` = ?`).join(', ')}
        WHERE
          \`${this.primaryKey}\` = ?
      `, values.concat(keyValue));
    } else {
      result = await this.query(`
        INSERT INTO \`${this.tableName}\` (
          ${filterFields.map(field => `\`${field.tableFieldName}\``).join(', ')}
        ) VALUES (${filterFields.map(field => `?`).join(', ')})
      `, values);
    }
    if (result.affectedRows === 1) {
      return {
        ...data,
        [this.primaryKey]: keyValue || result.insertId,
      };
    }
    throw new Error('mysql insert error: ' + JSON.stringify(result));
  }
}
