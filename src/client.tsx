import React, { ComponentType } from "react";
import ReactDOM from "react-dom/client";
import { Context } from "craq";

import Wrapper from "./Wrapper";

const renderer = <T extends unknown>(
  context: Context<T>,
  App: ComponentType<{ context: Context<T> }>,
  { node }: { node: HTMLElement }
) =>
  ReactDOM.hydrateRoot(
    node,
    <Wrapper context={context}>
      <App context={context} />
    </Wrapper>
  );

export default renderer;
