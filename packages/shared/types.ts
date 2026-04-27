export type Usuario = {
  id?: string;
  nombre: string;
  apellidos: string;
  email: string;
  password_hash: string;
  direccion: string;
  telefono: string;
  codigo_postal: string;
  lat: number;
  lng: number;
};
export type Farmacia = {
  id?: string;
  email: string;
  cif: string;
  password_hash: string;
  direccion: string;
  telefono: string;
  cp: string;
  horario?: string;
  lat: number;
  lng: number;
};
export type FarmaciaMapa = {
  id: string;
  direccion: string;
  telefono: string;
  codigo_postal: string;
  horario?: string;
  lat: number;
  lng: number;
};
export type RespuestaMapaFarmacias = {
  token: string;
  farmacias: FarmaciaMapa[];
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
  pactivos: string;
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
  atcs: {
    codigo: string;
    nombre: string;
    nivel: number;
  }[];
  principiosActivos: {
    id: number;
    codigo: string;
    nombre: string;
    cantidad: string;
    unidad: string;
    orden: number;
  }[];
  excipientes: {
    id: number;
    nombre: string;
    cantidad: string;
    unidad: string;
    orden: number;
  }[];
  presentaciones: {
    cn: string;
    nombre: string;
    estado: {
      aut: number;
    };
    comerc: boolean;
    psum: boolean;
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
  bioequivalente: boolean;
  nregistro: string;
  cantidad: number;
};
export type ProductoConDetalle = {
  bioequivalente: boolean;
  nregistro: string;
  cantidad: number;
  detalle: ProductoInfo | null;
};

export type EstadoPedido =
  | "Pendiente"
  | "Aceptado"
  | "Cancelado"
  | "Finalizado";

export type Pedido = {
  id: string;
  usuario_id: string;
  productos: CestaProducto[];
  farmacias_ids: string[];
  fecha_creacion: string;
  fecha_aceptacion: string | null;
  farmacia_aceptadora_id?: string | null;
  estado: EstadoPedido;
};

export type PedidoSSE = {
  id: string;
  fecha_creacion: string;
  fecha_aceptacion: string | null;
  farmacia_aceptadora_id?: string | null;
  estado: EstadoPedido;
};

export type PedidoConDirecciones = {
  pedido: Pedido;
  direcciones_farmacias: string[];
};

export type UsuarioHeader = {
  id: string;
  tipo: "usuario" | "farmacia";
  cif?: string;
  nombre?: string;
  apellidos?: string;
  email: string;
  telefono: string;
  codigo_postal: string;
  direccion: string;
  lat: number;
  lng: number;
  horario?: string;
};

export type JWTPayload = {
  id: string;
  tipo: "usuario" | "farmacia";
  exp: number;
};

export type JWTHeader = {
  auth?: UsuarioHeader | null;
};

export type PedidoConDetalle = {
  id: string;
  productos: ProductoConDetalle[];
};
