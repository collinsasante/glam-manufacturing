/**
 * Airtable Client for Cloudflare Workers Edge Runtime
 *
 * This implements Airtable operations using only fetch API
 * (no Node.js dependencies)
 */

interface AirtableRecord<T = any> {
  id: string;
  fields: T;
  createdTime: string;
}

interface AirtableListResponse<T = any> {
  records: AirtableRecord<T>[];
  offset?: string;
}

interface AirtableCreateResponse<T = any> {
  id: string;
  fields: T;
  createdTime: string;
}

interface AirtableUpdateResponse<T = any> {
  id: string;
  fields: T;
  createdTime: string;
}

export class AirtableEdgeClient {
  private baseId: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey) {
      throw new Error('AIRTABLE_API_KEY environment variable is not set');
    }

    if (!baseId) {
      throw new Error('AIRTABLE_BASE_ID environment variable is not set');
    }

    this.apiKey = apiKey;
    this.baseId = baseId;
    this.baseUrl = `https://api.airtable.com/v0/${baseId}`;
  }

  /**
   * Get authorization headers for Airtable API
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List records from a table
   */
  async list<T = any>(
    tableName: string,
    options?: {
      filterByFormula?: string;
      sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
      maxRecords?: number;
      pageSize?: number;
      view?: string;
    }
  ): Promise<AirtableRecord<T>[]> {
    const url = new URL(`${this.baseUrl}/${encodeURIComponent(tableName)}`);

    if (options?.filterByFormula) {
      url.searchParams.set('filterByFormula', options.filterByFormula);
    }

    if (options?.sort) {
      options.sort.forEach((s, i) => {
        url.searchParams.set(`sort[${i}][field]`, s.field);
        url.searchParams.set(`sort[${i}][direction]`, s.direction);
      });
    }

    if (options?.maxRecords) {
      url.searchParams.set('maxRecords', options.maxRecords.toString());
    }

    if (options?.pageSize) {
      url.searchParams.set('pageSize', options.pageSize.toString());
    }

    if (options?.view) {
      url.searchParams.set('view', options.view);
    }

    const allRecords: AirtableRecord<T>[] = [];
    let offset: string | undefined;

    do {
      if (offset) {
        url.searchParams.set('offset', offset);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as AirtableListResponse<T>;
      allRecords.push(...data.records);
      offset = data.offset;
    } while (offset);

    return allRecords;
  }

  /**
   * Get a single record by ID
   */
  async get<T = any>(
    tableName: string,
    recordId: string
  ): Promise<AirtableRecord<T>> {
    const url = `${this.baseUrl}/${encodeURIComponent(tableName)}/${encodeURIComponent(recordId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${error}`);
    }

    return await response.json() as AirtableRecord<T>;
  }

  /**
   * Create a new record
   */
  async create<T = any>(
    tableName: string,
    fields: Partial<T>
  ): Promise<AirtableRecord<T>> {
    const url = `${this.baseUrl}/${encodeURIComponent(tableName)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${error}`);
    }

    return await response.json() as AirtableCreateResponse<T>;
  }

  /**
   * Create multiple records in one request
   */
  async createMultiple<T = any>(
    tableName: string,
    records: Array<{ fields: Partial<T> }>
  ): Promise<AirtableRecord<T>[]> {
    const url = `${this.baseUrl}/${encodeURIComponent(tableName)}`;

    // Airtable allows max 10 records per batch
    const batches: Array<{ fields: Partial<T> }[]> = [];
    for (let i = 0; i < records.length; i += 10) {
      batches.push(records.slice(i, i + 10));
    }

    const allCreatedRecords: AirtableRecord<T>[] = [];

    for (const batch of batches) {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ records: batch }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as { records: AirtableRecord<T>[] };
      allCreatedRecords.push(...data.records);
    }

    return allCreatedRecords;
  }

  /**
   * Update an existing record
   */
  async update<T = any>(
    tableName: string,
    recordId: string,
    fields: Partial<T>
  ): Promise<AirtableRecord<T>> {
    const url = `${this.baseUrl}/${encodeURIComponent(tableName)}/${encodeURIComponent(recordId)}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${error}`);
    }

    return await response.json() as AirtableUpdateResponse<T>;
  }

  /**
   * Update multiple records in one request
   */
  async updateMultiple<T = any>(
    tableName: string,
    records: Array<{ id: string; fields: Partial<T> }>
  ): Promise<AirtableRecord<T>[]> {
    const url = `${this.baseUrl}/${encodeURIComponent(tableName)}`;

    // Airtable allows max 10 records per batch
    const batches: Array<{ id: string; fields: Partial<T> }[]> = [];
    for (let i = 0; i < records.length; i += 10) {
      batches.push(records.slice(i, i + 10));
    }

    const allUpdatedRecords: AirtableRecord<T>[] = [];

    for (const batch of batches) {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ records: batch }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as { records: AirtableRecord<T>[] };
      allUpdatedRecords.push(...data.records);
    }

    return allUpdatedRecords;
  }

  /**
   * Delete a record
   */
  async delete(tableName: string, recordId: string): Promise<void> {
    const url = `${this.baseUrl}/${encodeURIComponent(tableName)}/${encodeURIComponent(recordId)}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${error}`);
    }
  }

  /**
   * Delete multiple records
   */
  async deleteMultiple(
    tableName: string,
    recordIds: string[]
  ): Promise<void> {
    // Airtable allows max 10 records per batch delete
    const batches: string[][] = [];
    for (let i = 0; i < recordIds.length; i += 10) {
      batches.push(recordIds.slice(i, i + 10));
    }

    for (const batch of batches) {
      const url = new URL(`${this.baseUrl}/${encodeURIComponent(tableName)}`);
      batch.forEach(id => url.searchParams.append('records[]', id));

      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${error}`);
      }
    }
  }
}

// Export singleton instance
export const airtable = new AirtableEdgeClient();
