import { IRepository } from './IRepository';
import { Page } from './PageModel';

export class MySQLRepository<T> implements IRepository<T> {
  async queryOne(sql: string, params: any): Promise<T> {
    throw new Error('Method not implemented.');
  }
  async queryAll(sql: string, params: any): Promise<Page<T>> {
    throw new Error('Method not implemented.');
  }
  async update(sql: string, params: any): Promise<T> {
    throw new Error('Method not implemented.');
  }
  async delete(sql: string, params: any): Promise<T> {
    throw new Error('Method not implemented.');
  }
}
