export interface Page<T> {
  dataList: T[];
  paginator: {
    total: number;
    pageCount: number;
    pageNum: number;
    pageSize: number;
  };
}
