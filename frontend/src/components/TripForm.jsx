import React, { useState } from 'react';
import { MapPinIcon, TruckIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

const EXAMPLES = [
  {
    label: 'Chicago → Detroit → New York',
    data: { current_location: 'Chicago, IL', pickup_location: 'Detroit, MI', dropoff_location: 'New York, NY', current_cycle_used: 20 },
  },
  {
    label: 'Los Angeles → Phoenix → Dallas',
    data: { current_location: 'Los Angeles, CA', pickup_location: 'Phoenix, AZ', dropoff_location: 'Dallas, TX', current_cycle_used: 35 },
  },
  {
    label: 'Seattle → Portland → San Francisco',
    data: { current_location: 'Seattle, WA', pickup_location: 'Portland, OR', dropoff_location: 'San Francisco, CA', current_cycle_used: 10 },
  },
];

export default function TripForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: '',
  });

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, current_cycle_used: parseFloat(form.current_cycle_used) || 0 });
  };

  const loadExample = (example) => {
    setForm({ ...example.data, current_cycle_used: String(example.data.current_cycle_used) });
  };

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Quick Examples */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Quick Examples</p>
        <div className="flex flex-col gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => loadExample(ex)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Current Location */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <MapPinIcon className="h-4 w-4 text-green-500" />
          Current Location
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder="e.g. Chicago, IL"
          value={form.current_location}
          onChange={set('current_location')}
          required
        />
      </div>

      {/* Pickup */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <TruckIcon className="h-4 w-4 text-blue-500" />
          Pickup Location
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder="e.g. Detroit, MI"
          value={form.pickup_location}
          onChange={set('pickup_location')}
          required
        />
        <p className="mt-1 text-xs text-slate-400">1 hour on-duty (loading)</p>
      </div>

      {/* Arrow divider */}
      <div className="flex items-center justify-center">
        <ArrowRightIcon className="h-4 w-4 text-slate-300" />
      </div>

      {/* Dropoff */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <MapPinIcon className="h-4 w-4 text-red-500" />
          Dropoff Location
        </label>
        <input
          type="text"
          className={inputClass}
          placeholder="e.g. New York, NY"
          value={form.dropoff_location}
          onChange={set('dropoff_location')}
          required
        />
        <p className="mt-1 text-xs text-slate-400">1 hour on-duty (unloading)</p>
      </div>

      {/* Cycle Hours */}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <ClockIcon className="h-4 w-4 text-amber-500" />
          Current Cycle Used (Hrs)
        </label>
        <input
          type="number"
          className={inputClass}
          placeholder="0 – 70"
          min="0"
          max="70"
          step="0.5"
          value={form.current_cycle_used}
          onChange={set('current_cycle_used')}
          required
        />
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-green-400 to-red-500 transition-all"
              style={{ width: `${Math.min(100, ((parseFloat(form.current_cycle_used) || 0) / 70) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">
            {parseFloat(form.current_cycle_used) || 0}/70 hrs
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">70-hr/8-day property-carrying cycle</p>
      </div>

      {/* Assumptions */}
      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        <p className="font-semibold mb-1">Assumed ruleset:</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600">
          <li>11-hr driving / 14-hr duty window</li>
          <li>30-min break after 8 hrs driving</li>
          <li>10-hr mandatory rest</li>
          <li>Fuel stop every 1,000 miles</li>
          <li>55 mph average speed</li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Planning Route…
          </>
        ) : (
          <>
            <TruckIcon className="h-4 w-4" />
            Plan My Trip
          </>
        )}
      </button>
    </form>
  );
}
