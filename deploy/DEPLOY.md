# Despliegue en VPS (como cerrajeria)

Dominio: **https://dashboardad.grupomaclabi.com/**  
Ruta en servidor: **/var/www/dashboardAD**

## 1. Ver cómo está configurado cerrajeria (en el VPS)

Ejecuta estos comandos **en tu VPS** como root:

```bash
# Buscar el archivo de nginx de cerrajeria
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/

# Ver contenido (ajusta el nombre si difiere)
cat /etc/nginx/sites-available/cerrajeria

# Si no existe con ese nombre, buscar referencias
grep -r "cerrajeria" /etc/nginx/

# Ver con qué puerto corre (PM2)
pm2 list
pm2 show cerrajeria
```

Copia la salida de `cat` y `pm2 show` si quieres replicar el mismo patrón al 100%.

---

## 2. Preparar el proyecto en el VPS

```bash
cd /var/www/dashboardAD

# Variables de entorno (NO subir a git)
nano .env
```

Contenido mínimo de `.env`:

```env
NODE_ENV=production
AUTH_SECRET=genera_un_secreto_largo_y_aleatorio_aqui
AUTH_USERNAME=admin
AUTH_PASSWORD=tu_password_seguro

GOOGLE_CREDENTIALS_PATH=./google-credentials.json
GOOGLE_SHEETS_SPREADSHEET_ID_1=tu_spreadsheet_id
GOOGLE_SHEETS_RANGE_1=Base!A:Z
GOOGLE_SHEETS_RANGE_2='Base MM PDV'!A:Z
GOOGLE_SHEETS_RANGE_CUOTA_PREPAGO='Cuota Prepago'!A:AG
GOOGLE_SHEETS_RANGE_CUOTA_POSTPAGO='Cuota Postpago'!A:AG
```

Sube `google-credentials.json` al mismo directorio:

```bash
# Desde tu PC (PowerShell), ejemplo con scp:
scp "d:\Programacion\NextJS\dashboard-ad\google-credentials.json" root@TU_IP:/var/www/dashboardAD/
```

Build y PM2:

```bash
cd /var/www/dashboardAD
npm install
npm run build

# Instalar PM2 si no lo tienes
npm install -g pm2

# Arrancar con el puerto 3010 (cambia si choca con otro servicio)
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 3. Nginx

```bash
# Copiar config
cp /var/www/dashboardAD/deploy/nginx-dashboardad.conf /etc/nginx/sites-available/dashboardad

# Activar sitio
ln -sf /etc/nginx/sites-available/dashboardad /etc/nginx/sites-enabled/dashboardad

# Probar y recargar
nginx -t
systemctl reload nginx
```

---

## 4. SSL con Certbot (HTTPS)

Si cerrajeria ya usa certbot, repite lo mismo:

```bash
certbot --nginx -d dashboardad.grupomaclabi.com
```

O si usas wildcard/manual, copia el bloque `ssl_certificate` de cerrajeria y adáptalo.

---

## 5. DNS

En tu panel DNS (grupomaclabi.com), crea un registro:

| Tipo | Nombre        | Valor        |
|------|---------------|--------------|
| A    | dashboardad   | IP de tu VPS |

Espera propagación (minutos a horas) y prueba:

```bash
curl -I https://dashboardad.grupomaclabi.com
```

---

## 6. Actualizar después de cambios en git

```bash
cd /var/www/dashboardAD
git pull
npm install
npm run build
pm2 restart dashboardad
```

---

## Puertos

Este proyecto usa **3010** por defecto (`deploy/ecosystem.config.cjs`).  
Si cerrajeria usa otro puerto, elige uno libre:

```bash
ss -tlnp | grep -E '300[0-9]|301[0-9]'
```

Cambia `3010` en `ecosystem.config.cjs` y en `nginx-dashboardad.conf` si hace falta.
