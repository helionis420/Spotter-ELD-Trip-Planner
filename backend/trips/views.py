from datetime import date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .hos_calculator import HOSCalculator
from .routing import geocode, get_route


class PlanTripView(APIView):
    def post(self, request):
        data = request.data

        current_location  = str(data.get('current_location',  '')).strip()
        pickup_location   = str(data.get('pickup_location',   '')).strip()
        dropoff_location  = str(data.get('dropoff_location',  '')).strip()
        raw_cycle         = data.get('current_cycle_used', 0)

        # --- validation ---
        if not current_location:
            return Response({'error': 'Current location is required.'}, status=400)
        if not pickup_location:
            return Response({'error': 'Pickup location is required.'}, status=400)
        if not dropoff_location:
            return Response({'error': 'Dropoff location is required.'}, status=400)

        try:
            cycle_used = float(raw_cycle)
            assert 0 <= cycle_used <= 70
        except (TypeError, ValueError, AssertionError):
            return Response(
                {'error': 'Current cycle used must be a number between 0 and 70.'},
                status=400,
            )

        # --- geocode ---
        current_coords  = geocode(current_location)
        pickup_coords   = geocode(pickup_location)
        dropoff_coords  = geocode(dropoff_location)

        if not current_coords:
            return Response({'error': f'Could not find: "{current_location}". Try a more specific address.'}, status=400)
        if not pickup_coords:
            return Response({'error': f'Could not find: "{pickup_location}". Try a more specific address.'}, status=400)
        if not dropoff_coords:
            return Response({'error': f'Could not find: "{dropoff_location}". Try a more specific address.'}, status=400)

        # --- route ---
        route_to_pickup   = get_route([current_coords, pickup_coords])
        route_to_dropoff  = get_route([pickup_coords,  dropoff_coords])
        full_route        = get_route([current_coords, pickup_coords, dropoff_coords])

        miles_to_pickup  = route_to_pickup['distance_miles']
        miles_to_dropoff = route_to_dropoff['distance_miles']
        total_miles      = miles_to_pickup + miles_to_dropoff

        # --- HOS calculation ---
        calc = HOSCalculator(cycle_used)
        calc.plan_trip(
            miles_to_pickup,
            miles_to_dropoff,
            pickup_name=pickup_location,
            dropoff_name=dropoff_location,
        )

        eld_logs = calc.get_eld_logs(date.today())

        # --- build stop list for frontend ---
        stops = []
        for entry in calc.log_entries:
            stops.append({
                'status':           entry.status,
                'description':      entry.description,
                'location':         entry.location,
                'start_time':       round(entry.start_time, 2),
                'end_time':         round(entry.end_time,   2),
                'duration_hours':   round(entry.end_time - entry.start_time, 2),
                'miles_from_start': round(entry.miles_from_start, 1),
            })

        waypoints = [
            {
                'lat':  current_coords[0],
                'lon':  current_coords[1],
                'name': current_location,
                'type': 'start',
            },
            {
                'lat':  pickup_coords[0],
                'lon':  pickup_coords[1],
                'name': pickup_location,
                'type': 'pickup',
            },
            {
                'lat':  dropoff_coords[0],
                'lon':  dropoff_coords[1],
                'name': dropoff_location,
                'type': 'dropoff',
            },
        ]

        total_trip_hours   = round(calc.current_time, 2)
        total_driving_hrs  = sum(
            e.end_time - e.start_time
            for e in calc.log_entries if e.status == 'driving'
        )
        total_rest_hrs     = sum(
            e.end_time - e.start_time
            for e in calc.log_entries if e.status == 'off_duty'
        )

        return Response({
            'total_distance_miles':  round(total_miles, 1),
            'miles_to_pickup':       round(miles_to_pickup, 1),
            'miles_to_dropoff':      round(miles_to_dropoff, 1),
            'total_trip_hours':      total_trip_hours,
            'total_driving_hours':   round(total_driving_hrs, 2),
            'total_rest_hours':      round(total_rest_hrs, 2),
            'trip_days':             len(eld_logs),
            'waypoints':             waypoints,
            'route_geometry':        full_route.get('geometry'),
            'stops':                 stops,
            'eld_logs':              eld_logs,
        })


class HealthView(APIView):
    def get(self, request):
        return Response({'status': 'ok'})
