import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Line } from 'react-native-svg';

interface ChartData {
    x: number;
    y: number;
}

interface PerformanceChartProps {
    data: ChartData[];
    width?: number;
    height?: number;
}


export default function PerformanceChart({
    data,
    width = 180,
    height = 60
}: PerformanceChartProps) {
    if (data.length === 0) return null;

    // Find min and max values for scaling
    const yValues = data.map(d => d.y);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const yRange = maxY - minY;

    // Convert data points to SVG coordinates
    const points = data
        .map((point, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((point.y - minY) / yRange) * height;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <View style={styles.container}>
            <Svg width={width} height={height}>
                <Polyline
                    points={points}
                    fill="none"
                    stroke="#4A9D8E"
                    strokeWidth="2"
                />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
