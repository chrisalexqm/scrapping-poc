const puppeteer = require("puppeteer-core");
const cheerio = require("cheerio");

const connectionURL =
  "wss://browser.zenrows.com?apikey=b084be75c2064e78ed4d82ef8a20aa3e36b4dc7d";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Helper to measure and log duration of async actions
const timed = async (label, action) => {
  const start = Date.now();
  const result = await action();
  const elapsed = Date.now() - start;
  console.log(`[${new Date().toISOString()}] ${label} took ${elapsed} ms`);
  return result;
};

async function scrapeRuc(ruc) {
  const browser = await timed("connect to ZenRows", () =>
    puppeteer.connect({ browserWSEndpoint: connectionURL })
  );

  const page = await timed("newPage", () => browser.newPage());

  // Extend default timeouts (e.g., 2 min) to avoid 30 s NavigationTimeoutError
  const NAV_TIMEOUT = parseInt(process.env.NAV_TIMEOUT_MS || "360000", 10);
  page.setDefaultNavigationTimeout(NAV_TIMEOUT);
  page.setDefaultTimeout(NAV_TIMEOUT);

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36"
  );

  try {
    await timed("goto formulario", () =>
      page.goto(
        "https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp",
        {
          waitUntil: "networkidle2",
          timeout: 360000,
        }
      )
    );

    await timed("type RUC", () => page.type("#txtRuc", ruc));
    await timed("click Aceptar", () => page.click("#btnAceptar"));

    await timed("wait nav 1", () =>
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: NAV_TIMEOUT })
    );

    const content = await page.content();
    const $ = cheerio.load(content);

    const actividadesEconomicas = [];
    $("h4:contains('Actividad(es) Económica(s):')")
      .parent()
      .next()
      .find("tr td")
      .each((_, element) => {
        actividadesEconomicas.push($(element).text().replace(/\s+/g, " ").trim());
      });

    await delay(1000);
    await timed("click Representantes", () => page.click(".btnInfRepLeg"));
    await timed("wait nav 2", () =>
      page.waitForNavigation({ waitUntil: "load", timeout: NAV_TIMEOUT })
    );

    const newPageContent = await page.content();
    const new$ = cheerio.load(newPageContent);
    const representantesLegales = [];

    new$("table tbody tr").each((_, element) => {
      const cols = new$(element).find("td");
      representantesLegales.push({
        tipoDocumento: new$(cols[0]).text().trim(),
        numeroDocumento: new$(cols[1]).text().trim(),
        nombre: new$(cols[2]).text().trim(),
        cargo: new$(cols[3]).text().trim(),
        fechaDesde: new$(cols[4]).text().trim(),
      });
    });

    await delay(1000);
    await timed("browser.close", () => browser.close());

    const resultado = {
      ruc: $("h4:contains('Número de RUC:')")
        .parent()
        .next()
        .find("h4")
        .text()
        .trim(),
      tipoContribuyente: $("h4:contains('Tipo Contribuyente:')")
        .parent()
        .next()
        .find("p")
        .text()
        .trim(),
      nombreComercial: $("h4:contains('Nombre Comercial:')")
        .parent()
        .next()
        .find("p")
        .text()
        .trim(),
      estadoContribuyente: $("h4:contains('Estado del Contribuyente:')")
        .parent()
        .next()
        .find("p")
        .text()
        .trim(),
      condicionContribuyente: $("h4:contains('Condición del Contribuyente:')")
        .parent()
        .next()
        .find("p")
        .text()
        .trim(),
      domicilioFiscal: $("h4:contains('Domicilio Fiscal:')")
        .parent()
        .next()
        .find("p")
        .text()
        .replace(/\s+/g, " ")
        .trim(),
      actividadesEconomicas,
      representantesLegales,
    };

    console.log("Datos del RUC:", resultado);
    return resultado;
  } catch (err) {
    console.error("Error durante el scraping:", err);
    await timed("browser.close", () => browser.close());
    throw err;
  }
}

async function main() {
  const ruc = process.argv[2];
  if (!ruc) {
    console.error("Uso: node index.zen.js <RUC>");
    process.exit(1);
  }
  await scrapeRuc(ruc).catch(console.error);
}

if (require.main === module) {
  main();
}
