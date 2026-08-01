import { useState } from "react";
import Select from "./Select";
import FlatIcon from "./FlatIcon";

export type TimeRangeValue =
  | "all"
  | "today"
  | "yesterday"
  | "this-week"
  | "last-week"
  | "this-month"
  | "last-month"
  | "this-year"
  | "last-year"
  | "custom"
  | "specific-date";

export interface TimeRangeFilterState {
  range: TimeRangeValue;
  start?: string;
  end?: string;
  date?: string;
}

export const toApiTimeRange = (range: TimeRangeValue) =>
  (
    {
      all: "all_time",
      today: "today",
      yesterday: "yesterday",
      "this-week": "this_week",
      "last-week": "last_week",
      "this-month": "this_month",
      "last-month": "last_month",
      "this-year": "this_year",
      "last-year": "last_year",
      custom: "custom",
      "specific-date": "specific_date",
    } as const
  )[range];

interface TimeRangePickerProps {
  onChange: (state: TimeRangeFilterState) => void;
  className?: string;
}

export default function TimeRangePicker({
  onChange,
  className = "",
}: TimeRangePickerProps) {
  const [range, setRange] = useState<TimeRangeValue>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [specificDate, setSpecificDate] = useState("");

  const handleRangeChange = (val: TimeRangeValue) => {
    setRange(val);
    if (val === "specific-date") {
      onChange({ range: val, date: specificDate });
    } else if (val !== "custom") {
      onChange({ range: val });
    } else {
      onChange({ range: val, start: startDate, end: endDate });
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    onChange({ range: "custom", start, end });
  };

  const rangeOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "this-week", label: "This Week View" },
    { value: "last-week", label: "Last Week View" },
    { value: "this-month", label: "This Month" },
    { value: "last-month", label: "Last Month" },
    { value: "this-year", label: "This Year" },
    { value: "last-year", label: "Last Year View" },
    { value: "custom", label: "Custom Time Range" },
    { value: "specific-date", label: "Specific Date" },
  ];

  return (
    <div
      className={`flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-border-warm shadow-sm select-none ${className}`}
    >
      <div className="flex items-center gap-2 text-[10px] font-bold text-brand-teal uppercase tracking-wider">
        <FlatIcon name="calendar" className="text-[14px] text-brand-teal" />
        <span>Period</span>
      </div>

      <div className="relative">
        <Select
          options={rangeOptions}
          value={range}
          onChange={(val) => handleRangeChange(val as TimeRangeValue)}
          className="min-w-[150px]"
        />
      </div>

      {range === "custom" && (
        <div className="flex items-center gap-2 animate-fade-in">
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
            className="px-2.5 py-1 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium"
          />
          <span className="text-xs text-muted-gray">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
            className="px-2.5 py-1 border border-border-warm rounded text-xs text-charcoal outline-none focus:border-brand-teal bg-white font-medium"
          />
        </div>
      )}

      {range === "specific-date" && (
        <input
          type="date"
          value={specificDate}
          onChange={(event) => {
            setSpecificDate(event.target.value);
            onChange({ range: "specific-date", date: event.target.value });
          }}
          className="rounded border border-border-warm bg-white px-2.5 py-1 text-xs font-medium text-charcoal outline-none focus:border-brand-teal"
        />
      )}
    </div>
  );
}
