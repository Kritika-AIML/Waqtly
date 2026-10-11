import React from 'react';
import { LocationData, ActualWaitRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { ActualVsPredictedChart } from '../charts/ActualVsPredictedChart';
import { PlusCircle, RotateCcw, Sparkles, Check, Database, Trash2 } from 'lucide-react';

interface ActualWaitTrackerProps {
  location: LocationData;
}

export const ActualWaitTracker: React.FC<ActualWaitTrackerProps> = ({ location }) => {
  const { loadSampleActualRecords, clearActualRecords } = useApp();

  const records = location.actualRecords || [];

  // Calculate Mean Absolute Difference (MAE)
  const count = records.length;
  let mae: number | null = null;
  if (count >= 3) {
    const sumDiff = records.reduce(
      (acc, r) => acc + Math.abs(r.predictedWaitMin - r.actualWaitMin),
      0
    );
    mae = Number((sumDiff / count).toFixed(1));
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Predicted vs Actual Wait Times
          </h3>
          <p className="text-xs text-slate-500">
            Compare forecast estimates against recorded physical wait times
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length === 0 ? (
            <button
              type="button"
              onClick={() => loadSampleActualRecords(location.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load illustrative sample entries
            </button>
          ) : (
            <button
              type="button"
              onClick={() => clearActualRecords(location.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
              title="Clear entries"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear entries
            </button>
          )}
        </div>
      </div>

      {/* MAE Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium">Model Calibration Metric:</span>
        {mae !== null ? (
          <span className="font-semibold text-slate-900">
            Mean absolute difference over {count} recorded entries (demo data):{' '}
            <strong className="text-blue-700 font-mono text-sm">{mae} min</strong>
          </span>
        ) : (
          <span className="text-slate-500 italic">Not enough recorded entries yet (minimum 3 required)</span>
        )}
      </div>

      {records.length > 0 ? (
        <div className="space-y-4">
          {/* Comparison Chart */}
          <ActualVsPredictedChart records={records} />

          {/* Table container with horizontal scroll for responsiveness */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Hour Slot</th>
                  <th className="py-2.5 px-3">Predicted</th>
                  <th className="py-2.5 px-3">Actual Wait</th>
                  <th className="py-2.5 px-3">Difference</th>
                  <th className="py-2.5 px-3">Record Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((r) => {
                  const diff = r.actualWaitMin - r.predictedWaitMin;
                  const absDiff = Math.abs(diff);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                        {r.hour.toString().padStart(2, '0')}:00 –{' '}
                        {(r.hour + 1).toString().padStart(2, '0')}:00
                      </td>
                      <td className="py-2 px-3 font-mono">~{r.predictedWaitMin} min</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {r.actualWaitMin} min
                      </td>
                      <td className="py-2 px-3 font-mono">
                        <span
                          className={`inline-block font-semibold ${
                            diff > 0
                              ? 'text-amber-700'
                              : diff < 0
                              ? 'text-teal-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff} min
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {r.isSample ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                            sample
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium text-[10px]">
                            staff recorded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <Database className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-600 font-medium">
            No actual wait records have been logged yet for this location.
          </p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            You can load sample verification entries or log real observations using Staff Demo Mode in the Admin tab.
          </p>
          <button
            type="button"
            onClick={() => loadSampleActualRecords(location.id)}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load illustrative sample entries
          </button>
        </div>
      )}
    </div>
  );
};
