export type WebContentHandle = { goBack: () => void; reload: () => void };
export type WebContentProps = {
  url: string;
  title: string;
  onLoading: (loading: boolean) => void;
  onProgress: (progress: number) => void;
  onReady: () => void;
  onError: (message: string) => void;
  onHistoryChange: (canGoBack: boolean) => void;
  onLocationChange: (url: string) => void;
  onOpenLink: (url: string) => void;
};
