import React from 'react';
import { createDevTools } from 'redux-devtools';
import LogMonitor from 'redux-devtools-log-monitor';
import DockMonitor from 'redux-devtools-dock-monitor';

// NOTE: Turn on only when "<url>?log=xxx" for performance
const DevTools = createDevTools(
  <DockMonitor
    toggleVisibilityKey="shift-ctrl-h"
    changePositionKey="shift-ctrl-p"
    defaultIsVisible={false}
  >
    { (new URL(window.location.href)).searchParams.get('log') ? <LogMonitor /> : null }
  </DockMonitor>
);
export default DevTools;
