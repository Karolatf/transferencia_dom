// MÓDULO: rutas.js
// Fuente única de verdad para todas las rutas de la SPA.
//
// Para renombrar una ruta cambia solo el valor de la constante aquí.
// Los data-seccion del HTML son etiquetas DOM internas y NO cambian con esto.

export const RUTAS = {
    USUARIO: {
        INICIO:       'usuario/inicio',
        TAREAS:       'usuario/tareas',
        NOTAS:        'usuario/notas',
        VER_TAREA:    'usuario/tareas/ver-tarea',
        EDITAR_TAREA: 'usuario/tareas/editar-tarea',
    },

    ADMIN: {
        INICIO:      'admin/inicio',
        CREAR_TAREA: 'admin/crear-tarea',
        USUARIOS:    'admin/usuarios',
        TAREAS:      'admin/tareas',
        // Acciones en tareas
        VER_TAREA:      'admin/tareas/ver-tarea',
        EDITAR_TAREA:   'admin/tareas/editar-tarea',
        ELIMINAR_TAREA: 'admin/tareas/eliminar-tarea',
        // Acciones en usuarios
        VER_USUARIO:      'admin/usuarios/ver-usuario',
        EDITAR_USUARIO:   'admin/usuarios/editar-usuario',
        CAMBIAR_ROL:      'admin/usuarios/cambiar-rol',
        DESACTIVAR:       'admin/usuarios/desactivar-usuario',
        ACTIVAR:          'admin/usuarios/activar-usuario',
        ELIMINAR_USUARIO: 'admin/usuarios/eliminar-usuario',
    },

    INSTRUCTOR: {
        INICIO:      'instructor/inicio',
        CREAR_TAREA: 'instructor/crear-tarea',
        ESTUDIANTES: 'instructor/estudiantes',
        TAREAS:      'instructor/tareas',
        // Acciones en tareas
        VER_TAREA:      'instructor/tareas/ver-tarea',
        EDITAR_TAREA:   'instructor/tareas/editar-tarea',
        ELIMINAR_TAREA: 'instructor/tareas/eliminar-tarea',
        // Acciones en estudiantes
        VER_ESTUDIANTE: 'instructor/estudiantes/ver-estudiante',
    },

    MODAL: {
        REGISTRO:        'modal/registro',
        OLVIDO_PASSWORD: 'modal/olvido-password',
        CAMBIO_PASSWORD: 'modal/cambio-password',
        CERRAR_SESION:   'modal/cerrar-sesion',
    },
};

// Mapas data-seccion → ruta por rol.
// El sidebar lee dataset.seccion del HTML y busca aquí la ruta destino.
export const SECCIONES_USUARIO = {
    'inicio': RUTAS.USUARIO.INICIO,
    'tareas': RUTAS.USUARIO.TAREAS,
    'notas':  RUTAS.USUARIO.NOTAS,
};

export const SECCIONES_ADMIN = {
    'inicio':      RUTAS.ADMIN.INICIO,
    'crear-tarea': RUTAS.ADMIN.CREAR_TAREA,
    'usuarios':    RUTAS.ADMIN.USUARIOS,
    'tareas':      RUTAS.ADMIN.TAREAS,
};

export const SECCIONES_INSTRUCTOR = {
    'inicio':       RUTAS.INSTRUCTOR.INICIO,
    'crear-tarea':  RUTAS.INSTRUCTOR.CREAR_TAREA,
    'estudiantes':  RUTAS.INSTRUCTOR.ESTUDIANTES,
    'tareas':       RUTAS.INSTRUCTOR.TAREAS,
};
