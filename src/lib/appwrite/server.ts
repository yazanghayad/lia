/**
 * Appwrite Server Client - Supabase-compatible query builder
 *
 * Drop-in replacement for `@/lib/supabase/server`.
 * Every API route can simply change its import path:
 *   import { createClient } from '@/lib/appwrite/server';
 *
 * The returned object exposes `.from(collection)` with the same
 * chaining API as the Supabase PostgREST client:
 *   .select() / .insert() / .update() / .delete() / .upsert()
 *   .eq() / .neq() / .ilike() / .gt() / .gte() / .lte() / .in()
 *   .range() / .limit() / .order() / .single()
 *
 * Relationships (joins) like `select('*, schools(name)')` are resolved
 * automatically via additional lookups when the foreign-key convention
 * `<singular_table>_id` is followed (e.g. school_id → schools collection).
 *
 * NOTE: You must create matching collections and full-text indexes in your
 * Appwrite project for `.ilike()` (→ Query.search) to work correctly.
 */

import { Client, Databases, Query, ID } from 'node-appwrite';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;

/**
 * Map Supabase table names to Appwrite collection IDs.
 * Adjust the *values* if your Appwrite collection IDs differ from the names.
 */
const COLLECTIONS: Record<string, string> = {
  profiles: 'profiles',
  students: 'students',
  companies: 'companies',
  schools: 'schools',
  matches: 'matches',
  waitlist: 'waitlist',
  email_logs: 'email_logs'
};

function getCollectionId(name: string): string {
  return COLLECTIONS[name] || name;
}

// ---------------------------------------------------------------------------
// Public factory – async to stay compatible with the old Supabase wrapper
// ---------------------------------------------------------------------------

export async function createClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const databases = new Databases(client);

  return {
    from(collection: string) {
      return new QueryBuilder(databases, getCollectionId(collection));
    }
  };
}

/**
 * Synchronous admin client – used where Supabase was instantiated at module
 * level with the service-role key (e.g. Clerk webhooks).
 */
export function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);

  const databases = new Databases(client);

  return {
    from(collection: string) {
      return new QueryBuilder(databases, getCollectionId(collection));
    }
  };
}

// Re-export for convenience
export { Query, ID, DATABASE_ID };

// ---------------------------------------------------------------------------
// QueryBuilder – mirrors the Supabase PostgREST chaining API
// ---------------------------------------------------------------------------

type Operation = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

interface QueryResult {
  data: any;
  error: any;
  count?: number;
}

class QueryBuilder implements PromiseLike<QueryResult> {
  private db: Databases;
  private collectionId: string;

  // Filters & ordering
  private filters: string[] = [];
  private _orders: string[] = [];
  private _limitVal: number | null = null;
  private _offsetVal: number | null = null;

  // Select settings
  private _count = false;
  private _head = false;
  private _single = false;
  private _relationships: Array<{ table: string; fields: string[] }> = [];

  // Operation
  private _operation: Operation = 'select';
  private _insertData:
    | Record<string, unknown>
    | Record<string, unknown>[]
    | null = null;
  private _updateData: Record<string, unknown> | null = null;
  private _upsertConflict: string | null = null;

  constructor(db: Databases, collectionId: string) {
    this.db = db;
    this.collectionId = collectionId;
  }

  // -----------------------------------------------------------------------
  // Operation starters
  // -----------------------------------------------------------------------

  select(fields = '*', options?: { count?: string; head?: boolean }): this {
    if (options?.count === 'exact') this._count = true;
    if (options?.head) this._head = true;
    this._parseRelationships(fields);
    // Keep operation unchanged when called after insert / update (.select() = "return data")
    if (
      this._operation !== 'insert' &&
      this._operation !== 'update' &&
      this._operation !== 'upsert'
    ) {
      this._operation = 'select';
    }
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this._insertData = data;
    this._operation = 'insert';
    return this;
  }

  update(data: Record<string, unknown>): this {
    this._updateData = data;
    this._operation = 'update';
    return this;
  }

  delete(): this {
    this._operation = 'delete';
    return this;
  }

  upsert(
    data: Record<string, unknown> | Record<string, unknown>[],
    options?: { onConflict?: string; ignoreDuplicates?: boolean }
  ): this {
    this._insertData = Array.isArray(data) ? data : [data];
    this._upsertConflict = options?.onConflict || null;
    this._operation = 'upsert';
    return this;
  }

  // -----------------------------------------------------------------------
  // Filters
  // -----------------------------------------------------------------------

  eq(field: string, value: unknown): this {
    this.filters.push(Query.equal(this._mapField(field), [value as string]));
    return this;
  }

  neq(field: string, value: unknown): this {
    this.filters.push(Query.notEqual(this._mapField(field), [value as string]));
    return this;
  }

  /**
   * Translates Supabase's case-insensitive LIKE to Appwrite full-text search.
   * Requires a **fulltext index** on the attribute in your Appwrite project.
   */
  ilike(field: string, pattern: string): this {
    const clean = pattern.replace(/%/g, '');
    this.filters.push(Query.search(field, clean));
    return this;
  }

  gt(field: string, value: unknown): this {
    this.filters.push(Query.greaterThan(field, value as number));
    return this;
  }

  gte(field: string, value: unknown): this {
    this.filters.push(Query.greaterThanEqual(field, value as string));
    return this;
  }

  lte(field: string, value: unknown): this {
    this.filters.push(Query.lessThanEqual(field, value as string));
    return this;
  }

  in(field: string, values: unknown[]): this {
    this.filters.push(Query.equal(this._mapField(field), values as string[]));
    return this;
  }

  // -----------------------------------------------------------------------
  // Pagination & ordering
  // -----------------------------------------------------------------------

  range(start: number, end: number): this {
    this._offsetVal = start;
    this._limitVal = end - start + 1;
    return this;
  }

  limit(n: number): this {
    this._limitVal = n;
    return this;
  }

  order(field: string, options?: { ascending?: boolean }): this {
    const asc = options?.ascending ?? true;
    this._orders.push(asc ? Query.orderAsc(field) : Query.orderDesc(field));
    return this;
  }

  // -----------------------------------------------------------------------
  // Terminal helpers
  // -----------------------------------------------------------------------

  single(): Promise<QueryResult> {
    this._single = true;
    return this._execute();
  }

  /** PromiseLike – enables `await builder.from(…).select(…)` */
  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this._execute().then(onfulfilled, onrejected);
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private _mapField(field: string): string {
    return field === 'id' ? '$id' : field;
  }

  private _parseRelationships(fields: string): void {
    const regex = /(\w+)\(([^)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(fields)) !== null) {
      const tableName = m[1].replace(/!inner/, '');
      this._relationships.push({
        table: tableName,
        fields: m[2].split(',').map((f) => f.trim())
      });
    }
  }

  private _buildQueries(): string[] {
    const q = [...this.filters];
    if (this._limitVal !== null) q.push(Query.limit(this._limitVal));
    if (this._offsetVal !== null) q.push(Query.offset(this._offsetVal));
    q.push(...this._orders);
    return q;
  }

  /** Remove Appwrite system/internal fields before writing */
  private _cleanData(data: Record<string, unknown>): Record<string, unknown> {
    const clean = { ...data };
    delete clean.$id;
    delete clean.$createdAt;
    delete clean.$updatedAt;
    delete clean.$permissions;
    delete clean.$collectionId;
    delete clean.$databaseId;
    delete clean.id; // will be used as document ID instead
    return clean;
  }

  /** Convert an Appwrite document to the shape Supabase would return */
  private _docToData(doc: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(doc)) {
      if (key.startsWith('$')) continue;
      result[key] = value;
    }
    result.id = doc.$id;
    result.created_at = doc.$createdAt;
    result.updated_at = doc.$updatedAt;
    return result;
  }

  /**
   * Resolve simple foreign-key relationships.
   * Convention: `school_id` → collection `schools`, `student_id` → `students`, etc.
   */
  private async _resolveRelationships(
    documents: Record<string, unknown>[]
  ): Promise<void> {
    for (const rel of this._relationships) {
      // Try common FK naming conventions
      const possibleFKs = [
        `${rel.table.replace(/s$/, '')}_id`, // schools → school_id
        `${rel.table}_id` // fallback
      ];

      let fkField: string | null = null;
      for (const fk of possibleFKs) {
        if (documents.some((d) => d[fk] !== undefined)) {
          fkField = fk;
          break;
        }
      }
      if (!fkField) continue;

      const fkValues = Array.from(
        new Set(documents.map((d) => d[fkField!] as string).filter(Boolean))
      );
      if (fkValues.length === 0) continue;

      try {
        const collId = getCollectionId(rel.table);
        const relResult = await this.db.listDocuments(DATABASE_ID, collId, [
          Query.equal('$id', fkValues),
          Query.limit(fkValues.length)
        ]);

        const relMap = new Map<string, Record<string, unknown>>();
        for (const relDoc of relResult.documents) {
          relMap.set(relDoc.$id as string, this._docToData(relDoc));
        }

        for (const doc of documents) {
          const fkValue = doc[fkField] as string;
          doc[rel.table] =
            fkValue && relMap.has(fkValue) ? relMap.get(fkValue) : null;
        }
      } catch {
        for (const doc of documents) {
          doc[rel.table] = null;
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Execution
  // -----------------------------------------------------------------------

  private async _execute(): Promise<QueryResult> {
    try {
      switch (this._operation) {
        case 'select':
          return await this._execSelect();
        case 'insert':
          return await this._execInsert();
        case 'update':
          return await this._execUpdate();
        case 'delete':
          return await this._execDelete();
        case 'upsert':
          return await this._execUpsert();
        default:
          return { data: null, error: { message: 'Unknown operation' } };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: { message }, count: undefined };
    }
  }

  // -- SELECT --

  private async _execSelect(): Promise<QueryResult> {
    // Count-only (head: true)
    if (this._head && this._count) {
      const result = await this.db.listDocuments(
        DATABASE_ID,
        this.collectionId,
        [...this.filters, Query.limit(1)]
      );
      return { data: null, error: null, count: result.total };
    }

    const queries = this._buildQueries();
    const result = await this.db.listDocuments(
      DATABASE_ID,
      this.collectionId,
      queries
    );
    const documents = result.documents.map((d) => this._docToData(d));

    if (this._relationships.length > 0) {
      await this._resolveRelationships(documents);
    }

    if (this._single) {
      const doc = documents[0] || null;
      if (!doc) {
        return {
          data: null,
          error: { message: 'No document found', code: 'PGRST116' }
        };
      }
      return { data: doc, error: null };
    }

    return {
      data: documents,
      error: null,
      ...(this._count ? { count: result.total } : {})
    };
  }

  // -- INSERT --

  private async _execInsert(): Promise<QueryResult> {
    const dataArray = Array.isArray(this._insertData)
      ? this._insertData
      : [this._insertData!];

    const results: Record<string, unknown>[] = [];
    for (const item of dataArray) {
      const docId = (item.id as string) || ID.unique();
      const cleaned = this._cleanData(item);
      const doc = await this.db.createDocument(
        DATABASE_ID,
        this.collectionId,
        docId,
        cleaned
      );
      results.push(this._docToData(doc));
    }

    if (this._single) {
      return { data: results[0] || null, error: null };
    }
    return { data: results.length === 1 ? results[0] : results, error: null };
  }

  // -- UPDATE --

  private async _execUpdate(): Promise<QueryResult> {
    const docs = await this.db.listDocuments(
      DATABASE_ID,
      this.collectionId,
      this.filters
    );
    const cleaned = this._cleanData(this._updateData!);

    const results: Record<string, unknown>[] = [];
    for (const doc of docs.documents) {
      const updated = await this.db.updateDocument(
        DATABASE_ID,
        this.collectionId,
        doc.$id as string,
        cleaned
      );
      results.push(this._docToData(updated));
    }

    if (this._single) {
      return { data: results[0] || null, error: null };
    }
    return { data: results, error: null };
  }

  // -- DELETE --

  private async _execDelete(): Promise<QueryResult> {
    const docs = await this.db.listDocuments(
      DATABASE_ID,
      this.collectionId,
      this.filters
    );
    for (const doc of docs.documents) {
      await this.db.deleteDocument(
        DATABASE_ID,
        this.collectionId,
        doc.$id as string
      );
    }
    return { data: null, error: null };
  }

  // -- UPSERT --

  private async _execUpsert(): Promise<QueryResult> {
    const dataArray = this._insertData as Record<string, unknown>[];
    const results: Record<string, unknown>[] = [];

    for (const item of dataArray) {
      try {
        // Check for existing document by conflict field
        if (this._upsertConflict && item[this._upsertConflict]) {
          const existing = await this.db.listDocuments(
            DATABASE_ID,
            this.collectionId,
            [
              Query.equal(this._upsertConflict, [
                item[this._upsertConflict] as string
              ]),
              Query.limit(1)
            ]
          );

          if (existing.documents.length > 0) {
            const cleaned = this._cleanData(item);
            delete cleaned[this._upsertConflict];
            const updated = await this.db.updateDocument(
              DATABASE_ID,
              this.collectionId,
              existing.documents[0].$id as string,
              cleaned
            );
            results.push(this._docToData(updated));
            continue;
          }
        }

        const docId = (item.id as string) || ID.unique();
        const cleaned = this._cleanData(item);
        const doc = await this.db.createDocument(
          DATABASE_ID,
          this.collectionId,
          docId,
          cleaned
        );
        results.push(this._docToData(doc));
      } catch (e) {
        console.error('Upsert error for item:', e);
      }
    }

    if (this._single) {
      return { data: results[0] || null, error: null };
    }
    return { data: results, error: null };
  }
}
