package tsdb

import "sync"

type Request struct {
	TimeRange     TimeRange
	MaxDataPoints int
	Queries       QuerySlice
}

type Response struct {
	BatchTimings []*BatchTiming
	Results      map[string]*QueryResult
}

type BatchTiming struct {
	TimeElapsed int64
}

type TimeRange struct {
}

type DataSourceInfo struct {
	Id                int64
	Name              string
	Type              string
	Url               string
	Password          string
	User              string
	Database          string
	BasicAuth         bool
	BasicAuthUser     string
	BasicAuthPassword string
}

type QueryContext struct {
	TimeRange   TimeRange
	Queries     QuerySlice
	Results     map[string]*QueryResult
	ResultsChan chan *BatchResult
	Lock        sync.RWMutex
	BatchWaits  sync.WaitGroup
}

type BatchResult struct {
	Error        error
	Timings      *BatchTiming
	QueryResults map[string]*QueryResult
}

type QueryResult struct {
	Error  error
	RefId  string
	Series TimeSeriesSlice
}

type TimeSeries struct {
	Name string
}

type TimeSeriesSlice []*TimeSeries
