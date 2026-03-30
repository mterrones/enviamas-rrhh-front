

## Plan: Módulo de Gestión de Perfiles y Permisos

### Objetivo
Crear una página dedicada de gestión de perfiles (roles) donde el Superadmin RRHH pueda ver, crear, editar y eliminar perfiles/roles con sus permisos asociados por módulo. Todo con data mock interactiva.

### Estructura de la página `/perfiles`

La página tendrá dos secciones principales:

1. **Lista de Perfiles** — Tabla con los 4 roles del sistema, mostrando nombre del perfil, descripción, cantidad de usuarios asignados, cantidad de permisos activos y acciones (ver/editar/eliminar).

2. **Detalle/Edición de Perfil** — Al hacer clic en un perfil o en "Nuevo Perfil", se abre una vista con:
   - Nombre del perfil y descripción (editables)
   - Matriz de permisos agrupada por módulo (Dashboard, Empleados, Asistencia, Boletas, Portal, Activos, Reportes, Configuración), donde cada módulo tiene sus acciones (ver, crear, editar, eliminar, aprobar, exportar, etc.) representadas como checkboxes/switches
   - Indicador visual de cuántos permisos están activos por módulo
   - Lista de usuarios asignados a ese perfil
   - Botones Guardar/Cancelar

### Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/pages/ProfilesPage.tsx` | **Nuevo** — Página completa con tabla de perfiles, modal/panel de edición con matriz de permisos por módulo usando switches, y listado de usuarios asignados |
| `src/App.tsx` | Agregar ruta `/perfiles` |
| `src/components/layout/AppSidebar.tsx` | Agregar ítem "Perfiles y Permisos" con icono `ShieldCheck`, vinculado al permiso `settings.profiles` |
| `src/contexts/AuthContext.tsx` | Agregar permiso `settings.profiles` al rol `superadmin_rrhh` |

### Data mock

- 4 perfiles precargados con sus permisos actuales del `AuthContext`
- Usuarios mock asignados a cada perfil
- Módulos y acciones organizados en una estructura que permita renderizar la matriz de permisos dinámicamente
- Estado local con `useState` para simular CRUD (crear, editar, eliminar perfiles y toggle de permisos)

### Diseño visual

- Consistente con el resto de la app (Cards, Badges, Tables con el mismo estilo)
- Switches naranjas para activar/desactivar permisos individuales
- Badge con contador de permisos activos por módulo
- Badge de color por tipo de perfil (naranja para superadmin, dorado para admin, etc.)

