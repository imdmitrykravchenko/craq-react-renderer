import { RouterProvider } from "router6-react";
import React, { PropsWithChildren } from "react";
import { Context } from "craq";
import { ComponentContextProvider } from "./context";

const Wrapper = <S extends unknown, A extends unknown>({
  context,
  children,
}: PropsWithChildren<{ context: Context<S, A> }>) => (
  <RouterProvider router={context.router}>
    <ComponentContextProvider value={context.componentContext}>
      {children}
    </ComponentContextProvider>
  </RouterProvider>
);

export default Wrapper;
