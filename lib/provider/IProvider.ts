import { Page } from '../PageModel';

export abstract class IProvider<T = any> {
  abstract async queryOne(sql: string, params?: any): Promise<T>;
  abstract async  query(sql: string, params?: any): Promise<Page<T>>;

}
