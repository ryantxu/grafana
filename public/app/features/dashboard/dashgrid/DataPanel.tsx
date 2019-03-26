// Library
import React, { Component } from 'react';

// Services
import { DatasourceSrv, getDatasourceSrv } from 'app/features/plugins/datasource_srv';
// Utils
import kbn from 'app/core/utils/kbn';
// Types
import {
  DataQueryOptions,
  DataQueryResponse,
  DataQueryError,
  LoadingState,
  SeriesData,
  TimeRange,
  ScopedVars,
  toSeriesData,
  guessFieldTypes,
  DataQueryResponseData,
} from '@grafana/ui';
import throttle from 'lodash/throttle';

import { Subscribable, Unsubscribable } from 'rxjs';

interface RenderProps {
  loading: LoadingState;
  data: SeriesData[];
  timeRange?: TimeRange;
}

export interface Props {
  datasource: string | null;
  queries: any[];
  panelId: number;
  dashboardId?: number;
  isVisible?: boolean;
  timeRange?: TimeRange;
  widthPixels: number;
  refreshCounter: number;
  minInterval?: string;
  maxDataPoints?: number;
  scopedVars?: ScopedVars;
  children: (r: RenderProps) => JSX.Element;
  onDataResponse?: (data: DataQueryResponse) => void;
  onError: (message: string, error: DataQueryError) => void;
}

export interface State {
  isFirstLoad: boolean;
  loading: LoadingState;
  response: DataQueryResponse;
  data?: SeriesData[];
}

/**
 * All panels will be passed tables that have our best guess at colum type set
 *
 * This is also used by PanelChrome for snapshot support
 */
export function getProcessedSeriesData(results?: any[]): SeriesData[] {
  if (!results) {
    return [];
  }

  const series: SeriesData[] = [];
  for (const r of results) {
    if (r) {
      series.push(guessFieldTypes(toSeriesData(r)));
    }
  }
  return series;
}

export class DataPanel extends Component<Props, State> {
  static defaultProps = {
    isVisible: true,
    dashboardId: 1,
  };

  dataStream: Subscribable<DataQueryResponse>;
  dataSubscription: Unsubscribable;

  dataSourceSrv: DatasourceSrv = getDatasourceSrv();
  isUnmounted = false;

  constructor(props: Props) {
    super(props);

    this.state = {
      loading: LoadingState.NotStarted,
      response: {
        data: [],
      },
      isFirstLoad: true,
    };
  }

  componentDidMount() {
    this.issueQueries();
  }

  componentWillUnmount() {
    this.isUnmounted = true;
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
  }

  async componentDidUpdate(prevProps: Props) {
    if (!this.hasPropsChanged(prevProps)) {
      return;
    }

    this.issueQueries();
  }

  hasPropsChanged(prevProps: Props) {
    return this.props.refreshCounter !== prevProps.refreshCounter;
  }

  private handleDataStream = (stream: Subscribable<DataQueryResponseData>) => {
    if (this.dataStream) {
      if (stream === this.dataStream) {
        return;
      }
      console.log('stream handeler changed');
      if (this.dataSubscription) {
        console.log('removing existing subscription');
        this.dataSubscription.unsubscribe();
        this.dataSubscription = null;
      }
    }

    console.log('init stream', stream);
    this.dataStream = stream;
    this.dataSubscription = stream.subscribe({
      next: throttle((resp: DataQueryResponse) => {
        this.setState({
          loading: LoadingState.Done,
          response: resp,
          data: getProcessedSeriesData(resp.data),
          isFirstLoad: false,
        });
      }, 100), // Don't ever update faster than 10hz
      error: (err: any) => {
        console.log('panel: observer got error', err);
      },
      complete: () => {
        console.log('panel: observer got complete');
        this.dataStream = null;
      },
    });
  };

  private issueQueries = async () => {
    const {
      isVisible,
      queries,
      datasource,
      panelId,
      dashboardId,
      timeRange,
      widthPixels,
      maxDataPoints,
      scopedVars,
      onDataResponse,
      onError,
    } = this.props;

    if (!isVisible) {
      return;
    }

    if (!queries.length) {
      this.setState({ loading: LoadingState.Done });
      return;
    }

    this.setState({ loading: LoadingState.Loading });

    try {
      const ds = await this.dataSourceSrv.get(datasource, scopedVars);

      // TODO interpolate variables
      const minInterval = this.props.minInterval || ds.interval;
      const intervalRes = kbn.calculateInterval(timeRange, widthPixels, minInterval);

      const queryOptions: DataQueryOptions = {
        timezone: 'browser',
        panelId: panelId,
        dashboardId: dashboardId,
        range: timeRange,
        rangeRaw: timeRange.raw,
        interval: intervalRes.interval,
        intervalMs: intervalRes.intervalMs,
        targets: queries,
        maxDataPoints: maxDataPoints || widthPixels,
        scopedVars: scopedVars || {},
        cacheTimeout: null,
      };

      const resp = await ds.query(queryOptions);

      if (this.isUnmounted) {
        return;
      }

      // check if data source returns a stream
      if (resp && resp.stream) {
        this.handleDataStream(resp.stream);
        return;
      }

      if (onDataResponse) {
        onDataResponse(resp);
      }

      this.setState({
        loading: LoadingState.Done,
        response: resp,
        data: getProcessedSeriesData(resp.data),
        isFirstLoad: false,
      });
    } catch (err) {
      console.log('DataPanel error', err);

      let message = 'Query error';

      if (err.message) {
        message = err.message;
      } else if (err.data && err.data.message) {
        message = err.data.message;
      } else if (err.data && err.data.error) {
        message = err.data.error;
      } else if (err.status) {
        message = `Query error: ${err.status} ${err.statusText}`;
      }

      onError(message, err);
      this.setState({ isFirstLoad: false, loading: LoadingState.Error });
    }
  };

  render() {
    const { queries } = this.props;
    const { loading, isFirstLoad, data, response } = this.state;

    // do not render component until we have first data
    if (isFirstLoad && (loading === LoadingState.Loading || loading === LoadingState.NotStarted)) {
      return this.renderLoadingState();
    }

    if (!queries.length) {
      return (
        <div className="panel-empty">
          <p>Add a query to get some data!</p>
        </div>
      );
    }

    // Time from the query or the response
    const timeRange = response && response.range ? response.range : this.props.timeRange;

    return (
      <>
        {loading === LoadingState.Loading && this.renderLoadingState()}
        {this.props.children({ loading, timeRange, data })}
      </>
    );
  }

  private renderLoadingState(): JSX.Element {
    return (
      <div className="panel-loading">
        <i className="fa fa-spinner fa-spin" />
      </div>
    );
  }
}
