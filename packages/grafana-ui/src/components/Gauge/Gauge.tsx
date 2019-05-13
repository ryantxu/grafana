import React, { PureComponent } from 'react';
import $ from 'jquery';
import { getColorFromHexRgbOrName } from '../../utils';
import { DisplayValue, Themeable } from '../../types';
import { selectThemeVariant } from '../../themes';
import { FieldDisplayProcessor } from '../../utils/scale';

export interface Props extends Themeable {
  height: number;
  showThresholdMarkers: boolean;
  showThresholdLabels: boolean;
  width: number;
  value: DisplayValue;
  field: FieldDisplayProcessor;
}

const FONT_SCALE = 1;

export class Gauge extends PureComponent<Props> {
  canvasElement: any;

  static defaultProps: Partial<Props> = {
    showThresholdMarkers: true,
    showThresholdLabels: false,
  };

  componentDidMount() {
    this.draw();
  }

  componentDidUpdate() {
    this.draw();
  }

  getFormattedThresholds() {
    const { field, theme } = this.props;

    const { minValue, maxValue, scale } = field;
    const { thresholds } = scale;
    if (!thresholds) {
      return []; // TODO d3 scheme
    }

    const lastThreshold = thresholds[thresholds.length - 1];
    return [
      ...thresholds.map((threshold, index) => {
        if (index === 0) {
          return { value: minValue, color: getColorFromHexRgbOrName(threshold.color, theme.type) };
        }

        const previousThreshold = thresholds[index - 1];
        return { value: threshold.value, color: getColorFromHexRgbOrName(previousThreshold.color, theme.type) };
      }),
      { value: maxValue, color: getColorFromHexRgbOrName(lastThreshold.color, theme.type) },
    ];
  }

  getFontScale(length: number): number {
    if (length > 12) {
      return FONT_SCALE - (length * 5) / 110;
    }
    return FONT_SCALE - (length * 5) / 100;
  }

  draw() {
    const { field, showThresholdLabels, showThresholdMarkers, width, height, theme, value } = this.props;

    const autoProps = calculateGaugeAutoProps(width, height, value.title);
    const dimension = Math.min(width, autoProps.gaugeHeight);

    const backgroundColor = selectThemeVariant(
      {
        dark: theme.colors.dark8,
        light: theme.colors.gray6,
      },
      theme.type
    );

    const gaugeWidthReduceRatio = showThresholdLabels ? 1.5 : 1;
    const gaugeWidth = Math.min(dimension / 5, 40) / gaugeWidthReduceRatio;
    const thresholdMarkersWidth = gaugeWidth / 5;
    const fontSize = Math.min(dimension / 5.5, 100) * (value.text !== null ? this.getFontScale(value.text.length) : 1);
    const thresholdLabelFontSize = fontSize / 2.5;

    const options: any = {
      series: {
        gauges: {
          gauge: {
            min: field.minValue,
            max: field.maxValue,
            background: { color: backgroundColor },
            border: { color: null },
            shadow: { show: false },
            width: gaugeWidth,
          },
          frame: { show: false },
          label: { show: false },
          layout: { margin: 0, thresholdWidth: 0, vMargin: 0 },
          cell: { border: { width: 0 } },
          threshold: {
            values: this.getFormattedThresholds(),
            label: {
              show: showThresholdLabels,
              margin: thresholdMarkersWidth + 1,
              font: { size: thresholdLabelFontSize },
            },
            show: showThresholdMarkers,
            width: thresholdMarkersWidth,
          },
          value: {
            color: value.color,
            formatter: () => {
              return value.text;
            },
            font: { size: fontSize, family: theme.typography.fontFamily.sansSerif },
          },
          show: true,
        },
      },
    };

    const plotSeries = {
      data: [[0, value.numeric]],
      label: value.title,
    };

    try {
      $.plot(this.canvasElement, [plotSeries], options);
    } catch (err) {
      console.log('Gauge rendering error', err, options, value);
    }
  }

  render() {
    const { width, value, height } = this.props;
    const autoProps = calculateGaugeAutoProps(width, height, value.title);

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{ height: `${autoProps.gaugeHeight}px`, width: '100%' }}
          ref={element => (this.canvasElement = element)}
        />
        {autoProps.showLabel && (
          <div
            style={{
              textAlign: 'center',
              fontSize: autoProps.titleFontSize,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              position: 'relative',
              width: '100%',
              top: '-4px',
            }}
          >
            {value.title}
          </div>
        )}
      </div>
    );
  }
}

interface GaugeAutoProps {
  titleFontSize: number;
  gaugeHeight: number;
  showLabel: boolean;
}

function calculateGaugeAutoProps(width: number, height: number, title: string | undefined): GaugeAutoProps {
  const showLabel = title !== null && title !== undefined;
  const titleFontSize = Math.min((width * 0.15) / 1.5, 20); // 20% of height * line-height, max 40px
  const titleHeight = titleFontSize * 1.5;
  const availableHeight = showLabel ? height - titleHeight : height;
  const gaugeHeight = Math.min(availableHeight, width);

  return {
    showLabel,
    gaugeHeight,
    titleFontSize,
  };
}
