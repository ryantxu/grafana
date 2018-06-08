import React from 'react';
import { PanelModel } from '../panel_model';
import { PanelContainer } from './PanelContainer';
import { PanelObserver } from './PanelObserver';
import { AttachedPanel } from './PanelLoader';
import { DashboardRow } from './DashboardRow';
import { AddPanelPanel } from './AddPanelPanel';

export interface DashboardPanelProps {
  panel: PanelModel;
  index: number;
  observer: PanelObserver;
  getPanelContainer: () => PanelContainer;
}

export interface DashboardPanelState {
  lazyLoad: boolean;
  visible: boolean;
}

export class DashboardPanel extends React.Component<DashboardPanelProps, DashboardPanelState> {
  wrapper: any; // for visiblity observer
  element: any;
  attachedPanel: AttachedPanel;

  constructor(props) {
    super(props);
    this.state = {
      lazyLoad: props.index > 5,
      visible: false,
    };

    // Listen for visibility changes
    this.props.panel.events.on('panel-visibility-changed', this.panelVisibilityChanged.bind(this));
  }

  observe(element) {
    if (element) {
      this.wrapper = element; // Need to hang on to it for unobserve
      this.props.observer.observe(element, this.props.panel);
    }
  }

  panelVisibilityChanged(vis) {
    this.setState({ visible: vis });
    if (vis && !this.attachedPanel) {
      this.setState({ lazyLoad: false });
    }
  }

  componentDidMount() {
    if (!this.element) {
      return;
    }
    if (this.attachedPanel) {
      return; // already attached
    }

    if (!this.state.lazyLoad) {
      const panel = this.props.panel;
      const panelContainer = this.props.getPanelContainer();
      const dashboard = panelContainer.getDashboard();
      const loader = panelContainer.getPanelLoader();
      this.attachedPanel = loader.load(this.element, panel, dashboard);
    }
  }

  componentWillUnmount() {
    if (this.attachedPanel) {
      this.attachedPanel.destroy();
    }
    this.props.observer.unobserve(this.wrapper);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // If the lazy load state changed
    if (!this.attachedPanel && !this.state.lazyLoad) {
      this.componentDidMount();
    }
  }

  counter = 0;

  render() {
    // special handling for rows
    if (this.props.panel.type === 'row') {
      return <DashboardRow panel={this.props.panel} getPanelContainer={this.props.getPanelContainer} />;
    }

    if (this.props.panel.type === 'add-panel') {
      return <AddPanelPanel panel={this.props.panel} getPanelContainer={this.props.getPanelContainer} />;
    }

    const xxx = {
      zIndex: 1000,
      border: '1px solid red',
      height: '10px',
    };

    const descr = this.state.visible + ' // ' + this.counter++ + ' // ' + this.props.panel.visible;

    return (
      <div ref={element => this.observe(element)}>
        <div style={xxx}>VIS: {descr} </div>
        {this.state.lazyLoad === true && (
          <div>
            <i className="fa fa-spinner fa-spin" /> {this.props.panel.title}...
          </div>
        )}
        <div ref={element => (this.element = element)} className="panel-height-helper" />
      </div>
    );
  }
}
