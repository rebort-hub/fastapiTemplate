
import * as echarts from "echarts/core"
import {
  BarChart,
  CandlestickChart,
  GaugeChart,
  LineChart,
  MapChart,
  PieChart,
  RadarChart,
  ScatterChart,
} from "echarts/charts"
import {
  DataZoomComponent,
  GeoComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  MapChart,
  CandlestickChart,
  GaugeChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  GeoComponent,
  TitleComponent,
  CanvasRenderer,
])

export { echarts }
export type { EChartsOption, BarSeriesOption, LineSeriesOption } from "echarts"
export const graphic = echarts.graphic
