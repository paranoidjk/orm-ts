import { Page } from './PageModel';

export abstract class IRepository<T = any> {
  abstract async queryOne(sql: string, params: any): Promise<T>;
  abstract async  queryAll(sql: string, params: any): Promise<Page<T>>;
  abstract async update(sql: string, params: any): Promise<T>;
  abstract async delete(sql: string, params: any): Promise<T>;
}
