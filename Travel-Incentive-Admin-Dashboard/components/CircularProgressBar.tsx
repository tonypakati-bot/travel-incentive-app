import React from 'react';

interface CircularProgressBarProps {
  percentage: number;
  strokeWidth?: number;
  sqSize?: number;
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  percentage,
  strokeWidth = 10,
  sqSize = 100,
}) => {
  const radius = (sqSize - strokeWidth) / 2;
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  const dashArray = radius * Math.PI * 2;
  const dashOffset = dashArray - (dashArray * percentage) / 100;

  return (
    <div className="relative" style={{ width: sqSize, height: sqSize }}>
      <svg width={sqSize} height={sqSize} viewBox={viewBox}>
        <circle
          className="stroke-current text-gray-200"
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          fill="none"
        />
        <circle
          className="stroke-current text-blue-500 transition-all duration-300 ease-in-out"
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
          style={{
            strokeDasharray: dashArray,
            strokeDashoffset: dashOffset,
            strokeLinecap: 'round',
          }}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-blue-600">{`${percentage}%`}</span>
      </div>
    </div>
  );
};

export default CircularProgressBar;
