/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { useUI } from '../../lib/state';
import React, { useEffect, useState } from 'react';

export interface ExtendedErrorType {
  code?: number;
  message?: string;
  status?: string;
}

/**
 * A full-screen overlay component that displays error messages.
 * It listens for 'error' events from the Live API client and presents
 * them in a user-friendly format.
 */
export default function ErrorScreen() {
  const { client, connect } = useLiveAPIContext();
  const { setUseSearch } = useUI();
  const [error, setError] = useState<{ message?: string } | null>(null);

  // Effect to subscribe and unsubscribe from the client's error events.
  useEffect(() => {
    function onError(error: ErrorEvent) {
      console.error('Live API Error in ErrorScreen:', error);
      setError(error);
    }

    client.on('error', onError);

    return () => {
      client.off('error', onError);
    };
  }, [client]);

  // A specific, helpful message for the common resource exhausted error.
  const quotaErrorMessage =
    'Gemini Live API in AI Studio has a limited free quota each day. Come back tomorrow to continue.';

  // Default error message.
  let errorMessage = 'Something went wrong. Please try again.';
  let rawMessage: string | null = error?.message || null;
  let tryAgainOption = true;

  const msg = error?.message || '';

  // Check if the error is a quota error and customize the message.
  if (msg.includes('RESOURCE_EXHAUSTED')) {
    errorMessage = quotaErrorMessage;
    rawMessage = null; // Hide the raw technical message for this specific error.
    tryAgainOption = false; // Don't show a "try again" option for quota errors.
  } else if (msg.includes('RpcSecurityPolicy') || msg.includes('GroundedGenerationService') || msg.includes('GaiaMint')) {
    errorMessage = 'The Live session search grounding token expired. Google search has been turned off to keep your live voice session fast and uninterrupted.';
    rawMessage = null;
    // Auto turn off search so next session succeeds
    setUseSearch(false);
  } else if (msg.includes('Internal error occurred')) {
    errorMessage = 'The Gemini Live API encountered a temporary issue. This usually resolves quickly—please try again in a few moments.';
    rawMessage = null;
  }

  // If there's no error, render nothing.
  if (!error) {
    return <div style={{ display: 'none' }} />;
  }

  return (
    <div className="error-screen">
      <div
        style={{
          fontSize: 48,
        }}
      >
        💔
      </div>
      <div
        className="error-message-container"
        style={{
          fontSize: 20,
          lineHeight: 1.3,
          maxWidth: 600,
          textAlign: 'center',
          opacity: 0.85,
        }}
      >
        {errorMessage}
      </div>
      {tryAgainOption ? (
        <button
          className="close-button"
          onClick={() => {
            setError(null);
          }}
        >
          Dismiss
        </button>
      ) : null}
      {rawMessage ? (
        <div
          className="error-raw-message-container"
          style={{
            fontSize: 13,
            lineHeight: 1.2,
            opacity: 0.4,
            maxWidth: 600,
          }}
        >
          {rawMessage}
        </div>
      ) : null}
    </div>
  );
}