import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "./ui/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

interface SearchableComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  hasError?: boolean
  disabled?: boolean
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  hasError = false,
  disabled = false,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 rounded-lg border-2 text-left flex items-center justify-between transition-all min-h-[44px] font-['Poppins'] bg-white text-slate-800",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,32,91,0.16)] focus-visible:border-[#00205B]",
            open 
              ? "border-[#00205B] ring-2 ring-[rgba(0,32,91,0.16)]" 
              : hasError 
                ? "border-red-300 hover:border-red-400" 
                : "border-slate-300 hover:border-slate-400",
            disabled && "opacity-50 cursor-not-allowed bg-slate-50",
            className
          )}
        >
          <span className={cn("block truncate text-sm", (selectedOption || value) ? "text-slate-800" : "text-slate-400")}>
            {selectedOption ? selectedOption.label : (value || placeholder)}
          </span>
          <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command filter={(value, search) => {
           const option = options.find(o => o.value === value);
           if (!option) return 0;
           const searchLower = search.toLowerCase();
           const labelMatch = option.label.toLowerCase().includes(searchLower);
           const descMatch = option.description?.toLowerCase().includes(searchLower);
           return (labelMatch || descMatch) ? 1 : 0;
        }}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm text-slate-500 font-['Poppins']">
                {emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className="flex flex-col items-start py-2.5 px-3 cursor-pointer data-[selected=true]:bg-slate-100 aria-selected:bg-slate-100"
                >
                  <div className="flex items-center w-full">
                    <span className="font-semibold text-slate-900 text-sm font-['Poppins']">{option.label}</span>
                    {value === option.value && (
                      <Check className="ml-auto h-4 w-4 text-[#00205B]" />
                    )}
                  </div>
                  {option.description && (
                    <span className="text-xs text-slate-500 font-normal mt-0.5 font-['Poppins']">{option.description}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}