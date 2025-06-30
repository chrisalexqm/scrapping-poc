# SUNAT RUC Scraper (PoC)

Pequeña prueba de concepto para extraer los datos de un RUC desde el portal de SUNAT usando Puppeteer.

Dos variantes disponibles:

| Script | Comando NPM | Navegador | Descripción |
|--------|-------------|-----------|-------------|
| **Local** | `npm run sunat:local -- <RUC>` | `puppeteer` (Chrome headless local) | Lanza un navegador Chromium local (descargado por Puppeteer) y navega directamente al portal SUNAT. |
| **ZenRows** | `npm run sunat:zen -- <RUC>` | `puppeteer-core` + ZenRows Browser | Se conecta al browser remoto provisto por ZenRows (WebSocket) ideal para evitar bloqueos o restricciones IP. |

## Instalación

```bash
npm install
```

> Asegúrate de tener al menos Node 18.

## Uso rápido

```bash
# Versión local
npm run sunat:local -- 20555530090

# Versión ZenRows
npm run sunat:zen -- 20555530090
```

## Variables de entorno

| Variable | Por defecto | Propósito |
|----------|-------------|-----------|
| `NAV_TIMEOUT_MS` | `360000` | Timeout (ms) para esperas de navegación en la versión ZenRows. |

Ejemplo de uso con timeout personalizado:

```bash
NAV_TIMEOUT_MS=180000 npm run sunat:zen -- 20555530090
```

## Salida

Ambas versiones imprimen:

1. Log de marcas de tiempo y duración de cada paso clave del scraping.
2. Objeto JSON con los datos extraídos (estado, domicilio fiscal, actividades, representantes legales, etc.).

## Estructura del proyecto

```
scrapping-poc/
├─ index.js         # Versión local
├─ index.zen.js     # Versión ZenRows
├─ package.json     # Scripts y dependencias
├─ README.md        # Este archivo
└─ .gitignore
```

---

Proyecto de demostración para fines educativos. No está afiliado a SUNAT ni a ZenRows.
