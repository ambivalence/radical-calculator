import React, { useRef, useEffect, useState } from 'react'

interface ExpressionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  error: string | null
}

export const ExpressionInput: React.FC<ExpressionInputProps> = ({
  value,
  onChange,
  onSubmit,
  error
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [showFractionMode, setShowFractionMode] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    } else if (e.key === 'F1') {
      e.preventDefault()
      setShowFractionMode(!showFractionMode)
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setShowFractionMode(!showFractionMode)}
          className={`btn btn-sm ${showFractionMode ? 'btn-primary' : 'btn-secondary'}`}
          title="Toggle fraction display mode (F1) - Coming Soon!"
        >
          {showFractionMode ? '𝒇' : 'f'}
        </button>
        <span className="text-sm text-gray-600">
          {showFractionMode ? 'Visual fraction mode (Coming Soon)' : 'Text mode'} (Press F1 to toggle)
        </span>
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`input-field text-xl font-mono ${error ? 'border-red-500' : ''}`}
        placeholder="Enter expression..."
        autoComplete="off"
        spellCheck={false}
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {showFractionMode && (
        <div className="mt-2 text-xs text-gray-500">
          <p>⚠️ Visual fraction mode is under development. Use text mode for now (e.g., "3/4")</p>
        </div>
      )}
    </div>
  )
}
