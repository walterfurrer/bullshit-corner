interface MobileSectionPickerOption<T extends string> {
  value: T
  label: string
}

interface MobileSectionPickerProps<T extends string> {
  label: string
  options: MobileSectionPickerOption<T>[]
  value: T
  onValueChange: (value: T) => void
}

/** A thumb-friendly section selector using the app's shared Select primitive. */
export function MobileSectionPicker<T extends string>({
  label,
  options,
  value,
  onValueChange,
}: MobileSectionPickerProps<T>) {
  return (
    <div className="md:hidden">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Select
          value={value}
          onValueChange={(nextValue) => {
            if (nextValue) onValueChange(nextValue as T)
          }}
        >
          <SelectTrigger className="w-full" aria-label={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
