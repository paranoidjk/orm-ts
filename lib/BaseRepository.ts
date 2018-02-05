import { getDecorators } from './decorators';
import { IRepository } from './IRepository';
import { Page } from './PageModel';

const { lazyInject } = getDecorators();

export class BaseRepository<T = any> implements IRepository<T> {
  @lazyInject()
  private repository: IRepository;

  async queryOne(sql: string, params: any): Promise<T> {
    return this.repository.queryOne(sql, params);
  }
  async queryAll(sql: string, params: any): Promise<Page<T>> {
    return this.repository.queryAll(sql, params);
  }
  async update(sql: string, params: any): Promise<T> {
    return this.repository.update(sql, params);
  }
  async delete(sql: string, params: any): Promise<T> {
    return this.repository.delete(sql, params);
  }

  async getById(id: any): Promise<T> {
    return await this.repository.queryOne('', [id]);
  }
}
