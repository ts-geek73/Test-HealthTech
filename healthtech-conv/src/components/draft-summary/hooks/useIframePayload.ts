import { useEffect, useRef } from "react";

interface IframePayload {
  patientId: string;
  accountNumber: string;
}

const useIframePayload = (
  onReceive: (patientId: string, accountNumber: string) => void,
) => {
  const receivedRef = useRef(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as Partial<IframePayload>;

      if (!data) return;
      if (!data.patientId || !data.accountNumber) return;

      if (receivedRef.current) return;
      receivedRef.current = true;

      onReceive(data.patientId, data.accountNumber);
    };

    window.addEventListener("message", handleMessage);

    if (window.parent !== window) {
      window.parent.postMessage({ type: "IFRAME_READY" }, "*");
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onReceive]);
};

export default useIframePayload;
