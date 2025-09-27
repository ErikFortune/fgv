/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React from 'react';
import { useObservability } from '../contexts';

/**
 * Demo component to test dual-channel logging implementation.
 * Shows both diagnostic logging (console) and user-facing logging (toasts).
 */
export const LoggingDemo: React.FC = () => {
  const observability = useObservability();

  const testDiagnosticLogging = () => {
    observability.diag.detail('This is a detail message (only visible in console)');
    observability.diag.info('This is an info message for developers');
    observability.diag.warn('This is a warning for developers');
    observability.diag.error('This is an error for developers');
  };

  const testUserLogging = () => {
    observability.user.success('Operation completed successfully!');
    observability.user.info('Here is some information for you');
    observability.user.warn('Please be careful with this action');
    observability.user.error('Something went wrong, please try again');
  };

  const testCombinedLogging = () => {
    // Log diagnostic info
    observability.diag.info('User clicked combined test button', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });

    // Show user feedback
    observability.user.info('Combined logging test executed - check console for diagnostic details');

    // Simulate an operation with both diagnostic and user feedback
    setTimeout(() => {
      observability.diag.detail('Simulated operation completed');
      observability.user.success('Test operation finished successfully!');
    }, 1000);
  };

  const testErrorScenario = () => {
    try {
      // Simulate an error
      throw new Error('This is a simulated error for testing');
    } catch (error) {
      // Log detailed error info for developers
      observability.diag.error('Simulated error occurred', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });

      // Show user-friendly error message
      observability.user.error('An error occurred during the test. Please try again.');
    }
  };

  return (
    <div
      style={{
        padding: '2rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        margin: '1rem 0',
        backgroundColor: '#f8f9fa'
      }}
    >
      <h3>Logging Implementation Test</h3>
      <p>This component demonstrates the dual-channel logging system:</p>
      <ul>
        <li>
          <strong>Diagnostic Channel</strong>: Logs to console for developer debugging
        </li>
        <li>
          <strong>User Channel</strong>: Shows toast notifications for user feedback
        </li>
      </ul>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button
          onClick={testDiagnosticLogging}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Diagnostic Logging
        </button>

        <button
          onClick={testUserLogging}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test User Notifications
        </button>

        <button
          onClick={testCombinedLogging}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Combined Logging
        </button>

        <button
          onClick={testErrorScenario}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Error Handling
        </button>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#6c757d' }}>
        <p>
          <strong>Instructions:</strong>
        </p>
        <ol>
          <li>Open browser developer tools (F12) to see diagnostic logs</li>
          <li>Click the buttons above to test different logging scenarios</li>
          <li>User notifications will appear as toasts in the top-right corner</li>
          <li>Diagnostic information will appear in the browser console</li>
        </ol>
      </div>
    </div>
  );
};
