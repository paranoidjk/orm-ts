import { IRepository } from './IRepository';
import { Page } from './PageModel';

export class MockRepository<T> implements IRepository<T> {
  async queryOne(sql: string, params: any): Promise<T> {
    return await Promise.resolve(params as any);
  }
  async queryAll(sql: string, params: any): Promise<Page<T>> {
    return await Promise.resolve(params as any);
  }
  async update(sql: string, params: any): Promise<T> {
    return await Promise.resolve(params as any);
  }
  async delete(sql: string, params: any): Promise<T> {
    return await Promise.resolve(params as any);
  }
}
