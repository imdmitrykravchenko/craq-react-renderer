import React, { ComponentType } from "react";
import ReactDOM from "react-dom/client";
import { Context } from "craq";

import Wrapper from "./Wrapper";

const getRenderer =
  <S, A>(
    App: ComponentType<{ context: Context<S, A> }>,
    { node }: { node: HTMLElement }
  ) =>
  (context: Context<S, A>) =>
    ReactDOM.hydrateRoot(
      node,
      <Wrapper context={context}>
        <App context={context} />
      </Wrapper>
    );

export default getRenderer;
