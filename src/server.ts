import fs from "fs";

import React, { ComponentType } from "react";
import ReactDOMServer from "react-dom/server";
import { Context } from "craq";
import { ServerContext } from "craq-server";

export declare type Chunks = Record<string, string[]>;
export declare type RendererOptions = {
  rootNodeId?: string;
  assetsPath?: string;
  statsFile?: {
    path?: string;
    content?: Chunks;
  };
};

export declare type Renderer = <T extends object = {}>(
  context: ServerContext<T>,
  App: ComponentType<{ context: Context<T> }>,
  options: {
    bundles: Record<string, () => Promise<any>>;
    options: RendererOptions;
  }
) => Promise<any>;

const loadBundles = (bundles: Record<string, () => Promise<void>>) =>
  Promise.all(Object.values(bundles).map((bundle) => bundle()));
const stingified = (value) =>
  `JSON.parse('${JSON.stringify(value)
    .replace(/\\n/g, "\\n")
    .replace(/\\'/g, "\\'")
    .replace(/\\"/g, '\\"')
    .replace(/\\&/g, "\\&")
    .replace(/\\r/g, "\\r")
    .replace(/\\t/g, "\\t")
    .replace(/\\b/g, "\\b")
    .replace(/\\f/g, "\\f")}')`;

// @ts-ignore
const renderBefore = (head: ServerContext<any>["head"], rootNodeId: string) =>
  `<!DOCTYPE html><html lang="${head.getLang()}">${head}<body><div id="${rootNodeId}">`;

const renderAfter = ({ state, stats }: { stats: object; state: object }) =>
  `</div>
    <script type="text/javascript">
      window.__SERVER_STATS__ = ${stingified(stats)};
      window.__INITIAL_STATE__ = ${stingified(state)};
    </script>
  </body>
</html>`;

const hasExt = (ext) => (link) => link.split(".").pop() === ext;
const isJs = hasExt("js");
const isCss = hasExt("css");

const usefulChunks = ["vendor", "bundle"];
const getStaticReducer =
  (
    assetsByChunkName: Chunks,
    pred: (bundle: string) => boolean,
    additionalChunk?: string
  ) =>
  (set: Set<string>, chunkName) =>
    [
      ...(assetsByChunkName[additionalChunk] || []).filter(pred),
      ...(assetsByChunkName[chunkName] || []).filter(pred),
    ].reduce((result: Set<string>, link: string) => result.add(link), set);

const addAssetsPath = (assetsPath: string, path: string) =>
  `/${[assetsPath, path].join("/")}`;

const getStats = (statsFile: RendererOptions["statsFile"]): Promise<Chunks> => {
  if (!statsFile) {
    return Promise.resolve({});
  }

  if (statsFile.content) {
    return Promise.resolve(statsFile.content);
  }

  console.log("attempt to parse stats.json", statsFile);

  if (fs.existsSync(statsFile.path)) {
    return Promise.resolve(
      JSON.parse(fs.readFileSync(statsFile.path).toString())
    );
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStats(statsFile));
    }, 2000);
  });
};

let chunksUnderstand: Promise<Chunks>;

const render = (response, head, stream: NodeJS.ReadableStream, tail) =>
  new Promise<void>((resolve, reject) => {
    stream.on("error", reject);
    stream.once("readable", () => {
      response.write(head);

      stream.pipe(response, { end: false });

      stream.on("end", () => {
        response.write(tail);
        response.end();
        resolve();
      });
    });
  });

const renderer: Renderer = async <T>(context, App, { bundles, options }) => {
  if (!chunksUnderstand) {
    chunksUnderstand = loadBundles(bundles).then(() =>
      getStats(options.statsFile)
    );
  }

  const assetsByChunkName = await chunksUnderstand;
  const route = context.router.currentRoute;
  const { bundle, error } = route.config;

  usefulChunks
    .reduce(
      getStaticReducer(assetsByChunkName, isCss, bundle),
      new Set<string>()
    )
    .forEach((href) => {
      context.head.addLink({
        href: addAssetsPath(options.assetsPath, href),
        rel: "stylesheet",
      });
    });

  usefulChunks
    .reduce(
      getStaticReducer(assetsByChunkName, isJs, bundle),
      new Set<string>()
    )
    .forEach((src) => {
      context.head.addScript({
        src: addAssetsPath(options.assetsPath, src),
        attributes: { defer: true },
      });
    });

  const state = context.getStore().getState() as object;

  context.ctx.res.writeHead(error ? Number(route.name) : 200, {
    "Content-Type": "text/html;charset=UTF-8",
  });

  return render(
    context.ctx.res,
    renderBefore(context.head, options.rootNodeId || "root"),
    ReactDOMServer.renderToStaticNodeStream(
      React.createElement(App, { context })
    ),
    renderAfter({ state, stats: context.stats })
  );
};

export default renderer;
