import React from 'react';
import { TruckIcon, PauseCircleIcon, MoonIcon, WrenchScrewdriverIcon, MapPinIcon } from '@heroicons/react/24/solid';

function formatTime(hours) {
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatDuration(h) {
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

const STATUS_CONFIG = {
  driving: {
    icon: TruckIcon,
    bg:   'bg-blue-100',
    text: 'text-blue-700',
    dot:  'bg-blue-500',
    label: 'Driving',
  },
  on_duty: {
    icon: WrenchScrewdriverIcon,
    bg:   'bg-amber-100',
    text: 'text-amber-700',
    dot:  'bg-amber-500',
    label: 'On Duty',
  },
  off_duty: {
    icon: MoonIcon,
    bg:   'bg-slate-100',
    text: 'text-slate-600',
    dot:  'bg-slate-400',
    label: 'Off Duty',
  },
  sleeper: {
    icon: MoonIcon,
    bg:   'bg-purple-100',
    text: 'text-purple-700',
    dot:  'bg-purple-500',
    label: 'Sleeper',
  },
};

export default function StopsList({ stops = [] }) {
  if (!stops.length) return null;

  // Group consecutive stops by day
  const grouped = [];
  let currentDay = -1;
  stops.forEach((stop) => {
    const day = Math.floor(stop.start_time / 24);
    if (day !== currentDay) {
      currentDay = day;
      grouped.push({ day: day + 1, stops: [] });
    }
    grouped[grouped.length - 1].stops.push(stop);
  });

  return (
    <div className="space-y-6">
      {grouped.map(({ day, stops: dayStops }) => (
        <div key={day}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs text-white">
              {day}
            </span>
            Day {day}
          </h3>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

            <div className="space-y-3">
              {dayStops.map((stop, idx) => {
                const cfg = STATUS_CONFIG[stop.status] || STATUS_CONFIG.off_duty;
                const Icon = cfg.icon;
                const timeWithinDay = stop.start_time % 24;
                const endTimeWithinDay = stop.end_time % 24;

                return (
                  <div key={idx} className="relative flex gap-4">
                    {/* Icon bubble */}
                    <div className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                      <Icon className={`h-5 w-5 ${cfg.text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                            {stop.miles_from_start > 0 && (
                              <span className="text-xs text-slate-400">
                                Mile {stop.miles_from_start.toFixed(0)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {stop.description}
                          </p>
                          {stop.location && (
                            <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <MapPinIcon className="h-3 w-3" />
                              {stop.location}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs font-semibold text-slate-700">
                            {formatDuration(stop.duration_hours)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatTime(timeWithinDay)} – {formatTime(endTimeWithinDay)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
