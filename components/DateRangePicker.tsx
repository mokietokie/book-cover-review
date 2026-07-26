"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function formatDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}.${m}.${d}`;
}

function buildMonthGrid(viewDate: Date): (Date | null)[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function openPicker() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((v) => !v);
  }

  function handleDayClick(day: Date) {
    const iso = toISODate(day);
    if (!from || (from && to)) {
      onChange(iso, "");
    } else if (iso < from) {
      onChange(iso, from);
      setOpen(false);
    } else {
      onChange(from, iso);
      setOpen(false);
    }
  }

  const label =
    from && to
      ? `${formatDisplay(from)} ~ ${formatDisplay(to)}`
      : from
        ? `${formatDisplay(from)} ~ 종료일 선택`
        : "조회 기간 선택";

  const grid = buildMonthGrid(viewDate);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={openPicker}
        className="shrink-0 whitespace-nowrap rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
      >
        {label}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: "fixed", top: position.top, left: position.left }}
            className="z-50 w-72 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                }
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
                aria-label="이전 달"
              >
                ←
              </button>
              <span className="text-sm font-medium text-neutral-900">
                {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
              </span>
              <button
                type="button"
                onClick={() =>
                  setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                }
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
                aria-label="다음 달"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-neutral-400">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
              {grid.map((day, i) => {
                if (!day) return <span key={i} />;
                const iso = toISODate(day);
                const isStart = iso === from;
                const isEnd = iso === to;
                const inRange = from && to && iso > from && iso < to;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                      isStart || isEnd
                        ? "bg-neutral-900 text-white"
                        : inRange
                          ? "bg-neutral-100 text-neutral-900"
                          : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {(from || to) && (
              <button
                type="button"
                onClick={() => {
                  onChange("", "");
                  setOpen(false);
                }}
                className="mt-2 w-full text-center text-xs font-medium text-neutral-500 underline hover:text-neutral-900"
              >
                기간 초기화
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
