# Relato · Picker de Google Fotos

Web para mandar un correo, que la familia elija fotos a mano y dejarlas pendientes en la bandeja de Relato.

## Lo que sí se puede

1. Relato manda un correo con un enlace único (`/invitar`).
2. Alguien abre el enlace, elige hasta 10 fotos con el Picker (o el modo demo).
3. Esas fotos pasan a la bandeja de **Relato** o **Relato Mascotas** como pendientes. Autor y acompañante dan el dual sí. Nada se publica solo.

La IA **no** puede recorrer Google Fotos cada mes a solas. Google lo cerró en marzo de 2025.

## Arranque local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre [http://127.0.0.1:43147](http://127.0.0.1:43147).

## Correo

En **Correo** pones el email del cliente. Se crea un enlace `/i/…`.

- Si hay `RESEND_API_KEY`, Relato envía el correo.
- Si no, abre Gmail con el texto listo o copia el enlace.

## Producción

https://relato-fotos-picker.vercel.app

El Client ID de Google y la URL pública van en `.env.production` (no son secretos). `RESEND_API_KEY` sí es secreto: si lo pones en Vercel, el correo se envía solo; si no, la pantalla Correo abre Gmail.

## Google Fotos de verdad

1. Activa **Google Photos Picker API**.
2. Client ID OAuth web en `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
3. Orígenes autorizados: `http://127.0.0.1:43147` y `https://relato-fotos-picker.vercel.app`.
4. Testers mientras la app no esté verificada.

Relato nunca pide la contraseña.

## Límites

- Máximo 10 candidatas pendientes.
- Pendiente no se auto-aprueba.
- El Picker no va en iframe.
