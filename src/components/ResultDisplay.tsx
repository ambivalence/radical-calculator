import React from 'react'
import { CalculationResult, DisplayMode } from '@/types'

interface ResultDisplayProps {
  result: CalculationResult | null
  displayMode: DisplayMode
  onToggleMode: () => void
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  displayMode,
  onToggleMode
}) => {
  if (!result) {
    return (
      <div className="h-24 mb-4 flex items-center justify-center text-gray-400">
        <p>Result will appear here</p>
      </div>
    )
  }

  const displayValue = displayMode === 'decimal' 
    ? result.decimalResult.toString()
    : result.radicalResult?.toString() || result.decimalResult.toString()

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{result.expression} =</p>
          <p className="text-3xl font-bold text-gray-900 font-math">
            {displayValue}
          </p>
        </div>
        {result.radicalResult && (
          <button
            onClick={onToggleMode}
            className="btn btn-accent ml-4"
            title="Toggle between decimal and radical form"
          >
            {displayMode === 'decimal' ? '√' : '0.0'}
          </button>
        )}
      </div>
    </div>
  )
}
