import { IProvider } from './IProvider';
import { Page } from '../PageModel';
import { IocContext } from 'power-di';
import { BaseRepository } from '../BaseRepository';

export class MockProvider<T> implements IProvider<T> {
  getRepositoryByModelClass(modelCls: any): BaseRepository {
    return IocContext.DefaultInstance.get(modelCls);
  }
  async query(sql: string, params?: any): Promise<T[]> {
    return await Promise.resolve(params as any);
  }
  async queryOne(sql: string, params: any): Promise<T> {
    return await Promise.resolve(params as any);
  }
}
