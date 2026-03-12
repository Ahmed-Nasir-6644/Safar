import React, { useState } from 'react';
import { Clock, AlertCircle, Zap, MapPin, Bus } from 'lucide-react';

/**
 * TimelineDisplay Component
 * Displays real-time journey timeline with stop-by-stop information
 */
const TimelineDisplay = ({ route, className = '' }) => {
  const [expandedStops, setExpandedStops] = useState({});

  if (!route?.timeline) {
    return null;
  }

  const { timeline, realTimeStart12Hour } = route;
  const { summary, stops } = timeline;

  if (!summary || !stops) {
    return null;
  }

  const headerDurationLabel = route?.duration || summary.totalDurationFormatted;
  const statsDurationMinutes = Number.isFinite(route?.durationMinutes)
    ? route.durationMinutes
    : summary.totalDurationMinutes;

  const toggleStop = (stopId) => {
    setExpandedStops(prev => ({
      ...prev,
      [stopId]: !prev[stopId]
    }));
  };

  return (
    <div className={`w-full bg-gradient-to-b from-blue-50 to-white rounded-xl border border-blue-100 overflow-hidden ${className}`}>
      {/* Timeline Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Clock size={18} />
          <h3 className="font-bold text-sm uppercase tracking-wide">Real-Time Journey</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-xs opacity-80 font-medium">Start Time</p>
            <p className="font-bold text-sm">{realTimeStart12Hour}</p>
          </div>
          <div>
            <p className="text-xs opacity-80 font-medium">End Time</p>
            <p className="font-bold text-sm">{summary.endTime12Hour}</p>
          </div>
          <div>
            <p className="text-xs opacity-80 font-medium">Duration</p>
            <p className="font-bold text-sm">{headerDurationLabel}</p>
          </div>
          <div>
            <p className="text-xs opacity-80 font-medium">Waiting</p>
            <p className="font-bold text-sm">{summary.totalWaitingTimeMinutes} min</p>
          </div>
        </div>
      </div>

      {/* Timeline Stats */}
      <div className="px-5 py-4 border-b border-blue-100 grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-blue-100 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{summary.journeyStops}</p>
          <p className="text-xs text-blue-700 font-medium">Stops</p>
        </div>
        <div className="text-center p-2 bg-orange-100 rounded-lg">
          <p className="text-2xl font-bold text-orange-600">{summary.transfers}</p>
          <p className="text-xs text-orange-700 font-medium">Transfers</p>
        </div>
        <div className="text-center p-2 bg-green-100 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{statsDurationMinutes}</p>
          <p className="text-xs text-green-700 font-medium">Minutes</p>
        </div>
      </div>

      {/* Timeline Stops */}
      <div className="px-5 py-4 space-y-2">
        {stops.map((stop, index) => {
          const isExpanded = expandedStops[stop.stopId];
          const isFirstStop = stop.isFirstStop;
          const isLastStop = stop.isLastStop;
          const hasWaiting = stop.waiting?.hasWaiting;

          return (
            <div key={`${stop.stopId}-${index}`}>
              {/* Stop Timeline Entry */}
              <div
                onClick={() => toggleStop(stop.stopId)}
                className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer ${
                  isExpanded
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Timeline Dot */}
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={`w-3 h-3 rounded-full border-2 border-white z-10 ${
                        isFirstStop
                          ? 'bg-green-500 ring-2 ring-green-200'
                          : isLastStop
                            ? 'bg-red-500 ring-2 ring-red-200'
                            : 'bg-blue-500 ring-2 ring-blue-200'
                      }`}
                    />
                    {/* Connector line */}
                    {index < stops.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 ${hasWaiting ? 'bg-orange-400' : 'bg-blue-200'}`} />
                    )}
                  </div>

                  {/* Stop Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">
                          {stop.sequence}. {stop.stopName}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Bus size={12} />
                          {stop.bus}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs font-bold text-blue-600">{stop.arrivalTime}</p>
                      </div>
                    </div>

                    {/* Compact time display */}
                    {!isExpanded && (
                      <div className="text-xs text-gray-500">
                        Arrive {stop.arrivalTime} • Leave {stop.departureTime}
                      </div>
                    )}
                  </div>
                </div>

                {/* Transfer indicator */}
                {hasWaiting && (
                  <div className="mt-2 ml-6 flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit">
                    <Zap size={12} />
                    Wait {stop.waiting.timeMinutes} min
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="ml-6 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">📥 Arrival Time</p>
                      <p className="font-bold text-blue-600">{stop.arrivalTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">📤 Departure Time</p>
                      <p className="font-bold text-blue-600">{stop.departureTime}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">⏱️ Dwell Time</p>
                      <p className="font-semibold text-gray-700">{stop.dwellTimeMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">🚌 Bus Line</p>
                      <p className="font-semibold text-gray-700">{stop.bus}</p>
                    </div>
                  </div>

                  {/* Coordinates */}
                  {stop.stopLat && stop.stopLon && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                        <MapPin size={12} /> Location
                      </p>
                      <p className="text-xs text-gray-600 font-mono">
                        {stop.stopLat.toFixed(4)}, {stop.stopLon.toFixed(4)}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {stop.actions && stop.actions.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">✅ Actions</p>
                      <div className="flex flex-wrap gap-1">
                        {stop.actions.map((action, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded"
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transfer waiting info */}
                  {hasWaiting && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-700 text-xs flex items-start gap-2">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Transfer Point</p>
                        <p>Wait {stop.waiting.timeMinutes} minutes for the next {route.routeSegments?.[Math.min(stop.sequence, route.routeSegments.length - 1)]?.routeName || 'bus'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Journey Summary Footer */}
      <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-gray-50 border-t border-blue-100 text-xs text-gray-600">
        <p className="font-medium">
          ✨ Your journey from <span className="font-bold text-gray-900">{stops[0]?.stopName}</span> to{' '}
          <span className="font-bold text-gray-900">{stops[stops.length - 1]?.stopName}</span> takes{' '}
          <span className="font-bold text-blue-600">{summary.totalDurationFormatted}</span> including{' '}
          <span className="font-bold text-orange-600">{summary.totalWaitingTimeMinutes} min</span> of waiting time.
        </p>
      </div>
    </div>
  );
};

export default TimelineDisplay;
