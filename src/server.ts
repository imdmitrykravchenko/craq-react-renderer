import React, { ComponentType } from "react";
import ReactDOMServer from "react-dom/server";
import jsesc from "jsesc";
import { Context } from "craq";
import { ServerContext } from "craq-server";

import Wrapper from "./Wrapper";

type RendererOptions = {
  rootNodeId?: string;
};

const stingified = (value) =>
  `JSON.parse(${JSON.stringify(
    jsesc(value, { json: true, minimal: true, isScriptContext: true })
  )})`;

const renderBefore = (
  head: ServerContext<any, any>["head"],
  rootNodeId: string
) =>
  `<!DOCTYPE html><html lang="${head.getLang()}">${head}<body><div id="${rootNodeId}">`;

const renderAfter = <S>({ state, stats }: { stats: object; state: S }) =>
  `</div>
    <script type="text/javascript">
      window.__SERVER_STATS__ = ${stingified(stats)};
      window.__INITIAL_STATE__ = ${stingified(state)};
    </script>
  </body>
</html>`;

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

const getRenderer =
  <S, A>(
    App: ComponentType<{ context: Context<S, A> }>,
    options: RendererOptions
  ) =>
  async (
    context: ServerContext<any, any>,
    error: (Error & { statusCode: number }) | null
  ) => {
    const state = context.getStore().getState();

    context.ctx.res.writeHead(error ? error.statusCode : 200, {
      "Content-Type": "text/html;charset=UTF-8",
    });
    const props = { context };

    return render(
      context.ctx.res,
      renderBefore(context.head, options.rootNodeId || "root"),
      ReactDOMServer.renderToStaticNodeStream(
        React.createElement(Wrapper, props, React.createElement(App, props))
      ),
      renderAfter({ state, stats: context.stats })
    );
  };

export default getRenderer;
