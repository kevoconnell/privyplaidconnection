"use client";

import { LabelList, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PieChartData {
  category: string;
  amount: number;
  fill: string;
  label: string;
  name?: string;
}

interface PlaidPieChartProps {
  title: string;
  description: string;
  data: PieChartData[];
  dataKey: string;
  labelKey: string;
  showInnerRadius?: boolean;
  innerRadius?: number;
  strokeWidth?: number;
  footerContent?: React.ReactNode;
  className?: string;
}

export function PlaidPieChart({
  title,
  description,
  data,
  dataKey,
  labelKey,
  showInnerRadius = false,
  innerRadius = 60,
  strokeWidth = 10,
  footerContent,
  className = "",
}: PlaidPieChartProps) {
  const chartConfig = data.reduce((config, item) => {
    config[item.category] = {
      label: item.label,
      color: item.fill,
    };
    return config;
  }, {} as ChartConfig);

  return (
    <Card
      className={`flex flex-col rounded-3xl border backdrop-blur-xl surface-card ${className}`}
    >
      {data && data.length > 0 ? (
        <>
          <CardHeader className="items-center pb-0">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0 flex items-center justify-center">
            <ChartContainer
              config={chartConfig}
              className="h-[300px] overflow-hidden"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name, props) => {
                        const label = props.payload?.label || name;
                        const color = props.payload?.fill || "#000";
                        return [
                          <div
                            key="label"
                            className="flex items-center space-x-2"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span>{label}</span>
                          </div>,
                          `$${Number(value).toFixed(2)}`,
                        ];
                      }}
                    />
                  }
                />
                <Pie
                  data={data}
                  dataKey={dataKey}
                  innerRadius={showInnerRadius ? innerRadius : 0}
                  strokeWidth={strokeWidth}
                  stroke="#fff"
                  paddingAngle={2}
                >
                  <LabelList
                    dataKey={labelKey}
                    stroke="none"
                    fontSize={8}
                    className="hidden md:block"
                    position="outside"
                    offset={15}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
          {footerContent && (
            <CardFooter className="flex-col gap-2 text-sm">
              {footerContent}
            </CardFooter>
          )}
        </>
      ) : (
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-center text-secondary">
            <p>No data available</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
