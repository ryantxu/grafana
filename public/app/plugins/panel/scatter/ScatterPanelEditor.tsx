import React, { PureComponent } from 'react';
import { PanelEditorProps, PanelOptionsGrid } from '@grafana/ui';

import { ScatterOptionsBox } from './ScatterOptionsBox';
import { ScatterOptions } from './types';

export class ScatterPanelEditor extends PureComponent<PanelEditorProps<ScatterOptions>> {
  render() {
    const { onChange, options } = this.props;

    return (
      <>
        <PanelOptionsGrid>
          <ScatterOptionsBox onChange={onChange} options={options} />
        </PanelOptionsGrid>
      </>
    );
  }
}
