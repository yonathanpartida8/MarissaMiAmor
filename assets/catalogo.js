// GENERADO por `node herramientas/contenido.mjs`: lo que hay en assets/ y en «musica assets/».
// No se edita a mano: deja tus componentes, imágenes y canciones en sus carpetas y se rehace solo.
export default {
 "categorias": [
  {
   "id": "buttons",
   "nombre": "Botones",
   "items": [
    {
     "tipo": "componente",
     "id": "buttons/boton-corazon",
     "nombre": "Botón corazón",
     "descripcion": "Una tarjetita de papel con un botón que late y suelta corazones.",
     "ruta": "assets/buttons/boton-corazon/",
     "entrada": "index.html",
     "ancho": 280,
     "alto": 150,
     "parametros": [
      {
       "id": "texto",
       "tipo": "texto",
       "etiqueta": "Texto del botón",
       "def": "Ábreme"
      },
      {
       "id": "color",
       "tipo": "color",
       "etiqueta": "Color del botón",
       "def": "#ff8fb8"
      },
      {
       "id": "accion",
       "tipo": "opciones",
       "etiqueta": "Al tocarlo, además",
       "def": "",
       "opciones": [
        [
         "",
         "Nada"
        ],
        [
         "siguiente",
         "Pasar a la siguiente página"
        ],
        [
         "anterior",
         "Volver a la anterior"
        ],
        [
         "musica",
         "Pausar / poner la música"
        ]
       ]
      }
     ],
     "decorativo": false,
     "aislado": false,
     "miniatura": null,
     "archivos": [
      "asset.json",
      "index.html",
      "script.js",
      "style.css"
     ],
     "peso": 4586
    }
   ]
  },
  {
   "id": "players",
   "nombre": "Reproductores",
   "items": [
    {
     "tipo": "componente",
     "id": "players/casete",
     "nombre": "Casete",
     "descripcion": "Un reproductor de casete: toca ▶ y suena tu canción (las ruedas giran).",
     "ruta": "assets/players/casete/",
     "entrada": "index.html",
     "ancho": 310,
     "alto": 210,
     "parametros": [
      {
       "id": "cancion",
       "tipo": "audio",
       "etiqueta": "Canción"
      },
      {
       "id": "titulo",
       "tipo": "texto",
       "etiqueta": "Título",
       "def": "Nuestra canción"
      },
      {
       "id": "subtitulo",
       "tipo": "texto",
       "etiqueta": "Abajo",
       "def": "lado A · para ti"
      },
      {
       "id": "color",
       "tipo": "color",
       "etiqueta": "Color",
       "def": "#f7c6d9"
      }
     ],
     "decorativo": false,
     "aislado": false,
     "miniatura": null,
     "archivos": [
      "asset.json",
      "index.html",
      "script.js",
      "style.css"
     ],
     "peso": 3943
    }
   ]
  },
  {
   "id": "portraits",
   "nombre": "Retratos",
   "items": [
    {
     "tipo": "componente",
     "id": "portraits/retrato-ovalado",
     "nombre": "Retrato ovalado",
     "descripcion": "Un marco dorado ovalado, como de fotografía antigua, con su cartelito.",
     "ruta": "assets/portraits/retrato-ovalado/",
     "entrada": "index.html",
     "ancho": 240,
     "alto": 290,
     "parametros": [
      {
       "id": "foto",
       "tipo": "imagen",
       "etiqueta": "Foto"
      },
      {
       "id": "texto",
       "tipo": "texto",
       "etiqueta": "Cartelito",
       "def": "mi amor"
      }
     ],
     "decorativo": false,
     "aislado": false,
     "miniatura": null,
     "archivos": [
      "asset.json",
      "index.html"
     ],
     "peso": 2010
    }
   ]
  },
  {
   "id": "frames",
   "nombre": "Marcos",
   "items": [
    {
     "tipo": "componente",
     "id": "frames/marco-scrapbook",
     "nombre": "Marco scrapbook",
     "descripcion": "Foto pegada con cinta washi, su notita y un garabato.",
     "ruta": "assets/frames/marco-scrapbook/",
     "entrada": "index.html",
     "ancho": 270,
     "alto": 320,
     "parametros": [
      {
       "id": "foto",
       "tipo": "imagen",
       "etiqueta": "Foto"
      },
      {
       "id": "texto",
       "tipo": "texto",
       "etiqueta": "Notita",
       "def": "nosotros ♡"
      }
     ],
     "decorativo": false,
     "aislado": false,
     "miniatura": null,
     "archivos": [
      "asset.json",
      "index.html"
     ],
     "peso": 2246
    }
   ]
  },
  {
   "id": "effects",
   "nombre": "Efectos",
   "items": [
    {
     "tipo": "componente",
     "id": "effects/lluvia-corazones",
     "nombre": "Lluvia de corazones",
     "descripcion": "Corazoncitos que caen meciéndose. Es decorativo: los toques pasan a lo de abajo.",
     "ruta": "assets/effects/lluvia-corazones/",
     "entrada": "index.html",
     "ancho": 390,
     "alto": 844,
     "parametros": [
      {
       "id": "cantidad",
       "tipo": "numero",
       "etiqueta": "Cuántos",
       "def": 22,
       "min": 4,
       "max": 60
      },
      {
       "id": "colores",
       "tipo": "texto",
       "etiqueta": "Colores (separados por coma)",
       "def": "#ff8fb8,#ffc4d9,#f2c27d,#d8397a"
      }
     ],
     "decorativo": true,
     "aislado": false,
     "miniatura": null,
     "archivos": [
      "asset.json",
      "index.html"
     ],
     "peso": 2703
    }
   ]
  },
  {
   "id": "decorations",
   "nombre": "Decoraciones",
   "items": [
    {
     "tipo": "imagen",
     "id": "decorations/corazon-garabato.svg",
     "nombre": "Corazon garabato",
     "ruta": "assets/decorations/corazon-garabato.svg",
     "ancho": 120,
     "alto": 110,
     "peso": 487
    },
    {
     "tipo": "imagen",
     "id": "decorations/estrella-crayon.svg",
     "nombre": "Estrella crayon",
     "ruta": "assets/decorations/estrella-crayon.svg",
     "ancho": 120,
     "alto": 116,
     "peso": 422
    },
    {
     "tipo": "imagen",
     "id": "decorations/flor-crayon.svg",
     "nombre": "Flor crayon",
     "ruta": "assets/decorations/flor-crayon.svg",
     "ancho": 120,
     "alto": 140,
     "peso": 669
    },
    {
     "tipo": "imagen",
     "id": "decorations/sello-te-amo.svg",
     "nombre": "Sello te amo",
     "ruta": "assets/decorations/sello-te-amo.svg",
     "ancho": 140,
     "alto": 140,
     "peso": 561
    }
   ]
  },
  {
   "id": "ui",
   "nombre": "Interfaz",
   "items": [
    {
     "tipo": "componente",
     "id": "ui/flecha-siguiente",
     "nombre": "Flecha a crayón",
     "descripcion": "Una flecha dibujada a mano que pasa de página al tocarla.",
     "ruta": "assets/ui/flecha-siguiente/",
     "entrada": "index.html",
     "ancho": 90,
     "alto": 90,
     "parametros": [
      {
       "id": "accion",
       "tipo": "opciones",
       "etiqueta": "Al tocarla",
       "def": "siguiente",
       "opciones": [
        [
         "siguiente",
         "Página siguiente"
        ],
        [
         "anterior",
         "Página anterior"
        ],
        [
         "inicio",
         "Volver a la portada"
        ]
       ]
      }
     ],
     "decorativo": false,
     "aislado": false,
     "miniatura": null,
     "archivos": [
      "asset.json",
      "index.html"
     ],
     "peso": 1737
    }
   ]
  },
  {
   "id": "audio",
   "nombre": "Sonidos",
   "items": [
    {
     "tipo": "audio",
     "id": "audio/abrir.mp3",
     "nombre": "Abrir",
     "ruta": "assets/audio/abrir.mp3",
     "peso": 2120686
    },
    {
     "tipo": "audio",
     "id": "audio/musica.mp3",
     "nombre": "Musica",
     "ruta": "assets/audio/musica.mp3",
     "peso": 5165704
    },
    {
     "tipo": "audio",
     "id": "audio/musicaa.mp3",
     "nombre": "Musicaa",
     "ruta": "assets/audio/musicaa.mp3",
     "peso": 2
    },
    {
     "tipo": "audio",
     "id": "audio/musiyyca.mp3",
     "nombre": "Musiyyca",
     "ruta": "assets/audio/musiyyca.mp3",
     "peso": 2
    },
    {
     "tipo": "audio",
     "id": "audio/sonido.mp3",
     "nombre": "Sonido",
     "ruta": "assets/audio/sonido.mp3",
     "peso": 417243
    }
   ]
  },
  {
   "id": "img",
   "nombre": "Imágenes",
   "items": [
    {
     "tipo": "imagen",
     "id": "img/imagen83.png",
     "nombre": "Imagen83",
     "ruta": "assets/img/imagen83.png",
     "peso": 75219
    }
   ]
  }
 ],
 "musica": []
};
