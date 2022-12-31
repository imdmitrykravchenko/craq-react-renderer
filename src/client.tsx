import React, { ComponentType } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "router6-react";
import { Context } from "craq";
import { ComponentContextProvider } from "./context";

const renderer = <T extends unknown>(
  context: Context<T>,
  App: ComponentType<{ context: Context<T> }>,
  { node }: { node: HTMLElement }
) =>
  ReactDOM.hydrateRoot(
    node,
    <RouterProvider router={context.router}>
      <ComponentContextProvider value={context.componentContext}>
        <Provider store={context.getStore()}>
          <App context={context} />
        </Provider>
      </ComponentContextProvider>
    </RouterProvider>
  );

export default renderer;
