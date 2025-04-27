import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-800 py-8 mt-16">
      <div className="tufte-container">
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="mb-8 md:mb-0">
            <h3 className="font-tufte text-accent text-lg">The Tabletop Library</h3>
            <p className="text-muted-foreground mt-2">3048 Claremont Ave. Berkeley, CA</p>
          </div>
          <div>
            <h4 className="font-tufte text-foreground text-base mb-4">Connect With Us</h4>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com/BerkeleyTTL" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-accent transition duration-200"
              >
                <FontAwesomeIcon icon={['fab', 'twitter']} />
              </a>
              <a 
                href="https://www.instagram.com/p/DGopwvoSIZi/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-accent transition duration-200"
              >
                <FontAwesomeIcon icon={['fab', 'instagram']} />
              </a>
              <a 
                href="https://www.tabletoplibrary.com/mailing-list" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-accent transition duration-200"
              >
                <FontAwesomeIcon icon={['far', 'envelope']} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-800 text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} The Tabletop Library. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
