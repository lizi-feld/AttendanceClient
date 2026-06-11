import { Check, Circle } from 'lucide-react'
import { passwordChecks } from '../../utils/employeeValidation'

interface Props {
  value: string
}

/**
 * Real-time password requirements checklist.
 * Items are gray when the field is empty, red when not met, green when met.
 */
export function PasswordChecklist({ value }: Props) {
  const started = value.length > 0

  return (
    <ul className="mt-2 space-y-1">
      {passwordChecks.map(({ key, label, test }) => {
        const met = started && test(value)
        return (
          <li
            key={key}
            className={`flex items-center gap-1.5 text-xs transition-colors duration-150 ${
              met ? 'text-green-600' : started ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {met ? (
              <Check className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            {label}
          </li>
        )
      })}
    </ul>
  )
}
