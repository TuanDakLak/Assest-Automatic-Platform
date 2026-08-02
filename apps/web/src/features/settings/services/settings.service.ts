export class SettingsService {
  private static apiBase = '/api/v1/settings';

  static async fetchAll() {
    const res = await fetch(this.apiBase);
    if (!res.ok) throw new Error('Failed to fetch settings assets');
    return res.json();
  }

  static async create(payload: any) {
    const res = await fetch(this.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create settings item');
    return res.json();
  }
}
