import { IProvider } from './IProvider';
import { Page } from '../PageModel';
import { BaseRepository } from '..';

export class NoImplProvider<T> extends IProvider<T> {
  getRepositoryByModelClass(modelCls: any): BaseRepository {
    throw new Error('Method not implemented.');
  }
  async queryOne(sql: string, params: any): Promise<T> {
    throw new Error('Method not implemented.');
  }
  async query(sql: string, params: any): Promise<Page<T>> {
    throw new Error('Method not implemented.');
  }
}
