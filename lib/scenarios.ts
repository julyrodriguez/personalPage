import type { Category } from "./catalog";

export type RubricItem = {
  id: string;
  // Phrased as a yes/no condition about the design; sent to Jev as a Noul.
  check: string;
  // Categories the offline mock looks for when there is no API key.
  expects: Category[];
};

export type Scenario = {
  id: string;
  title: string;
  prompt: string;
  dailyActiveUsers: number;
  requestsPerUserPerDay: number;
  // Peak-to-average traffic ratio.
  peakFactor: number;
  readRatio: number;
  // Share of traffic a CDN can absorb (static assets, media segments).
  cacheableAtEdge: number;
  targetAvailability: number;
  requirements: string[];
  rubric: RubricItem[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: "web-1m",
    title: "App web para 1M de usuarios",
    prompt: "¿Cómo diseñarías la infraestructura para una aplicación web con 1 millón de usuarios activos diarios?",
    dailyActiveUsers: 1_000_000,
    requestsPerUserPerDay: 60,
    peakFactor: 3,
    readRatio: 0.9,
    cacheableAtEdge: 0.5,
    targetAvailability: 0.999,
    requirements: [
      "Una sola región es suficiente, usuarios en un continente principal",
      "Latencia p95 por debajo de 300 ms",
      "Disponibilidad del 99.9%",
      "Carga intensiva de lectura: aprox. 9 lecturas por cada escritura",
    ],
    rubric: [
      { id: "stateless_lb", check: "La capa de aplicación es stateless y escala horizontalmente detrás de un balanceador de carga.", expects: ["loadBalancer", "compute"] },
      { id: "read_cache", check: "Las lecturas frecuentes se atienden desde una memoria caché en lugar de consultar la base de datos.", expects: ["cache"] },
      { id: "db_scaling", check: "La capa de base de datos puede procesar el volumen de lectura, por ejemplo con réplicas de lectura.", expects: ["sqlDb"] },
      { id: "edge", check: "Los activos estáticos se sirven desde una CDN.", expects: ["cdn"] },
      { id: "observability", check: "El diseño incluye monitoreo, métricas o alertas.", expects: ["monitoring"] },
    ],
  },
  {
    id: "url-shortener",
    title: "Acortador de URLs",
    prompt: "Diseñá un acortador de enlaces que procese 100 millones de redirecciones por día.",
    dailyActiveUsers: 10_000_000,
    requestsPerUserPerDay: 10,
    peakFactor: 5,
    readRatio: 0.99,
    cacheableAtEdge: 0.3,
    targetAvailability: 0.9995,
    requirements: [
      "Las redirecciones deben ser ultrarrápidas (p99 menor a 50 ms)",
      "Los códigos cortos deben ser únicos",
      "Extremadamente orientado a lectura: aprox. 100 redirecciones por cada nuevo enlace",
      "Los enlaces no expiran por defecto",
    ],
    rubric: [
      { id: "kv_store", check: "Los mapeos se guardan en un almacén clave-valor o NoSQL que escala horizontalmente.", expects: ["nosqlDb"] },
      { id: "redirect_cache", check: "Los códigos cortos populares se cachean para que casi nunca lleguen a la base de datos.", expects: ["cache"] },
      { id: "edge_redirects", check: "Las redirecciones pueden servirse o cachearse en el edge cerca de los usuarios.", expects: ["cdn"] },
      { id: "stateless_tier", check: "El servicio de redirección es stateless y escalable horizontalmente.", expects: ["loadBalancer", "compute"] },
    ],
  },
  {
    id: "chat",
    title: "Chat en tiempo real",
    prompt: "Diseñá un servicio de mensajería instantánea tipo WhatsApp para 5 millones de usuarios activos diarios.",
    dailyActiveUsers: 5_000_000,
    requestsPerUserPerDay: 150,
    peakFactor: 4,
    readRatio: 0.6,
    cacheableAtEdge: 0.05,
    targetAvailability: 0.9995,
    requirements: [
      "Mensajes entregados en menos de 500 ms a usuarios en línea",
      "El historial de mensajes se almacena y pagina",
      "Se muestra el estado de presencia (en línea/desconectado)",
      "Alto volumen de escritura comparado con aplicaciones web típicas",
    ],
    rubric: [
      { id: "push", check: "Los clientes mantienen conexiones persistentes (WebSockets o similar) para recibir mensajes push.", expects: ["realtime"] },
      { id: "fanout", check: "La distribución (fan-out) de mensajes está desacoplada mediante una cola o stream.", expects: ["queue"] },
      { id: "history_store", check: "El historial de mensajes reside en un almacén que escala escrituras horizontalmente, particionado por conversación.", expects: ["nosqlDb"] },
      { id: "presence", check: "El estado de presencia y sesión se mantiene en un almacén ultra rápido en memoria.", expects: ["cache"] },
    ],
  },
  {
    id: "video",
    title: "Streaming de video",
    prompt: "Diseñá una plataforma de streaming de video tipo YouTube para 2 millones de espectadores diarios.",
    dailyActiveUsers: 2_000_000,
    requestsPerUserPerDay: 400,
    peakFactor: 3,
    readRatio: 0.99,
    cacheableAtEdge: 0.95,
    targetAvailability: 0.999,
    requirements: [
      "La mayor parte del tráfico son descargas de segmentos de video",
      "Las subidas deben transcodificarse en varias resoluciones",
      "Metadatos de video y motor de búsqueda",
    ],
    rubric: [
      { id: "blob_cdn", check: "Los archivos de video residen en almacenamiento de objetos y se entregan mediante una CDN.", expects: ["objectStorage", "cdn"] },
      { id: "async_transcode", check: "La transcodificación ocurre de forma asíncrona mediante colas y workers.", expects: ["queue"] },
      { id: "metadata_db", check: "Existe una base de datos dedicada para los metadatos de los videos.", expects: ["sqlDb"] },
      { id: "search", check: "Existe un índice de búsqueda para localizar videos rápidamente.", expects: ["search"] },
    ],
  },
  {
    id: "flash-sale",
    title: "Venta Flash (E-Commerce)",
    prompt: "Diseñá el checkout de una venta flash de e-commerce con 3 millones de compradores ingresando en pocos minutos.",
    dailyActiveUsers: 3_000_000,
    requestsPerUserPerDay: 40,
    peakFactor: 12,
    readRatio: 0.85,
    cacheableAtEdge: 0.4,
    targetAvailability: 0.9995,
    requirements: [
      "El tráfico se multiplica x12 en cuestión de minutos",
      "Nunca sobre-vender inventario (cero sobreventa)",
      "Las órdenes no deben perderse incluso si los sistemas downstream responden lento",
    ],
    rubric: [
      { id: "order_queue", check: "Las órdenes se amortiguan en una cola para que los picos no saturen la base de datos.", expects: ["queue"] },
      { id: "inventory_cache", check: "El conteo de inventario utiliza operaciones atómicas en memoria (ej. Redis).", expects: ["cache"] },
      { id: "throttle", check: "Un API gateway o similar limita la tasa (rate limit) y protege el backend de la avalancha.", expects: ["apiGateway"] },
      { id: "edge_static", check: "Las páginas de producto y activos se cachean en el edge.", expects: ["cdn"] },
    ],
  },
];

export const SCENARIOS_BY_ID = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

export function peakRps(scenario: Scenario, users = scenario.dailyActiveUsers): number {
  return ((users * scenario.requestsPerUserPerDay) / 86_400) * scenario.peakFactor;
}
