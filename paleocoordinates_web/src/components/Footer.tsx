import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* 1. Navigation */}
        <div className="footer-column">
          <h4>Navigation</h4>
          <nav className="footer-nav">
            <a href="/">Home</a>
            <a href="/rotate">Rotate</a>
            <a href="/citation">Citation</a>
            <a href="/about">About</a>
          </nav>
        </div>

        {/* 2. Contact */}
        <div className="footer-column contact-block">
          <h4>Contact</h4>
          <div className="contact-info">
            <div className="contact-person">
              <p><strong>Noa Scholz Murcia</strong></p>
              <p><a href="mailto:scholz@ub.edu">scholz@ub.edu</a></p>
            </div>

            <div className="contact-institution">
              <p>Section of Statistics</p>
              <p>Department of Genetics, Microbiology and Statistics</p>
              <p>Faculty of Biology</p>
              <p>University of Barcelona</p>
              <p>Av. Diagonal 643, 08028 Barcelona (Spain)</p>
            </div>
          </div>
        </div>

      </div>

      <div className="footer-version">
        PACA – Paleocoordinates Calculator v1.0 – 2025
      </div>
    </footer>
  );
};

export default Footer;
