import { colors } from '../../lib/theme/theme';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { WebContentHandle, WebContentProps } from './WebContent.types';

// Partner sites decide whether browsers may embed them. Never bypass their frame policy.
export const WebContent = forwardRef<WebContentHandle, WebContentProps>(function WebContent(props, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [revision, setRevision] = useState(0);
  const callbacks = useRef(props);
  callbacks.current = props;
  useImperativeHandle(ref, () => ({ goBack: () => {}, reload: () => setRevision((n) => n + 1) }), []);
  useEffect(() => {
    callbacks.current.onHistoryChange(false);
    callbacks.current.onLoading(true);
  }, [props.url, revision]);
  return <iframe
    key={revision}
    ref={frame}
    src={props.url}
    title={props.title}
    referrerPolicy="no-referrer"
    sandbox="allow-scripts allow-forms allow-same-origin"
    style={{ width: '100%', height: '100%', flex: 1, border: 0, background: colors.white }}
    onLoad={() => { props.onLoading(false); props.onReady(); }}
    onError={() => props.onError('This site could not be displayed here. Please try again in the mobile app.')}
  />;
});
