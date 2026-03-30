

## Plan: Formulario de Nueva Solicitud de Vacaciones

### Objetivo
Agregar un Dialog/modal al botón "Nueva Solicitud" en la pestaña Vacaciones del módulo de Asistencia, con un formulario para crear solicitudes de vacaciones.

### Cambio único en `src/pages/AttendancePage.tsx`

1. **Agregar estado** `showNuevaSolicitud` con `useState<boolean>(false)` y estado para la lista de solicitudes (para agregar nuevas dinámicamente)
2. **Dialog con formulario** que incluya:
   - Empleado (Select con lista mock de empleados)
   - Fecha de inicio (input date)
   - Fecha de fin (input date)
   - Cálculo automático de días entre fechas
   - Motivo / observaciones (textarea)
3. **Al guardar**: agregar la solicitud a la lista con estado "Pendiente", cerrar el modal y mostrar toast de confirmación
4. **Botón "Nueva Solicitud"** → `onClick={() => setShowNuevaSolicitud(true)}`

### Imports adicionales
- `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter` de `@/components/ui/dialog`
- `Input`, `Label`, `Textarea` de los componentes UI existentes
- `Select` (ya importado)
- `useToast` para confirmación

