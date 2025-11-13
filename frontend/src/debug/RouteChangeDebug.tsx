// src/debug/RouteChangeDebug.tsx
import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function RouteChangeDebug() {
  const loc = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    // Stack để thấy component nào vừa trigger
    // eslint-disable-next-line no-console
    console.log(
      "[NAV]",
      navType,
      loc.pathname + loc.search,
      "\nSTACK:",
      new Error().stack
    );
  }, [loc, navType]);
  return null;
}
