CREATE TABLE IF NOT EXISTS usuario (
 id_usuario  SERIAL PRIMARY KEY,
 nombre      varchar(100)   not null,
 apellidos   varchar(100)   not null,
 dni         varchar(16)    not null unique,
 correo      varchar(120)   not null unique,
 rol         varchar(100)   not null default 'usuario'
);
CREATE TABLE IF NOT EXISTS lista(
 id_lista    SERIAL PRIMARY KEY,
id_usuario INTEGER  REFERENCES usuario(id_usuario) ON DELETE CASCADE,
 nombre_lista      VARCHAR(100)   NOT NULL,
 creada_en      TIMESTAMP NOT NULL DEFAULT NOW()     --por defecto pone la fecha de ahora
);
CREATE TABLE IF NOT EXISTS album(
 id_album     SERIAL PRIMARY KEY,
id_usuario INTEGER  REFERENCES usuario(id_usuario) ON DELETE CASCADE,
 nombre_album  VARCHAR(100)    NOT NULL,
 genero     VARCHAR(80)   NOT NULL,
fecha         DATE );
CREATE TABLE IF NOT EXISTS album_detalle(
 id_album_detalle SERIAL PRIMARY KEY,
 id_album INTEGER  REFERENCES album(id_album) ON DELETE CASCADE ,
 id_cancion INTEGER  REFERENCES cancion(id_cancion) ON DELETE CASCADE ,
 genero VARCHAR(80)
);
CREATE TABLE IF NOT EXISTS cancion(
 id_cancion SERIAL  PRIMARY KEY,
 id_usuario INTEGER  REFERENCES usuario(id_usuario) ON DELETE CASCADE, 
 nombre_cancion varchar(100),
 fecha_cancion date
);
CREATE TABLE IF NOT EXISTS elemento_lista(
 id_elemento_lista SERIAL PRIMARY KEY,
 id_usuario INTEGER  REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  INTEGER  REFERENCES album(id_album) ON DELETE CASCADE ,
 id_cancion INTEGER  REFERENCES cancion(id_cancion) ON DELETE CASCADE,
 id_lista INTEGER REFERENCES lista(id_lista) ON DELETE CASCADE
);
/*CREATE TABLE IF NOT EXISTS usuario_lista(
 id_usuario_lista SERIAL PRIMARY KEY,
 id_usuario INTEGER  REFERENCES usuario(id_usuario) ON DELETE CASCADE,
 id_lista INTEGER REFERENCES lista(id_lista) ON DELETE CASCADE,
 es_creador   BOOLEAN   NOT NULL DEFAULT FALSE
);*/
CREATE TABLE IF NOT EXISTS resenia(
  id_resenia SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  id_elemento_lista INTEGER REFERENCES elemento_lista(id_elemento_lista) ON DELETE CASCADE,
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
  puntuacion SMALLINT CHECK(between in 1-5)

);
