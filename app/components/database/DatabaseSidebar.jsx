/**
 * Database Sidebar - Navigation for database features
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Database, Table, Code2, Settings } from 'lucide-react';

export default function DatabaseSidebar({ 
  tables = [], 
  selectedTable, 
  onSelectTable,
  onCreateTable,
  activeSection 
}) {
  const [expandedSections, setExpandedSections] = useState({
    tables: true,
    views: false,
    functions: false,
    enums: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const sections = [
    { key: 'tables', icon: Table, label: 'Tables', items: tables },
    { key: 'views', icon: Code2, label: 'Views', items: [] },
    { key: 'functions', icon: Code2, label: 'Functions', items: [] },
    { key: 'enums', icon: Settings, label: 'Enums', items: [] }
  ];

  return (
    <div className="w-64 bg-slate-900 text-white border-r border-slate-700 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Database size={18} />
          </div>
          <div>
            <h2 className="font-bold text-sm">Database</h2>
            <p className="text-xs text-slate-400">Studio</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {sections.map(section => (
          <div key={section.key} className="mb-1">
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-800 transition-colors text-xs font-medium text-slate-200"
            >
              <div className="flex items-center gap-2">
                <section.icon size={16} />
                <span className="uppercase tracking-wide">{section.label}</span>
              </div>
              {expandedSections[section.key] ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {expandedSections[section.key] && (
              <div className="bg-slate-800/50 max-h-96 overflow-y-auto">
                {section.key === 'tables' && (
                  section.items.length === 0 ? (
                    <div className="px-6 py-4 text-xs text-slate-400 text-center">
                      No tables found
                    </div>
                  ) : (
                    section.items.map(table => (
                      <button
                        key={table.name}
                        onClick={() => onSelectTable(table.name)}
                        className={`w-full text-left px-6 py-2 text-sm transition-colors flex items-center gap-2 ${
                          selectedTable === table.name
                            ? 'bg-blue-600 text-white border-l-2 border-blue-400'
                            : 'hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        <Table size={14} />
                        <span>{table.name}</span>
                        {table.rowCount !== undefined && (
                          <span className="ml-auto text-xs text-slate-400">
                            {table.rowCount}
                          </span>
                        )}
                      </button>
                    ))
                  )
                )}

                {section.key === 'views' && (
                  <div className="px-6 py-4 text-xs text-slate-400 text-center">
                    No views configured
                  </div>
                )}

                {section.key === 'functions' && (
                  <div className="px-6 py-4 text-xs text-slate-400 text-center">
                    No functions found
                  </div>
                )}

                {section.key === 'enums' && (
                  <div className="px-6 py-4 text-xs text-slate-400 text-center">
                    No enums found
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 p-4 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>Connected</span>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
