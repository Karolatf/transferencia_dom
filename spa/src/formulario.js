export const formulario = (nombre) => {
    return `<form action="/procesar-datos" method="post">
  <!-- Campo de Texto -->
  <label for="nombre">Nombre:</label><br>
  <input type="text" id="nombre" name="nombre" required><br><br>

  <!-- Campo de Correo -->
  <label for="email">Correo electrónico:</label><br>
  <input type="email" id="email" name="email" required><br><br>

  <!-- Campo de Contraseña -->
  <label for="pwd">Contraseña:</label><br>
  <input type="password" id="pwd" name="pwd"><br><br>

  <!-- Botón de Envío -->
  <input type="submit" value="Enviar">
</form>`
}