import React, { useRef, useEffect } from 'react'

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

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="mb-4">
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
    </div>
  )
}
