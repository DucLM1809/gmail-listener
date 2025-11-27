export interface IGenericRepository<T> {
  findAll(params?: any): Promise<T[]>;
  findOne(id: string | number): Promise<T | null>;
  create(data: any): Promise<T>;
  update(id: string | number, data: any): Promise<T>;
  delete(id: string | number): Promise<T>;
}
