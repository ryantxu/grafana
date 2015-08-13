package tsdb

import (
	"testing"
	"time"

	. "github.com/smartystreets/goconvey/convey"
)

func TestMetricQuery(t *testing.T) {

	Convey("When batches groups for query", t, func() {

		Convey("Given 3 queries for 2 data sources", func() {
			request := &Request{
				Queries: QuerySlice{
					{RefId: "A", Query: "asd", DataSource: &DataSourceInfo{Id: 1}},
					{RefId: "B", Query: "asd", DataSource: &DataSourceInfo{Id: 1}},
					{RefId: "C", Query: "asd", DataSource: &DataSourceInfo{Id: 2}},
				},
			}

			batches, err := getBatches(request)
			So(err, ShouldBeNil)

			Convey("Should group into two batches", func() {
				So(len(batches), ShouldEqual, 2)
			})
		})

		Convey("Given query 2 depends on query 1", func() {
			request := &Request{
				Queries: QuerySlice{
					{RefId: "A", Query: "asd", DataSource: &DataSourceInfo{Id: 1}},
					{RefId: "B", Query: "asd", DataSource: &DataSourceInfo{Id: 2}},
					{RefId: "C", Query: "#A / #B", DataSource: &DataSourceInfo{Id: 3}, Depends: []string{"A", "B"}},
				},
			}

			batches, err := getBatches(request)
			So(err, ShouldBeNil)

			Convey("Should return three batch groups", func() {
				So(len(batches), ShouldEqual, 3)
			})

			Convey("Group 3 should have group 1 and 2 as dependencies", func() {
				So(batches[2].Depends["A"], ShouldEqual, true)
				So(batches[2].Depends["B"], ShouldEqual, true)
			})

		})
	})

	Convey("When executing request with one query", t, func() {
		req := &Request{
			Queries: QuerySlice{
				{RefId: "A", Query: "asd", DataSource: &DataSourceInfo{Id: 1, Type: "test"}},
			},
		}

		setExecutorResults(&QueryResult{RefId: "A", Series: TimeSeriesSlice{&TimeSeries{Name: "Argh"}}})

		res, err := HandleRequest(req)
		So(err, ShouldBeNil)

		Convey("Should return query results", func() {
			So(res.Results["A"].Series, ShouldNotBeEmpty)
			So(res.Results["A"].Series[0].Name, ShouldEqual, "Argh")
		})
	})

	Convey("When executing one request with two queries from same data source", t, func() {
		req := &Request{
			Queries: QuerySlice{
				{RefId: "A", Query: "asd", DataSource: &DataSourceInfo{Id: 1, Type: "test"}},
				{RefId: "B", Query: "asd", DataSource: &DataSourceInfo{Id: 1, Type: "test"}},
			},
		}

		setExecutorResults(
			&QueryResult{RefId: "A", Series: TimeSeriesSlice{&TimeSeries{Name: "argh"}}},
			&QueryResult{RefId: "B", Series: TimeSeriesSlice{&TimeSeries{Name: "barg"}}},
		)

		res, err := HandleRequest(req)
		So(err, ShouldBeNil)

		Convey("Should return query results", func() {
			So(len(res.Results), ShouldEqual, 2)
			So(res.Results["B"].Series[0].Name, ShouldEqual, "barg")
		})

		Convey("Should have been batched in one request", func() {
			So(len(res.BatchTimings), ShouldEqual, 1)
		})

	})

	Convey("When executing one request with three queries from different datasources", t, func() {
		req := &Request{
			Queries: QuerySlice{
				{RefId: "A", Query: "asd", DataSource: &DataSourceInfo{Id: 1, Type: "test"}},
				{RefId: "B", Query: "asd", DataSource: &DataSourceInfo{Id: 1, Type: "test"}},
				{RefId: "C", Query: "asd", DataSource: &DataSourceInfo{Id: 2, Type: "test"}},
			},
		}

		res, err := HandleRequest(req)
		So(err, ShouldBeNil)

		Convey("Should have been batched in two requests", func() {
			So(len(res.BatchTimings), ShouldEqual, 2)
		})
	})

	Convey("When executing request that depend on other query", t, func() {
		req := &Request{
			Queries: QuerySlice{
				{RefId: "A", Query: "asd", DataSource: &DataSourceInfo{Id: 1, Type: "test"}},
				{RefId: "B", Query: "#A / 2", DataSource: &DataSourceInfo{Id: 2, Type: "test"},
					Depends: []string{"A"},
				},
			},
		}

		unitTestExecutor.results = make(map[string]*QueryResult)
		unitTestExecutor.resultsFn = make(map[string]executorTestFunc)
		unitTestExecutor.resultsFn["A"] = func(c *QueryContext) *QueryResult {
			time.Sleep(10 * time.Millisecond)
			return &QueryResult{
				Series: TimeSeriesSlice{
					&TimeSeries{Name: "Ares"},
				}}
		}
		unitTestExecutor.resultsFn["B"] = func(c *QueryContext) *QueryResult {
			return &QueryResult{
				Series: TimeSeriesSlice{
					&TimeSeries{Name: "Bres+" + c.Results["A"].Series[0].Name},
				}}
		}

		res, err := HandleRequest(req)
		So(err, ShouldBeNil)

		Convey("Should have been batched in two requests", func() {
			So(len(res.BatchTimings), ShouldEqual, 2)
		})

		Convey("Query B should have access to Query A results", func() {
			So(res.Results["B"].Series[0].Name, ShouldEqual, "Bres+Ares")
		})
	})
}

func setExecutorResults(results ...*QueryResult) {
	unitTestExecutor.results = make(map[string]*QueryResult)
	for _, res := range results {
		unitTestExecutor.results[res.RefId] = res
	}
}
