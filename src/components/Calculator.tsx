import React, { useState, useCallback, useEffect } from 'react'
import { ExpressionInput } from './ExpressionInput'
import { CalculatorButtons } from './CalculatorButtons'
import { ResultDisplay } from './ResultDisplay'
import { VariablePanel } from './VariablePanel'
import { HistoryPanel } from './HistoryPanel'
import { ExpressionParser } from '@/services/ExpressionParser'
import { VariableManager } from '@/services/VariableManager'
import { RadicalEngine } from '@/services/RadicalEngine'
import { CalculationEngine } from '@/services/CalculationEngine'
import { CalculationResult, DisplayMode } from '@/types'

export const Calculator: React.FC = () => {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('decimal')
  const [history, setHistory] = useState<CalculationResult[]>([])
  const [showVariablePanel, setShowVariablePanel] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize services
  const [services] = useState(() => {
    const parser = new ExpressionParser()
    const variableManager = new VariableManager()
    const radicalEngine = new RadicalEngine()
    const calculationEngine = new CalculationEngine(parser, variableManager, radicalEngine)
    
    return { parser, variableManager, radicalEngine, calculationEngine }
  })

  const handleCalculate = useCallback(() => {
    if (!expression.trim()) return

    setError(null)
    const evaluationResult = services.calculationEngine.evaluate(expression)
    
    if (evaluationResult.success && evaluationResult.value !== undefined) {
      const calcResult: CalculationResult = {
        expression,
        variables: services.variableManager.getAll(),
        decimalResult: evaluationResult.value,
        radicalResult: evaluationResult.radicalForm || null,
        timestamp: new Date()
      }
      
      setResult(calcResult)
      setHistory(prev => [calcResult, ...prev.slice(0, 49)]) // Keep last 50 items
    } else {
      setError(evaluationResult.error || 'Calculation error')
    }
  }, [expression, services])

  const handleButtonClick = useCallback((value: string) => {
    switch (value) {
      case '=':
        handleCalculate()
        break
      case 'C':
        setExpression('')
        setResult(null)
        setError(null)
        break
      case '⌫':
        setExpression(prev => prev.slice(0, -1))
        break
      default:
        setExpression(prev => prev + value)
    }
  }, [handleCalculate])

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCalculate()
    }
  }, [handleCalculate])

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [handleKeyPress])

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prev => prev === 'decimal' ? 'radical' : 'decimal')
  }, [])

  const loadFromHistory = useCallback((item: CalculationResult) => {
    setExpression(item.expression)
    setResult(item)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            High School Calculator
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowVariablePanel(!showVariablePanel)}
              className={`btn ${showVariablePanel ? 'btn-primary' : 'btn-secondary'}`}
            >
              Variables
            </button>
            <button
              onClick={() => setShowHistoryPanel(!showHistoryPanel)}
              className={`btn ${showHistoryPanel ? 'btn-primary' : 'btn-secondary'}`}
            >
              History
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Variables */}
          {showVariablePanel && (
            <div className="lg:col-span-3">
              <VariablePanel
                variables={services.variableManager.getAll()}
                onDefine={(name, value) => {
                  try {
                    services.variableManager.define(name, value)
                    setError(null)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Error defining variable')
                  }
                }}
                onDelete={(name) => {
                  try {
                    services.variableManager.delete(name)
                    setError(null)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Error deleting variable')
                  }
                }}
              />
            </div>
          )}

          {/* Center - Calculator */}
          <div className={`${showVariablePanel && showHistoryPanel ? 'lg:col-span-6' : showVariablePanel || showHistoryPanel ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
            <div className="bg-white rounded-lg shadow-md p-6">
              <ExpressionInput
                value={expression}
                onChange={setExpression}
                onSubmit={handleCalculate}
                error={error}
              />
              
              <ResultDisplay
                result={result}
                displayMode={displayMode}
                onToggleMode={toggleDisplayMode}
              />
              
              <CalculatorButtons
                onButtonClick={handleButtonClick}
              />
            </div>
          </div>

          {/* Right Panel - History */}
          {showHistoryPanel && (
            <div className="lg:col-span-3">
              <HistoryPanel
                history={history}
                onSelectItem={loadFromHistory}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
