export interface Page<T> {
  dataList: T[];
  total: number;
  pageSize: number;
  pageNum: number;
}
