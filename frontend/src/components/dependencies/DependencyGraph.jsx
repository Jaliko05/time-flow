import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DependencyGraph({ activities = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || activities.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate positions
    const nodeRadius = 30;
    const padding = 60;
    const cols = Math.ceil(Math.sqrt(activities.length));
    const rows = Math.ceil(activities.length / cols);
    const cellWidth = (width - 2 * padding) / cols;
    const cellHeight = (height - 2 * padding) / rows;

    const nodes = activities.map((activity, index) => ({
      ...activity,
      x: padding + (index % cols) * cellWidth + cellWidth / 2,
      y: padding + Math.floor(index / cols) * cellHeight + cellHeight / 2,
    }));

    // Draw edges (dependencies)
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;

    activities.forEach((activity) => {
      const sourceNode = nodes.find((n) => n.id === activity.id);
      if (!sourceNode || !activity.dependencies) return;

      activity.dependencies.forEach((depId) => {
        const targetNode = nodes.find((n) => n.id === depId);
        if (!targetNode) return;

        // Draw arrow
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(
          targetNode.y - sourceNode.y,
          targetNode.x - sourceNode.x
        );
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(
          targetNode.x - nodeRadius * Math.cos(angle),
          targetNode.y - nodeRadius * Math.sin(angle)
        );
        ctx.lineTo(
          targetNode.x -
            nodeRadius * Math.cos(angle) -
            arrowSize * Math.cos(angle - Math.PI / 6),
          targetNode.y -
            nodeRadius * Math.sin(angle) -
            arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          targetNode.x -
            nodeRadius * Math.cos(angle) -
            arrowSize * Math.cos(angle + Math.PI / 6),
          targetNode.y -
            nodeRadius * Math.sin(angle) -
            arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      });
    });

    // Draw nodes
    nodes.forEach((node) => {
      const colors = {
        Pendiente: "#fbbf24",
        "En Progreso": "#3b82f6",
        Completada: "#10b981",
      };
      const color = colors[node.status] || "#6b7280";

      // Draw circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const text =
        node.name.length > 10 ? node.name.substring(0, 8) + "..." : node.name;
      ctx.fillText(text, node.x, node.y);
    });
  }, [activities]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafo de Dependencias</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No hay actividades con dependencias para mostrar
          </p>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="w-full border rounded-lg"
            />
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500" />
                <span>Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span>En Progreso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500" />
                <span>Completada</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
