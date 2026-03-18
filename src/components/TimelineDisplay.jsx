import React, { useState } from 'react';
import { Clock, AlertCircle, Zap, MapPin, Bus, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * TimelineDisplay Component
 * Displays real-time journey timeline with stop-by-stop information
 */
const TimelineDisplay = ({ route, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!route?.timeline) {
    return null;
  }

  const { timeline, realTimeStart12Hour } = route;
  const { summary, stops } = timeline;

  if (!summary || !stops) {
    return null;
  }

  const headerDurationLabel = route?.duration || summary.totalDurationFormatted;

  return (
    <div className={`w-full ${className}`}>
      {/* Journey Summary Toggle Button */}
      <div 
        className="px-5 py-3 bg-linear-to-r from-blue-50 to-gray-50 border border-blue-100 rounded-lg cursor-pointer hover:bg-linear-to-r hover:from-blue-100 hover:to-gray-100 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-xs text-gray-600 flex-1 min-w-0 [word-break:break-word]">
            ✨ Your journey from <span className="font-bold text-gray-900">{stops[0]?.stopName}</span> to{' '}
            <span className="font-bold text-gray-900">{stops[stops.length - 1]?.stopName}</span> takes{' '}
            <span className="font-bold text-blue-600">{summary.totalDurationFormatted}</span> including{' '}
            <span className="font-bold text-orange-600">{summary.totalWaitingTimeMinutes} min</span> of waiting time.
          </p>
          <div className="shrink-0">
            {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </div>
        </div>
      </div>

      {/* Real Time Journey Banner - Only show when expanded */}
      {isExpanded && (
        <div className="mt-2 bg-linear-to-b from-blue-50 to-white rounded-xl border border-blue-100 overflow-hidden">
          {/* Timeline Header */}
          <div className="bg-linear-to-r from-blue-600 to-blue-500 px-5 py-4 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Clock size={18} />
              <h3 className="font-bold text-sm uppercase tracking-wide">Real-Time Journey</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs opacity-80 font-medium">Start Time</p>
                <p className="font-bold text-sm">{realTimeStart12Hour}</p>
              </div>
              <div>
                <p className="text-xs opacity-80 font-medium">End Time</p>
                <p className="font-bold text-sm">{summary.endTime12Hour}</p>
              </div>
              <div>
                <p className="text-xs opacity-80 font-medium">Waiting</p>
                <p className="font-bold text-sm">{summary.totalWaitingTimeMinutes} min</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineDisplay;
