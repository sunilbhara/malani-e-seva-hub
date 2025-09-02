import { useEffect } from "react";

const Adsense = ({ slot }: { slot: string }) => {
  const client = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;

  useEffect(() => {
    try {
      // @ts-expect-error Google AdSense global may not be typed
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Ignore AdSense errors
    }
  }, []);

  return (
    <div className="flex justify-center my-6">
      <ins className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default Adsense;
