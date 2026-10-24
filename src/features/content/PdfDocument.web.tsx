import { surfaces } from '../../lib/theme/theme';
import React, { useEffect, useRef } from 'react';
import type { PdfDocumentProps } from './PdfDocument';
import { isAllowedContentUrl } from './contentPolicy';

export function PdfDocument({ url, onReady, onError }: PdfDocumentProps) {
  const callbacks = useRef({ onReady, onError });
  callbacks.current = { onReady, onError };
  const allowed = isAllowedContentUrl(url);
  useEffect(() => {
    if (!allowed) callbacks.current.onError('This document link is not supported.');
  }, [allowed, url]);
  if (!allowed) return null;
  return (
    // Browser PDF viewers apply their own document sandbox. An iframe sandbox
    // disables Chrome's PDF renderer; native app links use the controlled reader.
    <iframe
      title="Document preview"
      src={url}
      referrerPolicy="no-referrer"
      onLoad={() => callbacks.current.onReady()}
      onError={() => callbacks.current.onError('This browser could not display the document. Please try again in the mobile app.')}
      style={{ width: '100%', height: '100%', flex: 1, border: 0, background: surfaces.document }}
    />
  );
}
