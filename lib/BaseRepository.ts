import { lazyInject } from 'power-di/helper';
import { IProvider } from './provider';
import { Paginator } from './Paginator';
import { Page } from './PageModel';
import { ModelMetadata, ColumnMetadata, metaSymbol } from './BaseModel';

export class BaseRepository<ModelType = any, DTOType = any> {
  protected get modelMetadata(): ModelMetadata {
    return (this.constructor as any)[metaSymbol];
  }
  protected get tableName(): string {
    return this.modelMetadata.tableName;
  }
  protected get primaryKey(): string {
    return this.modelMetadata.primaryKey;
  }
  protected get fields() {
    return this.modelMetadata.fields;
  }

  @lazyInject()
  private provider: IProvider;

  async queryOne(sql: string, params?: any): Promise<DTOType> {
    return this.provider.queryOne(sql, params);
  }
  async query(sql: string, params?: any): Promise<Page<DTOType>> {
    // TODO 分页信息
    return this.provider.query(sql, params);
  }

  // extend helper methods
  async getByPrimaryKey(id: any): Promise<DTOType> {
    return await this.queryOne(`
      SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?
    `, [id]);
  }
  async deleteByPrimaryKey(id: any): Promise<DTOType> {
    return await this.queryOne(`
      DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?
    `, [id]);
  }

  async save(model: ModelType) {
    const data: any = model;
    const keyValue = data[this.primaryKey];
    if (keyValue) {
      return await this.queryOne(`
      UPDATE ${this.tableName} SET
      ${this.fields.map(field => `${field.tableFieldName} = ?`).join(', ')}
      WHERE ${this.primaryKey} = ?
    `, [
          ...this.fields.map(field => data[field.tableFieldName]),
          keyValue,
        ]);
    } else {
      return await this.queryOne(`
      INSERT INTO ${this.tableName} (
        ${this.fields.map(field => `${field.tableFieldName} = ?`).join(', ')}
      ) VALUES (${this.fields.map(field => `?`).join(', ')})
    `, this.fields.map(field => data[field.tableFieldName]));
    }
  }

  public async queryCount(sql: string, params?: string): Promise<number> {
    const sqlResult: any = await this.query(sql, params);
    return sqlResult[0] && sqlResult[0].count || 0;
  }

  public getPaginator(size: number, total: number) {
    return new Paginator(size, total);
  }
}
