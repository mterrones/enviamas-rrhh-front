

## Plan: Notificaciones interactivas — clic para navegar, marcar como leída, eliminar

### Objetivo
Hacer que cada notificación: (1) navegue a la ruta correspondiente al hacer clic, (2) cambie visualmente a "leída" tras el clic, y (3) tenga un botón X para eliminarla. Actualizar el contador de no leídas en el TopBar.

### Cambios en `src/components/notifications/NotificationsPanel.tsx`

1. **Estado local de notificaciones**: Convertir la lista estática en `useState` para poder mutar (marcar leídas, eliminar)
2. **Agregar campo `link` a cada notificación**:
   - "Contrato por vencer" → `/empleados`
   - "Boleta disponible" → `/boletas`
   - "Solicitud aprobada" → `/portal`
   - "Nuevo empleado" → `/empleados`
3. **Al hacer clic en una notificación**:
   - Marcarla como `read: true` (cambia el fondo de `bg-accent/50` a transparente)
   - Navegar a la ruta con `useNavigate()` y cerrar el panel
4. **Botón X por notificación**: Agregar un icono X a la derecha de cada item que elimine esa notificación del estado (con `stopPropagation` para no activar la navegación)
5. **Props nuevas**: Agregar `onUnreadCountChange` callback para que el TopBar refleje el conteo real de no leídas
6. **Mensaje vacío**: Mostrar "Sin notificaciones" si la lista queda vacía

### Cambios en `src/components/layout/TopBar.tsx`

1. Reemplazar `unreadCount = 3` por un estado reactivo alimentado desde el callback del `NotificationsPanel`
2. Pasar `onUnreadCountChange` al componente de notificaciones

### Imports adicionales
- `useNavigate` de `react-router-dom`
- `useState` de React

