import React from 'react';
import { MapIcon, ClockIcon, TruckIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';

function formatHours(h) {
  const hrs  = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function StatCard({ icon: Icon, iconBg, label, value, sub }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm border border-slate-100">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function TripSummary({ result }) {
  const {
    total_distance_miles,
    miles_to_pickup,
    miles_to_dropoff,
    total_trip_hours,
    total_driving_hours,
    total_rest_hours,
    trip_days,
  } = result;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={MapIcon}
          iconBg="bg-blue-500"
          label="Total Distance"
          value={`${total_distance_miles.toFixed(0)} mi`}
          sub={`${miles_to_pickup.toFixed(0)} + ${miles_to_dropoff.toFixed(0)} mi`}
        />
        <StatCard
          icon={ClockIcon}
          iconBg="bg-amber-500"
          label="Total Trip Time"
          value={formatHours(total_trip_hours)}
          sub="incl. all stops & rests"
        />
        <StatCard
          icon={TruckIcon}
          iconBg="bg-green-500"
          label="Driving Time"
          value={formatHours(total_driving_hours)}
          sub={`${total_rest_hours.toFixed(1)}h rest`}
        />
        <StatCard
          icon={CalendarDaysIcon}
          iconBg="bg-purple-500"
          label="Trip Spans"
          value={`${trip_days} Day${trip_days !== 1 ? 's' : ''}`}
          sub={`${trip_days} ELD log sheet${trip_days !== 1 ? 's' : ''}`}
        />
      </div>

      {/* Route breadcrumb */}
      <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 text-sm text-white">
        <span className="rounded bg-green-500 px-2 py-0.5 text-xs font-bold">START</span>
        <span className="flex-1 truncate font-medium">{result.waypoints?.[0]?.name}</span>
        <span className="text-slate-400">→</span>
        <span className="rounded bg-blue-500 px-2 py-0.5 text-xs font-bold">PICKUP</span>
        <span className="flex-1 truncate font-medium">{result.waypoints?.[1]?.name}</span>
        <span className="text-slate-400">→</span>
        <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-bold">DROP</span>
        <span className="flex-1 truncate font-medium">{result.waypoints?.[2]?.name}</span>
      </div>
    </div>
  );
}
