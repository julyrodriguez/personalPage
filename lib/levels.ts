import { resolveItem, type Category } from "./catalog";
import type { RunReport } from "./run";
import { SCENARIOS_BY_ID, type Scenario } from "./scenarios";
import type { GraphEdge, GraphNode, Simulation } from "./simulate";

export type CheckContext = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  baseline: Simulation;
  report: RunReport;
};

export type Objective = {
  id: string;
  label: string;
  check: (ctx: CheckContext) => boolean;
  // Set on budget objectives so the UI can show the limit next to the current cost.
  budget?: number;
};

export type Level = {
  id: string;
  chapter: number;
  title: string;
  brief: string;
  scenario: Scenario;
  // All required objectives earn the first star; each bonus earns one more.
  required: Objective[];
  bonus: [Objective, Objective];
  hints: string[];
  // Levels drawn from the Azure Architecture Center link to the official article.
  reference?: { title: string; url: string };
  provider?: "azure";
};

export const CHAPTERS = [
  { number: 1, title: "Fundamentos", blurb: "Atender tráfico, balancear carga y persistir estado." },
  { number: 2, title: "Escala", blurb: "Cachés, edge computing y el primer millón de usuarios en producción." },
  { number: 3, title: "Sistemas Reales", blurb: "Picos de tráfico, tiempo real y cargas extremas de lectura." },
  { number: 4, title: "Azure Architecture Center", blurb: "Reconstruí arquitecturas de referencia de Microsoft y comparalas con las originales." },
];

/* -------------------------------------------------------------------------- */
/*                              Objective helpers                             */
/* -------------------------------------------------------------------------- */

const categoryOf = (node: GraphNode): Category | null =>
  resolveItem(node.data.catalogId, { name: node.data.customName ?? "", category: node.data.customCategory ?? null })?.category ?? null;

/** Components of these categories that actually carry traffic. */
function serving(ctx: CheckContext, categories: Category[]): GraphNode[] {
  return ctx.nodes.filter((n) => {
    const category = categoryOf(n);
    const sim = ctx.baseline.nodes[n.id];
    return category && categories.includes(category) && sim && sim.load.reads + sim.load.writes > 0;
  });
}

const supportsTarget = (): Objective => ({
  id: "supports",
  label: "Soportar a todos los usuarios en hora pico",
  check: ({ baseline }) => baseline.supportedUsers >= baseline.users,
});

const uses = (id: string, label: string, categories: Category[]): Objective => ({
  id,
  label,
  check: (ctx) => serving(ctx, categories).length > 0,
});

const survives = (failureId: string, label: string): Objective => ({
  id: `survives-${failureId}`,
  label,
  check: ({ report }) => report.failures.find((f) => f.id === failureId)?.verdict === "survives",
});

const underBudget = (dollars: number): Objective => ({
  id: "budget",
  budget: dollars,
  label: `Mantenerse por debajo de $${dollars.toLocaleString("es-AR")}/mes (estimado)`,
  check: ({ baseline }) => baseline.monthlyCost <= dollars,
});

const maxUtilization = (id: string, label: string, categories: Category[], max: number, writesOnly = false): Objective => ({
  id,
  label,
  check: (ctx) => {
    const nodes = serving(ctx, categories);
    return (
      nodes.length > 0 &&
      nodes.every((n) => {
        const sim = ctx.baseline.nodes[n.id];
        if (!writesOnly) return sim.utilization <= max;
        const item = resolveItem(n.data.catalogId)!;
        const writeCap = (item.unitWriteRps ?? item.unitRps) * (item.writesScale === false ? 1 : n.data.units);
        return sim.load.writes / writeCap <= max;
      })
    );
  },
});

const noFinding = (id: string, label: string, text: string): Objective => ({
  id,
  label,
  check: ({ baseline }) => !baseline.findings.some((f) => f.message.includes(text)),
});

const azureOnly: Objective = {
  id: "azure-only",
  label: "Construirlo exclusivamente con servicios de Azure",
  check: ({ nodes }) => nodes.every((n) => resolveItem(n.data.catalogId)?.provider !== "aws"),
};

/** There's a direct connection from one kind of component to another. */
const connects = (id: string, label: string, from: Category[], to: Category[]): Objective => ({
  id,
  label,
  check: ({ nodes, edges }) => {
    const category = new Map(nodes.map((n) => [n.id, categoryOf(n)]));
    return edges.some((e) => from.includes(category.get(e.source)!) && to.includes(category.get(e.target)!));
  },
});

const usesService = (id: string, label: string, catalogIds: string[]): Objective => ({
  id,
  label,
  check: (ctx) => ctx.nodes.some((n) => catalogIds.includes(n.data.catalogId) && (ctx.baseline.nodes[n.id]?.load.reads ?? 0) + (ctx.baseline.nodes[n.id]?.load.writes ?? 0) > 0),
});

const ARCH = "https://learn.microsoft.com/en-us/azure/architecture";

const hasMonitoring: Objective = {
  id: "observability",
  label: "Agregar monitoreo para detectar fallas en producción",
  check: ({ nodes }) => nodes.some((n) => categoryOf(n) === "monitoring"),
};

/* -------------------------------------------------------------------------- */
/*                                   Levels                                   */
/* -------------------------------------------------------------------------- */

function scenario(base: Partial<Scenario> & Pick<Scenario, "id" | "title" | "prompt" | "dailyActiveUsers">): Scenario {
  return {
    requestsPerUserPerDay: 50,
    peakFactor: 3,
    readRatio: 0.9,
    cacheableAtEdge: 0.5,
    targetAvailability: 0.999,
    requirements: [],
    rubric: [],
    ...base,
  };
}

export const LEVELS: Level[] = [
  {
    id: "first-deploy",
    chapter: 1,
    title: "Primer despliegue",
    brief: "Tu startup acaba de lanzarse y 20.000 personas usan la app diariamente. Llevá el tráfico de Usuarios hacia algo que pueda procesarlo.",
    scenario: scenario({ id: "lvl-first-deploy", title: "Primer despliegue", prompt: "Atender a 20.000 usuarios diarios.", dailyActiveUsers: 20_000 }),
    required: [supportsTarget(), uses("compute", "Rumbear tráfico a una capa de cómputo", ["compute", "serverless"])],
    bonus: [underBudget(150), noFinding("no-spof", "Evitar puntos únicos de falla (SPOF)", "single point of failure")],
    hints: [
      "Arrastrá Usuarios y EC2 Auto Scaling al lienzo, luego conectá Usuarios → EC2.",
      "Una sola instancia es un punto único de falla: usá dos o distribuilas en zonas de disponibilidad.",
    ],
  },
  {
    id: "share-the-load",
    chapter: 1,
    title: "Distribuir la carga",
    brief: "300.000 usuarios diarios. Un solo servidor ya no da abasto y algo debe balancear las peticiones entre las instancias.",
    scenario: scenario({ id: "lvl-share-the-load", title: "Distribuir la carga", prompt: "Atender a 300.000 usuarios diarios.", dailyActiveUsers: 300_000, requestsPerUserPerDay: 60 }),
    required: [
      supportsTarget(),
      uses("lb", "Colocar un balanceador de carga delante de los servidores", ["loadBalancer"]),
      noFinding("balanced", "No enviar tráfico directo a servidores sin balancear", "Nothing balances traffic"),
    ],
    bonus: [
      survives("single-failure", "Sobrevivir a la caída de cualquier instancia"),
      survives("az-outage", "Sobrevivir a la caída de una Zona de Disponibilidad (AZ)"),
    ],
    hints: [
      "Usuarios → Application Load Balancer → EC2. Verificá cuántas peticiones llegan a EC2 y cuántas atiende cada una.",
      "Perder una instancia debe dejar suficiente capacidad remanente: diseñá para N+1.",
      "Marcá 'Distribuir en múltiples zonas' y mantené suficientes instancias para que las otras dos zonas absorban el pico si una cae.",
    ],
  },
  {
    id: "remember-things",
    chapter: 1,
    title: "Persistir estado",
    brief: "Los usuarios ahora tienen cuentas y datos que deben guardarse permanentemente. Agregá una base de datos sin exponerla a internet.",
    scenario: scenario({ id: "lvl-remember-things", title: "Persistir estado", prompt: "Atender a 300.000 usuarios diarios con datos persistentes.", dailyActiveUsers: 300_000, requestsPerUserPerDay: 60 }),
    required: [
      supportsTarget(),
      uses("database", "Guardar datos en una base de datos", ["sqlDb", "nosqlDb"]),
      noFinding("no-direct-db", "Mantener a los clientes alejados de la base de datos", "talk to"),
    ],
    bonus: [survives("single-failure", "Sobrevivir a cualquier falla individual"), underBudget(800)],
    hints: [
      "Usuarios → Load Balancer → Servidores de App → Base de datos. La capa de app es la única que debe consultar la base de datos.",
      "Una base de datos single-AZ es un punto único de falla. Multi-AZ mantiene una réplica standby en otra zona.",
    ],
  },
  {
    id: "read-heavy",
    chapter: 2,
    title: "Carga intensiva de lectura",
    brief: "1 millón de usuarios diarios, 9 lecturas por cada escritura. La base de datos está colapsando al consultar los mismos datos populares repetidamente.",
    scenario: SCENARIOS_BY_ID["web-1m"],
    required: [supportsTarget(), maxUtilization("db-headroom", "Mantener cada base de datos por debajo del 30% de utilización", ["sqlDb", "nosqlDb"], 0.3)],
    bonus: [uses("cache", "Atender lecturas calientes desde un caché", ["cache"]), underBudget(2_000)],
    hints: [
      "Las réplicas de lectura añaden capacidad, pero un caché delante de la base de datos elimina la gran mayoría de consultas.",
      "Conectá la capa de app tanto al caché como a la base de datos: el modelo lo tratará como cache-aside.",
    ],
  },
  {
    id: "the-edge",
    chapter: 2,
    title: "El Edge (CDN)",
    brief: "2 millones de espectadores consumen video. Casi todas las peticiones son segmentos de video inmutables. Servirlos todos desde servidores de app requeriría una flota gigante.",
    scenario: SCENARIOS_BY_ID["video"],
    required: [supportsTarget(), uses("cdn", "Servir contenido estático desde una CDN", ["cdn"])],
    bonus: [uses("storage", "Almacenar archivos de video en storage de objetos", ["objectStorage"]), underBudget(2_500)],
    hints: [
      "Colocá una CDN entre Usuarios y tu app: absorberá la mayor parte de las peticiones cacheables.",
      "Los archivos de video pertenecen a object storage (S3 / Blob Storage) detrás de la app o de la CDN.",
    ],
  },
  {
    id: "production-ready",
    chapter: 2,
    title: "Un millón, listo para producción",
    brief: "El mismo 1M de usuarios, pero ahora el negocio requiere alta resiliencia ante contingencias. Cada capa necesita redundancia.",
    scenario: SCENARIOS_BY_ID["web-1m"],
    required: [
      supportsTarget(),
      noFinding("no-spof", "Sin puntos únicos de falla (SPOF)", "single point of failure"),
      survives("az-outage", "Sobrevivir a la caída de una Zona de Disponibilidad (AZ)"),
    ],
    bonus: [survives("single-failure", "Sobrevivir a cualquier falla individual"), hasMonitoring],
    hints: [
      "Cada componente administrado por vos (servidores, caché, base de datos) requiere Multi-AZ activado.",
      "Cuando una zona cae, los componentes multi-AZ pierden hasta un tercio de capacidad: el resto debe poder procesar el pico.",
    ],
  },
  {
    id: "flash-sale",
    chapter: 3,
    title: "Venta Flash",
    brief: "3 millones de compradores llegan en minutos: el tráfico se multiplica por 12 y las órdenes no deben perderse. Evitá escrituras directas a la base en hora pico.",
    scenario: SCENARIOS_BY_ID["flash-sale"],
    required: [supportsTarget(), uses("queue", "Amortiguar órdenes en una cola de mensajes", ["queue"])],
    bonus: [
      maxUtilization("write-headroom", "Mantener escrituras a la base por debajo del 50% de capacidad", ["sqlDb", "nosqlDb"], 0.5, true),
      survives("az-outage", "Sobrevivir a la caída de una Zona de Disponibilidad (AZ)"),
    ],
    hints: [
      "Conectá la capa de app a una cola y a la base: las escrituras van por la cola y los workers las drenan al ritmo promedio.",
      "Cola → Workers (cómputo) → Base de datos. La cola allana el pico de 12× hacia el promedio.",
    ],
  },
  {
    id: "real-time-chat",
    chapter: 3,
    title: "Chat en tiempo real",
    brief: "5 millones de usuarios enviando mensajes diarios. Los clientes necesitan recibir mensajes al instante y el historial debe escalar con las escrituras.",
    scenario: SCENARIOS_BY_ID["chat"],
    required: [
      supportsTarget(),
      uses("realtime", "Enviar mensajes por conexiones persistentes (WebSockets)", ["realtime"]),
      uses("nosql", "Guardar historial en un almacén que escale escrituras", ["nosqlDb"]),
    ],
    bonus: [survives("az-outage", "Sobrevivir a la caída de una Zona de Disponibilidad (AZ)"), underBudget(6_000)],
    hints: [
      "API Gateway WebSocket o Web PubSub mantienen las conexiones abiertas; dimensioná sus unidades según el pico.",
      "Las escrituras SQL están limitadas por una única primaria. Un almacén NoSQL escala escrituras horizontalmente con particiones.",
    ],
  },
  {
    id: "url-shortener",
    chapter: 3,
    title: "Acortador de URLs",
    brief: "100 millones de redirecciones por día, 99% lecturas. Las redirecciones deben ser ultrarrápidas y de costo mínimo.",
    scenario: SCENARIOS_BY_ID["url-shortener"],
    required: [supportsTarget(), uses("cache", "Cachear códigos cortos populares", ["cache"]), uses("kv", "Guardar mapeos en almacén clave-valor", ["nosqlDb"])],
    bonus: [survives("az-outage", "Sobrevivir a la caída de una Zona de Disponibilidad (AZ)"), underBudget(2_500)],
    hints: [
      "Los mapeos son simples búsquedas clave → valor: un almacén NoSQL / KV es ideal.",
      "Unos pocos enlaces populares concentran la mayor parte del tráfico: un caché con alta tasa de aciertos elimina la mayoría de lecturas a la base.",
    ],
  },

  // ------------------------------------------------ Azure Architecture Center
  {
    id: "az-basic-web-app",
    chapter: 4,
    title: "Aplicación web básica (Azure)",
    brief: "Prueba de concepto: app web en App Service respaldada por Azure SQL Database para 50.000 usuarios diarios. Mantenela simple, económica y observable.",
    scenario: scenario({ id: "lvl-az-basic", title: "Aplicación web básica", prompt: "Atender a 50.000 usuarios diarios con App Service y SQL Database.", dailyActiveUsers: 50_000 }),
    required: [
      supportsTarget(),
      azureOnly,
      usesService("app-service", "Alojar la app en App Service", ["az-appservice"]),
      usesService("sql", "Guardar datos en Azure SQL Database", ["az-sql"]),
    ],
    bonus: [hasMonitoring, underBudget(600)],
    hints: [
      "Usuarios → App Service → Azure SQL Database. Esa es toda la ruta en la arquitectura de referencia básica.",
      "La referencia agrega Azure Monitor / Application Insights para métricas y seguimiento de peticiones.",
    ],
    reference: { title: "Basic web application", url: `${ARCH}/web-apps/app-service/architectures/basic-web-app` },
    provider: "azure",
  },
  {
    id: "az-zone-redundant",
    chapter: 4,
    title: "App web con redundancia de zona (Azure)",
    brief: "Llevá la app web a producción para 500.000 usuarios diarios: punto de entrada seguro y tolerancia total a la pérdida de una zona.",
    scenario: scenario({ id: "lvl-az-baseline", title: "App web con redundancia de zona", prompt: "Atender a 500.000 usuarios diarios y tolerar la caída de una zona.", dailyActiveUsers: 500_000, requestsPerUserPerDay: 60 }),
    required: [
      supportsTarget(),
      azureOnly,
      connects("gateway-first", "Colocar Application Gateway delante de la app", ["loadBalancer"], ["compute"]),
      survives("az-outage", "Sobrevivir a la caída de una Zona de Disponibilidad (AZ)"),
    ],
    bonus: [noFinding("no-spof", "Sin puntos únicos de falla (SPOF)", "single point of failure"), uses("cdn", "Servir estáticos desde una CDN", ["cdn"])],
    hints: [
      "Usuarios → Application Gateway → App Service → SQL Database, con redundancia de zona activa en App Service y SQL.",
      "La referencia ubica al menos una instancia de App Service en cada zona y sobredimensiona para que las restantes soporten el pico ante una falla.",
      "También se recomienda una CDN para activos estáticos como imágenes y scripts.",
    ],
    reference: { title: "Baseline highly available zone-redundant web application", url: `${ARCH}/web-apps/app-service/architectures/baseline-zone-redundant` },
    provider: "azure",
  },
  {
    id: "az-static-content",
    chapter: 4,
    title: "Hosting de contenido estático (Azure)",
    brief: "Sitio con alta carga multimedia donde el 90% son imágenes, scripts y documentos. Dejá de saturar servidores de app entregando archivos.",
    scenario: scenario({
      id: "lvl-az-static",
      title: "Hosting de contenido estático",
      prompt: "Atender a 1.000.000 de usuarios diarios de un sitio mayormente estático.",
      dailyActiveUsers: 1_000_000,
      requestsPerUserPerDay: 80,
      readRatio: 0.97,
      cacheableAtEdge: 0.9,
    }),
    required: [
      supportsTarget(),
      azureOnly,
      uses("blob", "Servir archivos estáticos desde Blob Storage", ["objectStorage"]),
      uses("edge", "Cachearlos en el edge con Front Door", ["cdn"]),
    ],
    bonus: [maxUtilization("small-app-tier", "Mantener la capa de app por debajo del 60% de utilización", ["compute"], 0.6), underBudget(1_500)],
    hints: [
      "Los archivos estáticos van a Blob Storage; una CDN (Front Door) los cachea cerca de los usuarios.",
      "Con el edge absorbiendo la gran mayoría de peticiones, la app solo atiende la lógica dinámica.",
    ],
    reference: { title: "Static Content Hosting pattern", url: `${ARCH}/patterns/static-content-hosting` },
    provider: "azure",
  },
  {
    id: "az-protect-apis",
    chapter: 4,
    title: "Protección de APIs (Azure)",
    brief: "Tu API pública recibe 200 millones de peticiones al día. Colocá un WAF delante y un gateway que gestione auth, rate limiting y ruteo.",
    scenario: scenario({
      id: "lvl-az-apis",
      title: "Protección de APIs",
      prompt: "Atender una API pública con 200 millones de peticiones por día.",
      dailyActiveUsers: 2_000_000,
      requestsPerUserPerDay: 100,
      readRatio: 0.8,
      cacheableAtEdge: 0,
    }),
    required: [
      supportsTarget(),
      azureOnly,
      connects("waf-before-apim", "Rutear tráfico de Application Gateway → API Management", ["loadBalancer"], ["apiGateway"]),
      connects("apim-to-backend", "API Management al frente de los servicios de backend", ["apiGateway"], ["compute", "serverless"]),
    ],
    bonus: [survives("az-outage", "Sobrevivir a la caída de una Zona de Disponibilidad (AZ)"), underBudget(5_000)],
    hints: [
      "Usuarios → Application Gateway (WAF) → API Management → Backend (AKS o App Service).",
      "API Management publica un throughput estimado por unidad: calculá cuántas unidades requiere el pico.",
    ],
    reference: { title: "Protect APIs with Application Gateway and API Management", url: `${ARCH}/web-apps/api-management/architectures/protect-apis` },
    provider: "azure",
  },
  {
    id: "az-load-leveling",
    chapter: 4,
    title: "Nivelación de carga con colas (Azure)",
    brief: "Varias instancias de App Service escriben a la misma base de datos y el tráfico llega en ráfagas de 8× el promedio. La base colapsa en cada pico. Nivelá la carga.",
    scenario: scenario({
      id: "lvl-az-leveling",
      title: "Nivelación de carga con colas",
      prompt: "Absorber picos de escritura de 8× sin sobrecargar la base de datos.",
      dailyActiveUsers: 1_000_000,
      requestsPerUserPerDay: 60,
      peakFactor: 8,
      readRatio: 0.5,
      cacheableAtEdge: 0,
    }),
    required: [
      supportsTarget(),
      azureOnly,
      uses("service-bus", "Amortiguar escrituras en una cola", ["queue"]),
      maxUtilization("db-writes", "Mantener escrituras a la base por debajo del 50% en pico", ["sqlDb", "nosqlDb"], 0.5, true),
    ],
    bonus: [connects("functions-consumer", "Procesar la cola con Azure Functions", ["queue"], ["serverless"]), survives("az-outage", "Sobrevivir a la caída de una Zona de Disponibilidad (AZ)")],
    hints: [
      "App Service → Service Bus → Consumidor → Base de datos. El consumidor drena la cola al ritmo promedio, no al ritmo pico.",
      "La referencia utiliza una app de Azure Functions que procesa la cola de Service Bus.",
    ],
    reference: { title: "Queue-Based Load Leveling pattern", url: `${ARCH}/patterns/queue-based-load-leveling` },
    provider: "azure",
  },
  {
    id: "az-polyglot",
    chapter: 4,
    title: "Persistencia políglota (Azure)",
    brief: "Plataforma de e-commerce: catálogo, carritos y sesiones cambian constantemente; órdenes y pagos requieren transacciones ACID. Una sola base de datos no sirve para todo.",
    scenario: scenario({
      id: "lvl-az-polyglot",
      title: "Persistencia políglota",
      prompt: "Atender a 2.000.000 de compradores diarios con la base de datos adecuada para cada carga.",
      dailyActiveUsers: 2_000_000,
      requestsPerUserPerDay: 60,
      peakFactor: 4,
      readRatio: 0.9,
      cacheableAtEdge: 0.3,
    }),
    required: [
      supportsTarget(),
      azureOnly,
      uses("gateway", "Entrada mediante API Management", ["apiGateway"]),
      usesService("cosmos", "Catálogo, carritos y sesiones en Cosmos DB", ["az-cosmos"]),
      usesService("sql", "Órdenes y pagos en Azure SQL Database", ["az-sql"]),
    ],
    bonus: [survives("az-outage", "Sobrevivir a la caída de una Zona de Disponibilidad (AZ)"), underBudget(6_000)],
    hints: [
      "Clientes → API Management → Microservicios (AKS o App Service). Los servicios se conectan a Cosmos DB y a SQL Database según la entidad.",
      "Cosmos DB escala throughput por partición; SQL Database preserva consistencia transaccional multi-tabla.",
    ],
    reference: { title: "Polyglot persistence with Azure Cosmos DB and Azure SQL Database", url: `${ARCH}/databases/idea/combine-relational-nosql` },
    provider: "azure",
  },
];

export const LEVELS_BY_ID = Object.fromEntries(LEVELS.map((l) => [l.id, l]));

export type ObjectiveResult = { id: string; label: string; passed: boolean; bonus: boolean };

export type LevelResult = { stars: number; objectives: ObjectiveResult[] };

export function evaluateLevel(level: Level, ctx: CheckContext): LevelResult {
  const required = level.required.map((o) => ({ id: o.id, label: o.label, passed: o.check(ctx), bonus: false }));
  const bonus = level.bonus.map((o) => ({ id: `bonus-${o.id}`, label: o.label, passed: o.check(ctx), bonus: true }));
  const cleared = required.every((o) => o.passed);
  return { stars: cleared ? 1 + bonus.filter((o) => o.passed).length : 0, objectives: [...required, ...bonus] };
}

export function nextLevel(id: string): Level | null {
  const index = LEVELS.findIndex((l) => l.id === id);
  return LEVELS[index + 1] ?? null;
}
