import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usersAPI, areasAPI } from "@/api";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ListChecks, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    area_id: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Fetch areas for selection (public endpoint)
  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      try {
        return await areasAPI.getAll();
      } catch (error) {
        console.error("Error loading areas:", error);
        return [];
      }
    },
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!formData.email || !formData.password || !formData.full_name) {
      setError("Por favor completa todos los campos obligatorios");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      // Create user with role "user" by default
      await usersAPI.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: "user",
        area_id:
          formData.area_id && formData.area_id !== "none"
            ? parseInt(formData.area_id)
            : null,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.error ||
          "Error al registrar el usuario. Intenta nuevamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <ListChecks className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-foreground">
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Regístrate en TimeTracker
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert
                variant="destructive"
                className="border-red-200 dark:border-red-900"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                <AlertDescription className="text-green-800 dark:text-green-200">
                  ¡Registro exitoso! Redirigiendo al login...
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="full_name"
                className="text-foreground font-medium"
              >
                Nombre Completo *
              </Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Juan Pérez"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                required
                disabled={isLoading || success}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Correo Electrónico *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                disabled={isLoading || success}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Contraseña *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
                disabled={isLoading || success}
                className="h-11"
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area" className="text-foreground font-medium">
                Área (Opcional)
              </Label>
              <Select
                value={formData.area_id}
                onValueChange={(value) =>
                  handleChange("area_id", value === "none" ? "" : value)
                }
                disabled={isLoading || success}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecciona un área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin área</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registrando...
                </>
              ) : success ? (
                "¡Registro exitoso!"
              ) : (
                "Crear Cuenta"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
