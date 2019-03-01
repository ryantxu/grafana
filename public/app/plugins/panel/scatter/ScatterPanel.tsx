// Libraries
import React, { PureComponent } from 'react';
import echarts, { EChartOption } from 'echarts';

// Types
import { ScatterOptions } from './types';
import { PanelProps } from '@grafana/ui/src/types';

interface Props extends PanelProps<ScatterOptions> {}

// ICON:
//  https://pngtree.com/free-icon/scatter-plot_317204

export class ScatterPanel extends PureComponent<Props> {
  element: HTMLDivElement | null = null;

  // first add
  componentDidMount() {
    this.rerender();
  }

  // update
  componentDidUpdate(prevProps) {
    // // 以下属性修改的时候，需要 dispose 之后再新建
    // // 1. 切换 theme 的时候
    // // 2. 修改 opts 的时候
    // // 3. 修改 onEvents 的时候，这样可以取消所以之前绑定的事件 issue #151
    // if (
    //   !isEqual(prevProps.theme, this.props.theme) ||
    //   !isEqual(prevProps.opts, this.props.opts) ||
    //   !isEqual(prevProps.onEvents, this.props.onEvents)
    // ) {
    //   this.dispose();

    //   this.rerender(); // 重建
    //   return;
    // }

    // // 当这些属性保持不变的时候，不 setOption
    // const pickKeys = ['option', 'notMerge', 'lazyUpdate', 'showLoading', 'loadingOption'];
    // if (isEqual(pick(this.props, pickKeys), pick(prevProps, pickKeys))) {
    //   return;
    // }

    // // 判断是否需要 setOption，由开发者自己来确定。默认为 true
    // if (typeof this.props.shouldSetOption === 'function' && !this.props.shouldSetOption(prevProps, this.props)) {
    //   return;
    // }

    const echartObj = this.renderEchartDom();
    if (this.props.height !== prevProps.height || this.props.width !== prevProps.width) {
      console.log('Size Changed', this.props.height);
      try {
        echartObj.resize();
      } catch (e) {
        console.warn(e);
      }
    }
  }

  // remove
  componentWillUnmount() {
    this.dispose();
  }
  //EChartOption<EChartOption.SeriesScatter>
  getEChartOptions = (): any => {
    //EChartOption<EChartOption.SeriesScatter> => {
    const { options, panelData } = this.props;

    const ooo: EChartOption<EChartOption.SeriesScatter> = {};

    console.log('TODO panelData to series', panelData, ooo);

    return {
      xAxis: {
        axisLabel: {
          formatter: (value, index) => {
            return value + ' (XXX)';
          },
        },
      },
      yAxis: {
        axisLabel: {
          formatter: (value, index) => {
            return value + ' (YYY)';
          },
        },
      },
      dataset: {
        source: [
          // Each column is called a dimension.
          // There are five dimensions: 0, 1, 2, 3, 4。
          [12, 44, 55, 66, 2],
          [23, 6, 16, 23, 1],
        ],
      },
      tooltip: {
        // trigger: 'axis',
        // axisPointer: {
        //     type: 'cross'
        // },
        backgroundColor: 'rgba(245, 245, 245, 0.8)',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        textStyle: {
          color: '#000',
        },
      },
      series: {
        type: 'scatter',
        symbolSize: options.symbolSize,
        encode: {
          x: 0, // Dimension 3, 1, 5 is mapped to x axis.
          y: 1, // Dimension 2 is mapped to y axis.
          tooltip: [2, 3, 4], // Dimension 3, 2, 4 will be displayed in tooltip.
        },
        // tooltip: {
        //   formatter: (param) => {
        //     console.log( 'TTIP formatter', param )
        //       return 'xxx';
        //   }
        // }
      },
      // series: [{
      //     data: [
      //         [10.0, 8.04],
      //         [8.0, 6.95],
      //         [13.0, 7.58],
      //         [9.0, 8.81],
      //         [11.0, 8.33],
      //         [14.0, 9.96],
      //         [6.0, 7.24],
      //         [4.0, 4.26],
      //         [12.0, 10.84],
      //         [7.0, 4.82],
      //         [5.0, 5.68]
      //     ],
      //     type: ''
      // }]
    };
  };

  mouseover = evt => {
    console.log('OVER', evt);
  };

  mouseout = evt => {
    console.log('OUT', evt);
  };

  rerender = () => {
    const echartObj = this.renderEchartDom();

    echartObj.on('mouseover', this.mouseover);
    echartObj.on('mouseout', this.mouseout);

    if (this.element) {
      console.log('TODO, get the resize??', echartObj);
    }
  };

  // dispose echarts and clear size-sensor
  dispose = () => {
    if (this.element) {
      echarts.dispose(this.element);
    }
  };

  // return the echart object
  getEchartsInstance = () => echarts.getInstanceByDom(this.element) || echarts.init(this.element, null, {});

  // render the dom
  renderEchartDom = () => {
    // init the echart object
    const echartObj = this.getEchartsInstance();

    // set the echart option
    const notMerge = false;
    const lazyUpdate = false;
    echartObj.setOption(this.getEChartOptions(), notMerge, lazyUpdate);

    // // set loading mask
    // if (this.props.showLoading)
    //   echartObj.showLoading(this.props.loadingOption || null);
    // else echartObj.hideLoading();

    return echartObj;
  };

  render() {
    const { height } = this.props;

    const style = {
      height: height,
      width: '100%',
      border: '1px solid red',
    };

    return <div ref={e => (this.element = e)} style={style} />;
  }
}
