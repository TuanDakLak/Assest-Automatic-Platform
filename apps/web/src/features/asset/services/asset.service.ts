export class AssetService {
  private static apiBase = '/api/v1/asset';

  static async fetchAll() {
    const res = await fetch(this.apiBase);
    if (!res.ok) throw new Error('Failed to fetch asset assets');
    return res.json();
  }

  static async create(payload: any) {
    const res = await fetch(this.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create asset item');
    return res.json();
  }
}
