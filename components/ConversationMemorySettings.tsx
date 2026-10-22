import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileJson, FileText, Trash2, Upload } from 'lucide-react';
import { useAgent } from '../lib/state';
import {
  loadConversation, saveConversation, deleteConversation, sanitizeMemoryTurns,
  type MemoryTurn,
} from '../lib/conversation-memory';

type MemoryChangeDetail = { agentId: string; turns: MemoryTurn[] };
const announceChange = (detail: MemoryChangeDetail) =>
  window.dispatchEvent(new CustomEvent<MemoryChangeDetail>('joe:conversation-memory-changed', { detail }));

/** Conversation backups live in settings rather than covering the transcript toolbar. */
export default function ConversationMemorySettings() {
  const agent = useAgent(state => state.current);
  const [turns, setTurns] = useState<MemoryTurn[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const saved = await loadConversation(agent.id);
      setTurns(saved?.turns || []);
      setStatus('');
    } catch (error) {
      setStatus('Browser storage is unavailable. Export backups on a supported browser.');
      console.warn('Conversation memory could not be loaded:', error);
    } finally {
      setLoading(false);
    }
  }, [agent.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  const download = (format: 'json' | 'txt') => {
    const stamp = new Date().toISOString();
    const safeTurns = sanitizeMemoryTurns(turns);
    const content = format === 'json'
      ? JSON.stringify({ version: 1, agentId: agent.id, agentName: agent.name, exportedAt: stamp, turns: safeTurns }, null, 2)
      : safeTurns.map(t => t.speaker + ': ' + t.text).join('\n\n');
    const url = URL.createObjectURL(new Blob([content], { type: format === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'joe-tutor-' + agent.id.replace(/[^a-z0-9_-]/gi, '-') + '-' + stamp.slice(0, 10) + '.' + format;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    setStatus('Exported ' + safeTurns.length + ' messages as ' + format.toUpperCase() + '.');
  };

  const importBackup = async (file: File) => {
    try {
      if (file.size > 5_000_000) throw new Error('Maximum JSON backup size is 5 MB.');
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid backup.');
      const data = parsed as Record<string, unknown>;
      const matchesCurrent = data.agentId === agent.id;
      const legacyTianXiWeiBackup = agent.id === 'tian_xi_wei' && data.agentId === 'mei';
      if ((!matchesCurrent && !legacyTianXiWeiBackup) || !Array.isArray(data.turns)) {
        throw new Error('Select a backup for ' + agent.name + '.');
      }
      const entries = sanitizeMemoryTurns(data.turns);
      if (!entries.length) throw new Error('This backup has no valid messages.');
      await saveConversation(agent.id, entries);
      setTurns(entries);
      announceChange({ agentId: agent.id, turns: entries });
      setStatus('Imported ' + entries.length + ' messages. Restart the voice session to recall them.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not import backup.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Delete this browser\'s saved conversation with ' + agent.name + '?')) return;
    try {
      await deleteConversation(agent.id);
      setTurns([]);
      announceChange({ agentId: agent.id, turns: [] });
      setStatus('Saved conversation deleted from this browser.');
    } catch {
      setStatus('Could not delete history; check browser storage permissions.');
    }
  };

  return (
    <section className="joe-sheet-memory" aria-labelledby="joe-memory-heading">
      <div className="joe-sheet-section-heading">
        <div>
          <h3 id="joe-memory-heading">Conversation memory</h3>
          <p>Private browser storage (IndexedDB) for <strong>{agent.name.split(' (')[0]}</strong>. Saved separately for each companion.</p>
        </div>
        <span className="joe-memory-counter">{loading ? 'Loading…' : turns.length + ' messages'}</span>
      </div>
      <div className="joe-sheet-memory-grid">
        <button type="button" onClick={() => download('json')} disabled={loading || !turns.length}><FileJson size={17} /> Export JSON</button>
        <button type="button" onClick={() => download('txt')} disabled={loading || !turns.length}><FileText size={17} /> Export TXT</button>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading}><Upload size={17} /> Import JSON</button>
        <button type="button" className="danger" onClick={() => void clearHistory()} disabled={loading || !turns.length}><Trash2 size={17} /> Clear memory</button>
      </div>
      <input ref={inputRef} type="file" accept=".json,application/json" hidden onChange={event => {
        const file = event.target.files?.[0];
        if (file) void importBackup(file);
      }} />
      <p className="joe-sheet-memory-hint">Only text is saved, not audio. Recent messages are included when you start a new voice session. Export JSON before clearing browser data or changing devices.</p>
      {status && <p className="joe-sheet-memory-status" role="status">{status}</p>}
    </section>
  );
}
