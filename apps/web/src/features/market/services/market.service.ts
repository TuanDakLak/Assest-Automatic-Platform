export class MarketService {
  private static apiBase = '/api/v1/market';

  static async fetchAll() {
    const res = await fetch(this.apiBase);
    if (!res.ok) throw new Error('Failed to fetch market assets');
    return res.json();
  }

  static async create(payload: any) {
    const res = await fetch(this.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create market item');
    return res.json();
  }
}
