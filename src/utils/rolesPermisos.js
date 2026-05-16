// MÓDULO: utils/rolesPermisos.js
// CAPA: Utils — diccionario de roles y permisos del sistema

export const PERMISOS_POR_ROL = {
    admin: [
        // Tareas — solo puede editar tareas que no estén calificadas
        'tasks.create', 'tasks.view.all', 'tasks.update.ungraded', 'tasks.delete.all',
        'tasks.assign', 'tasks.status.update',
        // Usuarios
        'users.view', 'users.edit', 'users.delete', 'users.assign.role',
        'users.deactivate', 'users.reactivate',
        // Calendario
        'calendar.create',
    ],
    instructor: [
        // Tareas
        'tasks.create', 'tasks.view.all', 'tasks.update', 'tasks.delete.all',
        'tasks.assign', 'tasks.grade',
        // Usuarios
        'users.view',
        // Calendario — eventos propios y para estudiantes
        'calendar.create', 'calendar.assign',
    ],
    user: [
        // Tareas — solo las propias
        'tasks.view.own', 'tasks.status.update',
        // Notas personales
        'notes.create', 'notes.view.own',
        // Calendario personal
        'calendar.create.own',
    ],
};

export const METADATOS_ROL = {
    admin:      { nombre: 'Administrador',       descripcion: 'Acceso total: usuarios, tareas, roles y sistema',                icono: 'shield',         color: 'var(--color-admin)' },
    instructor: { nombre: 'Instructor / Docente', descripcion: 'Gestión de tareas, calificaciones y calendario de estudiantes', icono: 'graduation-cap', color: 'var(--color-instructor)' },
    user:       { nombre: 'Estudiante',           descripcion: 'Tareas propias, notas personales y eventos de calendario',      icono: 'user',           color: 'var(--color-primario)' },
};