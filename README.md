# Portal MILUGA

Portal web estatico conectado a Supabase para uso de colaboradores.

## Publicacion

Este paquete esta preparado para GitHub Pages. Incluye solamente los archivos publicos necesarios para abrir el portal:

- `index.html`
- `app.js`
- `styles.css`
- `supabase-config.js`
- `assets/logo-luga.jpeg`

No incluye cotizaciones recuperadas, archivos SQL, funciones de Supabase ni configuracion local de la computadora.

## Correos

Los botones para enviar cotizaciones y ordenes usan una funcion segura en Supabase llamada `send-document-email`. Para que funcionen, esa funcion debe estar desplegada y debe tener configurados los secretos `RESEND_API_KEY`, `MAIL_FROM` y `MAIL_REPLY_TO` en Supabase.
