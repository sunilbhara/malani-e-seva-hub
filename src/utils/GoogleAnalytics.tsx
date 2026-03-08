import React, { useEffect } from 'react';
import ReactGA from "react-ga4";


const GoogleAnalytics = () => {
  const trackingId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID; 

  useEffect(() => {
    ReactGA.initialize(trackingId);

    ReactGA.send({ hitType: "pageview", page: window.location.pathname, title: document.title });
  }, []);

  return null;
}

export default GoogleAnalytics
