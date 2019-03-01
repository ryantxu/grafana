import { ReactPanelPlugin } from '@grafana/ui';

import { ScatterPanelEditor } from './ScatterPanelEditor';
import { ScatterPanel } from './ScatterPanel';
import { ScatterOptions, defaults } from './types';

export const reactPanel = new ReactPanelPlugin<ScatterOptions>(ScatterPanel);

reactPanel.setEditor(ScatterPanelEditor);
reactPanel.setDefaults(defaults);
