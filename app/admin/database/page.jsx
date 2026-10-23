'use client';

import { useState, useEffect } from 'react';
import { databaseService } from '@/lib/database-service';
import DatabaseSidebar from '@/app/components/database/DatabaseSidebar';
import DataGrid from '@/app/components/database/DataGrid';
import SQLConsole from '@/app/components/database/SQLConsole';
import CreateTableModal from '@/app/components/database/CreateTableModal';
import SchemaViewer from '@/app/components/database/SchemaViewer';
import { Search, Plus, Users, Database as DatabaseIcon, HardDrive, Wifi } from 'lucide-react';

export default function DatabasePage() {
  // State
  const [dbStats, setDbStats] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('users');
  const [activeTab, setActiveTab] = useState('data'); // 'data', 'structure', 'sql'
  
  // Table data state
  const [tableRows, setTableRows] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [tableSchema, setTableSchema] = useState([]);
  
  // Pagination & sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Loading & errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showCreateTable, setShowCreateTable] = useState(false);

  // Fetch tables list on mount
  useEffect(() => {
    loadTables();
    loadDbStats();
  }, []);

  const loadDbStats = async () => {
    try {
      const res = await fetch('/api/admin/database-stats');
      const json = await res.json();
      if (json.success) {
        setDbStats(json.data);
      }
    } catch (e) {
      console.error('Failed to load DB stats', e);
    }
  };

  // Load table data when selected table changes
  useEffect(() => {
    if (selectedTable && activeTab === 'data') {
      loadTableData();
    } else if (selectedTable && activeTab === 'structure') {
      loadTableSchema();
    }
  }, [selectedTable, activeTab, currentPage, sortBy, sortOrder]);

  // Functions
  const loadTables = async () => {
    setLoading(true);
    const result = await databaseService.getTables();
    setLoading(false);
    
    if (result.success) {
      setTables(result.data || []);
      if (result.data && result.data.length > 0 && !selectedTable) {
        setSelectedTable(result.data[0].name);
      }
    } else {
      setError(result.error || 'Failed to load tables');
    }
  };

  const loadTableData = async () => {
    setLoading(true);
    setError('');
    
    const result = await databaseService.getTableRows(selectedTable, {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      sortBy,
      sortOrder,
      search: searchQuery || undefined
    });

    setLoading(false);

    if (result.success) {
      setTableRows(result.data || []);
      setTotalCount(result.total || 0);
      
      if (result.data && result.data.length > 0) {
        setTableColumns(Object.keys(result.data[0]));
      } else {
        setTableColumns([]);
      }
    } else {
      setError(result.error || 'Failed to load table data');
      setTableRows([]);
      setTableColumns([]);
    }
  };

  const loadTableSchema = async () => {
    setLoading(true);
    setError('');
    
    const result = await databaseService.getTableSchema(selectedTable);
    setLoading(false);

    if (result.success) {
      setTableSchema(result.data || []);
    } else {
      setError(result.error || 'Failed to load table schema');
      setTableSchema([]);
    }
  };

  const handleCreateTable = async (tableData) => {
    setLoading(true);
    const result = await databaseService.createTable(tableData.tableName, tableData.columns);
    setLoading(false);

    if (result.success) {
      setSuccess('Table created successfully');
      setTimeout(() => setSuccess(''), 3000);
      await loadTables();
      setSelectedTable(tableData.tableName);
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Failed to create table' };
    }
  };

  const handleDeleteTable = async (tableName) => {
    if (!window.confirm(`Delete table "${tableName}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    const result = await databaseService.deleteTable(tableName);
    setLoading(false);

    if (result.success) {
      setSuccess('Table deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      await loadTables();
      setSelectedTable(tables[0]?.name || '');
    } else {
      setError(result.error || 'Failed to delete table');
    }
  };

  const handleAddRow = async () => {
    alert('Add row feature - open modal to enter data based on table schema');
  };

  const handleEditRow = async (rowIndex, column, value) => {
    const row = tableRows[rowIndex];
    const updateResult = await databaseService.updateRow(selectedTable, row.id, {
      [column]: value
    });

    if (updateResult.success) {
      setSuccess('Row updated');
      setTimeout(() => setSuccess(''), 2000);
      await loadTableData();
    } else {
      setError(updateResult.error || 'Failed to update row');
    }
  };

  const handleDeleteRow = async (rowIndex) => {
    const row = tableRows[rowIndex];
    const deleteResult = await databaseService.deleteRow(selectedTable, row.id);

    if (deleteResult.success) {
      setSuccess('Row deleted');
      setTimeout(() => setSuccess(''), 2000);
      await loadTableData();
    } else {
      setError(deleteResult.error || 'Failed to delete row');
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleExecuteSql = async (query) => {
    const result = await databaseService.executeSql(query);
    return result;
  };

  const handleAddColumn = async (columnDef) => {
    const result = await databaseService.addColumn(selectedTable, columnDef);
    if (result.success) {
      setSuccess('Column added');
      setTimeout(() => setSuccess(''), 2000);
      await loadTableSchema();
    } else {
      setError(result.error || 'Failed to add column');
    }
    return result;
  };

  const handleDeleteColumn = async (columnName) => {
    const result = await databaseService.deleteColumn(selectedTable, columnName);
    if (result.success) {
      setSuccess('Column deleted');
      setTimeout(() => setSuccess(''), 2000);
      await loadTableSchema();
    } else {
      setError(result.error || 'Failed to delete column');
    }
  };


  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 bg-gray-50">
      {/* Sidebar */}
      <DatabaseSidebar
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
        onCreateTable={() => setShowCreateTable(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Alerts */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}
        {success && (
          <div className="mx-4 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-green-800">{success}</p>
            <button
              onClick={() => setSuccess('')}
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header and Stats */}
        <div className="p-6 border-b border-gray-200 bg-white">
          {/* Database Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-4">
              <div className="p-3 bg-white text-blue-600 rounded-lg shadow-sm"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-xl font-bold text-gray-800">{dbStats ? dbStats.totalUsers : '...'}</p>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-4">
              <div className="p-3 bg-white text-purple-600 rounded-lg shadow-sm"><DatabaseIcon className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Rows</p>
                <p className="text-xl font-bold text-gray-800">{dbStats ? dbStats.totalRows.toLocaleString() : '...'}</p>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex items-center gap-4">
              <div className="p-3 bg-white text-green-600 rounded-lg shadow-sm"><HardDrive className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-gray-500 font-medium">DB Size</p>
                <p className="text-xl font-bold text-gray-800">{dbStats ? (dbStats.totalSize / 1024 / 1024).toFixed(2) + ' MB' : '...'}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-white text-gray-600 rounded-lg shadow-sm">
                <Wifi className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Connection</p>
                <p className="text-md font-bold text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Healthy
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedTable || 'Database'}</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your database tables and data</p>
            </div>
            <button
              onClick={() => setShowCreateTable(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              New Table
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4">
            {['data', 'structure', 'sql'].map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab === 'data' && 'Data'}
                {tab === 'structure' && 'Structure'}
                {tab === 'sql' && 'SQL Editor'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'data' && (
            <div className="flex flex-col h-full">
              {/* Search Bar */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search data..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Data Grid */}
              <div className="flex-1 overflow-hidden">
                <DataGrid
                  columns={tableColumns}
                  rows={tableRows}
                  loading={loading}
                  totalCount={totalCount}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onPageChange={setCurrentPage}
                  onSort={handleSort}
                  onAddRow={handleAddRow}
                  onEditRow={handleEditRow}
                  onDeleteRow={handleDeleteRow}
                />
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="p-6 overflow-hidden h-full">
              <SchemaViewer
                tableName={selectedTable}
                columns={tableSchema}
                loading={loading}
                onAddColumn={handleAddColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="p-6 overflow-hidden h-full">
              <SQLConsole
                loading={loading}
                onExecute={handleExecuteSql}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Table Modal */}
      <CreateTableModal
        isOpen={showCreateTable}
        onClose={() => setShowCreateTable(false)}
        onSubmit={handleCreateTable}
        loading={loading}
      />
    </div>
  );
}