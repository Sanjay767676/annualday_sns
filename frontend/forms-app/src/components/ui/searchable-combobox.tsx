import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchableComboboxProps {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Search...",
  emptyMessage = "No results found.",
  className,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between border-slate-300 bg-white px-3 font-normal hover:bg-white text-slate-950",
            !value && "text-slate-400",
            className
          )}
        >
          <span className="truncate">
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                // Allow user to just type their own value
                if (e.target.value && !options.includes(e.target.value)) {
                  onChange(e.target.value);
                }
              }}
            />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandGroup>
              {options
                .filter((option) =>
                  option.toLowerCase().includes(searchValue.toLowerCase())
                )
                .slice(0, 50) // Limit for performance
                .map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setSearchValue("");
                      setOpen(false);
                    }}
                    className="text-xs py-2"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
              {searchValue && !options.some(o => o.toLowerCase() === searchValue.toLowerCase()) && (
                <CommandItem
                  value={searchValue}
                  onSelect={() => {
                    onChange(searchValue);
                    setOpen(false);
                  }}
                  className="text-xs py-2 italic text-slate-500"
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Use "{searchValue}"
                </CommandItem>
              )}
            </CommandGroup>
            {options.filter((option) =>
                  option.toLowerCase().includes(searchValue.toLowerCase())
                ).length === 0 && !searchValue && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
