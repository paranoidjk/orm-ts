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

export interface SQLStruct {
  select?: string;
  from?: string;
  where?: string;
  groupBy?: string;
  orderBy?: string;
  limit?: string;
  paged?: boolean;
  argLength?: number;
}

function buildSQLStruct(metadata: ModelMetadata, funcName: string) {
  /**
   * TODO:
   * getByIdAndUserIdGroupByTypeOrderByCreateTimeAndUpdateTimeDESC
   * getAllByUserId
   * 抽象语法树结构？
   */
  const struct: SQLStruct = {
    select: metadata.fields.map(field => `\`${field.tableFieldName}\``).join(', '),
    from: `\`${metadata.tableName}\``,
    limit: '0, 1',
    paged: false,
    argLength: 0,
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
      struct.paged = clause.startsWith('getAllBy');
      if (struct.paged) {
        struct.argLength += 2;
        struct.limit = '?, ?';
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
        }).join(', ');
    } else if (clause.startsWith('GroupBy')) {
      console.warn('Not Impl Clause: GroupBy.');
    } else if (clause.startsWith('OrderBy')) {
      struct.orderBy = clause.replace(/OrderBy/g, '').split(/And/g)
        .map(name => {
          name = `${name[0].toLowerCase()}${name.substr(1)}`;

          let direct = 'ASC';
          if (name.endsWith('DESC')) {
            name.substr(0, name.length - 4);
            direct = 'DESC';
          } else if (name.endsWith('ASC')) {
            name.substr(0, name.length - 3);
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

export function bindSql(initSqlStruct: SQLStruct = {}) {
  let sqlStruct: SQLStruct;
  return (target: any, key: string) => {
    return {
      value: async function (this: BaseRepository, ...args: any[]) {
        const metadata: ModelMetadata = (this as any).modelMetadata;
        sqlStruct = sqlStruct || {
          ...initSqlStruct,
          ...buildSQLStruct(metadata, key),
        };

        const data = await this.queryBySqlStruct(sqlStruct, args);
        if (sqlStruct.paged) {
          if (data.dataList && data.dataList.length) {
            data.dataList = data.dataList.map(item => (this as any).convertToModel(item));
          }
          return data;
        } else {
          return (this as any).convertToModel(data);
        }
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

              const key = this[foreignKeyField];
              data = new modelCls(await (repo as any)[method](key));
            }
            resolve(data);
          });
        },
        set: async function (value: any) { data = await value; },
      });
    });
    return model;
  }

  public async queryCount(sql: string, params?: any[]): Promise<number> {
    const sqlResult: any = await this.query(sql, params);
    return sqlResult[0] && sqlResult[0].count || 0;
  }

  async queryOne(sql: string, params?: any[]): Promise<DTOType> {
    return await this.provider.queryOne(sql, params);
  }

  async query(sql: string, params?: any): Promise<any> {
    return await this.provider.query(sql, params);
  }

  async queryBySqlStruct(sqlStruct: SQLStruct, params: any[] = [])
    : Promise<Page<DTOType>> {
    if (sqlStruct.argLength !== params.length) {
      console.log(sqlStruct);
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
    const groupBy = sqlStruct.groupBy ? `GroupBy
        ${sqlStruct.orderBy}
    ` : '';
    const orderBy = sqlStruct.orderBy ? `OrderBy
        ${sqlStruct.orderBy}
    ` : '';
    const limit = sqlStruct.limit ? `LIMIT
        ${sqlStruct.limit}
    ` : '';

    let paginatorData;
    if (sqlStruct.paged) {
      const pageNum: number = params[params.length - 2], pageSize: number = params[params.length - 1];

      const _total = await this.queryCount(`SELECT
          count(1) AS count ${from} ${where} ${groupBy}
      `, params);

      const _paginator = this.getPaginator(pageSize, _total);
      // const _offset = _paginator.getOffset(pageNum);
      // const _length = _paginator.getLength(pageNum);
      paginatorData = _paginator.getConfig(pageNum);
    }

    const sql = `${select} ${from} ${where} ${groupBy} ${orderBy} ${limit}`;
    const result: any = await this.provider.query(sql, params);

    if (sqlStruct.paged) {
      return {
        dataList: [].concat(result),
        paginator: paginatorData,
      };
    } else {
      return result && result[0];
    }
  }

  // extend helper methods
  async getByPrimaryKey(id: any): Promise<DTOType> {
    return this.convertToModel(
      await this.queryOne(`
      SELECT
        ${this.fields.map(field => `\`${field.tableFieldName}\``).join(', ')}
      FROM
        \`${this.tableName}\`
      WHERE
        \`${this.primaryKey}\` = ?
       LIMIT 0, 1
    `, [id])
    );
  }
  async deleteByPrimaryKey(id: any): Promise<DTOType> {
    return this.convertToModel(
      await this.query(`
      DELETE FROM \`${this.tableName}\` WHERE \`${this.primaryKey}\` = ?
    `, [id])
    );
  }

  async save(model: ModelType) {
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
    console.log('save over', result);
    if (result.affectedRows === 1) {
      return {
        ...data,
        [this.primaryKey]: keyValue || result.insertId,
      };
    }
    throw new Error('mysql insert error: ' + JSON.stringify(result));
  }

  public getPaginator(size: number, total: number) {
    return new Paginator(size, total);
  }
}
