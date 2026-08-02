export class ResearchService {
  private static apiBase = '/api/v1/research';

  static async fetchAll() {
    const res = await fetch(this.apiBase);
    if (!res.ok) throw new Error('Failed to fetch research assets');
    return res.json();
  }

  static async create(payload: any) {
    const res = await fetch(this.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create research item');
    return res.json();
  }
}
