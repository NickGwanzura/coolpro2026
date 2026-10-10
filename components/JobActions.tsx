'use client';

import { useState } from 'react';
import { ClipboardCheck, Play, ShieldAlert } from 'lucide-react';
import { updatePlannerJob } from '@/lib/api';
import { outstandingChecklist } from '@/lib/planner-lifecycle';
import type { PlannerJob } from '@/types/index';

type Panel = 'none' | 'checklist' | 'complete' | 'follow-up';

const button = 'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

/** Start / checklist / complete / follow-up controls for one planner job card. */
export default function JobActions({ job }: { job: PlannerJob }) {
    const [panel, setPanel] = useState<Panel>('none');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [amount, setAmount] = useState(job.amount != null ? String(job.amount) : '');

    const outstanding = outstandingChecklist(job.checklistItems, job.refrigerantClass);
    const blocked = outstanding.length > 0;

    const run = async (action: () => Promise<unknown>, after?: () => void) => {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            await action();
            after?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'That action failed. Try again.');
        } finally {
            setBusy(false);
        }
    };

    const toggleItem = (itemId: string, completed: boolean) =>
        run(() => updatePlannerJob(job.id, {
            checklistItems: job.checklistItems.map(item => (item.id === itemId ? { ...item, completed } : item)),
        }));

    const submitStatus = (status: 'completed' | 'follow-up') => {
        const parsed = amount.trim() === '' ? undefined : Number(amount);
        return run(
            () => updatePlannerJob(job.id, { status, note, ...(status === 'completed' && parsed !== undefined ? { amount: parsed } : {}) }),
            () => { setPanel('none'); setNote(''); },
        );
    };

    const isDone = job.status === 'completed';

    return (
        <div className="mt-3 space-y-2">
            {!isDone && <div className="flex gap-2">
                {job.status === 'scheduled' && (
                    <button type="button" disabled={busy || blocked} onClick={() => run(() => updatePlannerJob(job.id, { status: 'in-progress' }))}
                        title={blocked ? `Checklist incomplete: ${outstanding.join(', ')}` : undefined}
                        className={`${button} border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100`}>
                        <Play className="h-3.5 w-3.5" /> Start job
                    </button>
                )}
                <button type="button" onClick={() => setPanel(panel === 'complete' ? 'none' : 'complete')}
                    className={`${button} border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100`}>
                    <ClipboardCheck className="h-3.5 w-3.5" /> Complete
                </button>
            </div>}
            <div className="flex gap-2">
                {!isDone && <button type="button" onClick={() => setPanel(panel === 'checklist' ? 'none' : 'checklist')}
                    className={`${button} border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}>
                    Checklist {blocked ? `(${outstanding.length} open)` : '✓'}
                </button>}
                <button type="button" onClick={() => setPanel(panel === 'follow-up' ? 'none' : 'follow-up')}
                    className={`${button} border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}>
                    Needs follow-up
                </button>
            </div>

            {blocked && job.status === 'scheduled' && !isDone && (
                <p className="text-xs text-amber-700">Tick every required checklist item before starting.</p>
            )}

            {panel === 'checklist' && (
                <div className="space-y-1.5 border border-gray-200 bg-gray-50 p-3">
                    {job.checklistItems.length === 0 && <p className="text-xs text-gray-500">No checklist recorded for this job.</p>}
                    {job.checklistItems.map(item => (
                        <label key={item.id} className="flex items-start gap-2 text-xs text-gray-700">
                            <input type="checkbox" checked={item.completed} disabled={busy} onChange={event => toggleItem(item.id, event.target.checked)} className="mt-0.5" />
                            <span>
                                {item.label}
                                {item.completed && item.completedBy && (
                                    <span className="block text-[11px] text-gray-400">{item.completedBy}, {item.completedAt?.slice(0, 16).replace('T', ' ')}</span>
                                )}
                            </span>
                        </label>
                    ))}
                </div>
            )}

            {(panel === 'complete' || panel === 'follow-up') && (
                <div className="space-y-2 border border-gray-200 bg-gray-50 p-3">
                    <label className="block text-xs font-semibold text-gray-600">
                        {panel === 'complete' ? 'What was done? (required)' : 'What follow-up is needed? (required)'}
                        <textarea value={note} onChange={event => setNote(event.target.value)} rows={3}
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-300" />
                    </label>
                    {panel === 'complete' && !isDone && job.refrigerantType && (
                        <label className="block text-xs font-semibold text-gray-600">
                            Refrigerant used ({job.refrigerantType}), kg
                            <input type="number" min="0" step="0.001" value={amount} onChange={event => setAmount(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-blue-300" />
                        </label>
                    )}
                    <button type="button" disabled={busy || !note.trim()} onClick={() => submitStatus(panel === 'complete' ? 'completed' : 'follow-up')}
                        className="w-full rounded-lg bg-[#D97706] px-3 py-2 text-xs font-semibold text-white hover:bg-[#b45309] disabled:opacity-60">
                        {busy ? 'Saving…' : panel === 'complete' ? 'Mark job complete' : 'Save follow-up'}
                    </button>
                </div>
            )}

            {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
        </div>
    );
}
