import { Provider } from "react-redux";
import { RouterProvider } from "router6-react";
import React, { PropsWithChildren } from "react";
import { Context } from "craq";
import { ComponentContextProvider } from "./context";

const Wrapper = <T extends unknown>({
  context,
  children,
}: PropsWithChildren<{ context: Context<T> }>) => (
  <RouterProvider router={context.router}>
    <ComponentContextProvider value={context.componentContext}>
      <Provider store={context.getStore()}>{children}</Provider>
    </ComponentContextProvider>
  </RouterProvider>
);

export default Wrapper;
