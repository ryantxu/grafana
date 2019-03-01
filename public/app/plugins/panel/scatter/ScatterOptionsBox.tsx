// Libraries
import React, { PureComponent } from 'react';

// Components
import { PanelOptionsGroup } from '@grafana/ui';

// Types
import { FormField, PanelEditorProps } from '@grafana/ui';
import { ScatterOptions } from './types';

export class ScatterOptionsBox extends PureComponent<PanelEditorProps<ScatterOptions>> {
  onSymbolSizeChanged = ({ target }) => this.props.onChange({ ...this.props.options, symbolSize: target.value });

  render() {
    const { options } = this.props;
    const { symbolSize } = options;

    return (
      <PanelOptionsGroup title="Scatter">
        <FormField label="Symbol Size" labelWidth={8} onChange={this.onSymbolSizeChanged} value={symbolSize} />
      </PanelOptionsGroup>
    );
  }
}
