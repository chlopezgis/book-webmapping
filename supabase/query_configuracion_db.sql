-- SQL para ver la estructura de las tablas de la BD
select 
		a.table_name as tabla, 
		a.ordinal_position as orden_campo, 
		a.column_name as campo, 
		a.udt_name as tipo_dato,
		b.f_geometry_column as columna_geometria,
		b."type" as tipo_geometria,
		b.srid
from information_schema.columns a
left join geometry_columns b
on a.table_name  = b.f_table_name
where a.table_schema = 'public' 
order by a.table_name, a.ordinal_position;

select * from geometry_columns;

-- Función SQL: buscar barrios por texto
CREATE OR REPLACE FUNCTION buscar_barrios(texto TEXT)
RETURNS TABLE(gid INT, barrio VARCHAR, geom JSON) AS $$
BEGIN
  RETURN QUERY
  SELECT b.gid, b.barrio, ST_AsGeoJSON(b.geom)::json
  FROM barrios b
  WHERE LOWER(b.barrio) LIKE '%' || LOWER(texto) || '%';
END;
$$ LANGUAGE plpgsql;

    
 -- Crear tabla de incidencias:
CREATE TABLE incidencias (
  id serial PRIMARY KEY,
  categoria TEXT NOT NULL, -- Seguridad, Estado de la vía, Alumbrado, Accidentes
  descripcion TEXT,
  geom geometry(Point, 4326),
  fecha_reporte TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar acceso público (ajusta según tus políticas de seguridad)
ALTER TABLE incidencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir inserción pública" ON incidencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura pública" ON incidencias FOR SELECT USING (true);


-- Función SQL: estadísticas a partir del nombre del barrio
CREATE OR REPLACE FUNCTION obtener_estadisticas_barrio(nombre_barrio_buscado TEXT)
RETURNS TABLE (
    conteo_policias BIGINT,
    conteo_bomberos BIGINT,
    conteo_salud BIGINT,
    conteo_incidencias BIGINT, -- Nueva columna
    longitud_alcantarillado FLOAT8
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM policias_wgs84 p WHERE ST_Intersects(p.geom, b.geom)),
        (SELECT COUNT(*) FROM bomberos_wgs84 f WHERE ST_Intersects(f.geom, b.geom)),
        (SELECT COUNT(*) FROM salud_wgs84 s WHERE ST_Intersects(s.geom, b.geom)),
        (SELECT COUNT(*) FROM incidencias i WHERE ST_Intersects(i.geom, b.geom)), -- Conteo de reportes
        (SELECT COALESCE(SUM(ST_Length(a.geom::geography)), 0) FROM alcantarillado a WHERE ST_Intersects(a.geom, b.geom))
    FROM barrios b
    WHERE b.barrio = nombre_barrio_buscado
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;