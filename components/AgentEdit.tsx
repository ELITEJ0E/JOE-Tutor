/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef } from 'react';
import {
  Agent,
  INTERLOCUTOR_VOICE,
  INTERLOCUTOR_VOICES,
} from '../lib/presets/agents';
import Modal from './Modal';
import { useAgent, useUI } from '../lib/state';

/**
 * Clean modal component for customizing the active companion's name, voice, and personality.
 */
export default function EditAgent() {
  const agent = useAgent(state => state.current);
  const updateAgent = useAgent(state => state.update);
  const nameInput = useRef<HTMLInputElement>(null);
  const { setShowAgentEdit } = useUI();

  function onClose() {
    setShowAgentEdit(false);
  }

  function updateCurrentAgent(adjustments: Partial<Agent>) {
    updateAgent(agent.id, adjustments);
  }

  return (
    <Modal onClose={onClose} className="agent-edit-modal">
      <form
        className="edit-agent-form"
        onSubmit={e => {
          e.preventDefault();
          onClose();
        }}
      >
        <div className="agent-edit-header">
          <div className="config-field name-field">
            <label>Name</label>
            <input
              type="text"
              placeholder="Name"
              value={agent.name}
              onChange={e => updateCurrentAgent({ name: e.target.value })}
              ref={nameInput}
              className="header-input"
            />
          </div>
          <div className="config-field voice-field">
            <label>Voice</label>
            <select
              value={agent.voice}
              onChange={e => {
                updateCurrentAgent({
                  voice: e.target.value as INTERLOCUTOR_VOICE,
                });
              }}
              className="header-input"
            >
              {INTERLOCUTOR_VOICES.map(voice => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="button primary done-button">
            Done
          </button>
        </div>

        <div className="agent-personality">
          <label>Personality</label>
          <textarea
            value={agent.personality}
            onChange={e => updateCurrentAgent({ personality: e.target.value })}
            placeholder="How should this learning companion teach and assist?"
          />
        </div>
      </form>
    </Modal>
  );
}