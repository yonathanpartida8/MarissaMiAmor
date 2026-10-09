# assets/elementos — elementos propios

Deja aquí cualquier `.html` y aparece solo en **Recursos → Elementos**:

- El nombre sale del archivo: `rayos.html` → «Rayos», `lluvia-de-petalos.html` → «Lluvia de petalos».
- Todo va en un solo archivo (HTML + `<style>` + `<script>`): no hace falta CSS ni JS aparte.
- Se ve con su vista previa (sobre fondo oscuro para que se noten los detalles) y se añade a la página con un toque.
- Conserva su estructura, estilos y scripts tal cual. En el librito corre aislado (no puede tocar nada de fuera).

Opcional, en el `<head>`:

```html
<meta name="tamaño" content="360x420">          <!-- ancho x alto al añadirlo -->
<meta name="descripcion" content="Qué hace">
<meta name="decorativo" content="si">           <!-- deja pasar los toques -->
```

Fondo transparente (`html,body{background:transparent}`) para que se vea lo de debajo.
Para que una parte concreta haga algo al tocarla, usa **Efectos al tocar → Zonas táctiles** en el editor.
