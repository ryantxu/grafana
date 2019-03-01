export interface AxisConfig {
  field: string;
}

export interface ScatterOptions {
  symbolSize: number;
  x: AxisConfig;
  y: AxisConfig;
}

export const defaults: ScatterOptions = {
  symbolSize: 20,
  x: {
    field: '[0]',
  },
  y: {
    field: '[1]',
  },
};
