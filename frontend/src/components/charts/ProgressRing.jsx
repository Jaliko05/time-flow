import { cn } from "@/lib/utils";

export default function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className = "",
  showLabel = true,
  color = "text-primary",
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    "text-primary": "stroke-primary",
    "text-green-600": "stroke-green-600",
    "text-blue-600": "stroke-blue-600",
    "text-orange-600": "stroke-orange-600",
    "text-red-600": "stroke-red-600",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-500",
            colorClasses[color] || "stroke-primary"
          )}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
          <span className="text-xs text-gray-500">
            {value}/{max}
          </span>
        </div>
      )}
    </div>
  );
}
