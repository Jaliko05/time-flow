import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

const ACTIVITY_TYPES = [
  { value: "plan_de_trabajo", label: "Plan de Trabajo" },
  { value: "apoyo_solicitado_por_otras_areas", label: "Apoyo Solicitado por Otras Áreas" },
  { value: "teams", label: "Teams" },
  { value: "interno", label: "Interno" },
  { value: "sesion", label: "Sesión" },
  { value: "investigacion", label: "Investigación" },
  { value: "prototipado", label: "Prototipado" },
  { value: "disenos", label: "Diseños" },
  { value: "pruebas", label: "Pruebas" },
  { value: "documentacion", label: "Documentación" }
];

export default function QuickActivityForm({ onSubmit, isSubmitting, user }) {
  const [formData, setFormData] = useState({
    activity_name: "",
    activity_type: "plan_de_trabajo",
    execution_time: "",
    observations: "",
    project_id: "none",
    other_area: "",
    is_meeting: false
  });
  const [errors, setErrors] = useState({});

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ 
      created_by: user?.email,
      is_active: true 
    }),
    enabled: !!user,
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.activity_name.trim()) {
      newErrors.activity_name = "El nombre de la actividad es obligatorio";
    }
    
    if (!formData.execution_time || parseFloat(formData.execution_time) <= 0) {
      newErrors.execution_time = "El tiempo debe ser mayor a 0";
    }
    
    if (formData.project_id && formData.project_id !== 'none' && !formData.observations.trim()) {
      newErrors.observations = "Las observaciones son obligatorias al seleccionar un proyecto";
    }
    
    if (formData.activity_type === "apoyo_solicitado_por_otras_areas" && !formData.other_area.trim()) {
      newErrors.other_area = "Debe especificar el área solicitante";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const selectedProject = projects.find(p => p.id === formData.project_id);
    
    await onSubmit({
      ...formData,
      execution_time: parseFloat(formData.execution_time),
      project_id: formData.project_id === 'none' ? null : formData.project_id,
      project_name: selectedProject?.name || null
    });
    
    setFormData({
      activity_name: "",
      activity_type: "plan_de_trabajo",
      execution_time: "",
      observations: "",
      project_id: "none",
      other_area: "",
      is_meeting: false
    });
    setErrors({});
  };

  const handleProjectChange = (projectId) => {
    setFormData(prev => ({ ...prev, project_id: projectId }));
    
    if (projectId && projectId !== 'none' && !formData.observations.trim()) {
      setErrors(prev => ({
        ...prev,
        observations: "Las observaciones son obligatorias al seleccionar un proyecto"
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.observations;
        return newErrors;
      });
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Plus className="w-5 h-5 text-primary" />
          Registrar Actividad Rápida
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activity_name">Nombre de la Actividad *</Label>
              <Input
                id="activity_name"
                value={formData.activity_name}
                onChange={(e) => setFormData(prev => ({ ...prev, activity_name: e.target.value }))}
                placeholder="Ej: Desarrollo de funcionalidad X"
                className={errors.activity_name ? "border-red-500" : ""}
              />
              {errors.activity_name && (
                <p className="text-xs text-red-500">{errors.activity_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_type">Tipo de Actividad</Label>
              <Select
                value={formData.activity_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, activity_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="execution_time">Tiempo (horas) *</Label>
              <Input
                id="execution_time"
                type="number"
                step="0.25"
                min="0.25"
                value={formData.execution_time}
                onChange={(e) => setFormData(prev => ({ ...prev, execution_time: e.target.value }))}
                placeholder="Ej: 2.5"
                className={errors.execution_time ? "border-red-500" : ""}
              />
              {errors.execution_time && (
                <p className="text-xs text-red-500">{errors.execution_time}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_id">Proyecto (Opcional)</Label>
              <Select
                value={formData.project_id}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.activity_type === "apoyo_solicitado_por_otras_areas" && (
            <div className="space-y-2">
              <Label htmlFor="other_area">Área Solicitante *</Label>
              <Input
                id="other_area"
                value={formData.other_area}
                onChange={(e) => setFormData(prev => ({ ...prev, other_area: e.target.value }))}
                placeholder="Ej: Recursos Humanos"
                className={errors.other_area ? "border-red-500" : ""}
              />
              {errors.other_area && (
                <p className="text-xs text-red-500">{errors.other_area}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observations">
              Observaciones {formData.project_id && formData.project_id !== 'none' && "*"}
            </Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Describe brevemente la actividad realizada..."
              className={`h-20 ${errors.observations ? "border-red-500" : ""}`}
            />
            {errors.observations && (
              <p className="text-xs text-red-500">{errors.observations}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Actividad
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}