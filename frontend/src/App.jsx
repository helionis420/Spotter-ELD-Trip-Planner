import React, { useState, useRef } from 'react';
import {
  MapIcon,
  ListBulletIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import TripForm    from './components/TripForm';
import RouteMap    from './components/RouteMap';
import StopsList   from './components/StopsList';
import ELDLogSheet from './components/ELDLogSheet';
import TripSummary from './components/TripSummary';
import { planTrip } from './api/tripApi';

const TABS = [
  { id: 'map',      label: 'Route Map',    Icon: MapIcon           },
  { id: 'timeline', label: 'Timeline',     Icon: ListBulletIcon    },
  { id: 'logs',     label: 'ELD Logs',     Icon: DocumentTextIcon  },
];

export default function App() {
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState(null);
  const [result,  setResult]    = useState(null);
  const [tab,     setTab]       = useState('map');
  const resultsRef = useRef(null);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await planTrip(payload);
      setResult(data);
      setTab('map');
      // Smooth scroll to results on mobile
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow">
            <TruckIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold leading-tight text-slate-900">
              Spotter ELD Trip Planner
            </h1>
            <p className="text-xs text-slate-500">
              HOS-compliant route planning · 70-hr/8-day cycle · DOT 395.8 logs
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 sm:block">
              Property Carrier
            </span>
            <span className="hidden rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 sm:block">
              No Adverse Conditions
            </span>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-screen-2xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">

          {/* ── LEFT PANEL – Input form ───────────────────────────────────── */}
          <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <TruckIcon className="h-3.5 w-3.5" />
                </span>
                Trip Details
              </h2>
              <TripForm onSubmit={handleSubmit} loading={loading} />
            </div>
          </aside>

          {/* ── RIGHT PANEL – Results ─────────────────────────────────────── */}
          <section ref={resultsRef} className="flex-1 min-w-0">
            {/* Error banner */}
            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <div className="flex-1">
                  <p className="font-semibold">Unable to plan trip</p>
                  <p className="mt-0.5 text-red-600">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-24 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                  <TruckIcon className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Ready to plan your route</h3>
                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  Enter your trip details on the left. We'll calculate your HOS-compliant route
                  and generate DOT-standard ELD log sheets.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Route Map', icon: '🗺️' },
                    { label: 'Stop Timeline', icon: '📋' },
                    { label: 'ELD Log Sheets', icon: '📄' },
                  ].map((f) => (
                    <div key={f.label} className="rounded-xl bg-slate-50 p-3">
                      <div className="mb-1 text-2xl">{f.icon}</div>
                      <p className="text-xs font-medium text-slate-600">{f.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center gap-4 py-12">
                  <div className="relative flex h-16 w-16 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                    <TruckIcon className="h-7 w-7 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-slate-700">Planning your route…</p>
                    <p className="text-sm text-slate-500">
                      Geocoding locations · Calculating route · Applying HOS rules
                    </p>
                  </div>
                  {/* Skeleton bars */}
                  <div className="mt-4 w-full max-w-md space-y-3">
                    {[80, 60, 90, 50].map((w, i) => (
                      <div key={i} className="h-3 animate-pulse rounded-full bg-slate-100"
                           style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div className="space-y-4">
                {/* Summary cards */}
                <TripSummary result={result} />

                {/* Tabs */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex border-b border-slate-100 bg-slate-50">
                    {TABS.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                          tab === id
                            ? 'border-b-2 border-blue-600 bg-white text-blue-700'
                            : 'text-slate-500 hover:bg-white hover:text-slate-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{label}</span>
                        {id === 'logs' && (
                          <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700">
                            {result.eld_logs?.length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-4">
                    {/* MAP TAB */}
                    {tab === 'map' && (
                      <div style={{ height: '520px' }}>
                        <RouteMap
                          waypoints={result.waypoints}
                          routeGeometry={result.route_geometry}
                        />
                      </div>
                    )}

                    {/* TIMELINE TAB */}
                    {tab === 'timeline' && (
                      <div className="max-h-[520px] overflow-y-auto pr-1">
                        <StopsList stops={result.stops} />
                      </div>
                    )}

                    {/* ELD LOGS TAB */}
                    {tab === 'logs' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-600">
                            <span className="font-semibold">{result.eld_logs?.length} daily log sheet{result.eld_logs?.length !== 1 ? 's' : ''}</span>
                            {' '}generated — scroll to view all days
                          </p>
                          <button
                            onClick={() => window.print()}
                            className="no-print flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                          >
                            Print All
                          </button>
                        </div>
                        <div className="space-y-6 max-h-[700px] overflow-y-auto pr-1">
                          {(result.eld_logs || []).map((log, i) => (
                            <div key={i} className="print-break">
                              <ELDLogSheet
                                dayData={log}
                                index={i}
                                total={result.eld_logs.length}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>Spotter ELD Trip Planner · Property-Carrying · 70-hr/8-day Cycle · 49 CFR Part 395</p>
        <p className="mt-1">For planning purposes only — always verify compliance with a qualified HOS specialist.</p>
      </footer>
    </div>
  );
}
