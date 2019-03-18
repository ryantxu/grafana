import { toFixed } from './valueFormats';

describe('Value Formats', () => {
  it('reasonable default fixed decimals', () => {
    expect(toFixed(1)).toEqual('1');

    // expect(toFixed(1.2)).toEqual('1.2');
    // expect(toFixed(1.23)).toEqual('1.2');
    // expect(toFixed(1.234)).toEqual('1.2');
    // expect(toFixed(1.2345)).toEqual('1.2');
    // expect(toFixed(1.23456)).toEqual('1.2');
    // expect(toFixed(1.234567)).toEqual('1.2');
    // expect(toFixed(1.2345678)).toEqual('1.2');
    // expect(toFixed(1.23456789)).toEqual('1.2');
    // expect(toFixed(1.234567890)).toEqual('1.2');

    expect(toFixed(1.2345678901)).toEqual('1.2');
    expect(toFixed(1.23456789012)).toEqual('1.2');
    expect(toFixed(1.234567890123)).toEqual('1.2');

    expect(toFixed(12345.678)).toEqual('12346');
  });

  it('fixed decimals', () => {
    const decimals = 3;
    const output = '1.235'; // rounded up!

    expect(toFixed(1, decimals)).toEqual('1.000');
    expect(toFixed(1.2, decimals)).toEqual('1.200');
    expect(toFixed(1.23, decimals)).toEqual('1.230');
    expect(toFixed(1.234, decimals)).toEqual('1.234');
    expect(toFixed(1.2345, decimals)).toEqual(output);
    expect(toFixed(1.23456, decimals)).toEqual(output);
    expect(toFixed(1.234567, decimals)).toEqual(output);
    expect(toFixed(1.2345678, decimals)).toEqual(output);
    expect(toFixed(1.23456789, decimals)).toEqual(output);
  });
});
