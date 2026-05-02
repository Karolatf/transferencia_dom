// MÓDULO: utils/rolesPermisos.js
// CAPA: Utils — diccionario de roles y permisos del sistema

export const PERMISOS_POR_ROL = {
    admin: [
        'tasks.create', 'tasks.view.all', 'tasks.update', 'tasks.delete.all',
        'tasks.assign', 'tasks.status.update', 'users.view', 'users.edit',
        'users.delete', 'users.assign.role',
    ],
    instructor: [
        'tasks.create', 'tasks.view.all', 'tasks.update', 'tasks.delete.all',
        'tasks.assign', 'users.view',
    ],
    user: [
        'tasks.status.update', 'tasks.view.all',
    ],
};

export const METADATOS_ROL = {
    admin:      { nombre: 'Administrador',       descripcion: 'Acceso total al sistema',             icono: 'shield',         color: 'var(--color-admin)' },
    instructor: { nombre: 'Instructor / Docente', descripcion: 'Gestión de tareas y estudiantes',    icono: 'graduation-cap', color: 'var(--color-instructor)' },
    user:       { nombre: 'Estudiante',           descripcion: 'Ver y actualizar sus propias tareas', icono: 'user',           color: 'var(--color-primario)' },
};