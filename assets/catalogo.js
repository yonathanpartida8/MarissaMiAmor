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
 "musica": [],
 "extras": {
  "animaciones": [
   {
    "id": "animaciones/aparecer-suave",
    "nombre": "Aparecer suave",
    "ruta": "assets/animaciones/aparecer-suave/",
    "definicion": [
     "animacion.json"
    ],
    "miniatura": null
   },
   {
    "id": "animaciones/flotando",
    "nombre": "Flotando",
    "ruta": "assets/animaciones/flotando/",
    "definicion": [
     "animacion.json"
    ],
    "miniatura": null
   },
   {
    "id": "animaciones/latido-con-codigo",
    "nombre": "Latido con codigo",
    "ruta": "assets/animaciones/latido-con-codigo/",
    "definicion": [
     "animacion.js"
    ],
    "miniatura": null
   },
   {
    "id": "animaciones/rebote",
    "nombre": "Rebote",
    "ruta": "assets/animaciones/rebote/",
    "definicion": [
     "animacion.css"
    ],
    "miniatura": null
   }
  ],
  "transiciones": [
   {
    "id": "transiciones/deslizar",
    "nombre": "Deslizar",
    "ruta": "assets/transiciones/deslizar/",
    "definicion": [
     "transicion.json"
    ],
    "miniatura": null
   },
   {
    "id": "transiciones/fundido-suave",
    "nombre": "Fundido suave",
    "ruta": "assets/transiciones/fundido-suave/",
    "definicion": [
     "transicion.json"
    ],
    "miniatura": null
   },
   {
    "id": "transiciones/glitch",
    "nombre": "Glitch",
    "ruta": "assets/transiciones/glitch/",
    "definicion": [
     "transicion.json"
    ],
    "miniatura": null
   },
   {
    "id": "transiciones/zoom",
    "nombre": "Zoom",
    "ruta": "assets/transiciones/zoom/",
    "definicion": [
     "transicion.css"
    ],
    "miniatura": null
   }
  ],
  "efectos": [
   {
    "id": "efectos/calido.json",
    "nombre": "Calido",
    "ruta": "assets/efectos/calido.json",
    "miniatura": null
   },
   {
    "id": "efectos/frio.json",
    "nombre": "Frio",
    "ruta": "assets/efectos/frio.json",
    "miniatura": null
   },
   {
    "id": "efectos/noche.json",
    "nombre": "Noche",
    "ruta": "assets/efectos/noche.json",
    "miniatura": null
   },
   {
    "id": "efectos/sonador.json",
    "nombre": "Sonador",
    "ruta": "assets/efectos/sonador.json",
    "miniatura": null
   }
  ],
  "fondos": [
   {
    "tipo": "html",
    "id": "fondos/aurora",
    "nombre": "Aurora",
    "ruta": "assets/fondos/aurora/index.html",
    "base": "assets/fondos/aurora/",
    "archivos": [
     "index.html"
    ],
    "miniatura": null
   },
   {
    "tipo": "html",
    "id": "fondos/corazones-flotando",
    "nombre": "Corazones flotando",
    "ruta": "assets/fondos/corazones-flotando/index.html",
    "base": "assets/fondos/corazones-flotando/",
    "archivos": [
     "index.html"
    ],
    "miniatura": null
   },
   {
    "tipo": "html",
    "id": "fondos/estrellas",
    "nombre": "Estrellas",
    "ruta": "assets/fondos/estrellas/index.html",
    "base": "assets/fondos/estrellas/",
    "archivos": [
     "index.html"
    ],
    "miniatura": null
   }
  ],
  "sonidos": {
   "abrir": [
    "assets/sonidos-editor/abrir/abrir-1.wav",
    "assets/sonidos-editor/abrir/abrir-2.wav"
   ],
   "arrastrar": [
    "assets/sonidos-editor/arrastrar/arrastrar-1.wav",
    "assets/sonidos-editor/arrastrar/arrastrar-2.wav"
   ],
   "borrar": [
    "assets/sonidos-editor/borrar/borrar-1.wav",
    "assets/sonidos-editor/borrar/borrar-2.wav"
   ],
   "botones": [
    "assets/sonidos-editor/botones/botones-1.wav",
    "assets/sonidos-editor/botones/botones-2.wav",
    "assets/sonidos-editor/botones/botones-3.wav"
   ],
   "cerrar": [
    "assets/sonidos-editor/cerrar/cerrar-1.wav",
    "assets/sonidos-editor/cerrar/cerrar-2.wav"
   ],
   "deshacer": [
    "assets/sonidos-editor/deshacer/deshacer-1.wav",
    "assets/sonidos-editor/deshacer/deshacer-2.wav"
   ],
   "error": [
    "assets/sonidos-editor/error/error-1.wav"
   ],
   "exito": [
    "assets/sonidos-editor/exito/exito-1.wav"
   ],
   "guardar": [
    "assets/sonidos-editor/guardar/guardar-1.wav",
    "assets/sonidos-editor/guardar/guardar-2.wav"
   ],
   "seleccionar": [
    "assets/sonidos-editor/seleccionar/seleccionar-1.wav",
    "assets/sonidos-editor/seleccionar/seleccionar-2.wav"
   ],
   "soltar": [
    "assets/sonidos-editor/soltar/soltar-1.wav",
    "assets/sonidos-editor/soltar/soltar-2.wav"
   ]
  },
  "iconos": {}
 }
};
