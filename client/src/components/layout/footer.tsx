import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const Footer: React.FC = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-inner">
          <div className="footer-info">
            <p className="footer-logo">TABLETOP LIBRARY</p>
            <p>3048 Claremont Ave. Berkeley, CA</p>
          </div>
          <div className="footer-links">
            <h4>Connect With Us</h4>
            <div className="social-links">
              <a 
                href="https://twitter.com/BerkeleyTTL" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={['fab', 'twitter']} />
              </a>
              <a 
                href="https://www.instagram.com/p/DGopwvoSIZi/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={['fab', 'instagram']} />
              </a>
              <a 
                href="https://www.tabletoplibrary.com/mailing-list" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={['far', 'envelope']} />
              </a>
            </div>
          </div>
        </div>
        <div className="copyright">
          <p>© {new Date().getFullYear()} The Tabletop Library. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
