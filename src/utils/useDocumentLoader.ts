import { Dispatch, useContext, useEffect } from "react";
import { DocViewerContext } from "../state";
import {
  MainStateActions,
  setDocumentLoading,
  updateCurrentDocument,
} from "../state/actions";
import { IMainState } from "../state/reducer";
import { DocRenderer } from "../types";
import { defaultFileLoader, FileLoaderComplete } from "./fileLoaders";
import { useRendererSelector } from "./useRendererSelector";

/**
 * Custom Hook for loading the current document into context
 */
export const useDocumentLoader = (): {
  state: IMainState;
  dispatch: Dispatch<MainStateActions>;
  CurrentRenderer: DocRenderer | null | undefined;
} => {
  const { state, dispatch } = useContext(DocViewerContext);
  const { currentFileNo, currentDocument, headers: defaultHeaders } = state;

  const { CurrentRenderer } = useRendererSelector();

  const documentURI = currentDocument?.uri || "";

  useEffect(
    () => {
      if (!currentDocument) return;
      if (currentDocument.fileType !== undefined) return;

      const controller = new AbortController();
      const { signal } = controller;

      const headers = new Headers({
        ...defaultHeaders,
        'Range': 'bytes=0-0',
      });
      fetch(documentURI, { method: "GET", headers, signal }).then((response) => {
        const contentTypeRaw = response.headers.get("content-type");
        const contentTypes = contentTypeRaw?.split(";") || [];
        const contentType = contentTypes.length ? contentTypes[0] : undefined;

        dispatch(
          updateCurrentDocument({
            ...currentDocument,
            fileType: contentType || undefined,
          })
        );
      });

      return () => {
        controller.abort();
      };
    },
    // eslint ignore added, because a warning appears for dispatch to
    // be a dependancy of the useEffect
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentFileNo, documentURI]
  );

  useEffect(() => {
    if (!currentDocument || CurrentRenderer === undefined) return;

    const controller = new AbortController();
    const { signal } = controller;

    const fileLoaderComplete: FileLoaderComplete = (fileReader) => {
      if (!currentDocument || !fileReader) {
        dispatch(setDocumentLoading(false));
        return;
      }

      let updatedDocument = { ...currentDocument };
      if (fileReader.result !== null) {
        updatedDocument.fileData = fileReader.result;
      }

      dispatch(updateCurrentDocument(updatedDocument));
      dispatch(setDocumentLoading(false));
    };

    if (CurrentRenderer === null) {
      dispatch(setDocumentLoading(false));
    } else if (CurrentRenderer.fileLoader !== undefined) {
      CurrentRenderer.fileLoader?.({ headers: defaultHeaders, documentURI, signal, fileLoaderComplete });
    } else {
      defaultFileLoader({ headers: defaultHeaders, documentURI, signal, fileLoaderComplete });
    }

    return () => {
      controller.abort();
    };
  }, [CurrentRenderer]);

  return { state, dispatch, CurrentRenderer };
};
