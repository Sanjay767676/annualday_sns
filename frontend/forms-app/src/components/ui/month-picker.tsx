import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  value?: string; // yyyy-MM
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function MonthPicker({ value, onChange, disabled, className }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  
  const currentYear = value ? parseInt(value.split("-")[0]) : new Date().getFullYear();
  const currentMonth = value ? parseInt(value.split("-")[1]) - 1 : new Date().getMonth();

  const [viewYear, setViewYear] = React.useState(currentYear);

  const displayValue = value ? `${MONTHS[currentMonth]} ${currentYear}` : "Select month & year";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start border-slate-300 bg-white text-left font-normal hover:bg-white px-3",
            !value && "text-slate-400",
            className
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{displayValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="start">
        <div className="flex items-center justify-between mb-4 px-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500"
            onClick={() => setViewYear(v => v - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-semibold text-slate-900 tracking-tight">
            {viewYear}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500"
            onClick={() => setViewYear(v => v + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((month, index) => {
            const isSelected = currentYear === viewYear && currentMonth === index;
            return (
              <Button
                key={month}
                variant="ghost"
                className={cn(
                  "h-9 w-full text-xs font-medium transition-all duration-200",
                  isSelected 
                    ? "bg-slate-950 text-white hover:bg-slate-900 hover:text-white" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
                onClick={() => {
                  const monthStr = (index + 1).toString().padStart(2, "0");
                  onChange(`${viewYear}-${monthStr}`);
                  setOpen(false);
                }}
              >
                {month}
              </Button>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Clear
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] uppercase tracking-wider font-bold text-slate-900 hover:bg-slate-100"
            onClick={() => {
              const now = new Date();
              const m = (now.getMonth() + 1).toString().padStart(2, "0");
              onChange(`${now.getFullYear()}-${m}`);
              setOpen(false);
            }}
          >
            This month
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
