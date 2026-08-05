# Implementacion y comparacion de servicios SOAP y REST

## 1. Introduccion

El Sistema Nacional de Informacion Crediticia ofrece dos interfaces para consultar los mismos datos: una API REST y un servicio SOAP. Ambas interfaces reutilizan la logica de negocio, la autenticacion mediante API token y el acceso a PostgreSQL.

SOAP utiliza mensajes XML definidos formalmente mediante WSDL. REST utiliza recursos HTTP documentados mediante OpenAPI y puede responder en JSON o XML.

## 2. Ejecucion del sistema

El sistema completo se inicia desde la raiz del proyecto con:

```bash
docker compose up --build
```

| Recurso | Direccion |
| --- | --- |
| API REST | `http://localhost:3000/api/v1` |
| Swagger REST | `http://localhost:3000/api-docs` |
| Servicio SOAP | `http://localhost:3000/soap/creditos` |
| Contrato WSDL | `http://localhost:3000/soap/creditos?wsdl` |
| Estado del sistema | `http://localhost:3000/health` |

**Captura 1: Servicio SOAP en ejecucion.** Abrir el WSDL en el navegador dejando visible la URL y, al lado, la terminal con los mensajes `SOAP disponible` y `WSDL disponible`.

> Insertar aqui la captura del servicio SOAP en ejecucion.

## 3. Archivo WSDL

El contrato se encuentra en `src/soap/credit.wsdl`. Define el espacio de nombres `http://localhost:3000/soap/creditos`, los tipos XML, mensajes, operaciones, binding SOAP 1.1 y direccion del servicio.

Se visualiza en `http://localhost:3000/soap/creditos?wsdl`.

**Captura 2: Archivo WSDL.** Mostrar en el navegador el inicio del XML con `definitions`, `types` y `targetNamespace`.

> Insertar aqui la captura del archivo WSDL.

## 4. Operaciones SOAP

El servicio `CreditoService`, puerto `CreditoPort`, expone estas operaciones:

| Operacion | Entrada | Resultado |
| --- | --- | --- |
| `ConsultarHistorial` | API token e identificacion | Todos los indicadores crediticios |
| `ConsultarScore` | API token e identificacion | Score, existencia de historial y clasificacion |
| `ConsultarEndeudamiento` | API token e identificacion | Prestamos, tarjetas, porcentaje, nivel y mora |

Las operaciones se encuentran en la seccion `portType` del WSDL y su implementacion esta en `src/soap/credit.soap.js`.

**Captura 3: Definicion de operaciones.** Buscar `portType name="CreditoPortType"` dentro del WSDL y mostrar las tres etiquetas `operation`.

> Insertar aqui la captura de la definicion de operaciones.

## 5. Mensaje SOAP Request

Ejemplo para `ConsultarHistorial`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://localhost:3000/soap/creditos">
  <soap:Body>
    <tns:ConsultarHistorialRequest>
      <tns:apiToken>API_TOKEN_GENERADO</tns:apiToken>
      <tns:identificacion>001-1234567-8</tns:identificacion>
    </tns:ConsultarHistorialRequest>
  </soap:Body>
</soap:Envelope>
```

El cliente genera y muestra el XML real con:

```bash
npm run soap:client -- ConsultarHistorial 001-1234567-8
```

**Captura 4: SOAP Request.** Mostrar el bloque `SOAP REQUEST`, incluyendo `Envelope`, `Body` y `ConsultarHistorialRequest`. El token visible debe considerarse solamente de demostracion.

> Insertar aqui la captura del SOAP Request.

## 6. Mensaje SOAP Response

Ejemplo de respuesta:

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ConsultarHistorialResponse xmlns="http://localhost:3000/soap/creditos">
      <identificacion>001-1234567-8</identificacion>
      <poseeHistorial>true</poseeHistorial>
      <scoreCrediticio>780</scoreCrediticio>
      <prestamosActivos>2</prestamosActivos>
      <tarjetasCredito>1</tarjetasCredito>
      <porcentajeEndeudamiento>38.5</porcentajeEndeudamiento>
      <nivelEndeudamiento>Medio</nivelEndeudamiento>
      <poseeMoraActual>false</poseeMoraActual>
      <estadoGeneral>Excelente</estadoGeneral>
    </ConsultarHistorialResponse>
  </soap:Body>
</soap:Envelope>
```

Los valores exactos dependen de los datos cargados en PostgreSQL.

**Captura 5: SOAP Response.** Mostrar el bloque `SOAP RESPONSE` devuelto por el servidor.

> Insertar aqui la captura del SOAP Response.

## 7. Cliente SOAP

El archivo `scripts/soap-client.js` carga el WSDL, crea un cliente, ejecuta la operacion indicada y muestra el request, response y objeto interpretado. Si no se proporciona `API_TOKEN`, obtiene uno automaticamente usando las credenciales de demostracion de la API REST.

```bash
npm run soap:client -- ConsultarHistorial 001-1234567-8
npm run soap:client -- ConsultarScore 001-1234567-8
npm run soap:client -- ConsultarEndeudamiento 001-1234567-8
```

Tambien se puede usar un token existente:

```bash
API_TOKEN=snic_token npm run soap:client -- ConsultarScore 001-1234567-8
```

**Captura 6: Cliente SOAP consumiendo el servicio.** Mostrar el comando ejecutado y `RESULTADO INTERPRETADO` en la terminal.

> Insertar aqui la captura del cliente SOAP.

## 8. Comparacion con la API REST

La operacion SOAP `ConsultarHistorial` equivale a `GET /api/v1/ciudadanos/001-1234567-8/historial-crediticio`. El endpoint REST puede ejecutarse desde Swagger en `http://localhost:3000/api-docs`, autorizando primero con un API token.

| Aspecto | SOAP | REST |
| --- | --- | --- |
| Contrato | WSDL | OpenAPI |
| Formato principal | XML con Envelope | JSON; XML opcional |
| Forma de invocacion | Operaciones | Metodos y rutas HTTP |
| Consulta de historial | `ConsultarHistorial` | `GET .../historial-crediticio` |
| Consulta de score | `ConsultarScore` | `GET .../score` |
| Consulta de deuda | `ConsultarEndeudamiento` | `GET .../endeudamiento` |
| Metadatos | Envelope, Body y SOAPAction | Metodo, URL y headers HTTP |
| Facilidad de consumo web | Requiere cliente o XML | Directa con HTTP y JSON |
| Validacion formal | Tipos XSD en WSDL | Esquemas en OpenAPI |
| Manejo de errores | SOAP Fault | Codigo HTTP y cuerpo JSON/XML |

REST resulta mas simple y ligero para aplicaciones web. SOAP ofrece un contrato XML estricto, operaciones tipadas y errores estandarizados mediante SOAP Fault. En esta implementacion ambos mecanismos comparten la misma logica y producen datos equivalentes.

**Captura 7: Comparacion con REST.** Mostrar Swagger ejecutando `GET /historial-crediticio`, con su respuesta JSON, junto a la respuesta de `ConsultarHistorial` del cliente SOAP.

> Insertar aqui la captura comparativa SOAP y REST.

## 9. Conclusion

La implementacion demuestra dos estilos de servicios web sobre el mismo dominio. SOAP prioriza el contrato formal y el intercambio XML; REST reduce la estructura necesaria y se integra con mayor facilidad en clientes web. La eleccion depende de los requisitos de interoperabilidad, validacion y simplicidad de cada sistema.
