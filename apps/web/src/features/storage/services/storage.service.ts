export class StorageService {
  private static apiBase = '/api/v1/storage';

  static async fetchAll() {
    const res = await fetch(this.apiBase);
    if (!res.ok) throw new Error('Failed to fetch storage assets');
    return res.json();
  }

  static async create(payload: any) {
    const res = await fetch(this.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create storage item');
    return res.json();
  }
}
