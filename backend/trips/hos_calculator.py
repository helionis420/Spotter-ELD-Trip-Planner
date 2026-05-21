"""
HOS (Hours of Service) Calculator for property-carrying drivers.
Ruleset: 70-hour/8-day cycle, no adverse driving conditions.
49 CFR Part 395 compliance.
"""
from dataclasses import dataclass
from typing import List, Optional
from datetime import date, timedelta
import math


@dataclass
class LogEntry:
    status: str          # 'off_duty' | 'sleeper' | 'driving' | 'on_duty'
    start_time: float    # hours from trip start
    end_time: float
    description: str
    location: Optional[str] = None
    miles_from_start: float = 0.0


class HOSCalculator:
    """
    Enforces:
      - 11-hr driving limit per 14-hr window
      - 30-min break after 8 hrs cumulative driving
      - 10-hr mandatory off-duty rest resets the window
      - 70-hr/8-day cycle (34-hr restart when exhausted)
      - Fuel stop every 1,000 miles (30 min on-duty)
      - 1 hr on-duty (not driving) for pickup and dropoff
    """

    SPEED_MPH = 55.0
    MAX_DRIVING = 11.0       # hours driving per 14-hr window
    MAX_WINDOW = 14.0        # 14-hour on-duty window
    BREAK_AFTER = 8.0        # mandatory break after this many driving hours
    BREAK_DUR = 0.5          # 30-minute break
    REST_DUR = 10.0          # 10-hour rest
    RESTART_DUR = 34.0       # 34-hour cycle restart
    MAX_CYCLE = 70.0         # 70-hr/8-day cycle
    FUEL_MILES = 1000.0      # fuel every 1,000 miles
    FUEL_DUR = 0.5           # 30-min fuel stop
    STOP_DUR = 1.0           # 1-hr pickup / dropoff

    def __init__(self, current_cycle_used: float):
        self.current_time = 0.0
        self.driving_since_break = 0.0   # driving hrs since last qualifying break
        self.driving_in_window = 0.0     # driving hrs in current 14-hr window
        self.on_duty_in_window = 0.0     # all on-duty hrs in current 14-hr window
        self.cycle_hours = min(float(current_cycle_used), self.MAX_CYCLE)
        self.total_miles = 0.0
        self.miles_since_fuel = 0.0
        self.log_entries: List[LogEntry] = []

    # ── private helpers ────────────────────────────────────────────

    def _add(self, status: str, duration: float, description: str,
             location: str = None) -> LogEntry:
        if duration <= 0:
            return None
        entry = LogEntry(
            status=status,
            start_time=round(self.current_time, 4),
            end_time=round(self.current_time + duration, 4),
            description=description,
            location=location,
            miles_from_start=round(self.total_miles, 2),
        )
        self.log_entries.append(entry)
        self.current_time += duration
        return entry

    def _rest(self):
        self._add('off_duty', self.REST_DUR, 'Mandatory 10-hour rest period')
        self.driving_in_window = 0.0
        self.on_duty_in_window = 0.0
        self.driving_since_break = 0.0

    def _restart(self):
        self._add('off_duty', self.RESTART_DUR, '34-hour cycle restart (70-hr limit reached)')
        self.cycle_hours = 0.0
        self.driving_in_window = 0.0
        self.on_duty_in_window = 0.0
        self.driving_since_break = 0.0

    def _break(self):
        self._add('off_duty', self.BREAK_DUR, 'Mandatory 30-minute break (8-hr driving rule)')
        self.driving_since_break = 0.0
        # break counts in the 14-hr window but NOT against the driving limit
        self.on_duty_in_window += self.BREAK_DUR

    def _fuel(self):
        self._add('on_duty', self.FUEL_DUR,
                  f'Fuel stop (~{self.total_miles:.0f}-mile mark)')
        self.on_duty_in_window += self.FUEL_DUR
        self.cycle_hours += self.FUEL_DUR
        self.miles_since_fuel = 0.0

    def _on_duty_stop(self, duration: float, description: str, location: str = None):
        # if the window won't fit this stop, rest first
        if self.on_duty_in_window + duration > self.MAX_WINDOW:
            self._rest()
        # also check cycle
        if self.cycle_hours + duration > self.MAX_CYCLE:
            self._restart()
        self._add('on_duty', duration, description, location)
        self.on_duty_in_window += duration
        self.cycle_hours += duration

    # ── core drive routine ─────────────────────────────────────────

    def drive(self, total_miles: float):
        """Drive `total_miles`, inserting HOS events automatically."""
        remaining = total_miles

        while remaining > 0.01:
            # 1. 70-hr cycle exhausted?
            if self.cycle_hours >= self.MAX_CYCLE:
                self._restart()
                continue

            # 2. 14-hr window or 11-hr driving exhausted?
            if (self.on_duty_in_window >= self.MAX_WINDOW or
                    self.driving_in_window >= self.MAX_DRIVING):
                self._rest()
                continue

            # 3. Need break after 8 hrs driving?
            if self.driving_since_break >= self.BREAK_AFTER:
                duty_left = self.MAX_WINDOW - self.on_duty_in_window
                if duty_left > self.BREAK_DUR:
                    self._break()
                else:
                    self._rest()
                continue

            # 4. Calculate max driveable stretch before next constraint
            headroom_break = self.BREAK_AFTER - self.driving_since_break
            headroom_drive = self.MAX_DRIVING - self.driving_in_window
            headroom_duty  = self.MAX_WINDOW  - self.on_duty_in_window
            headroom_cycle = self.MAX_CYCLE   - self.cycle_hours

            miles_to_fuel   = self.FUEL_MILES - self.miles_since_fuel
            hours_to_fuel   = miles_to_fuel / self.SPEED_MPH
            remaining_hours = remaining / self.SPEED_MPH

            # Cap by each limit
            max_hrs = min(
                headroom_break,
                headroom_drive,
                headroom_duty,
                headroom_cycle,
                hours_to_fuel,
                remaining_hours,
            )

            if max_hrs <= 0.001:
                # resolve whichever constraint is blocking
                if self.driving_since_break >= self.BREAK_AFTER:
                    self._break()
                elif (self.on_duty_in_window >= self.MAX_WINDOW or
                      self.driving_in_window >= self.MAX_DRIVING):
                    self._rest()
                elif self.cycle_hours >= self.MAX_CYCLE:
                    self._restart()
                else:
                    self._fuel()   # fuel is the only remaining constraint
                continue

            miles = min(max_hrs * self.SPEED_MPH, remaining)
            hours = miles / self.SPEED_MPH

            self._add('driving', hours, f'Driving ({miles:.1f} mi)')
            self.driving_since_break += hours
            self.driving_in_window   += hours
            self.on_duty_in_window   += hours
            self.cycle_hours         += hours
            self.total_miles         += miles
            self.miles_since_fuel    += miles
            remaining                -= miles

            # Fuel stop needed and more driving ahead?
            if self.miles_since_fuel >= self.FUEL_MILES and remaining > 0.01:
                self._fuel()

    # ── public API ─────────────────────────────────────────────────

    def plan_trip(self,
                  miles_to_pickup: float,
                  miles_to_dropoff: float,
                  pickup_name: str = 'Pickup Location',
                  dropoff_name: str = 'Dropoff Location') -> List[LogEntry]:
        self.drive(miles_to_pickup)
        self._on_duty_stop(self.STOP_DUR, 'Pickup (loading)', pickup_name)
        self.drive(miles_to_dropoff)
        self._on_duty_stop(self.STOP_DUR, 'Dropoff (unloading)', dropoff_name)
        return self.log_entries

    def get_eld_logs(self, trip_start: date = None) -> list:
        """Return a list of per-day dicts ready for the frontend ELD renderer."""
        if trip_start is None:
            trip_start = date.today()
        if not self.log_entries:
            return []

        max_time = max(e.end_time for e in self.log_entries)
        num_days = math.ceil(max_time / 24) + 1

        daily = []
        for day in range(num_days):
            day_start = day * 24.0
            day_end   = (day + 1) * 24.0

            # only emit days that have actual entries
            if not any(e.start_time < day_end and e.end_time > day_start
                       for e in self.log_entries):
                continue

            activities = []
            cursor = day_start   # tracks the last "closed" time within the day

            for entry in self.log_entries:
                if entry.end_time <= day_start or entry.start_time >= day_end:
                    continue

                clipped_start = max(entry.start_time, day_start)
                clipped_end   = min(entry.end_time,   day_end)

                # fill gap with off-duty
                if clipped_start > cursor + 0.001:
                    activities.append({
                        'status': 'off_duty',
                        'start_hour': round(cursor - day_start, 4),
                        'end_hour':   round(clipped_start - day_start, 4),
                        'description': 'Off Duty',
                        'location': None,
                    })

                activities.append({
                    'status':      entry.status,
                    'start_hour':  round(clipped_start - day_start, 4),
                    'end_hour':    round(clipped_end   - day_start, 4),
                    'description': entry.description,
                    'location':    entry.location,
                })
                cursor = clipped_end

            # trailing off-duty to midnight
            if cursor < day_end - 0.001:
                activities.append({
                    'status': 'off_duty',
                    'start_hour': round(cursor - day_start, 4),
                    'end_hour': 24.0,
                    'description': 'Off Duty',
                    'location': None,
                })

            totals = {'driving': 0.0, 'on_duty': 0.0, 'off_duty': 0.0, 'sleeper': 0.0}
            for act in activities:
                dur = act['end_hour'] - act['start_hour']
                if act['status'] in totals:
                    totals[act['status']] += dur

            daily.append({
                'date':       (trip_start + timedelta(days=day)).isoformat(),
                'day_number': day + 1,
                'activities': activities,
                'totals':     {k: round(v, 2) for k, v in totals.items()},
            })

        return daily
