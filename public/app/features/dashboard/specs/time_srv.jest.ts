import { TimeSrv } from '../time_srv';
import '../time_srv';
import moment from 'moment';

describe('timeSrv', function() {
  var rootScope = {
    $on: jest.fn(),
    onAppEvent: jest.fn(),
    appEvent: jest.fn(),
  };

  var timer = {
    register: jest.fn(),
    cancel: jest.fn(),
    cancelAll: jest.fn(),
  };

  var location = {
    search: jest.fn(() => ({})),
  };

  var timeSrv;

  var _dashboard: any = {
    time: { from: 'now-6h', to: 'now' },
    getTimezone: jest.fn(() => 'browser'),
  };

  beforeEach(function() {
    timeSrv = new TimeSrv(rootScope, jest.fn(), location, timer, { isGrafanaVisibile: jest.fn() });
    timeSrv.init(_dashboard);
  });

  describe('timeRange', function() {
    it('should return unparsed when parse is false', function() {
      timeSrv.setTime({ from: 'now', to: 'now-1h' });
      var time = timeSrv.timeRange();
      expect(time.raw.from).toBe('now');
      expect(time.raw.to).toBe('now-1h');
    });

    it('should return parsed when parse is true', function() {
      timeSrv.setTime({ from: 'now', to: 'now-1h' });
      var time = timeSrv.timeRange();
      expect(moment.isMoment(time.from)).toBe(true);
      expect(moment.isMoment(time.to)).toBe(true);
    });
  });

  describe('init time from url', function() {
    it('should handle relative times', function() {
      location = {
        search: jest.fn(() => ({
          from: 'now-2d',
          to: 'now',
        })),
      };

      timeSrv = new TimeSrv(rootScope, jest.fn(), location, timer, { isGrafanaVisibile: jest.fn() });
      timeSrv.init(_dashboard);
      var time = timeSrv.timeRange();
      expect(time.raw.from).toBe('now-2d');
      expect(time.raw.to).toBe('now');
    });

    it('should handle formatted dates', function() {
      location = {
        search: jest.fn(() => ({
          from: '20140410T052010',
          to: '20140520T031022',
        })),
      };

      timeSrv = new TimeSrv(rootScope, jest.fn(), location, timer, { isGrafanaVisibile: jest.fn() });

      timeSrv.init(_dashboard);
      var time = timeSrv.timeRange();
      expect(time.from.valueOf()).toEqual(new Date('2014-04-10T05:20:10Z').getTime());
      expect(time.to.valueOf()).toEqual(new Date('2014-05-20T03:10:22Z').getTime());
    });

    it('should handle formatted dates without time', function() {
      location = {
        search: jest.fn(() => ({
          from: '20140410',
          to: '20140520',
        })),
      };

      timeSrv = new TimeSrv(rootScope, jest.fn(), location, timer, { isGrafanaVisibile: jest.fn() });

      timeSrv.init(_dashboard);
      var time = timeSrv.timeRange();
      expect(time.from.valueOf()).toEqual(new Date('2014-04-10T00:00:00Z').getTime());
      expect(time.to.valueOf()).toEqual(new Date('2014-05-20T00:00:00Z').getTime());
    });

    it('should handle epochs', function() {
      location = {
        search: jest.fn(() => ({
          from: '1410337646373',
          to: '1410337665699',
        })),
      };

      timeSrv = new TimeSrv(rootScope, jest.fn(), location, timer, { isGrafanaVisibile: jest.fn() });

      timeSrv.init(_dashboard);
      var time = timeSrv.timeRange();
      expect(time.from.valueOf()).toEqual(1410337646373);
      expect(time.to.valueOf()).toEqual(1410337665699);
    });

    it('should handle bad dates', function() {
      location = {
        search: jest.fn(() => ({
          from: '20151126T00010%3C%2Fp%3E%3Cspan%20class',
          to: 'now',
        })),
      };

      timeSrv = new TimeSrv(rootScope, jest.fn(), location, timer, { isGrafanaVisibile: jest.fn() });

      _dashboard.time.from = 'now-6h';
      timeSrv.init(_dashboard);
      expect(timeSrv.time.from).toEqual('now-6h');
      expect(timeSrv.time.to).toEqual('now');
    });
  });

  describe('setTime', function() {
    it('should return disable refresh if refresh is disabled for any range', function() {
      _dashboard.refresh = false;

      timeSrv.setTime({ from: '2011-01-01', to: '2015-01-01' });
      expect(_dashboard.refresh).toBe(false);
    });

    it('should restore refresh for absolute time range', function() {
      _dashboard.refresh = '30s';

      timeSrv.setTime({ from: '2011-01-01', to: '2015-01-01' });
      expect(_dashboard.refresh).toBe('30s');
    });

    it('should restore refresh after relative time range is set', function() {
      _dashboard.refresh = '10s';
      timeSrv.setTime({
        from: moment([2011, 1, 1]),
        to: moment([2015, 1, 1]),
      });
      expect(_dashboard.refresh).toBe(false);
      timeSrv.setTime({ from: '2011-01-01', to: 'now' });
      expect(_dashboard.refresh).toBe('10s');
    });

    it('should keep refresh after relative time range is changed and now delay exists', function() {
      _dashboard.refresh = '10s';
      timeSrv.setTime({ from: 'now-1h', to: 'now-10s' });
      expect(_dashboard.refresh).toBe('10s');
    });

    it('should disable refresh after zooming out', function() {
      _dashboard.refresh = '10s';
      timeSrv.setTime({ from: 'now-1h', to: 'now-10s' });
      expect(_dashboard.refresh).toBe('10s');

      timeSrv.setTime({ from: 'now-2h', to: 'now-10s' });
      expect(_dashboard.refresh).toBe(false);
    });
  });
});
