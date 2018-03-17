import { Page } from '../PageModel';
import { BaseRepository } from '../BaseRepository';

export abstract class IProvider<T = any> {
  abstract async queryOne(sql: string, params?: any): Promise<T>;
  abstract async  query(sql: string, params?: any): Promise<T[]>;
  abstract getRepositoryByModelClass(modelCls: any): BaseRepository;
}
