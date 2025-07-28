import React, { useState } from 'react'

interface VariablePanelProps {
  variables: Map<string, number>
  onDefine: (name: string, value: number) => void
  onDelete: (name: string) => void
}

export const VariablePanel: React.FC<VariablePanelProps> = ({
  variables,
  onDefine,
  onDelete
}) => {
  const [newVarName, setNewVarName] = useState('')
  const [newVarValue, setNewVarValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newVarName && newVarValue) {
      const value = parseFloat(newVarValue)
      if (!isNaN(value)) {
        onDefine(newVarName, value)
        setNewVarName('')
        setNewVarValue('')
      }
    }
  }

  const reservedWords = new Set(['e', 'pi', 'PI'])

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">Variables</h2>
      
      {/* Variable list */}
      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {Array.from(variables.entries()).map(([name, value]) => (
          <div key={name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="font-mono">
              <span className="text-blue-600">{name}</span> = {value}
            </span>
            {!reservedWords.has(name) && (
              <button
                onClick={() => onDelete(name)}
                className="text-red-500 hover:text-red-700"
                title="Delete variable"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {variables.size === 0 && (
          <p className="text-gray-500 text-sm">No variables defined</p>
        )}
      </div>

      {/* Add new variable form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          placeholder="Variable name"
          className="input-field text-sm"
          pattern="[a-zA-Z][a-zA-Z0-9_]*"
          title="Must start with a letter"
        />
        <input
          type="number"
          value={newVarValue}
          onChange={(e) => setNewVarValue(e.target.value)}
          placeholder="Value"
          className="input-field text-sm"
          step="any"
        />
        <button
          type="submit"
          className="btn btn-primary w-full text-sm"
          disabled={!newVarName || !newVarValue}
        >
          Define Variable
        </button>
      </form>
    </div>
  )
}
