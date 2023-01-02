import React, { ComponentType } from "react";
import ReactDOM from "react-dom/client";
import { Context } from "craq";

import Wrapper from "./Wrapper";

const renderer = <S extends unknown, A extends unknown>(
  context: Context<S, A>,
  App: ComponentType<{ context: Context<S, A> }>,
  { node }: { node: HTMLElement }
) =>
  ReactDOM.hydrateRoot(
    node,
    <Wrapper context={context}>
      <App context={context} />
    </Wrapper>
  );

export default renderer;
