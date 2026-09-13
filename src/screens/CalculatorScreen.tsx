import { useState } from 'react'
import '../styles/CalculatorScreen.css'

export function CalculatorScreen() {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [newNumber, setNewNumber] = useState(true)

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+':
        return prev + current
      case '-':
        return prev - current
      case '×':
        return prev * current
      case '÷':
        return prev / current
      default:
        return current
    }
  }

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num)
      setNewNumber(false)
    } else {
      setDisplay(display === '0' ? num : display + num)
    }
  }

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay('0.')
      setNewNumber(false)
    } else if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1))
    } else {
      setDisplay('0')
      setNewNumber(true)
    }
  }

  const handleOperation = (op: string) => {
    const currentValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(currentValue)
    } else if (operation) {
      const result = calculate(previousValue, currentValue, operation)
      setDisplay(result.toString())
      setPreviousValue(result)
    }

    setOperation(op)
    setNewNumber(true)
  }

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const currentValue = parseFloat(display)
      const result = calculate(previousValue, currentValue, operation)
      setDisplay(result.toString())
      setPreviousValue(null)
      setOperation(null)
      setNewNumber(true)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setNewNumber(true)
  }

  return (
    <div className="calculator-screen">
      <div className="calculator-container">
        <h1 className="calculator-title">Calculatrice</h1>

        <div className="display">{display}</div>

        <div className="buttons">
          <button className="btn btn-clear" onClick={handleClear}>
            C
          </button>
          <button className="btn btn-backspace" onClick={handleBackspace}>
            ⌫
          </button>
          <button className="btn" onClick={handleDecimal}>
            ,
          </button>
          <button className="btn btn-operation" onClick={() => handleOperation('÷')}>
            ÷
          </button>

          <button className="btn" onClick={() => handleNumber('1')}>
            1
          </button>
          <button className="btn" onClick={() => handleNumber('2')}>
            2
          </button>
          <button className="btn" onClick={() => handleNumber('3')}>
            3
          </button>
          <button className="btn btn-operation" onClick={() => handleOperation('×')}>
            ×
          </button>

          <button className="btn" onClick={() => handleNumber('4')}>
            4
          </button>
          <button className="btn" onClick={() => handleNumber('5')}>
            5
          </button>
          <button className="btn" onClick={() => handleNumber('6')}>
            6
          </button>
          <button className="btn btn-operation" onClick={() => handleOperation('-')}>
            −
          </button>

          <button className="btn" onClick={() => handleNumber('7')}>
            7
          </button>
          <button className="btn" onClick={() => handleNumber('8')}>
            8
          </button>
          <button className="btn" onClick={() => handleNumber('9')}>
            9
          </button>
          <button className="btn btn-operation" onClick={() => handleOperation('+')}>
            +
          </button>

          <button className="btn btn-zero" onClick={() => handleNumber('0')}>
            0
          </button>
          <button className="btn btn-equals" onClick={handleEquals}>
            =
          </button>
        </div>
      </div>
    </div>
  )
}
