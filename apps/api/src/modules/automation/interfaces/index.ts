export interface IAutomationService {
  create(dto: any): Promise<any>;
  findAll(): Promise<any[]>;
  findOne(id: string): Promise<any>;
  update(id: string, dto: any): Promise<any>;
  remove(id: string): Promise<any>;
}
