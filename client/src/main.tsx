import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add icons
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faDiceOne, faDiceTwo, faDiceThree, faDiceFour, faDiceFive, 
  faSearch, faExternalLinkAlt, faWeightHanging, faTimes, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { fab, faTwitter, faInstagram } from '@fortawesome/free-brands-svg-icons';

library.add(
  faDiceOne, faDiceTwo, faDiceThree, faDiceFour, faDiceFive,
  faSearch, faExternalLinkAlt, faWeightHanging, faTimes, faCheck,
  faTwitter, faInstagram, faEnvelope, fab
);

createRoot(document.getElementById("root")!).render(<App />);
