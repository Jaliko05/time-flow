import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TrendIndicator({
  value,
  isPositive = true,
  showIcon = true,
}) {
  if (value === 0) {
    return (
      <div className="flex items-center text-gray-600">
        {showIcon && <Minus className="h-4 w-4 mr-1" />}
        <span className="text-sm font-medium">0%</span>
      </div>
    );
  }

  const isUp = value > 0;
  const isGood = isPositive ? isUp : !isUp;

  return (
    <div
      className={cn(
        "flex items-center",
        isGood ? "text-green-600" : "text-red-600"
      )}
    >
      {showIcon && (
        <>
          {isUp ? (
            <ArrowUp className="h-4 w-4 mr-1" />
          ) : (
            <ArrowDown className="h-4 w-4 mr-1" />
          )}
        </>
      )}
      <span className="text-sm font-medium">{Math.abs(value)}%</span>
    </div>
  );
}
