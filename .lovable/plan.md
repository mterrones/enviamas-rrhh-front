

## Plan: Formulario de Creación de Nuevo Empleado

### Objetivo
Crear una página `/empleados/nuevo` con un formulario completo organizado en secciones que cubra todos los campos del perfil del empleado (datos personales, laborales, contacto, bancarios, documentos).

### Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/pages/NewEmployeePage.tsx` | **Nuevo** — Formulario completo con secciones colapsables/cards |
| `src/App.tsx` | Agregar ruta `/empleados/nuevo` (antes de `/empleados/:id`) |
| `src/pages/EmployeesPage.tsx` | Cambiar botón "Nuevo Empleado" a `Link` hacia `/empleados/nuevo` |

### Estructura del formulario (`NewEmployeePage.tsx`)

Página con enlace "Volver a empleados" y formulario organizado en cards:

**Card 1 — Datos Personales:**
- Foto de perfil (upload placeholder)
- Nombre completo, DNI, fecha de nacimiento, nivel de estudios, carrera
- Carga de documentos: antecedentes policiales (PDF), CV (PDF)

**Card 2 — Datos de Contacto:**
- Teléfono, correo, dirección
- Contacto de emergencia: nombre y teléfono

**Card 3 — Datos Bancarios:**
- Banco (select), número de cuenta, sistema previsional (AFP/ONP select)

**Card 4 — Datos Laborales:**
- Puesto y área (selects con opciones: Contact Center, Chat Bot, Campañas, TI, Admin)
- Modalidad (Full-time / Part-time)
- Horario laboral
- Sueldo
- Tipo de contrato (Plazo Fijo, Indefinido, Locación de Servicios)
- Fechas de inicio y fin de contrato
- Carga de contrato PDF
- Jefe directo (select con empleados existentes)
- Estado inicial (select)

**Acciones:** Botones "Cancelar" (vuelve a `/empleados`) y "Guardar Empleado" (muestra toast de éxito y redirige a la lista).

### Detalles técnicos
- Estado local con `useState` para cada campo del formulario
- Selects para: área, puesto, modalidad, contrato, banco, previsión, estado, jefe
- Toast de confirmación al guardar (mock)
- Navegación con `useNavigate`
- Estilo consistente con el resto de la app (Cards, Labels, Inputs, Selects)

