// Archivo: utils/rolesPermisos.js
// Este archivo define qué puede hacer cada tipo de usuario en la aplicación.
// Los permisos son cadenas de texto con un formato "recurso.accion" (ej: "tasks.create").
// Otros archivos consultan estos permisos para saber si el usuario puede ejecutar una acción.

// Exportamos el objeto PERMISOS_POR_ROL que lista todas las acciones permitidas para cada rol
export const PERMISOS_POR_ROL = {
    // Permisos del Administrador: tiene acceso completo al sistema
    admin: [
        // Tareas — el administrador puede crear, ver todas, editar las que no estén calificadas, eliminar todas,
        // asignar tareas a usuarios y cambiar el estado de las tareas
        'tasks.create', 'tasks.view.all', 'tasks.update.ungraded', 'tasks.delete.all',
        'tasks.assign', 'tasks.status.update',
        // Usuarios — el administrador puede ver, editar, eliminar, asignar roles,
        // desactivar y reactivar cuentas de usuario
        'users.view', 'users.edit', 'users.delete', 'users.assign.role',
        'users.deactivate', 'users.reactivate',
        // Calendario — el administrador puede crear eventos
        'calendar.create',
    ],
    // Permisos del Instructor: gestión de tareas, calificaciones y calendario de estudiantes
    instructor: [
        // Tareas — el instructor puede crear, ver todas, editar, eliminar, asignar y calificar tareas
        'tasks.create', 'tasks.view.all', 'tasks.update', 'tasks.delete.all',
        'tasks.assign', 'tasks.grade',
        // Usuarios — el instructor solo puede ver la lista de usuarios
        'users.view',
        // Calendario — el instructor puede crear eventos propios y asignarlos a estudiantes
        'calendar.create', 'calendar.assign',
    ],
    // Permisos del Estudiante (rol "user"): acceso limitado a sus propias tareas y notas
    user: [
        // Tareas — el estudiante solo puede ver sus propias tareas y cambiar su estado
        'tasks.view.own', 'tasks.status.update',
        // Notas personales — el estudiante puede crear y ver sus propias notas tipo post-it
        'notes.create', 'notes.view.own',
        // Calendario personal — el estudiante puede crear sus propios eventos de calendario
        'calendar.create.own',
    ],
};

// Exportamos el objeto METADATOS_ROL con la información visual y descriptiva de cada rol
// Se usa para mostrar el nombre, descripción, ícono y color en los paneles de la aplicación
export const METADATOS_ROL = {
    // Administrador: escudo azul, acceso total
    admin:      { nombre: 'Administrador',       descripcion: 'Acceso total: usuarios, tareas, roles y sistema',                icono: 'shield',         color: 'var(--color-admin)' },
    // Instructor: birrete verde, gestión de tareas y estudiantes
    instructor: { nombre: 'Instructor / Docente', descripcion: 'Gestión de tareas, calificaciones y calendario de estudiantes', icono: 'graduation-cap', color: 'var(--color-instructor)' },
    // Estudiante: usuario morado, tareas y notas propias
    user:       { nombre: 'Estudiante',           descripcion: 'Tareas propias, notas personales y eventos de calendario',      icono: 'user',           color: 'var(--color-primario)' },
};
