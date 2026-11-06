# Guía de entrega · Sprint 1 (paso a paso)

Este archivo es solo para ti. Puedes borrarlo antes de subir el repositorio.

## 1. Pruebas (guía de la Tarea 3)

Abre `index.html`, presiona F12 → Consola y prueba:

| Caso | Qué hacer | Resultado esperado |
|---|---|---|
| 1. Formulario vacío | Presiona "Guardar tarea" sin llenar nada | Aparece la alerta roja con los 4 errores y los campos se marcan |
| 2. Campos incompletos | Llena solo nombre y fecha | La alerta lista solo la descripción y el estado |
| 3. Formulario válido | Llena todo | La alerta se oculta, sale el aviso verde y aparece la tarjeta |

En la consola verás `name:`, `description:`, `date:` y `status:` con lo que escribiste.

## 2. Crear el repositorio y subir el avance por partes

Los revisores miran las fechas de los commits, así que **haz los commits en tus días reales de trabajo**, uno por tarea. No los hagas todos el mismo día.

```bash
git init
git branch -M main
git remote add origin https://github.com/TU-USUARIO/planificador-de-tareas.git
```

**Tarea 1 · Wireframes con Bootstrap**
```bash
git add index.html styles.css
git commit -m "Tarea 1: estructura base con Bootstrap (navbar, hero, secciones)"
git push -u origin main
```

**Tarea 2 · Tarjeta y lista de tareas**
```bash
git add app.js index.html styles.css
git commit -m "Tarea 2: componentes de tarjeta de tarea y lista de tareas"
git push
```

**Tarea 3 · Validación**
```bash
git add app.js index.html
git commit -m "Tarea 3: validFormFieldInput y alerta de errores"
git push
```

**Cierre**
```bash
git add README.md
git commit -m "Cierre Sprint 1: README con Trello, Figma y demo"
git push
```

Si ya tienes todo el código junto, puedes ir quitando partes del archivo y volviéndolas a agregar en cada commit, para que el historial refleje el avance real.

## 3. Publicar en GitHub Pages

1. Repositorio en GitHub → **Settings** → **Pages**.
2. En *Build and deployment*, elige **Deploy from a branch**.
3. Rama **main**, carpeta **/ (root)** → **Save**.
4. Espera uno o dos minutos y copia el enlace.

## 4. Completar el README.md

Reemplaza los tres textos `PEGAR-AQUI-…` por:
- Tu tablero de Trello del Sprint 1.
- Tu archivo de Figma con el wireframe.
- El enlace de GitHub Pages.

## 5. Checklist final

- [ ] Tarea 1, 2 y 3 implementadas
- [ ] `app.js` vinculado en `index.html`
- [ ] `validFormFieldInput(data)` implementada
- [ ] Alerta se muestra y se oculta correctamente
- [ ] Commits con fechas distintas
- [ ] README con descripción, Trello, Figma y demo
- [ ] GitHub Pages funcionando y enlace probado
