import {LocalizedElement} from "./components/Locale";
export default function Loading(){
  return <LocalizedElement as="main" className="web-loading-shell" aria-label="Lädt">
    <div className="web-loading-top"><span/><span/></div>
    <div className="web-loading-hero"/>
    <div className="web-loading-row"><i/><i/><i/></div>
    <div className="web-loading-grid"><i/><i/><i/><i/></div>
  </LocalizedElement>;
}
