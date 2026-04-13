export type Usuario = {
  id?: string;
  nombre: string;
  apellidos: string;
  email: string;
  password_hash: string;
  direccion: string;
  telefono: string;
  codigo_postal: string;
  lat?: number;
  lng?: number;
};
export type Farmacia = {
  id?: string;
  email: string;
  cif: string;
  password_hash: string;
  direccion: string;
  telefono: string;
  cp: string;
};
export type RespuestaAPIProducto = {
  totalFilas: number;
  pagina: number;
  tamanioPagina: number;
  resultados: ProductoInfo[];
};
export type ProductoInfo = {
  nregistro: string;
  nombre: string;
  labtitular: string;
  labcomercializador: string;
  cpresc: string;
  estado: {
    aut: number;
  };
  comerc: boolean;
  receta: boolean;
  generico: boolean;
  conduc: boolean;
  triangulo: boolean;
  huerfano: boolean;
  biosimilar: boolean;
  nosustituible: {
    id: number;
    nombre: string;
  };
  psum: boolean;
  notas: boolean;
  materialesInf: boolean;
  ema: boolean;
  docs: {
    tipo: number;
    url: string;
    urlHtml: string;
    secc: boolean;
    fecha: number;
  }[];
  fotos: {
    tipo: string;
    url: string;
    fecha: number;
  }[];
  viasAdministracion: {
    id: number;
    nombre: string;
  }[];
  formaFarmaceutica: {
    id: number;
    nombre: string;
  };
  formaFarmaceuticaSimplificada: {
    id: number;
    nombre: string;
  };
  vtm: {
    id: number;
    nombre: string;
  };
  dosis: string;
};
export type Cesta = {
  id?: string;
  usuario_id: string;
  productos: CestaProducto[];
};
export type CestaProducto = {
  nregistro: string;
  cantidad: number;
};
export type ProductoConDetalle = {
  nregistro: string;
  cantidad: number;
  detalle: ProductoInfo | null;
};
export type Pedido = {
  id?: string;
  usuario_id: string;
  productos: CestaProducto[];
  distancia_maxima: number;
  direccion: string;
  farmacias_ids?: string[];
  fecha_creacion?: string;
};
