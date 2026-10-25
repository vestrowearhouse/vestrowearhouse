/**
 * Database Service - Reusable functions for database operations
 * Uses existing Supabase configuration
 */

const API_BASE = '/api/database';

export const databaseService = {
  /**
   * Get list of all tables with metadata
   */
  async getTables() {
    try {
      const res = await fetch(`${API_BASE}/tables`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const error = await res.json();
        return { success: false, error: error.error || `HTTP ${res.status}` };
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error fetching tables:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get schema information for a specific table
   */
  async getTableSchema(tableName) {
    try {
      const res = await fetch(`${API_BASE}/tables/${tableName}/schema`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const error = await res.json();
        return { success: false, error: error.error || `HTTP ${res.status}` };
      }

      return await res.json();
    } catch (error) {
      console.error('Error fetching table schema:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get rows from a table with pagination, sorting, filtering
   */
  async getTableRows(tableName, options = {}) {
    const { 
      limit = 100, 
      offset = 0, 
      sortBy = null, 
      sortOrder = 'asc',
      search = null,
      filters = []
    } = options;

    try {
      const params = new URLSearchParams({
        limit,
        offset,
        ...(sortBy && { sortBy, sortOrder }),
        ...(search && { search }),
        ...(filters.length && { filters: JSON.stringify(filters) })
      });

      const res = await fetch(`/api/database/tables/${tableName}/rows?${params}`, {
        method: 'GET',
        credentials: 'include'
      });
      return await res.json();
    } catch (error) {
      console.error('Error fetching table rows:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Insert a new row into a table
   */
  async insertRow(tableName, data) {
    try {
      const res = await fetch(`/api/database/tables/${tableName}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      return await res.json();
    } catch (error) {
      console.error('Error inserting row:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update an existing row
   */
  async updateRow(tableName, id, data) {
    try {
      const res = await fetch(`/api/database/tables/${tableName}/rows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      return await res.json();
    } catch (error) {
      console.error('Error updating row:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a row from a table
   */
  async deleteRow(tableName, id) {
    try {
      const res = await fetch(`/api/database/tables/${tableName}/rows/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await res.json();
    } catch (error) {
      console.error('Error deleting row:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create a new table
   */
  async createTable(tableName, columns) {
    try {
      const res = await fetch('/api/database/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, columns }),
        credentials: 'include'
      });
      return await res.json();
    } catch (error) {
      console.error('Error creating table:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete a table
   */
  async deleteTable(tableName) {
    try {
      const res = await fetch(`/api/database/tables/${tableName}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await res.json();
    } catch (error) {
      console.error('Error deleting table:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Add column to a table
   */
  async addColumn(tableName, columnDef) {
    try {
      const res = await fetch(`/api/database/tables/${tableName}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(columnDef),
        credentials: 'include'
      });
      return await res.json();
    } catch (error) {
      console.error('Error adding column:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Delete column from a table
   */
  async deleteColumn(tableName, columnName) {
    try {
      const res = await fetch(`/api/database/tables/${tableName}/columns/${columnName}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await res.json();
    } catch (error) {
      console.error('Error deleting column:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Execute raw SQL query
   */
  async executeSql() {
    return { 
      success: false, 
      error: 'SQL Console and raw SQL query execution have been permanently disabled for security reasons.' 
    };
  },

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    try {
      const res = await fetch('/api/database/stats', {
        method: 'GET',
        credentials: 'include'
      });
      return await res.json();
    } catch (error) {
      console.error('Error fetching database stats:', error);
      return { success: false, error: error.message };
    }
  }
};
