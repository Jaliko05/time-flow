import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User as UserIcon, Bell, Save, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

export default function Settings() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData({
        team: currentUser.team || 'General',
        work_schedule: currentUser.work_schedule || {},
        lunch_break: currentUser.lunch_break || {
          start: '13:00',
          end: '14:00',
          enabled: true
        },
        notifications_enabled: currentUser.notifications_enabled ?? true
      });
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSave = () => {
    updateUserMutation.mutate(formData);
  };

  const updateSchedule = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      work_schedule: {
        ...prev.work_schedule,
        [day]: {
          ...prev.work_schedule[day],
          [field]: value
        }
      }
    }));
  };

  if (!user || !formData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">
            Personaliza tu perfil y horarios de trabajo
          </p>
        </div>

        {saveSuccess && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <AlertDescription className="text-green-800 dark:text-green-200">
              ¡Configuración guardada exitosamente!
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="schedule">Horarios</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <UserIcon className="w-5 h-5" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Configura tu información básica y equipo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input value={user.full_name} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">
                    El nombre no se puede modificar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Equipo / Área</Label>
                  <Input
                    id="team"
                    value={formData.team}
                    onChange={(e) => setFormData(prev => ({ ...prev, team: e.target.value }))}
                    placeholder="Ej: Desarrollo, Diseño, Marketing..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Clock className="w-5 h-5" />
                  Horario de Trabajo
                </CardTitle>
                <CardDescription>
                  Define tu horario laboral por día de la semana
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {DAYS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3 w-32">
                        <Switch
                          checked={formData.work_schedule[key]?.enabled || false}
                          onCheckedChange={(checked) => updateSchedule(key, 'enabled', checked)}
                        />
                        <Label className="font-medium">{label}</Label>
                      </div>
                      <div className="flex-1 flex items-center gap-4">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Inicio</Label>
                          <Input
                            type="time"
                            value={formData.work_schedule[key]?.start || '09:00'}
                            onChange={(e) => updateSchedule(key, 'start', e.target.value)}
                            disabled={!formData.work_schedule[key]?.enabled}
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Fin</Label>
                          <Input
                            type="time"
                            value={formData.work_schedule[key]?.end || '18:00'}
                            onChange={(e) => updateSchedule(key, 'end', e.target.value)}
                            disabled={!formData.work_schedule[key]?.enabled}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-medium text-foreground mb-4">Hora de Almuerzo</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={formData.lunch_break?.enabled || false}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({
                            ...prev,
                            lunch_break: { ...prev.lunch_break, enabled: checked }
                          }))
                        }
                      />
                      <Label>Descontar hora de almuerzo</Label>
                    </div>
                    
                    {formData.lunch_break?.enabled && (
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label>Inicio</Label>
                          <Input
                            type="time"
                            value={formData.lunch_break.start}
                            onChange={(e) => 
                              setFormData(prev => ({
                                ...prev,
                                lunch_break: { ...prev.lunch_break, start: e.target.value }
                              }))
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <Label>Fin</Label>
                          <Input
                            type="time"
                            value={formData.lunch_break.end}
                            onChange={(e) => 
                              setFormData(prev => ({
                                ...prev,
                                lunch_break: { ...prev.lunch_break, end: e.target.value }
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Bell className="w-5 h-5" />
                  Notificaciones
                </CardTitle>
                <CardDescription>
                  Configura las notificaciones del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <Label className="font-medium">Recordatorios Diarios</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recibe notificaciones si no has registrado actividades
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifications_enabled}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, notifications_enabled: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            className="gap-2"
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}