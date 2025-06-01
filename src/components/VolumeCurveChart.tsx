
"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, DotProps, ReferenceDot } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import type { CurvePoint } from '@/types';

interface CustomDotProps extends DotProps {
  payload?: CurvePoint; 
  current?: boolean;
}

const CustomDot: React.FC<CustomDotProps> = (props) => {
  const { cx, cy, stroke, current } = props; // Removed payload as it's not used directly in this simplified dot
  if (current) {
    return <circle cx={cx} cy={cy} r={8} fill="hsl(var(--accent))" stroke="hsl(var(--background))" strokeWidth={2} />;
  }
  return <circle cx={cx} cy={cy} r={5} fill={stroke} stroke="hsl(var(--background))" strokeWidth={1}/>;
};


const VolumeCurveChart: React.FC = () => {
  const { activeProfileId, getProfileById, currentSpeed, currentVolume, isOn } = useAppContext();
  const activeProfile = getProfileById(activeProfileId);

  if (!activeProfile) {
    return (
      <Card className="shadow-lg col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-semibold text-foreground">
            <TrendingUp className="mr-2 h-6 w-6 text-primary" />
            Volume Curve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active profile selected or profile data is incomplete.</p>
        </CardContent>
      </Card>
    );
  }

  // Construct chartData to include thresholds and user-defined curve points
  const allPointsForChart: Array<{ speed: number; volume: number }> = [];

  // Add min threshold point
  allPointsForChart.push({ speed: activeProfile.minSpeed, volume: activeProfile.minVolume });

  // Add user-defined curve points, ensuring they are distinct from thresholds
  activeProfile.curve.forEach(p => {
    // Only add points that are strictly between min and max speed to avoid duplicate points if user accidentally created one matching a threshold
    // The editor should ideally prevent this, but this is a safeguard.
    if (p.speed > activeProfile.minSpeed && p.speed < activeProfile.maxSpeed) {
      allPointsForChart.push({ speed: p.speed, volume: p.volume });
    }
  });
  
  // Add max threshold point
  allPointsForChart.push({ speed: activeProfile.maxSpeed, volume: activeProfile.maxVolume });

  // Sort all points by speed and remove duplicates (e.g. if a curve point had same speed as a threshold before filtering)
  // Using a Map to ensure uniqueness based on speed, preferring the first encountered volume for a given speed if duplicates exist after filtering.
  // This also helps if minSpeed === maxSpeed (though UI should prevent this), it would just show one point.
  const uniquePointsMap = new Map<number, number>();
  allPointsForChart.forEach(p => {
    if (!uniquePointsMap.has(p.speed)) {
        uniquePointsMap.set(p.speed, p.volume);
    }
  });
  
  const chartData = Array.from(uniquePointsMap, ([speed, volume]) => ({ speed, volume }))
                         .sort((a, b) => a.speed - b.speed);


  return (
    <Card className="shadow-lg col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-foreground">
          <TrendingUp className="mr-2 h-6 w-6 text-primary" />
          Volume Curve: {activeProfile.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] md:h-[400px] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 0,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="speed" 
              type="number" 
              label={{ value: 'Speed (MPH)', position: 'insideBottom', offset: -15, fill: 'hsl(var(--foreground))' }} 
              stroke="hsl(var(--foreground))"
              domain={['dataMin', 'dataMax']}
              allowDuplicatedCategory={false}
            />
            <YAxis 
              label={{ value: 'Volume (%)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }} 
              stroke="hsl(var(--foreground))"
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))' }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
              itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            <Legend verticalAlign="top" wrapperStyle={{paddingBottom: "10px"}}/>
            <Line 
              type="monotone" 
              dataKey="volume" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3} 
              activeDot={{ r: 8, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))' }} 
              dot={(dotProps: DotProps & { key?: React.Key }) => {
                const { key, ...restProps } = dotProps;
                return <CustomDot key={key} {...restProps} />;
              }}
            />
            {isOn && currentSpeed !== null && currentVolume !== null && chartData.length > 0 && (
               <ReferenceDot 
                x={currentSpeed} 
                y={currentVolume} 
                r={10} 
                fill="hsl(var(--accent))" 
                stroke="hsl(var(--background))"
                strokeWidth={2}
                isFront={true} 
                ifOverflow="extendDomain" // Ensures the dot is visible even if outside the initial domain
                label={{value: "Current", position:"top", fill: "hsl(var(--accent))"}}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default VolumeCurveChart;

