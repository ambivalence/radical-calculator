import React from 'react'
import { CalculationResult } from '@/types'

interface HistoryPanelProps {
  history: CalculationResult[]
  onSelectItem: (item: CalculationResult) => void
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onSelectItem
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">History</h2>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.map((item, index) => (
          <button
            key={index}
            onClick={() => onSelectItem(item)}
            className="w-full text-left p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
          >
            <div className="text-sm text-gray-500 mb-1">
              {formatTime(item.timestamp)}
            </div>
            <div className="font-mono text-sm">
              {item.expression} = {item.decimalResult}
            </div>
            {item.radicalResult && (
              <div className="text-xs text-purple-600 mt-1">
                = {item.radicalResult.toString()}
              </div>
            )}
          </button>
        ))}
        {history.length === 0 && (
          <p className="text-gray-500 text-sm">No calculations yet</p>
        )}
      </div>
      
      {history.length > 0 && (
        <div className="mt-4 text-xs text-gray-500">
          Showing {history.length} calculation{history.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
