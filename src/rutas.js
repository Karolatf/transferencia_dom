// Archivo: rutas.js
// Este archivo es la fuente única de verdad para todas las rutas (URLs internas) de la aplicación.
// La aplicación es una SPA (Single Page Application) que usa el símbolo # en la URL para navegar
// sin recargar la página. Por ejemplo: http://localhost/index.html#admin/usuarios

// Si alguna ruta necesita cambiar de nombre, solo hay que editar el valor aquí.
// El resto del código usa estas constantes, así que se actualiza automáticamente.

// Exportamos el objeto RUTAS con todas las rutas organizadas por el rol del usuario
export const RUTAS = {
    // Rutas disponibles para el rol Estudiante (user)
    USUARIO: {
        INICIO:       'usuario/inicio',        // pantalla principal del estudiante con su dashboard
        TAREAS:       'usuario/tareas',        // lista de tareas asignadas al estudiante
        NOTAS:        'usuario/notas',         // notas personales tipo post-it del estudiante
        VER_TAREA:    'usuario/tareas/ver-tarea',    // pantalla de detalle de una tarea específica
        EDITAR_TAREA: 'usuario/tareas/editar-tarea', // formulario para cambiar el estado de una tarea
    },

    // Rutas disponibles para el rol Administrador (admin)
    ADMIN: {
        INICIO:      'admin/inicio',       // dashboard del administrador con estadísticas
        CREAR_TAREA: 'admin/crear-tarea',  // formulario para crear una nueva tarea
        USUARIOS:    'admin/usuarios',     // tabla con todos los usuarios del sistema
        TAREAS:      'admin/tareas',       // tabla con todas las tareas del sistema
        // Acciones sobre una tarea específica
        VER_TAREA:      'admin/tareas/ver-tarea',      // ver detalle de una tarea
        EDITAR_TAREA:   'admin/tareas/editar-tarea',   // editar los datos de una tarea
        ELIMINAR_TAREA: 'admin/tareas/eliminar-tarea', // eliminar una tarea del sistema
        // Acciones sobre un usuario específico
        VER_USUARIO:      'admin/usuarios/ver-usuario',      // ver perfil de un usuario
        EDITAR_USUARIO:   'admin/usuarios/editar-usuario',   // editar datos de un usuario
        CAMBIAR_ROL:      'admin/usuarios/cambiar-rol',      // cambiar el rol del usuario
        DESACTIVAR:       'admin/usuarios/desactivar-usuario', // desactivar una cuenta de usuario
        ACTIVAR:          'admin/usuarios/activar-usuario',    // reactivar una cuenta desactivada
        ELIMINAR_USUARIO: 'admin/usuarios/eliminar-usuario',   // eliminar permanentemente un usuario
    },

    // Rutas disponibles para el rol Instructor
    INSTRUCTOR: {
        INICIO:      'instructor/inicio',      // dashboard del instructor con sus estadísticas
        CREAR_TAREA: 'instructor/crear-tarea', // formulario para crear una nueva tarea
        ESTUDIANTES: 'instructor/estudiantes', // tabla con los estudiantes del instructor
        TAREAS:      'instructor/tareas',      // tabla con todas las tareas
        // Acciones sobre una tarea específica
        VER_TAREA:      'instructor/tareas/ver-tarea',      // ver detalle de una tarea
        EDITAR_TAREA:   'instructor/tareas/editar-tarea',   // editar los datos de una tarea
        ELIMINAR_TAREA: 'instructor/tareas/eliminar-tarea', // eliminar una tarea
        // Acciones sobre un estudiante específico
        VER_ESTUDIANTE: 'instructor/estudiantes/ver-estudiante', // ver perfil de un estudiante
    },

    // Rutas de los modales (ventanas emergentes) que se abren sobre el panel actual
    MODAL: {
        REGISTRO:        'modal/registro',         // modal para registrar un nuevo usuario
        OLVIDO_PASSWORD: 'modal/olvido-password',  // modal para recuperar contraseña olvidada
        CAMBIO_PASSWORD: 'modal/cambio-password',  // modal para cambiar la contraseña actual
        CERRAR_SESION:   'modal/cerrar-sesion',    // modal de confirmación para cerrar sesión
    },
};

// Exportamos el mapa de secciones del Estudiante
// Conecta el atributo data-seccion del HTML con la ruta destino del router
export const SECCIONES_USUARIO = {
    'inicio': RUTAS.USUARIO.INICIO, // el botón con data-seccion="inicio" navega a usuario/inicio
    'tareas': RUTAS.USUARIO.TAREAS, // el botón con data-seccion="tareas" navega a usuario/tareas
    'notas':  RUTAS.USUARIO.NOTAS,  // el botón con data-seccion="notas" navega a usuario/notas
};

// Exportamos el mapa de secciones del Administrador
export const SECCIONES_ADMIN = {
    'inicio':      RUTAS.ADMIN.INICIO,      // botón Inicio del menú del admin
    'crear-tarea': RUTAS.ADMIN.CREAR_TAREA, // botón Crear Tarea del menú del admin
    'usuarios':    RUTAS.ADMIN.USUARIOS,    // botón Usuarios del menú del admin
    'tareas':      RUTAS.ADMIN.TAREAS,      // botón Tareas del menú del admin
};

// Exportamos el mapa de secciones del Instructor
export const SECCIONES_INSTRUCTOR = {
    'inicio':       RUTAS.INSTRUCTOR.INICIO,      // botón Inicio del menú del instructor
    'crear-tarea':  RUTAS.INSTRUCTOR.CREAR_TAREA, // botón Crear Tarea del menú del instructor
    'estudiantes':  RUTAS.INSTRUCTOR.ESTUDIANTES, // botón Estudiantes del menú del instructor
    'tareas':       RUTAS.INSTRUCTOR.TAREAS,      // botón Tareas del menú del instructor
};
