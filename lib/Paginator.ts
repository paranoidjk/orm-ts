export class Paginator {
  static UNKNOWN_ITEMS = Number.MAX_SAFE_INTEGER;
  static DEFAULT_ITEMS_PER_PAGE = 20;

  private total: number; // 总数
  private pages: number; // 页数
  private size: number;  // 页大小

  constructor(size = Paginator.DEFAULT_ITEMS_PER_PAGE, total = Paginator.UNKNOWN_ITEMS) {
    size = Number(size);
    total = Number(total);

    this.total = total > 0 ? total : 0;
    this.size = size > 0 ? size : Paginator.DEFAULT_ITEMS_PER_PAGE;
    this.pages = Math.ceil(this.total / this.size);
  }

  public getOffset(page: number): number {
    page = this.getPage(page);
    return page > 0 ? this.size * (page - 1) : 0;
  }

  public getLength(page: number): number {
    const size = this.size;
    const total = this.total;
    page = this.getPage(page);
    return page > 0 ? Math.min(size * page, total) - (size * (page - 1)) : 0;
  }

  public getConfig(page: number) {
    return {
      total: this.total,
      pageCount: this.pages,
      pageNum: this.getPage(page),
      pageSize: this.size,
    };
  }

  private getPage(page: number): number {
    const pages = this.pages;
    page = Number(page);
    return pages > 0 ? page > 0 ? page > pages ? pages : page : 1 : 0;
  }
}
