# Proyecto Backend NASA - Express

Este proyecto es un servidor backend en **Node.js con Express** que:
- Se conecta a la **API de la NASA (NeoWs, Near Earth Object Web Service)** usando una API Key.
- Procesa y sirve datos de meteoritos/asteroides.
- Usa **Axios** para las llamadas HTTP y **dotenv** para manejar claves de entorno.
- Expone endpoints REST en `/api/nasa` para que un frontend (React o Next.js) pueda consumir los datos.
- La estructura del proyecto es:
  - `app.js`: punto de entrada del servidor Express.
  - `routes/`: define rutas como `/nasa.js`.
  - `controllers/`: maneja la lógica de cada endpoint.
  - `services/`: se conecta a la API de NASA y procesa los datos.
  - `.env`: almacena `NASA_API_KEY`.

Requisitos:
- Mantener segura la clave `NASA_API_KEY` (nunca exponerla en frontend).
- Validar parámetros de entrada (ejemplo: `start_date`, `end_date`).
- Devolver respuestas JSON listas para usar en frontend.
- Posibilidad de agregar seguridad adicional con JWT o API keys propias más adelante.

Objetivo:
- Crear un backend modular, seguro y escalable que pueda integrarse fácilmente con un frontend en React/Next.js para un hackathon de meteoritos (NASA Space Apps Challenge).
