import React, { FC, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { setRendererRect } from "../state/actions";
import { IStyledProps } from "../types";
import { useDocumentLoader } from "../utils/useDocumentLoader";
import { useWindowSize } from "../utils/useWindowSize";
import { LinkButton } from "./common";
import { LoadingIcon } from "./icons";

export const ProxyRenderer: FC<{}> = (props) => {
  const { state, dispatch, CurrentRenderer } = useDocumentLoader();
  const { documents, documentLoading, currentDocument, onDownload, title } = state;
  const {children} = props
  const size = useWindowSize();

  const containerRef = useCallback(
    (node) => {
      node && dispatch(setRendererRect(node?.getBoundingClientRect()));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size]
  );

  const Contents = () => {
    if (!documents.length) {
      return <div id="no-documents">{/* No Documents */}</div>;
    } else if (documentLoading) {
      return (
        <LoadingContainer id="loading-renderer" data-testid="loading-renderer">
          <LoadingIconContainer>
            <LoadingIcon color="#444" size={40} />
          </LoadingIconContainer>
        </LoadingContainer>
      );
    } else {
      if (CurrentRenderer) {
        return <CurrentRenderer mainState={state} />;
      } else if (CurrentRenderer === undefined) {
        return null;
      } else {
        let fileName = currentDocument ? currentDocument.uri || "" : "";
        fileName = decodeURI(fileName);
        fileName = fileName.split("?")[0];
        const splitURL = fileName.split("/");
        if (splitURL.length) {
          fileName = splitURL[splitURL.length - 1];
        }
        return (
          <>
            {children}
          </>
        );
      }
    }
  };

  return (
    <Container id="proxy-renderer" ref={containerRef}>
      <Contents />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex: 1;
  overflow-y: auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex: 1;
  height: 75px;
  align-items: center;
  justify-content: center;
`;
const spinAnim = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;
const LoadingIconContainer = styled.div`
  animation-name: ${spinAnim};
  animation-duration: 4s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
`;

const DownloadButton = styled(LinkButton)`
  width: 130px;
  height: 30px;
  background-color: ${(props: IStyledProps) => props.theme.primary};
  @media (max-width: 768px) {
    width: 125px;
    height: 25px;
  }
`;
