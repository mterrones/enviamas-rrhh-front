

## Plan: Mejorar navegación del calendario de asistencia

### Situación actual
El calendario de asistencia tiene selectores estáticos de mes (solo Enero-Marzo hardcoded) y no tiene selector de año. No hay botón para ir al registro del empleado.

### Cambios en `src/pages/AttendancePage.tsx`

**1. Reemplazar selectores de mes/año**
- Agregar un `Select` de año (rango 2020-2030) junto al selector de mes
- Expandir el selector de mes para incluir los 12 meses del año
- Ambos controlados con `useState`, inicializados al mes/año actual

**2. Agregar botón "Ver registro"**
- A la derecha de los selectores, agregar un `Button` con icono `FileText` o `Eye` y texto "Ver Registro"
- Al hacer clic, navega a una vista/sección filtrada con el empleado seleccionado + año + mes
- Si el empleado seleccionado es "Todos", mostrar toast indicando que debe seleccionar un empleado primero

**3. Generar datos del calendario dinámicamente**
- Usar `new Date(year, month, 0).getDate()` para obtener días reales del mes seleccionado
- Calcular el día de la semana en que inicia el mes para posicionar correctamente los días en la grilla
- Regenerar los datos mock al cambiar mes/año

### Estructura visual
```text
[Empleado ▼] [Año ▼] [Mes ▼]  [📄 Ver Registro]
```

