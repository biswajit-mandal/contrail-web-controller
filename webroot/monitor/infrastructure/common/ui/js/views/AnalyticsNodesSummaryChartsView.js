/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define(['underscore', 'contrail-view',
       'monitor-infra-analytics-sandesh-chart-model',
       'monitor-infra-analytics-queries-chart-model',
       'monitor-infra-analytics-database-read-write-chart-model',
       'monitor-infra-analytics-database-usage-model'],
       function(_, ContrailView,AnalyticsNodeSandeshChartModel,
            AnalyticsNodeQueriesChartModel, AnalyticsNodeDataBaseReadWriteChartModel,
            AanlyticsNodeDatabaseUsageModel){
        var AnalyticsNodesSummaryChartsView = ContrailView.extend({
        render : function (){
            var anlyticsTemplate = contrail.getTemplate4Id(
                    cowc.TMPL_4COLUMN__2ROW_CONTENT_VIEW);
            var self = this,
                viewConfig = self.attributes.viewConfig,
                colorFn = viewConfig['colorFn'];
            self.$el.html(anlyticsTemplate);
            var topleftColumn = self.$el.find(".top-container .left-column"),
                toprightCoulmn = self.$el.find(".top-container .right-column"),
                bottomleftColumn = self.$el.find(".bottom-container .left-column"),
                bottomrightCoulmn = self.$el.find(".bottom-container .right-column"),
                sandeshModel = new AnalyticsNodeSandeshChartModel(),
                queriesModel = new AnalyticsNodeQueriesChartModel(),
                dbUsageModel = new AanlyticsNodeDatabaseUsageModel();
                databseReadWritemodel = new AnalyticsNodeDataBaseReadWriteChartModel();
            self.renderView4Config(topleftColumn,  sandeshModel,
                   getAnalyticsNodeSandeshChartViewConfig(colorFn));

            self.renderView4Config(toprightCoulmn,  queriesModel,
                    getAnalyticsNodeQueriesChartViewConfig(colorFn));

            self.renderView4Config(bottomrightCoulmn,  dbUsageModel,
                    getAnalyticsNodeDatabaseUsageChartViewConfig(colorFn));

            self.renderView4Config(bottomleftColumn,  databseReadWritemodel,
                    getAnalyticsNodeDatabaseWriteChartViewConfig(colorFn));
        }
    });
   function getAnalyticsNodeSandeshChartViewConfig(colorFn) {
       return {
           elementId : ctwl.ANALYTICS_CHART_SANDESH_SECTION_ID,
           view : "SectionView",
           viewConfig : {
               rows : [ {
                   columns : [ {
                       elementId : ctwl.ANALYTICS_CHART_SANDESH_STACKEDBARCHART_ID,
                       view : "StackedBarChartWithFocusView",
                       viewConfig : {
                           class: 'mon-infra-chart chartMargin',
                           chartOptions:{
                               height: 230,
                               title: ctwl.ANALYTICSNODE_SUMMARY_TITLE,
                               xAxisLabel: '',
                               yAxisLabel: ctwl.ANALYTICS_CHART_SANDESH_LABEL,
                               groupBy: 'Source',
                               yField: 'SUM(msg_info.messages)',
                               yAxisOffset: 25,
                               tickPadding: 8,
                               margin: {
                                   left: 55,
                                   top: 20,
                                   right: 0,
                                   bottom: 40
                               },
                               bucketSize: monitorInfraConstants.STATS_BUCKET_DURATION,
                               colors: colorFn,
                               showControls: false,
                           }
                       }
                   }]
               }]
           }
       }

   }

   function getAnalyticsNodeQueriesChartViewConfig(colorFn) {
       return {
           elementId : ctwl.ANALYTICS_CHART_QUERIES_SECTION_ID,
           view : "SectionView",
           viewConfig : {
               rows : [ {

                   columns : [ {
                       elementId : ctwl.ANALYTICS_CHART_QUERIES_STACKEDBARCHART_ID,
                       view : "StackedBarChartWithFocusView",
                       viewConfig : {
                           class: 'mon-infra-chart chartMargin',
                           chartOptions:{
                               height: 230,
                               xAxisLabel: '',
                               yAxisLabel: ctwl.ANALYTICS_CHART_QUERIES_LABEL,
                               title: ctwl.ANALYTICSNODE_SUMMARY_TITLE,
                               groupBy: 'Source',
                               failureCheckFn: function (d) {
                                   if (d['query_stats.error'] != "None") {
                                       return 1;
                                   } else {
                                       return 0;
                                   }
                               },
                               yAxisOffset: 25,
                               tickPadding: 4,
                               margin: {
                                   left: 55,
                                   top: 20,
                                   right: 0,
                                   bottom: 40
                               },
                               bucketSize: monitorInfraConstants.STATS_BUCKET_DURATION,
                               colors: colorFn,
                               showControls: false,
                           }
                       }
                   }]
               }]
           }
       }

   }

   function getAnalyticsNodeDatabaseUsageChartViewConfig() {
       return {
           elementId : ctwl.ANALYTICS_CHART_DATABASE_READ_SECTION_ID,
           view : "SectionView",
           viewConfig : {
               rows : [ {
                   columns : [ {
                       elementId : ctwl.ANALYTICS_CHART_DATABASE_READ_STACKEDBARCHART_ID,
                       view : "StackedBarChartWithFocusView",
                       viewConfig : {
                           class: 'mon-infra-chart chartMargin',
                           chartOptions:{
                               height: 230,
                               xAxisLabel: '',
                               yAxisLabel: ctwl.ANALYTICS_CHART_DATABASE_USAGE,
                               yField: 'MAX(database_usage.analytics_db_size_1k)',
                               title: ctwl.ANALYTICSNODE_SUMMARY_TITLE,
                               yAxisOffset: 25,
                               yAxisFormatter: function (d) {
                                   return formatBytes(d, true);
                               },
                               tickPadding: 8,
                               margin: {
                                   left: 55,
                                   top: 20,
                                   right: 0,
                                   bottom: 40
                               },
                               bucketSize: monitorInfraConstants.STATS_BUCKET_DURATION,
                               showControls: false,
                           }
                       }
                   }]
               }]
           }
       }

   }

   function getAnalyticsNodeDatabaseWriteChartViewConfig(colorFn) {
       return {
           elementId : ctwl.ANALYTICS_CHART_DATABASE_WRITE_SECTION_ID,
           view : "SectionView",
           viewConfig : {
               rows : [ {

                   columns : [ {
                       elementId : ctwl.ANALYTICS_CHART_DATABASE_WRITE_STACKEDBARCHART_ID,
                       view : "StackedBarChartWithFocusView",
                       viewConfig : {
                           class: 'mon-infra-chart chartMargin',
                           chartOptions:{
                               height: 230,
                               title: ctwl.ANALYTICSNODE_SUMMARY_TITLE,
                               xAxisLabel: '',
                               yAxisLabel: ctwl.ANALYTICS_CHART_DATABASE_WRITE_LABEL,
                               yAxisOffset: 25,
                               groupBy: 'Source',
                               failureCheckFn: function (d) {
                                   return d[ctwl.ANALYTICS_CHART_DATABASE_WRITE_FAILS];
                               },
                               yField: ctwl.ANALYTICS_CHART_DATABASE_WRITE,
                               tickPadding: 8,
                               margin: {
                                   left: 55,
                                   top: 20,
                                   right: 0,
                                   bottom: 40
                               },
                               bucketSize: monitorInfraConstants.STATS_BUCKET_DURATION,
                               colors: colorFn,
                               showControls: false,
                           },
                       }
                   }]
               }]
           }
       }

   }
   return AnalyticsNodesSummaryChartsView;
});
