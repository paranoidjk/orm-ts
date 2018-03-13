import { IProvider } from './IProvider';
import { Page } from '../PageModel';

export class MockProvider<T> implements IProvider<T> {
  async query(sql: string, params?: any): Promise<Page<T>> {
    return await Promise.resolve(params as any);
  }
  async queryOne(sql: string, params: any): Promise<T> {
    return await Promise.resolve(params as any);
  }
}
