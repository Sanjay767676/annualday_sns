import * as React from "react";
import Calendar from "react-calendar";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";

import "react-calendar/dist/Calendar.css";

import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";

type CalendarValue = Date | null | [Date | null, Date | null];

type DateCalendarPickerProps = {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  maxDate?: string;
};

function parseDateValue(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function DateCalendarPicker({ value, onChange, disabled, className, maxDate }: DateCalendarPickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = parseDateValue(value);
  const maxAllowedDate = parseDateValue(maxDate);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start border-slate-300 bg-white px-3 text-left font-normal hover:bg-white",
            !selectedDate && "text-slate-400",
            className,
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">
            {selectedDate ? format(selectedDate, "dd MMM yyyy") : "Select date"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          value={selectedDate}
          maxDate={maxAllowedDate ?? undefined}
          selectRange={false}
          onChange={(nextValue: CalendarValue) => {
            if (nextValue instanceof Date) {
              onChange(format(nextValue, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
        />
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            onClick={() => onChange("")}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
