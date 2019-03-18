import { toFixed } from './valueFormats';

describe('Value Formats', () => {
  it('fixed default decimals', () => {
    expect(toFixed(1.23)).toEqual('1.2');
  });
});
