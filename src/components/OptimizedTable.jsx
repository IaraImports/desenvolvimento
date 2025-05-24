import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

const TableRow = memo(({ item, columns, onEdit, onDelete, rowIndex }) => (
  <motion.tr
    key={item.id}
    className="hover:bg-[#FF2C68]/5 transition-colors"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: rowIndex * 0.05, duration: 0.3 }}
  >
    {columns.map((column) => (
      <td key={column.key} className="px-6 py-4">
        {column.render ? column.render(item) : item[column.key]}
      </td>
    ))}
    <td className="px-6 py-4">
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => onEdit(item)}
          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
        >
          {/* Edit icon será passado via prop */}
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          {/* Delete icon será passado via prop */}
        </button>
      </div>
    </td>
  </motion.tr>
));

const OptimizedTable = memo(({ 
  data = [], 
  columns = [], 
  loading = false,
  emptyMessage = "Nenhum item encontrado",
  onEdit,
  onDelete,
  maxVisibleRows = 10
}) => {
  // Implementar paginação simples para melhorar performance
  const paginatedData = useMemo(() => {
    return data.slice(0, maxVisibleRows);
  }, [data, maxVisibleRows]);

  if (loading) {
    return (
      <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-[#FF2C68]/30 border-t-[#FF2C68] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0C0C]/50 backdrop-blur-xl rounded-2xl border border-[#FF2C68]/30 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#FF2C68]/10">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-6 py-4 text-left text-white font-medium">
                  {column.title}
                </th>
              ))}
              <th className="px-6 py-4 text-center text-white font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FF2C68]/20">
            {paginatedData.map((item, index) => (
              <TableRow
                key={item.id}
                item={item}
                columns={columns}
                onEdit={onEdit}
                onDelete={onDelete}
                rowIndex={index}
              />
            ))}
          </tbody>
        </table>
        
        {data.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/60">{emptyMessage}</p>
          </div>
        )}
        
        {data.length > maxVisibleRows && (
          <div className="p-4 border-t border-[#FF2C68]/20 text-center">
            <p className="text-white/60 text-sm">
              Mostrando {maxVisibleRows} de {data.length} itens
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedTable.displayName = 'OptimizedTable';
TableRow.displayName = 'TableRow';

 