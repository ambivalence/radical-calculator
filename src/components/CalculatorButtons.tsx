import React from 'react'

interface CalculatorButtonsProps {
  onButtonClick: (value: string) => void
}

const buttonLayout = [
  ['C', '(', ')', '⌫'],
  ['7', '8', '9', '/'],
  ['4', '5', '6', '*'],
  ['1', '2', '3', '-'],
  ['0', '.', '=', '+'],
  ['sqrt(', 'abs(', '^', 'π'],
  ['sin(', 'cos(', 'tan(', 'e'],
  ['log(', 'ln(', 'x', 'y']
]

const operatorButtons = new Set(['+', '-', '*', '/', '^'])
const functionButtons = new Set(['sqrt(', 'abs(', 'sin(', 'cos(', 'tan(', 'log(', 'ln('])
const constantButtons = new Set(['π', 'e'])

export const CalculatorButtons: React.FC<CalculatorButtonsProps> = ({ onButtonClick }) => {
  const getButtonClass = (button: string): string => {
    if (button === '=') return 'btn-primary'
    if (button === 'C') return 'bg-red-500 text-white hover:bg-red-600'
    if (button === '⌫') return 'bg-orange-500 text-white hover:bg-orange-600'
    if (operatorButtons.has(button)) return 'bg-blue-100 hover:bg-blue-200'
    if (functionButtons.has(button)) return 'bg-purple-100 hover:bg-purple-200'
    if (constantButtons.has(button)) return 'bg-green-100 hover:bg-green-200'
    return 'btn-secondary'
  }

  const handleClick = (value: string) => {
    if (value === 'π') {
      onButtonClick('pi')
    } else {
      onButtonClick(value)
    }
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {buttonLayout.map((row, rowIndex) => (
        row.map((button, colIndex) => (
          <button
            key={`${rowIndex}-${colIndex}`}
            onClick={() => handleClick(button)}
            className={`btn h-12 text-lg font-medium ${getButtonClass(button)}`}
          >
            {button}
          </button>
        ))
      ))}
    </div>
  )
}
