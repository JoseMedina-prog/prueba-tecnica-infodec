# Documentación de Base de Datos - Travel App

Este directorio contiene la especificación, scripts y esquemas visuales de la base de datos PostgreSQL (`travel_app_db`).

## Archivos del directorio

- `schema.sql`: Script DDL y DML exportado con `pg_dump` con el esquema limpio y los datos iniciales.
- `diagrama.dbml`: Esquema en formato DBML compatible con [dbdiagram.io](https://dbdiagram.io).
- `diagrama.png`: Imagen visual del diagrama de Entidad-Relación exportada desde la herramienta ERD de pgAdmin.

---

## Diagrama Entidad-Relación (Mermaid)

```mermaid
erDiagram
    monedas ||--o{ paises : "utiliza"
    paises ||--o{ ciudades : "contiene"
    usuarios ||--o{ consultas : "realiza"
    ciudades ||--o{ consultas : "es_consultada"
    usuarios ||--o{ refresh_tokens : "posee"
    usuarios ||--o{ tokens_revocados : "revoca"

    monedas {
        bigint id PK
        char(3) codigo UK
        varchar nombre
        varchar simbolo
        timestamp created_at
        timestamp updated_at
    }

    paises {
        bigint id PK
        varchar nombre
        char(2) codigo UK
        bigint moneda_id FK
        timestamp created_at
        timestamp updated_at
    }

    ciudades {
        bigint id PK
        bigint pais_id FK
        varchar nombre
        decimal(9_6) latitud
        decimal(9_6) longitud
        timestamp created_at
        timestamp updated_at
        char(3) codigo_iata UK
    }

    usuarios {
        bigint id PK
        varchar nombre
        varchar correo UK
        varchar password_hash
        varchar(2) idioma
        timestamp created_at
        timestamp updated_at
    }

    consultas {
        bigint id PK
        bigint usuario_id FK
        bigint ciudad_id FK
        decimal(15_2) presupuesto_cop
        decimal(5_2) clima_temperatura
        varchar clima_descripcion
        decimal(20_10) tasa
        decimal(18_2) valor_convertido
        timestamp fecha_tasa
        timestamp created_at
        timestamp updated_at
    }

    tasas_cambio {
        bigint id PK
        char(3) moneda_origen
        char(3) moneda_destino
        decimal(20_10) tasa
        timestamp fecha_tasa
        timestamp created_at
        timestamp updated_at
    }

    refresh_tokens {
        bigint id PK
        bigint usuario_id FK
        char(64) token_hash UK
        uuid familia_id
        timestamp expira_en
        timestamp usado_en
        timestamp revocado_en
        timestamp created_at
        timestamp updated_at
    }

    tokens_revocados {
        bigint id PK
        uuid jti UK
        bigint usuario_id FK
        timestamp expira_en
        timestamp created_at
    }
```
